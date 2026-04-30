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
      <div className="px-3 pt-4 pb-3 border-b border-white/6">
        <SectionLabel as="h2" className="mb-3 tracking-[0.2em]">My Issues</SectionLabel>

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
      <div className="flex-1 overflow-y-auto">
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

      {/* Footer count */}
      {filtered && (
        <div className="px-3 py-2 border-t border-white/6 font-mono text-[10px] text-[#767680]">
          {filtered.length} issue{filtered.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
