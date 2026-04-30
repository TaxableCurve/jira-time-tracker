import { NextRequest, NextResponse } from "next/server";
import { jiraFetch, configFromRequest } from "@/lib/jira";
import { isoToJira } from "@/lib/format";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ issueKey: string; worklogId: string }> }
) {
  const config = configFromRequest(req);
  if (!config) return NextResponse.json({ error: "Missing credentials" }, { status: 401 });

  const { issueKey, worklogId } = await params;
  const { timeSpentSeconds, startedAt } = await req.json();

  if (!timeSpentSeconds || !startedAt) {
    return NextResponse.json({ error: "timeSpentSeconds and startedAt required" }, { status: 400 });
  }

  try {
    const worklog = await jiraFetch(
      config,
      `/issue/${issueKey}/worklog/${worklogId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          timeSpentSeconds,
          started: isoToJira(new Date(startedAt)),
        }),
      }
    );
    return NextResponse.json(worklog);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ issueKey: string; worklogId: string }> }
) {
  const config = configFromRequest(req);
  if (!config) return NextResponse.json({ error: "Missing credentials" }, { status: 401 });

  const { issueKey, worklogId } = await params;
  console.log("[delete worklog]", { issueKey, worklogId });

  try {
    await jiraFetch(config, `/issue/${issueKey}/worklog/${worklogId}`, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
