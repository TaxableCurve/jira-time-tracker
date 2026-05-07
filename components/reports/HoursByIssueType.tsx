"use client";

import { secondsToHuman } from "@/lib/format";
import { WorklogEvent } from "@/hooks/useWorklogs";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

const PALETTE = ["#06B6D4", "#F59E0B", "#7ADE9A", "#E8B42E", "#DE7AAE", "#9B7ADE", "#DE4E4E"];

interface Props {
  worklogs: WorklogEvent[];
}

export function HoursByIssueType({ worklogs }: Props) {
  const byType = worklogs.reduce<Record<string, number>>((acc, wl) => {
    acc[wl.issueType] = (acc[wl.issueType] ?? 0) + wl.timeSpentSeconds;
    return acc;
  }, {});

  const total = worklogs.reduce((acc, wl) => acc + wl.timeSpentSeconds, 0);
  const sorted = Object.entries(byType).sort((a, b) => b[1] - a[1]);

  if (sorted.length <= 1) return null;

  return (
    <Card className="p-4">
      <SectionLabel as="h2" className="mb-4">Hours by issue type</SectionLabel>

      <div className="space-y-3">
        {sorted.map(([type, seconds], i) => {
          const pct = total > 0 ? seconds / total : 0;
          const color = PALETTE[i % PALETTE.length];
          return (
            <div key={type}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="font-sans text-[10px] text-muted-foreground truncate">{type}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    {Math.round(pct * 100)}%
                  </span>
                  <span className="font-mono text-xs tabular-nums text-foreground">
                    {secondsToHuman(seconds)}
                  </span>
                </div>
              </div>
              <div
                className="h-1 w-full rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct * 100}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
