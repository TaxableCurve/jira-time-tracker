import { NextRequest, NextResponse } from "next/server";
import { jiraFetch } from "@/lib/jira";

export async function POST(req: NextRequest) {
  const { baseUrl, email, token } = await req.json();

  if (!baseUrl || !email || !token) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const user = await jiraFetch<{ accountId: string; displayName: string; emailAddress: string }>(
      { baseUrl, email, token },
      "/myself"
    );
    return NextResponse.json({ accountId: user.accountId, displayName: user.displayName });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
