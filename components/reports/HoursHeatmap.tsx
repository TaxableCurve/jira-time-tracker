"use client";

import { useState } from "react";
import { eachDayOfInterval, format, getDay, startOfWeek } from "date-fns";
import { secondsToHuman } from "@/lib/format";
import { WorklogEvent } from "@/hooks/useWorklogs";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_HOURS = 8;

function intensityColor(seconds: number): string {
  if (seconds === 0) return "rgba(255,255,255,0.06)";
  const ratio = Math.min(seconds / (MAX_HOURS * 3600), 1);
  const opacity = 0.2 + ratio * 0.8;
  return `rgba(232,124,46,${opacity.toFixed(2)})`;
}

interface Props {
  worklogs: WorklogEvent[];
  from: Date;
  to: Date;
}

interface TooltipData {
  date: string;
  seconds: number;
  tasks: { key: string; name: string; seconds: number }[];
  x: number;
  y: number;
}

export function HoursHeatmap({ worklogs, from, to }: Props) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const dayMap = worklogs.reduce<Record<string, { seconds: number; tasks: Record<string, { name: string; seconds: number }> }>>((acc, wl) => {
    const key = wl.start.slice(0, 10);
    if (!acc[key]) acc[key] = { seconds: 0, tasks: {} };
    acc[key].seconds += wl.timeSpentSeconds;
    if (!acc[key].tasks[wl.issueKey]) acc[key].tasks[wl.issueKey] = { name: wl.issueName, seconds: 0 };
    acc[key].tasks[wl.issueKey].seconds += wl.timeSpentSeconds;
    return acc;
  }, {});

  const firstWeekStart = startOfWeek(from, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: firstWeekStart, end: to });

  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = [];
  allDays.forEach((day) => {
    const dow = (getDay(day) + 6) % 7;
    if (dow === 0 && week.length > 0) {
      weeks.push(week);
      week = [];
    }
    const inRange = day >= from && day <= to;
    week.push(inRange ? day : null);
  });
  if (week.length > 0) weeks.push(week);

  const monthLabels: { label: string; colIndex: number }[] = [];
  weeks.forEach((w, i) => {
    const firstDay = w.find((d) => d !== null);
    if (firstDay && (i === 0 || format(firstDay, "MMM") !== monthLabels[monthLabels.length - 1]?.label)) {
      monthLabels.push({ label: format(firstDay, "MMM"), colIndex: i });
    }
  });

  const cellSize = 18;
  const cellGap = 3;
  const step = cellSize + cellGap;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <SectionLabel as="h3">Hours heatmap</SectionLabel>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-[#767680]">less</span>
          {[0, 0.2, 0.4, 0.7, 1].map((r) => (
            <span
              key={r}
              className="rounded-sm"
              style={{
                width: 10,
                height: 10,
                display: "inline-block",
                background: r === 0 ? "rgba(255,255,255,0.04)" : `rgba(232,124,46,${(0.15 + r * 0.85).toFixed(2)})`,
              }}
            />
          ))}
          <span className="font-mono text-[9px] text-[#767680]">more</span>
        </div>
      </div>

      <div className="overflow-x-auto flex justify-center">
        <div style={{ position: "relative", paddingLeft: 28, paddingTop: 20 }}>
          {monthLabels.map(({ label, colIndex }) => (
            <span
              key={label}
              className="font-mono text-[9px] text-muted-foreground absolute"
              style={{ top: 2, left: 28 + colIndex * step }}
            >
              {label}
            </span>
          ))}

          {DAY_LABELS.map((d, i) => (
            <span
              key={d}
              className="font-mono text-[9px] text-[#767680] absolute"
              style={{ left: 0, top: 20 + i * step, lineHeight: `${cellSize}px` }}
            >
              {i % 2 === 0 ? d.slice(0, 1) : ""}
            </span>
          ))}

          <div style={{ display: "flex", gap: cellGap }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: cellGap }}>
                {Array.from({ length: 7 }).map((_, di) => {
                  const day = week[di] ?? null;
                  const key = day ? format(day, "yyyy-MM-dd") : null;
                  const data = key ? dayMap[key] : null;
                  const seconds = data?.seconds ?? 0;
                  const isToday = day ? format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") : false;

                  return (
                    <div
                      key={di}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: 2,
                        background: day ? intensityColor(seconds) : "rgba(255,255,255,0.02)",
                        border: isToday ? "1px solid rgba(232,124,46,0.8)" : "1px solid transparent",
                        cursor: seconds > 0 ? "pointer" : "default",
                      }}
                      onMouseEnter={(e) => {
                        if (!day || !data) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          date: format(day, "EEE, MMM d yyyy"),
                          seconds,
                          tasks: Object.entries(data.tasks)
                            .sort((a, b) => b[1].seconds - a[1].seconds)
                            .map(([k, v]) => ({ key: k, name: v.name, seconds: v.seconds })),
                          x: rect.right + 8,
                          y: rect.top,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: Math.min(tooltip.x, window.innerWidth - 220),
            top: Math.min(tooltip.y, window.innerHeight - 160),
            zIndex: 1000,
            background: "#1C1C1F",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            padding: "8px 10px",
            minWidth: 180,
            pointerEvents: "none",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <p className="font-mono text-[10px] text-muted-foreground mb-1">{tooltip.date}</p>
          <p className="font-sans text-[13px] font-bold text-primary mb-1.5">
            {secondsToHuman(tooltip.seconds)}
          </p>
          {tooltip.tasks.map((t) => (
            <div key={t.key} className="mb-0.5">
              <span className="font-mono text-[9px] text-primary">{t.key}</span>
              <span className="font-mono text-[9px] text-[#767680]"> · </span>
              <span className="font-mono text-[9px] text-[#B0B0B8]">{secondsToHuman(t.seconds)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
