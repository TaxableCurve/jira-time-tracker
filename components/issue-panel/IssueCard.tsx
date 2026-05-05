"use client";

import { useState, useRef, useEffect } from "react";
import { secondsToHuman } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { useTransitions, useExecuteTransition } from "@/hooks/useJira";

interface Issue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: { name: string; statusCategory: { colorName: string } };
    project: { key: string; name: string };
    timeoriginalestimate: number | null;
    timespent: number | null;
  };
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

const STATUS_COLORS: Record<string, string> = {
  "blue-grey": "#6B7280",
  yellow: "#E8B42E",
  green: "#7ADE9A",
};

interface Props {
  issue: Issue;
  onStartTimer?: (issue: Issue) => void;
  isTimerActive?: boolean;
}

function StatusDropdown({ issueKey, onClose }: { issueKey: string; onClose: () => void }) {
  const { data: transitions, isLoading } = useTransitions(issueKey);
  const execute = useExecuteTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1 z-50 min-w-[140px] py-1 rounded"
      style={{ background: "#1C1C24", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
    >
      {isLoading && (
        <p className="px-3 py-2 font-mono text-[10px] text-white/30">Loading...</p>
      )}
      {transitions?.map((t) => {
        const color = STATUS_COLORS[t.to.statusCategory.colorName] ?? "#6B7280";
        return (
          <button
            key={t.id}
            disabled={execute.isPending}
            onClick={async () => {
              await execute.mutateAsync({ issueKey, transitionId: t.id });
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition-colors duration-100"
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="font-mono text-[10px] text-[#D4D4D0]">{t.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export function IssueCard({ issue, onStartTimer, isTimerActive }: Props) {
  const [showTransitions, setShowTransitions] = useState(false);
  const color = projectColor(issue.fields.project.key);
  const statusColor = STATUS_COLORS[issue.fields.status.statusCategory.colorName] ?? "#6B7280";

  return (
    <div
      className={`group relative px-3 py-2.5 transition-all duration-200 border-l-2 ${
        isTimerActive
          ? "border-primary bg-primary/5"
          : "border-transparent hover:border-white/10 hover:bg-white/[0.025]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Key + status */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <Badge color={color}>{issue.key}</Badge>
            <div className="relative flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTransitions((v) => !v);
                }}
                className="flex items-center gap-1.5 rounded px-1 py-0.5 -mx-1 cursor-pointer hover:bg-white/6 transition-colors duration-100"
                title="Change status"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColor }} />
                <span className="font-mono text-[10px] truncate text-[#7A7A84]">
                  {issue.fields.status.name}
                </span>
              </button>
              {showTransitions && (
                <StatusDropdown issueKey={issue.key} onClose={() => setShowTransitions(false)} />
              )}
            </div>
          </div>

          {/* Title */}
          <p className="font-sans text-xs leading-snug line-clamp-2 text-[#D4D4D0]">
            {issue.fields.summary}
          </p>

          {/* Time info */}
          {(issue.fields.timespent || issue.fields.timeoriginalestimate) && (
            <div className="mt-1.5 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-primary">
                  {secondsToHuman(issue.fields.timespent ?? 0)} logged
                </span>
                {issue.fields.timeoriginalestimate && (
                  <span className="font-mono text-[10px] text-[#9A9AA4]">
                    {secondsToHuman(issue.fields.timeoriginalestimate)} est.
                  </span>
                )}
              </div>
              {issue.fields.timeoriginalestimate && (() => {
                const spent = issue.fields.timespent ?? 0;
                const estimate = issue.fields.timeoriginalestimate;
                const pct = Math.min(spent / estimate, 1);
                const over = spent > estimate;
                const barColor = over ? "#DE4E4E" : pct >= 0.8 ? "#E8B42E" : "#7ADE9A";
                return (
                  <div className="h-0.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct * 100}%`, background: barColor }}
                    />
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Timer button */}
        {onStartTimer && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartTimer(issue);
            }}
            className={`flex-shrink-0 transition-all duration-150 size-6 flex items-center justify-center rounded ${isTimerActive ? "opacity-100" : "opacity-0 group-hover:opacity-80"}`}
            style={{
              background: isTimerActive ? "rgba(232,124,46,0.2)" : "rgba(255,255,255,0.06)",
              color: isTimerActive ? "#E87C2E" : "#9A9AA4",
            }}
            aria-label={isTimerActive ? `Stop timer for ${issue.key}` : `Start timer for ${issue.key}`}
            title={isTimerActive ? "Stop timer" : "Start timer"}
          >
            {isTimerActive ? (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                <rect x="0" y="0" width="3" height="8" rx="0.5" />
                <rect x="5" y="0" width="3" height="8" rx="0.5" />
              </svg>
            ) : (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                <path d="M1 0.5L7.5 4L1 7.5V0.5Z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
