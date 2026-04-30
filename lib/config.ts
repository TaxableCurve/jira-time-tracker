export interface JiraConfig {
  baseUrl: string;
  email: string;
  token: string;
  accountId: string;
}

export function getConfig(): JiraConfig | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("jira_config");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as JiraConfig;
  } catch {
    return null;
  }
}

export function configHeaders(config: JiraConfig): Record<string, string> {
  return {
    "X-Jira-Base-Url": config.baseUrl,
    "X-Jira-Email": config.email,
    "X-Jira-Token": config.token,
  };
}
