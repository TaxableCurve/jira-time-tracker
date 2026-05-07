"use client";

import { useState, useSyncExternalStore, useMemo } from "react";
import dynamic from "next/dynamic";
import { ReportFilters, getRangeFromPreset, type RangePreset, type DateRange } from "@/components/reports/ReportFilters";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { ConsistencyStreak } from "@/components/reports/ConsistencyStreak";
import { EstimateAccuracy } from "@/components/reports/EstimateAccuracy";
import { useWorklogRange } from "@/hooks/useWorklogs";

const HoursByDay = dynamic(() => import("@/components/reports/HoursByDay").then((m) => m.HoursByDay), { ssr: false });
const HoursByProject = dynamic(() => import("@/components/reports/HoursByProject").then((m) => m.HoursByProject), { ssr: false });
const HoursByProjectGroup = dynamic(() => import("@/components/reports/HoursByProjectGroup").then((m) => m.HoursByProjectGroup), { ssr: false });
const HoursByIssueType = dynamic(() => import("@/components/reports/HoursByIssueType").then((m) => m.HoursByIssueType), { ssr: false });
const HoursHeatmap = dynamic(() => import("@/components/reports/HoursHeatmap").then((m) => m.HoursHeatmap), { ssr: false });

export default function ReportsPage() {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [preset, setPreset] = useState<RangePreset>("this-month");
  const [range, setRange] = useState<DateRange>(getRangeFromPreset("this-month"));

  const handlePresetChange = (p: RangePreset) => {
    setPreset(p);
    if (p !== "custom") setRange(getRangeFromPreset(p));
  };

  const { data: worklogs, isLoading } = useWorklogRange(range.from, range.to);

  const showProjectGroup = useMemo(
    () => new Set(worklogs?.map((w) => w.projectKey)).size > 1,
    [worklogs]
  );
  const showIssueType = useMemo(
    () => new Set(worklogs?.map((w) => w.issueType)).size > 1,
    [worklogs]
  );
  const bothHalf = showProjectGroup && showIssueType;

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold leading-none" style={{ fontFamily: "var(--font-syne)" }}>
            Reports
          </h1>
          <p className="text-xs mt-1" style={{ fontFamily: "var(--font-jetbrains)", color: "#6B6B72" }}>
            {range.from.toLocaleDateString()} — {range.to.toLocaleDateString()}
          </p>
        </div>

        {mounted && isLoading && (
          <span className="text-[10px] animate-pulse" style={{ fontFamily: "var(--font-jetbrains)", color: "#06B6D4" }}>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          <div className="lg:col-span-2">
            <SummaryCards worklogs={worklogs} />
          </div>
          <div className="lg:col-span-2">
            <ConsistencyStreak worklogs={worklogs} from={range.from} to={range.to} />
          </div>
          <div className="lg:col-span-2">
            <HoursByDay worklogs={worklogs} from={range.from} to={range.to} />
          </div>
          {showProjectGroup && (
            <div className={bothHalf ? "" : "lg:col-span-2"}>
              <HoursByProjectGroup worklogs={worklogs} />
            </div>
          )}
          {showIssueType && (
            <div className={bothHalf ? "" : "lg:col-span-2"}>
              <HoursByIssueType worklogs={worklogs} />
            </div>
          )}
          <div className="flex flex-col">
            <HoursByProject worklogs={worklogs} />
          </div>
          <div className="flex flex-col">
            <HoursHeatmap worklogs={worklogs} from={range.from} to={range.to} />
          </div>
          <div className="lg:col-span-2">
            <EstimateAccuracy worklogs={worklogs} />
          </div>
        </div>
      )}

      {worklogs?.length === 0 && !isLoading && (
        <div
          className="rounded-lg p-10 text-center mt-5"
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
