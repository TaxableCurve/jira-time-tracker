"use client";

import { useState } from "react";
import { useIssues, useProjects } from "@/hooks/useJira";
import { IssueCard } from "./IssueCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";

interface Props {
  activeIssueKey?: string;
  onStartTimer?: (issue: { key: string; fields: { summary: string } }) => void;
}

export function IssueList({ activeIssueKey, onStartTimer }: Props) {
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState("");

  const { data: projects } = useProjects();
  const { data: issues, isLoading, isError } = useIssues(selectedProject || undefined);

  const filtered = issues?.filter((issue: { key: string; fields: { summary: string } }) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      issue.key.toLowerCase().includes(q) ||
      issue.fields.summary.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-white/8" style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel as="h2" className="tracking-[0.2em]">My Issues</SectionLabel>
          {filtered !== undefined && (
            <span
              className="font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded"
              style={{ background: "rgba(232,124,46,0.1)", color: "#E87C2E", border: "1px solid rgba(232,124,46,0.2)" }}
            >
              {filtered.length}
            </span>
          )}
        </div>

        <Input
          placeholder="Search..."
          aria-label="Search issues"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />

        {projects && projects.length > 0 && (
          <Select value={selectedProject} onValueChange={(v) => setSelectedProject(v ?? "")}>
            <SelectTrigger
              aria-label="Filter by project"
              className="w-full h-auto py-1.5 px-2.5 rounded text-xs border-white/7 bg-white/4"
              style={{ fontFamily: "var(--font-jetbrains)" }}
            >
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.key}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
        {isLoading && (
          <div className="flex flex-col gap-2 p-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 rounded animate-pulse bg-white/4"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        )}

        {isError && (
          <p className="p-3 font-mono text-xs text-destructive">Failed to load issues</p>
        )}

        {!isLoading && !isError && filtered?.length === 0 && (
          <p className="p-3 font-mono text-xs text-[#767680]">No issues found</p>
        )}

        {filtered?.map((issue: Parameters<typeof IssueCard>[0]["issue"]) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            isTimerActive={activeIssueKey === issue.key}
            onStartTimer={onStartTimer}
          />
        ))}
      </div>

    </div>
  );
}
