import { NextRequest } from "next/server";

export interface JiraConfig {
  baseUrl: string;
  email: string;
  token: string;
}

export function getAuthHeader(config: JiraConfig): string {
  const credentials = Buffer.from(`${config.email}:${config.token}`).toString("base64");
  return `Basic ${credentials}`;
}

export function configFromRequest(req: NextRequest): JiraConfig | null {
  const baseUrl = req.headers.get("X-Jira-Base-Url");
  const email = req.headers.get("X-Jira-Email");
  const token = req.headers.get("X-Jira-Token");
  if (!baseUrl || !email || !token) return null;
  return { baseUrl, email, token };
}

export async function jiraFetch<T>(
  config: JiraConfig,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `https://${config.baseUrl}/rest/api/3${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: getAuthHeader(config),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira API error ${res.status}: ${text}`);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null as T;
  }

  return res.json();
}
