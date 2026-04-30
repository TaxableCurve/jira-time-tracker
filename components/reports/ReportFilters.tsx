"use client";

import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type RangePreset = "this-week" | "last-week" | "this-month" | "last-month" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

export function getRangeFromPreset(preset: RangePreset): DateRange {
  const now = new Date();
  switch (preset) {
    case "this-week":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case "last-week": {
      const last = new Date(now);
      last.setDate(last.getDate() - 7);
      return { from: startOfWeek(last, { weekStartsOn: 1 }), to: endOfWeek(last, { weekStartsOn: 1 }) };
    }
    case "this-month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "last-month": {
      const last = subMonths(now, 1);
      return { from: startOfMonth(last), to: endOfMonth(last) };
    }
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "this-week", label: "This week" },
  { value: "last-week", label: "Last week" },
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "custom", label: "Custom" },
];

interface Props {
  preset: RangePreset;
  range: DateRange;
  onPresetChange: (preset: RangePreset) => void;
  onRangeChange: (range: DateRange) => void;
}

export function ReportFilters({ preset, range, onPresetChange, onRangeChange }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESETS.map((p) => (
        <Button
          key={p.value}
          variant="toggle"
          size="xs"
          isActive={preset === p.value}
          onClick={() => onPresetChange(p.value)}
        >
          {p.label}
        </Button>
      ))}

      {preset === "custom" && (
        <div className="flex items-center gap-2 ml-2">
          <Input
            type="date"
            value={format(range.from, "yyyy-MM-dd")}
            onChange={(e) => onRangeChange({ ...range, from: new Date(e.target.value) })}
            className="w-auto px-2 py-1"
            style={{ colorScheme: "dark" }}
          />
          <span className="font-mono text-[10px] text-[#767680]">→</span>
          <Input
            type="date"
            value={format(range.to, "yyyy-MM-dd")}
            onChange={(e) => onRangeChange({ ...range, to: new Date(e.target.value) })}
            className="w-auto px-2 py-1"
            style={{ colorScheme: "dark" }}
          />
        </div>
      )}
    </div>
  );
}
