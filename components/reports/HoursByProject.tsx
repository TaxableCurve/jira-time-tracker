"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { secondsToHuman } from "@/lib/format";
import { WorklogEvent } from "@/hooks/useWorklogs";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

const PALETTE = ["#E87C2E", "#4EA8DE", "#7ADE9A", "#E8B42E", "#DE7AAE", "#9B7ADE", "#DE4E4E"];

interface Props {
  worklogs: WorklogEvent[];
}

export function HoursByProject({ worklogs }: Props) {
  const byIssue = worklogs.reduce<Record<string, { seconds: number; name: string; estimate: number | null }>>((acc, wl) => {
    const key = wl.issueKey;
    if (!acc[key]) acc[key] = { seconds: 0, name: wl.issueName, estimate: wl.originalEstimateSeconds ?? null };
    acc[key].seconds += wl.timeSpentSeconds;
    return acc;
  }, {});

  const sorted = Object.entries(byIssue).sort((a, b) => b[1].seconds - a[1].seconds);
  const top = sorted.slice(0, 8);
  const others = sorted.slice(8);
  const othersSeconds = others.reduce((acc, [, v]) => acc + v.seconds, 0);

  const data = [
    ...top.map(([key, val], i) => ({
      key,
      name: `${key} · ${val.name}`,
      shortName: key,
      hours: parseFloat((val.seconds / 3600).toFixed(1)),
      seconds: val.seconds,
      color: PALETTE[i % PALETTE.length],
    })),
    ...(othersSeconds > 0 ? [{
      key: "others",
      name: "Others",
      shortName: "Others",
      hours: parseFloat((othersSeconds / 3600).toFixed(1)),
      seconds: othersSeconds,
      color: "#767680",
    }] : []),
  ];

  if (data.length === 0) return <EmptyState />;

  return (
    <Card className="p-4">
      <SectionLabel as="h3" className="mb-4">Hours by task</SectionLabel>

      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="hours">
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#1C1C1F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, fontFamily: "var(--font-jetbrains)", fontSize: 11 }}
              formatter={(_: unknown, __: unknown, props: { payload?: { seconds: number; name: string } }) => [secondsToHuman(props.payload?.seconds ?? 0), props.payload?.name ?? ""] as [string, string]}
              labelStyle={{ color: "#E8E8E4" }}
              itemStyle={{ color: "#B0B0B8" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 space-y-3 max-h-56 overflow-y-auto pr-1">
        {data.map((entry) => {
          const estimate = entry.key !== "others" ? byIssue[entry.key]?.estimate ?? null : null;
          const pct = estimate ? Math.min(entry.seconds / estimate, 1) : null;
          const over = estimate ? entry.seconds > estimate : false;
          const barColor = !pct ? entry.color : over ? "#DE4E4E" : pct >= 0.8 ? "#E8B42E" : "#7ADE9A";

          return (
            <div key={entry.key}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] text-primary">{entry.shortName}</span>
                    {entry.key !== "others" && (
                      <span className="font-sans text-[10px] truncate block text-muted-foreground">
                        {entry.name.split(" · ")[1]}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="font-mono text-xs tabular-nums" style={{ color: barColor }}>
                    {secondsToHuman(entry.seconds)}
                  </span>
                  {estimate && (
                    <span className="font-mono text-[10px] tabular-nums text-[#767680]">
                      / {secondsToHuman(estimate)}
                    </span>
                  )}
                </div>
              </div>
              {pct !== null && (
                <div className="h-px w-full rounded-full overflow-hidden ml-4" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct * 100}%`, background: barColor }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="p-4 flex items-center justify-center" style={{ height: 220 }}>
      <p className="font-mono text-xs text-[#767680]">No data for this period</p>
    </Card>
  );
}
