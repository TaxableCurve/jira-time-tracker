import { NextRequest, NextResponse } from "next/server";
import { jiraFetch, configFromRequest } from "@/lib/jira";

interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
}

export async function GET(req: NextRequest) {
  const config = configFromRequest(req);
  if (!config) return NextResponse.json({ error: "Missing credentials" }, { status: 401 });

  try {
    const data = await jiraFetch<JiraProject[]>(config, "/project?orderBy=name&maxResults=100");
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
