import { NextRequest, NextResponse } from "next/server";
import { jiraFetch, configFromRequest } from "@/lib/jira";

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: { name: string; statusCategory: { colorName: string } };
    project: { key: string; name: string; id: string };
    timeoriginalestimate: number | null;
    timespent: number | null;
    assignee: { accountId: string } | null;
  };
}

interface SearchResult {
  issues: JiraIssue[];
  total: number;
}

export async function GET(req: NextRequest) {
  const config = configFromRequest(req);
  if (!config) return NextResponse.json({ error: "Missing credentials" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectKey = searchParams.get("project");

  let jql = `assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC`;
  if (projectKey) jql = `assignee = currentUser() AND project = "${projectKey}" AND statusCategory != Done ORDER BY updated DESC`;

  try {
    const data = await jiraFetch<SearchResult>(config, `/search/jql`, {
      method: "POST",
      body: JSON.stringify({
        jql,
        maxResults: 50,
        fields: ["summary", "status", "project", "timeoriginalestimate", "timespent", "assignee"],
      }),
    });
    return NextResponse.json(data.issues);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[issues]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
