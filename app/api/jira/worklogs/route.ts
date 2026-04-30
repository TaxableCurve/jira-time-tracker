import { NextRequest, NextResponse } from "next/server";
import { jiraFetch, configFromRequest } from "@/lib/jira";
import { isoToJira } from "@/lib/format";

export async function POST(req: NextRequest) {
  const config = configFromRequest(req);
  if (!config) return NextResponse.json({ error: "Missing credentials" }, { status: 401 });

  const { issueKey, timeSpentSeconds, startedAt, comment } = await req.json();

  if (!issueKey || !timeSpentSeconds || !startedAt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const body: Record<string, unknown> = {
      timeSpentSeconds,
      started: isoToJira(new Date(startedAt)),
    };

    if (comment) {
      body.comment = {
        type: "doc",
        version: 1,
        content: [{ type: "paragraph", content: [{ type: "text", text: comment }] }],
      };
    }

    const worklog = await jiraFetch(config, `/issue/${issueKey}/worklog`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return NextResponse.json(worklog);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const config = configFromRequest(req);
  if (!config) return NextResponse.json({ error: "Missing credentials" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const issueKey = searchParams.get("issueKey");

  if (!issueKey) return NextResponse.json({ error: "issueKey required" }, { status: 400 });

  try {
    const data = await jiraFetch<{ worklogs: unknown[] }>(config, `/issue/${issueKey}/worklog`);
    return NextResponse.json(data.worklogs);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
