import { NextRequest, NextResponse } from "next/server";
import { jiraFetch, configFromRequest } from "@/lib/jira";

interface JiraWorklog {
  id: string;
  author: { accountId: string; displayName: string };
  started: string;
  timeSpentSeconds: number;
  comment?: unknown;
}

interface SearchResult {
  issues: {
    id: string;
    key: string;
    fields: {
      summary: string;
      project: { key: string; name: string };
      timeoriginalestimate: number | null;
      timespent: number | null;
      issuetype: { name: string };
    };
  }[];
}

export async function POST(req: NextRequest) {
  const config = configFromRequest(req);
  if (!config) return NextResponse.json({ error: "Missing credentials" }, { status: 401 });

  const { from, to, accountId } = await req.json();
  if (!from || !to || !accountId) {
    return NextResponse.json({ error: "from, to and accountId required" }, { status: 400 });
  }

  const fromDate = from.slice(0, 10); // YYYY-MM-DD
  const toDate = to.slice(0, 10);

  try {
    const jql = `worklogAuthor = currentUser() AND worklogDate >= "${fromDate}" AND worklogDate <= "${toDate}"`;

    const data = await jiraFetch<SearchResult>(config, `/search/jql`, {
      method: "POST",
      body: JSON.stringify({
        jql,
        maxResults: 100,
        fields: ["summary", "project", "timeoriginalestimate", "timespent", "issuetype"],
      }),
    });

    const fromMs = new Date(from).getTime();
    const toMs = new Date(to).getTime();

    // Fetch worklogs for each issue in parallel
    const issueWorklogs = await Promise.all(
      data.issues.map(async (issue) => {
        const wlData = await jiraFetch<{ worklogs: JiraWorklog[] }>(
          config,
          `/issue/${issue.key}/worklog`
        );
        return { issue, worklogs: wlData.worklogs ?? [] };
      })
    );

    const events = issueWorklogs.flatMap(({ issue, worklogs }) =>
      worklogs
        .filter((wl) => {
          if (wl.author.accountId !== accountId) return false;
          const t = new Date(wl.started).getTime();
          return t >= fromMs && t <= toMs;
        })
        .map((wl) => ({
          id: wl.id,
          issueKey: issue.key,
          issueName: issue.fields.summary,
          projectKey: issue.fields.project.key,
          projectName: issue.fields.project.name,
          start: wl.started,
          end: new Date(new Date(wl.started).getTime() + wl.timeSpentSeconds * 1000).toISOString(),
          timeSpentSeconds: wl.timeSpentSeconds,
          originalEstimateSeconds: issue.fields.timeoriginalestimate,
          totalTimeSpentSeconds: issue.fields.timespent,
          issueType: issue.fields.issuetype.name,
        }))
    );

    return NextResponse.json(events);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[worklogs/range]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
