"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getConfig, configHeaders } from "@/lib/config";

export interface WorklogEvent {
  id: string;
  issueKey: string;
  issueName: string;
  projectKey: string;
  projectName: string;
  start: string;
  end: string;
  timeSpentSeconds: number;
}

export function useWorklogRange(from: Date, to: Date) {
  const config = getConfig();
  return useQuery({
    queryKey: ["worklogs", from.toISOString().slice(0, 10), to.toISOString().slice(0, 10)],
    queryFn: async (): Promise<WorklogEvent[]> => {
      if (!config) throw new Error("No config");
      const res = await fetch("/api/jira/worklogs/range", {
        method: "POST",
        headers: { ...configHeaders(config), "Content-Type": "application/json" },
        body: JSON.stringify({ from: from.toISOString(), to: to.toISOString(), accountId: config.accountId }),
      });
      if (!res.ok) throw new Error("Failed to fetch worklogs");
      return res.json();
    },
    enabled: !!config,
    staleTime: 30_000,
  });
}

export function useInvalidateWorklogs() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["worklogs"] });
}
