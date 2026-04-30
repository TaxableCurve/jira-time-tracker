"use client";

import { secondsToHuman } from "@/lib/format";
import { WorklogEvent } from "@/hooks/useWorklogs";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

interface Props {
  worklogs: WorklogEvent[];
}

export function EstimateAccuracy({ worklogs }: Props) {
  const withEstimate = worklogs.filter((wl) => wl.originalEstimateSeconds && wl.originalEstimateSeconds > 0);
  if (withEstimate.length === 0) return null;

  const byIssue = withEstimate.reduce<
    Record<string, { name: string; logged: number; estimate: number; total: number | null }>
  >((acc, wl) => {
    if (!acc[wl.issueKey]) {
      acc[wl.issueKey] = {
        name: wl.issueName,
        logged: 0,
        estimate: wl.originalEstimateSeconds!,
        total: wl.totalTimeSpentSeconds,
      };
    }
    acc[wl.issueKey].logged += wl.timeSpentSeconds;
    if (wl.totalTimeSpentSeconds !== null) acc[wl.issueKey].total = wl.totalTimeSpentSeconds;
    return acc;
  }, {});

  const items = Object.entries(byIssue)
    .map(([key, val]) => {
      const reference = val.total ?? val.logged;
      const ratio = reference / val.estimate;
      return { key, ...val, ratio };
    })
    .sort((a, b) => b.ratio - a.ratio);

  const overCount = items.filter((i) => i.ratio > 1).length;
  const onTrackCount = items.filter((i) => i.ratio >= 0.8 && i.ratio <= 1).length;
  const underCount = items.filter((i) => i.ratio < 0.8).length;

  function statusColor(ratio: number) {
    if (ratio > 1) return "#DE4E4E";
    if (ratio >= 0.8) return "#E8B42E";
    return "#7ADE9A";
  }

  function statusLabel(ratio: number) {
    if (ratio > 1) return "over";
    if (ratio >= 0.8) return "on track";
    return "under";
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <SectionLabel as="h3">Estimate accuracy</SectionLabel>
        <div className="flex gap-3">
          {overCount > 0 && (
            <span className="font-mono text-[10px]" style={{ color: "#DE4E4E" }}>
              {overCount} over
            </span>
          )}
          {onTrackCount > 0 && (
            <span className="font-mono text-[10px]" style={{ color: "#E8B42E" }}>
              {onTrackCount} on track
            </span>
          )}
          {underCount > 0 && (
            <span className="font-mono text-[10px]" style={{ color: "#7ADE9A" }}>
              {underCount} under
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {items.map((item) => {
          const pct = Math.min(item.ratio, 1);
          const color = statusColor(item.ratio);
          const reference = item.total ?? item.logged;

          return (
            <div key={item.key}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="min-w-0">
                  <span className="font-mono text-[10px] text-primary">{item.key}</span>
                  <span className="font-sans text-[10px] text-muted-foreground truncate block">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono text-[10px] tabular-nums" style={{ color }}>
                    {statusLabel(item.ratio)}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-foreground">
                    {secondsToHuman(reference)}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    / {secondsToHuman(item.estimate)}
                  </span>
                </div>
              </div>
              <div
                className="h-px w-full rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full"
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
