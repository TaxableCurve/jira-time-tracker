"use client";

import { secondsToHuman } from "@/lib/format";
import { WorklogEvent } from "@/hooks/useWorklogs";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

interface Props {
  worklogs: WorklogEvent[];
}

export function SummaryCards({ worklogs }: Props) {
  const totalSeconds = worklogs.reduce((acc, wl) => acc + wl.timeSpentSeconds, 0);

  const byIssue = worklogs.reduce<Record<string, number>>((acc, wl) => {
    acc[wl.issueKey] = (acc[wl.issueKey] ?? 0) + wl.timeSpentSeconds;
    return acc;
  }, {});

  const topIssue = Object.entries(byIssue).sort((a, b) => b[1] - a[1])[0];
  const days = new Set(worklogs.map((wl) => wl.start.slice(0, 10))).size;
  const avgPerDay = days > 0 ? totalSeconds / days : 0;

  const cards = [
    { label: "Total hours", value: secondsToHuman(totalSeconds), sub: `${worklogs.length} worklogs`, accent: "#E87C2E" },
    { label: "Days worked", value: String(days), sub: `avg ${secondsToHuman(Math.round(avgPerDay))} / day`, accent: "#4EA8DE" },
    { label: "Top task", value: topIssue?.[0] ?? "—", sub: topIssue ? secondsToHuman(topIssue[1]) : "", accent: "#9B7ADE" },
    { label: "Tasks", value: String(Object.keys(byIssue).length), sub: "worked this period", accent: "#7ADE9A" },
  ];

  const isEmpty = worklogs.length === 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="px-4 py-4 relative overflow-hidden"
          style={{ borderTop: `2px solid ${card.accent}22`, boxShadow: `0 1px 0 0 ${card.accent}18 inset` }}
        >
          <span
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: card.accent, opacity: 0.5 }}
          />
          <SectionLabel className="mb-3">{card.label}</SectionLabel>
          {isEmpty ? (
            <div className="h-7 w-16 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
          ) : (
            <p className="font-sans text-2xl font-bold leading-none mb-1.5 text-foreground">
              {card.value}
            </p>
          )}
          <p className="font-mono text-[10px] text-[#767680]">
            {isEmpty ? "no data" : card.sub}
          </p>
        </Card>
      ))}
    </div>
  );
}
