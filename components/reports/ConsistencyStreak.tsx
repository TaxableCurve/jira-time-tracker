"use client";

import { eachDayOfInterval, format, isWeekend, getYear } from "date-fns";
import Holidays from "date-holidays";
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

  // Build holiday set for all years spanned by the range
  const hd = new Holidays("CO");
  const years = new Set(allDays.map((d) => getYear(d)));
  const holidays = new Set<string>();
  for (const year of years) {
    for (const h of hd.getHolidays(year)) {
      holidays.add(h.date.slice(0, 10));
    }
  }

  const workDays = allDays.filter((d) => !isWeekend(d) && !holidays.has(format(d, "yyyy-MM-dd")));
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

  const missedDays = pastWorkDays.filter((d) => format(d, "yyyy-MM-dd") < todayStr).length -
    pastWorkDays.filter((d) => format(d, "yyyy-MM-dd") < todayStr && loggedDays.has(format(d, "yyyy-MM-dd"))).length;

  const stats = [
    { label: "Current streak", value: `${currentStreak}d`, sub: currentStreak === longestStreak && longestStreak > 1 ? "personal best" : "consecutive" },
    { label: "Best streak", value: `${longestStreak}d`, sub: "this period" },
    { label: "Missed days", value: String(missedDays), sub: missedDays === 0 ? "perfect attendance" : "work days without logs" },
  ];

  const consistencyColor =
    consistency >= 90 ? "#7ADE9A" : consistency >= 70 ? "#E8B42E" : "#DE4E4E";

  return (
    <Card className="p-4">
      <SectionLabel as="h2" className="mb-3">Consistency</SectionLabel>

      {/* Hero + stats row */}
      <div className="flex gap-6 items-start mb-4">
        {/* Hero percentage */}
        <div className="min-w-[90px]">
          <span
            className="font-sans font-bold leading-none"
            style={{ fontSize: 48, color: consistencyColor, lineHeight: 1 }}
          >
            {consistency}%
          </span>
          <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)", width: 90 }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${consistency}%`, background: consistencyColor }}
            />
          </div>
          <p className="font-mono text-[10px] text-[#767680] mt-1.5">{workedCount} / {pastWorkDays.length} days</p>
        </div>

        {/* Divider */}
        <div className="self-stretch w-px" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* Stats */}
        <div className="flex flex-1 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="flex-1">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground mb-1">{s.label}</p>
              <p className="font-sans text-2xl font-bold leading-none mb-1">{s.value}</p>
              <p className="font-mono text-[10px] text-[#767680]">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mini timeline: all weekdays colored by logged / missed / holiday */}
      <div className="flex flex-wrap gap-1 mt-2">
        {allDays.filter((d) => !isWeekend(d) && format(d, "yyyy-MM-dd") <= todayStr).map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const isHoliday = holidays.has(key);
          const logged = loggedDays.has(key);
          const holidayName = isHoliday
            ? hd.isHoliday(new Date(key + "T12:00:00"))
            : null;
          const title = isHoliday
            ? `${format(day, "EEE MMM d")} — ${Array.isArray(holidayName) ? holidayName[0]?.name : "holiday"}`
            : `${format(day, "EEE MMM d")}${logged ? " ✓" : " — no log"}`;
          const bg = isHoliday
            ? "rgba(120,120,200,0.5)"
            : logged
            ? "#7ADE9A"
            : "rgba(222,78,78,0.4)";
          return (
            <div
              key={key}
              title={title}
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: bg,
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
        <div className="flex items-center gap-1">
          <span style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(120,120,200,0.5)", display: "inline-block" }} />
          <span className="font-mono text-[9px] text-muted-foreground">holiday</span>
        </div>
      </div>
    </Card>
  );
}
