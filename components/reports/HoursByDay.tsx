"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { eachDayOfInterval, format } from "date-fns";
import { secondsToHuman } from "@/lib/format";
import { WorklogEvent } from "@/hooks/useWorklogs";

const PALETTE = ["#06B6D4", "#F59E0B", "#7ADE9A", "#E8B42E", "#DE7AAE", "#9B7ADE", "#DE4E4E"];
const PROJECT_COLORS: Record<string, string> = {};
function projectColor(key: string): string {
  if (!PROJECT_COLORS[key]) {
    const idx = Object.keys(PROJECT_COLORS).length % PALETTE.length;
    PROJECT_COLORS[key] = PALETTE[idx];
  }
  return PROJECT_COLORS[key];
}

interface Props {
  worklogs: WorklogEvent[];
  from: Date;
  to: Date;
}

export function HoursByDay({ worklogs, from, to }: Props) {
  const days = eachDayOfInterval({ start: from, end: to });

  const data = days.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const dayLogs = worklogs.filter((wl) => wl.start.slice(0, 10) === key);
    const totalSeconds = dayLogs.reduce((acc, wl) => acc + wl.timeSpentSeconds, 0);
    return {
      date: format(day, "EEE d"),
      fullDate: key,
      hours: parseFloat((totalSeconds / 3600).toFixed(2)),
      seconds: totalSeconds,
      logs: dayLogs,
    };
  });

  const maxHours = Math.max(...data.map((d) => d.hours), 1);

  return (
    <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <h3 className="text-xs font-600 mb-4 uppercase tracking-[0.15em]" style={{ fontFamily: "var(--font-jetbrains)", color: "#9A9AA4" }}>
        Hours by day
      </h3>

      <ResponsiveContainer width="100%" height={200} minWidth={0}>
        <BarChart data={data} barSize={24} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <XAxis
            dataKey="date"
            tick={{ fontFamily: "var(--font-jetbrains)", fontSize: 9, fill: "#767680" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, Math.ceil(maxHours * 1.2)]}
            tick={{ fontFamily: "var(--font-jetbrains)", fontSize: 9, fill: "#767680" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}h`}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{ background: "#1C1C1F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, fontFamily: "var(--font-jetbrains)", fontSize: 11 }}
            formatter={(_: unknown, __: unknown, props: { payload?: { seconds: number; logs: WorklogEvent[] } }) => {
              const p = props.payload;
              if (!p || p.seconds === 0) return ["No logs", ""];
              const byProject = p.logs.reduce<Record<string, number>>((acc, wl) => {
                acc[wl.projectKey] = (acc[wl.projectKey] ?? 0) + wl.timeSpentSeconds;
                return acc;
              }, {});
              const lines = Object.entries(byProject).map(([k, s]) => `${k}: ${secondsToHuman(s)}`).join("\n");
              return [secondsToHuman(p.seconds), lines];
            }}
            labelStyle={{ color: "#E8E8E4", marginBottom: 4 }}
            itemStyle={{ color: "#B0B0B8", whiteSpace: "pre" }}
          />
          <Bar dataKey="hours" radius={[3, 3, 0, 0]}>
            {data.map((entry) => {
              const topProject = entry.logs.sort((a, b) => b.timeSpentSeconds - a.timeSpentSeconds)[0];
              const color = topProject ? projectColor(topProject.projectKey) : "rgba(255,255,255,0.08)";
              return (
                <Cell
                  key={entry.fullDate}
                  fill={entry.seconds > 0 ? `${color}80` : "rgba(255,255,255,0.04)"}
                  stroke={entry.seconds > 0 ? color : "transparent"}
                  strokeWidth={1}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
