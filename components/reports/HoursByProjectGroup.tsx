"use client";

import { secondsToHuman } from "@/lib/format";
import { WorklogEvent } from "@/hooks/useWorklogs";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

const PALETTE = ["#E87C2E", "#4EA8DE", "#7ADE9A", "#E8B42E", "#DE7AAE", "#9B7ADE", "#DE4E4E"];

interface Props {
  worklogs: WorklogEvent[];
}

export function HoursByProjectGroup({ worklogs }: Props) {
  const byProject = worklogs.reduce<Record<string, { name: string; seconds: number }>>((acc, wl) => {
    if (!acc[wl.projectKey]) acc[wl.projectKey] = { name: wl.projectName, seconds: 0 };
    acc[wl.projectKey].seconds += wl.timeSpentSeconds;
    return acc;
  }, {});

  const total = worklogs.reduce((acc, wl) => acc + wl.timeSpentSeconds, 0);
  const sorted = Object.entries(byProject).sort((a, b) => b[1].seconds - a[1].seconds);

  if (sorted.length <= 1) return null;

  return (
    <Card className="p-4">
      <SectionLabel as="h3" className="mb-4">Hours by project</SectionLabel>

      <div className="space-y-3">
        {sorted.map(([key, val], i) => {
          const pct = total > 0 ? val.seconds / total : 0;
          const color = PALETTE[i % PALETTE.length];
          return (
            <div key={key}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] text-primary">{key}</span>
                    <span className="font-sans text-[10px] text-muted-foreground truncate block">{val.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    {Math.round(pct * 100)}%
                  </span>
                  <span className="font-mono text-xs tabular-nums text-foreground">
                    {secondsToHuman(val.seconds)}
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
