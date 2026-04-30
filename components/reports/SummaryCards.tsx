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
    { label: "Total hours", value: secondsToHuman(totalSeconds), sub: `${worklogs.length} worklogs` },
    { label: "Days worked", value: String(days), sub: `avg ${secondsToHuman(Math.round(avgPerDay))} / day` },
    { label: "Top task", value: topIssue?.[0] ?? "—", sub: topIssue ? secondsToHuman(topIssue[1]) : "" },
    { label: "Tasks", value: String(Object.keys(byIssue).length), sub: "worked this period" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="px-4 py-3">
          <SectionLabel className="mb-2">{card.label}</SectionLabel>
          <p className="font-sans text-2xl font-bold leading-none mb-1 text-foreground">
            {card.value}
          </p>
          <p className="font-mono text-[10px] text-[#767680]">{card.sub}</p>
        </Card>
      ))}
    </div>
  );
}
