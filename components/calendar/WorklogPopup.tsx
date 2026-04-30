"use client";

import { useState, useEffect, useRef } from "react";
import { useIssues, useIssueSearch } from "@/hooks/useJira";
import { secondsToHuman } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, TimeBadge } from "@/components/ui/badge";
import { PopupContainer } from "@/components/ui/popup-container";

interface Props {
  start: Date;
  end: Date;
  position: { x: number; y: number };
  onConfirm: (issueKey: string, issueName: string, timeSpentSeconds: number, startedAt: string) => void;
  onCancel: () => void;
}

const PROJECT_COLORS: Record<string, string> = {};
const PALETTE = ["#E87C2E", "#4EA8DE", "#7ADE9A", "#E8B42E", "#DE7AAE", "#9B7ADE", "#DE4E4E"];
function projectColor(key: string): string {
  if (!PROJECT_COLORS[key]) {
    const idx = Object.keys(PROJECT_COLORS).length % PALETTE.length;
    PROJECT_COLORS[key] = PALETTE[idx];
  }
  return PROJECT_COLORS[key];
}

export function WorklogPopup({ start, end, position, onConfirm, onCancel }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ key: string; summary: string } | null>(null);
  const isSearching = search.length >= 2;
  const { data: activeIssues, isLoading: loadingActive } = useIssues();
  const { data: searchResults, isLoading: loadingSearch } = useIssueSearch(search);
  const ref = useRef<HTMLDivElement>(null);

  const durationSeconds = Math.round((end.getTime() - start.getTime()) / 1000);
  const isLoading = isSearching ? loadingSearch : loadingActive;

  const filtered = isSearching
    ? searchResults?.slice(0, 8)
    : activeIssues?.slice(0, 8);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onCancel();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onCancel]);

  const positionStyle: React.CSSProperties = {
    position: "fixed",
    left: Math.min(position.x, window.innerWidth - 320),
    top: Math.min(position.y, window.innerHeight - 380),
    zIndex: 1000,
    width: 300,
  };

  return (
    <PopupContainer ref={ref} positionStyle={positionStyle}>
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-white/7">
        <div className="flex items-center justify-between">
          <span className="font-sans text-xs font-semibold text-foreground">Log Time</span>
          <TimeBadge>{secondsToHuman(durationSeconds)}</TimeBadge>
        </div>
        <p className="font-mono text-[10px] mt-0.5 text-muted-foreground whitespace-nowrap">
          {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} →{" "}
          {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Search */}
      <div className="p-2">
        <Input
          autoFocus
          placeholder="Search issue..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Issue list */}
      <div className="max-h-48 overflow-y-auto px-2 pb-2 space-y-0.5">
        {isLoading && (
          <p className="font-mono text-xs py-2 text-center text-muted-foreground">Loading...</p>
        )}
        {filtered?.map((issue: { id: string; key: string; fields: { summary: string; project: { key: string } } }) => {
          const isSelected = selected?.key === issue.key;
          const color = projectColor(issue.fields.project.key);
          return (
            <button
              key={issue.id}
              onClick={() => setSelected({ key: issue.key, summary: issue.fields.summary })}
              className="w-full text-left px-2.5 py-2 rounded transition-all"
              style={{
                background: isSelected ? "rgba(232,124,46,0.12)" : "transparent",
                border: `1px solid ${isSelected ? "rgba(232,124,46,0.3)" : "transparent"}`,
              }}
            >
              <div className="flex items-center gap-1.5">
                <Badge color={color}>{issue.key}</Badge>
                <span
                  className="font-sans text-xs truncate"
                  style={{ color: isSelected ? "#E8E8E4" : "#B0B0B8" }}
                >
                  {issue.fields.summary}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-3 py-2.5 border-t border-white/7">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          disabled={!selected}
          onClick={() => selected && onConfirm(selected.key, selected.summary, durationSeconds, start.toISOString())}
        >
          Log →
        </Button>
      </div>
    </PopupContainer>
  );
}
