"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getConfig, configHeaders } from "@/lib/config";

async function headers() {
  const config = await getConfig();
  if (!config) throw new Error("No Jira config");
  return configHeaders(config);
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/jira/projects", { headers: await headers() });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json() as Promise<{ id: string; key: string; name: string }[]>;
    },
  });
}

export function useIssues(projectKey?: string, statusFilter: string = "active") {
  return useQuery({
    queryKey: ["issues", projectKey ?? "all", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ statusFilter });
      if (projectKey) params.set("project", projectKey);
      const res = await fetch(`/api/jira/issues?${params}`, { headers: await headers() });
      if (!res.ok) throw new Error("Failed to fetch issues");
      return res.json();
    },
  });
}

export function useIssueSearch(query: string) {
  return useQuery({
    queryKey: ["issue-search", query],
    queryFn: async () => {
      const res = await fetch(`/api/jira/issues/search?q=${encodeURIComponent(query)}`, { headers: await headers() });
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
        headers: { ...await headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ timeSpentSeconds: payload.timeSpentSeconds, startedAt: payload.startedAt }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to update worklog");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worklogs"] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}

export function useDeleteWorklog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ issueKey, worklogId }: { issueKey: string; worklogId: string }) => {
      const res = await fetch(`/api/jira/worklogs/${issueKey}/${worklogId}`, {
        method: "DELETE",
        headers: await headers(),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = "Failed to delete worklog";
        try { msg = JSON.parse(text).error ?? msg; } catch { /* empty body */ }
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worklogs"] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}

export function useTransitions(issueKey: string) {
  return useQuery({
    queryKey: ["transitions", issueKey],
    queryFn: async () => {
      const res = await fetch(`/api/jira/transitions?issueKey=${issueKey}`, { headers: await headers() });
      if (!res.ok) throw new Error("Failed to fetch transitions");
      return res.json() as Promise<{ id: string; name: string; to: { statusCategory: { colorName: string } } }[]>;
    },
    staleTime: 60_000,
  });
}

export function useExecuteTransition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ issueKey, transitionId }: { issueKey: string; transitionId: string }) => {
      const res = await fetch("/api/jira/transitions", {
        method: "POST",
        headers: { ...await headers(), "Content-Type": "application/json" },
        body: JSON.stringify({ issueKey, transitionId }),
      });
      if (!res.ok) throw new Error("Failed to execute transition");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"], refetchType: "active" });
    },
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
        headers: { ...await headers(), "Content-Type": "application/json" },
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
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}
