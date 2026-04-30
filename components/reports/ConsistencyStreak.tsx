"use client";

import { eachDayOfInterval, format, isWeekend } from "date-fns";
import { WorklogEvent } from "@/hooks/useWorklogs";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

interface Props {
  worklogs: WorklogEvent[];
  from: Date;
  to: Date;
}

export function ConsistencyStreak({ worklogs, from, to }: Props) {
  const loggedDays = new Set(worklogs.map((wl) => wl.start.slice(0, 10)));

  const allDays = eachDayOfInterval({ start: from, end: to });
  const workDays = allDays.filter((d) => !isWeekend(d));
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const pastWorkDays = workDays.filter((d) => format(d, "yyyy-MM-dd") <= todayStr);

  const workedCount = pastWorkDays.filter((d) => loggedDays.has(format(d, "yyyy-MM-dd"))).length;
  const consistency = pastWorkDays.length > 0 ? Math.round((workedCount / pastWorkDays.length) * 100) : 0;

  // Current streak: consecutive work days backwards from today with logs
  let currentStreak = 0;
  const sortedWorkDays = [...pastWorkDays].reverse();
  for (const day of sortedWorkDays) {
    if (loggedDays.has(format(day, "yyyy-MM-dd"))) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Longest streak in period
  let longestStreak = 0;
  let runningStreak = 0;
  for (const day of pastWorkDays) {
    if (loggedDays.has(format(day, "yyyy-MM-dd"))) {
      runningStreak++;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  const missedDays = pastWorkDays.length - workedCount;

  const stats = [
    { label: "Consistency", value: `${consistency}%`, sub: `${workedCount} / ${pastWorkDays.length} work days` },
    { label: "Current streak", value: `${currentStreak}d`, sub: currentStreak === longestStreak && longestStreak > 1 ? "personal best" : "consecutive" },
    { label: "Best streak", value: `${longestStreak}d`, sub: "this period" },
    { label: "Missed days", value: String(missedDays), sub: missedDays === 0 ? "perfect attendance" : "work days without logs" },
  ];

  const consistencyColor =
    consistency >= 90 ? "#7ADE9A" : consistency >= 70 ? "#E8B42E" : "#DE4E4E";

  return (
    <Card className="p-4">
      <SectionLabel as="h3" className="mb-4">Consistency</SectionLabel>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{s.label}</p>
            <p
              className="font-sans text-2xl font-bold leading-none mb-1"
              style={{ color: s.label === "Consistency" ? consistencyColor : "var(--foreground)" }}
            >
              {s.value}
            </p>
            <p className="font-mono text-[10px] text-[#767680]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Mini timeline: past work days colored by logged/missed */}
      <div className="flex flex-wrap gap-1 mt-2">
        {pastWorkDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const logged = loggedDays.has(key);
          const isToday = key === todayStr;
          return (
            <div
              key={key}
              title={`${format(day, "EEE MMM d")}${logged ? " ✓" : " — no log"}`}
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: logged ? "#7ADE9A" : "rgba(222,78,78,0.4)",
                border: isToday ? "1px solid rgba(232,124,46,0.8)" : "1px solid transparent",
              }}
            />
          );
        })}
      </div>
      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-1">
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "#7ADE9A", display: "inline-block" }} />
          <span className="font-mono text-[9px] text-muted-foreground">logged</span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(222,78,78,0.4)", display: "inline-block" }} />
          <span className="font-mono text-[9px] text-muted-foreground">no log</span>
        </div>
      </div>
    </Card>
  );
}
