import { NextRequest, NextResponse } from "next/server";
import { jiraFetch, configFromRequest } from "@/lib/jira";

interface SearchResult {
  issues: {
    id: string;
    key: string;
    fields: {
      summary: string;
      status: { name: string; statusCategory: { colorName: string } };
      project: { key: string; name: string; id: string };
      timeoriginalestimate: number | null;
      timespent: number | null;
    };
  }[];
}

export async function GET(req: NextRequest) {
  const config = configFromRequest(req);
  if (!config) return NextResponse.json({ error: "Missing credentials" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  // Search by key or text, no status filter so Done issues also appear
  const jql = `assignee = currentUser() AND (issueKey = "${q}" OR text ~ "${q}") ORDER BY updated DESC`;

  try {
    const data = await jiraFetch<SearchResult>(config, `/search/jql`, {
      method: "POST",
      body: JSON.stringify({
        jql,
        maxResults: 10,
        fields: ["summary", "status", "project", "timeoriginalestimate", "timespent"],
      }),
    });
    return NextResponse.json(data.issues);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
