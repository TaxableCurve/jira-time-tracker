"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ReportFilters, getRangeFromPreset, type RangePreset, type DateRange } from "@/components/reports/ReportFilters";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { ConsistencyStreak } from "@/components/reports/ConsistencyStreak";
import { EstimateAccuracy } from "@/components/reports/EstimateAccuracy";
import { useWorklogRange } from "@/hooks/useWorklogs";

const HoursByDay = dynamic(() => import("@/components/reports/HoursByDay").then((m) => m.HoursByDay));
const HoursByProject = dynamic(() => import("@/components/reports/HoursByProject").then((m) => m.HoursByProject));
const HoursByProjectGroup = dynamic(() => import("@/components/reports/HoursByProjectGroup").then((m) => m.HoursByProjectGroup));
const HoursHeatmap = dynamic(() => import("@/components/reports/HoursHeatmap").then((m) => m.HoursHeatmap));

export default function ReportsPage() {
  const [preset, setPreset] = useState<RangePreset>("this-month");
  const [range, setRange] = useState<DateRange>(getRangeFromPreset("this-month"));

  const handlePresetChange = (p: RangePreset) => {
    setPreset(p);
    if (p !== "custom") setRange(getRangeFromPreset(p));
  };

  const { data: worklogs, isLoading } = useWorklogRange(range.from, range.to);

  return (
    <div className="p-5 space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-700 leading-none" style={{ fontFamily: "var(--font-syne)" }}>
            Reports
          </h1>
          <p className="text-xs mt-1" style={{ fontFamily: "var(--font-jetbrains)", color: "#6B6B72" }}>
            {range.from.toLocaleDateString()} — {range.to.toLocaleDateString()}
          </p>
        </div>

        {isLoading && (
          <span className="text-[10px] animate-pulse" style={{ fontFamily: "var(--font-jetbrains)", color: "#E87C2E" }}>
            Loading...
          </span>
        )}
      </div>

      <ReportFilters
        preset={preset}
        range={range}
        onPresetChange={handlePresetChange}
        onRangeChange={setRange}
      />

      {worklogs && (
        <>
          <SummaryCards worklogs={worklogs} />
          <ConsistencyStreak worklogs={worklogs} from={range.from} to={range.to} />

          <HoursByDay worklogs={worklogs} from={range.from} to={range.to} />
          <HoursByProjectGroup worklogs={worklogs} />
          <HoursByProject worklogs={worklogs} />
          <EstimateAccuracy worklogs={worklogs} />
          <HoursHeatmap worklogs={worklogs} from={range.from} to={range.to} />
        </>
      )}

      {worklogs?.length === 0 && !isLoading && (
        <div
          className="rounded-lg p-10 text-center"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-sm" style={{ fontFamily: "var(--font-jetbrains)", color: "#3A3A3F" }}>
            No worklogs found for this period
          </p>
        </div>
      )}
    </div>
  );
}
