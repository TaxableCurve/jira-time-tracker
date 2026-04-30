"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getConfig, configHeaders } from "@/lib/config";

function headers() {
  const config = getConfig();
  if (!config) throw new Error("No Jira config");
  return configHeaders(config);
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/jira/projects", { headers: headers() });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json() as Promise<{ id: string; key: string; name: string }[]>;
    },
  });
}

export function useIssues(projectKey?: string) {
  return useQuery({
    queryKey: ["issues", projectKey ?? "all"],
    queryFn: async () => {
      const url = projectKey ? `/api/jira/issues?project=${projectKey}` : "/api/jira/issues";
      const res = await fetch(url, { headers: headers() });
      if (!res.ok) throw new Error("Failed to fetch issues");
      return res.json();
    },
  });
}

export function useIssueSearch(query: string) {
  return useQuery({
    queryKey: ["issue-search", query],
    queryFn: async () => {
      const res = await fetch(`/api/jira/issues/search?q=${encodeURIComponent(query)}`, { headers: headers() });
      if (!res.ok) throw new Error("Failed to search issues");
      return res.json();
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

export function useUpdateWorklog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      issueKey: string;
      worklogId: string;
      timeSpentSeconds: number;
      startedAt: string;
    }) => {
      const res = await fetch(`/api/jira/worklogs/${payload.issueKey}/${payload.worklogId}`, {
        method: "PUT",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ timeSpentSeconds: payload.timeSpentSeconds, startedAt: payload.startedAt }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update worklog");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["worklogs"] }),
  });
}

export function useDeleteWorklog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ issueKey, worklogId }: { issueKey: string; worklogId: string }) => {
      const res = await fetch(`/api/jira/worklogs/${issueKey}/${worklogId}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = "Failed to delete worklog";
        try { msg = JSON.parse(text).error ?? msg; } catch { /* empty body */ }
        throw new Error(msg);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["worklogs"] }),
  });
}

export function useCreateWorklog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      issueKey: string;
      timeSpentSeconds: number;
      startedAt: string;
      comment?: string;
    }) => {
      const res = await fetch("/api/jira/worklogs", {
        method: "POST",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create worklog");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worklogs"] });
    },
  });
}
