"use client";

import { useState } from "react";
import { format, getDay, getYear, getDaysInMonth } from "date-fns";
import Holidays from "date-holidays";
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
  return `rgba(6,182,212,${opacity.toFixed(2)})`;
}

function getMonthsInRange(from: Date, to: Date): { year: number; month: number }[] {
  const months: { year: number; month: number }[] = [];
  let y = from.getFullYear(), m = from.getMonth();
  const endY = to.getFullYear(), endM = to.getMonth();
  while (y < endY || (y === endY && m <= endM)) {
    months.push({ year: y, month: m });
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return months;
}

function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const startOffset = (getDay(firstDay) + 6) % 7;
  const totalDays = getDaysInMonth(firstDay);

  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1)),
  ];

  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const row = cells.slice(i, i + 7);
    while (row.length < 7) row.push(null);
    rows.push(row);
  }
  return rows;
}

interface Props {
  worklogs: WorklogEvent[];
  from: Date;
  to: Date;
}

interface TooltipData {
  date: string;
  seconds: number;
  holiday?: string;
  tasks: { key: string; name: string; seconds: number }[];
  x: number;
  y: number;
}

export function HoursHeatmap({ worklogs, from, to }: Props) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const hd = new Holidays("CO");
  const allYears = new Set([getYear(from), getYear(to)]);
  const holidayMap = new Map<string, string>();
  for (const year of allYears) {
    for (const h of hd.getHolidays(year)) {
      holidayMap.set(h.date.slice(0, 10), h.name);
    }
  }

  const dayMap = worklogs.reduce<Record<string, { seconds: number; tasks: Record<string, { name: string; seconds: number }> }>>((acc, wl) => {
    const key = wl.start.slice(0, 10);
    if (!acc[key]) acc[key] = { seconds: 0, tasks: {} };
    acc[key].seconds += wl.timeSpentSeconds;
    if (!acc[key].tasks[wl.issueKey]) acc[key].tasks[wl.issueKey] = { name: wl.issueName, seconds: 0 };
    acc[key].tasks[wl.issueKey].seconds += wl.timeSpentSeconds;
    return acc;
  }, {});

  const months = getMonthsInRange(from, to);
  const multiMonth = months.length > 1;

  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between gap-4 mb-4">
        <SectionLabel as="h2">Hours calendar</SectionLabel>
        <div className="flex items-center gap-2">
          {([0, 2, 4, 6, 8] as const).map((h, i) => (
            <div key={h} className="flex items-center gap-1">
              <span
                className="rounded-sm flex-shrink-0"
                style={{
                  width: 10,
                  height: 10,
                  display: "inline-block",
                  background: i === 0 ? "rgba(255,255,255,0.06)" : intensityColor(h * 3600),
                }}
              />
              <span className="font-mono text-[9px] text-[#767680]">{h}h</span>
            </div>
          ))}
        </div>
      </div>

      <div className={multiMonth ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "flex-1 flex flex-col"}>
        {months.map(({ year, month }) => {
          const rows = buildMonthGrid(year, month);
          const monthLabel = format(new Date(year, month, 1), "MMMM yyyy");

          return (
            <div key={`${year}-${month}`} className={multiMonth ? "" : "flex-1 flex flex-col"}>
              {multiMonth && (
                <p className="font-mono text-[10px] text-muted-foreground mb-2">{monthLabel}</p>
              )}
              <div
                className="grid grid-cols-7 gap-1 flex-1"
                style={{ gridTemplateRows: `auto repeat(${rows.length}, 1fr)` }}
              >
                {DAY_LABELS.map((d) => (
                  <div key={d} className="text-center font-mono text-[9px] text-[#767680] pb-1">
                    {d.slice(0, 1)}
                  </div>
                ))}
                {rows.map((row, ri) =>
                  row.map((day, di) => {
                    if (!day) {
                      return <div key={`${ri}-${di}`} />;
                    }
                    const key = format(day, "yyyy-MM-dd");
                    const inRange = day >= from && day <= to;
                    const data = inRange ? dayMap[key] : null;
                    const seconds = data?.seconds ?? 0;
                    const isToday = key === format(new Date(), "yyyy-MM-dd");
                    const holidayName = inRange ? holidayMap.get(key) : undefined;
                    const bg = !inRange
                      ? "rgba(255,255,255,0.02)"
                      : holidayName && seconds === 0
                      ? "rgba(120,120,200,0.25)"
                      : intensityColor(seconds);

                    return (
                      <div
                        key={`${ri}-${di}`}
                        className="relative rounded flex items-end justify-end p-0.5 select-none h-full"
                        style={{
                          minHeight: 24,
                          background: bg,
                          border: isToday
                            ? "1px solid rgba(6,182,212,0.8)"
                            : holidayName
                            ? "1px solid rgba(120,120,200,0.4)"
                            : "1px solid transparent",
                          cursor: inRange && (seconds > 0 || holidayName) ? "pointer" : "default",
                          opacity: inRange ? 1 : 0.3,
                        }}
                        onMouseEnter={(e) => {
                          if (!inRange || (!data && !holidayName)) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltip({
                            date: format(day, "EEE, MMM d yyyy"),
                            seconds,
                            holiday: holidayName,
                            tasks: data
                              ? Object.entries(data.tasks)
                                  .sort((a, b) => b[1].seconds - a[1].seconds)
                                  .map(([k, v]) => ({ key: k, name: v.name, seconds: v.seconds }))
                              : [],
                            x: rect.right + 8,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        <span
                          className="font-mono leading-none"
                          style={{
                            fontSize: 9,
                            color: seconds > 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
                          }}
                        >
                          {day.getDate()}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
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
          {tooltip.holiday && (
            <p className="font-mono text-[10px] mb-1" style={{ color: "rgba(160,160,230,0.9)" }}>
              {tooltip.holiday}
            </p>
          )}
          <p className="font-sans text-[13px] font-bold text-primary mb-1.5">
            {tooltip.seconds > 0 ? secondsToHuman(tooltip.seconds) : "No logs"}
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
