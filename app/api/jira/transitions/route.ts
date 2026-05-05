import { NextRequest, NextResponse } from "next/server";
import { jiraFetch, configFromRequest } from "@/lib/jira";

export async function GET(req: NextRequest) {
  const config = configFromRequest(req);
  if (!config) return NextResponse.json({ error: "Missing credentials" }, { status: 401 });

  const issueKey = req.nextUrl.searchParams.get("issueKey");
  if (!issueKey) return NextResponse.json({ error: "Missing issueKey" }, { status: 400 });

  try {
    const data = await jiraFetch(config, `/issue/${issueKey}/transitions`) as { transitions: unknown[] };
    return NextResponse.json(data.transitions);
  } catch {
    return NextResponse.json({ error: "Failed to fetch transitions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const config = configFromRequest(req);
  if (!config) return NextResponse.json({ error: "Missing credentials" }, { status: 401 });

  const { issueKey, transitionId } = await req.json();
  if (!issueKey || !transitionId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  try {
    await jiraFetch(config, `/issue/${issueKey}/transitions`, {
      method: "POST",
      body: JSON.stringify({ transition: { id: transitionId } }),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to execute transition" }, { status: 500 });
  }
}
