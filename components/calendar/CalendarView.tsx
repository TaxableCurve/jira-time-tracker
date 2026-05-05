"use client";

import { useRef, useState, useCallback, useSyncExternalStore, useMemo } from "react";
import Holidays from "date-holidays";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, DatesSetArg, EventDropArg, EventContentArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { useWorklogRange, useInvalidateWorklogs, WorklogEvent } from "@/hooks/useWorklogs";
import { useCreateWorklog, useUpdateWorklog } from "@/hooks/useJira";
import { WorklogPopup } from "./WorklogPopup";
import { WorklogDetailPopup } from "./WorklogDetailPopup";
import { secondsToHuman } from "@/lib/format";

const PROJECT_COLORS: Record<string, string> = {};
const PALETTE = ["#E87C2E", "#4EA8DE", "#7ADE9A", "#E8B42E", "#DE7AAE", "#9B7ADE", "#DE4E4E"];
function projectColor(key: string): string {
  if (!PROJECT_COLORS[key]) {
    const idx = Object.keys(PROJECT_COLORS).length % PALETTE.length;
    PROJECT_COLORS[key] = PALETTE[idx];
  }
  return PROJECT_COLORS[key];
}

interface NewWorklogPopup {
  type: "new";
  start: Date;
  end: Date;
  position: { x: number; y: number };
}

interface DetailPopup {
  type: "detail";
  worklog: WorklogEvent;
  position: { x: number; y: number };
}

type Popup = NewWorklogPopup | DetailPopup;

export function CalendarView() {
  const calRef = useRef<FullCalendar>(null);
  const [range, setRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(new Date().setDate(new Date().getDate() + 7)),
  });
  const [popup, setPopup] = useState<Popup | null>(null);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const { data: worklogs, isLoading } = useWorklogRange(range.from, range.to);
  const createWorklog = useCreateWorklog();
  const updateWorklog = useUpdateWorklog();
  const invalidate = useInvalidateWorklogs();

  const fromYear = range.from.getFullYear();
  const toYear = range.to.getFullYear();
  const { holidayEvents, holidayMap } = useMemo(() => {
    const hd = new Holidays("CO");
    const years = new Set([fromYear, toYear]);
    const map = new Map<string, string>();
    const events = Array.from(years).flatMap((year) =>
      hd.getHolidays(year).map((h) => {
        map.set(h.date.slice(0, 10), h.name);
        return {
          title: h.name,
          start: h.date.slice(0, 10),
          allDay: true,
          display: "background",
          backgroundColor: "rgba(120,120,200,0.12)",
          borderColor: "rgba(120,120,200,0.4)",
          classNames: ["fc-holiday"],
          extendedProps: { isHoliday: true, holidayName: h.name },
        };
      })
    );
    return { holidayEvents: events, holidayMap: map };
  }, [fromYear, toYear]);

  const events = worklogs?.map((wl) => {
    const color = projectColor(wl.projectKey);
    return {
      id: wl.id,
      title: wl.issueKey,
      start: wl.start,
      end: wl.end,
      backgroundColor: `${color}18`,
      borderColor: `${color}60`,
      textColor: "#E8E8E4",
      extendedProps: wl,
    };
  }) ?? [];

  const handleSelect = useCallback((arg: DateSelectArg) => {
    const rect = (arg.jsEvent?.target as HTMLElement)?.getBoundingClientRect();
    setPopup({
      type: "new",
      start: arg.start,
      end: arg.end,
      position: {
        x: rect ? rect.right + 8 : 300,
        y: rect ? rect.top : 200,
      },
    });
    calRef.current?.getApi().unselect();
  }, []);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const rect = arg.el.getBoundingClientRect();
    setPopup({
      type: "detail",
      worklog: arg.event.extendedProps as WorklogEvent,
      position: { x: rect.right + 8, y: rect.top },
    });
  }, []);

  const handleEventDrop = useCallback(async (arg: EventDropArg) => {
    const wl = arg.event.extendedProps as WorklogEvent;
    const newStart = arg.event.start;
    const newEnd = arg.event.end;
    if (!newStart || !newEnd) { arg.revert(); return; }
    const newSeconds = Math.round((newEnd.getTime() - newStart.getTime()) / 1000);
    try {
      await updateWorklog.mutateAsync({
        issueKey: wl.issueKey,
        worklogId: wl.id,
        timeSpentSeconds: Math.max(newSeconds, 60),
        startedAt: newStart.toISOString(),
      });
      invalidate();
    } catch {
      arg.revert();
    }
  }, [updateWorklog, invalidate]);

  const handleEventResize = useCallback(async (arg: EventResizeDoneArg) => {
    const wl = arg.event.extendedProps as WorklogEvent;
    const newStart = arg.event.start;
    const newEnd = arg.event.end;
    if (!newStart || !newEnd) { arg.revert(); return; }
    const newSeconds = Math.round((newEnd.getTime() - newStart.getTime()) / 1000);
    try {
      await updateWorklog.mutateAsync({
        issueKey: wl.issueKey,
        worklogId: wl.id,
        timeSpentSeconds: Math.max(newSeconds, 60),
        startedAt: newStart.toISOString(),
      });
      invalidate();
    } catch {
      arg.revert();
    }
  }, [updateWorklog, invalidate]);

  const handleConfirm = async (
    issueKey: string,
    _issueName: string,
    timeSpentSeconds: number,
    startedAt: string
  ) => {
    setPopup(null);
    await createWorklog.mutateAsync({ issueKey, timeSpentSeconds, startedAt });
    invalidate();
  };

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setRange({ from: arg.start, to: arg.end });
  }, []);

  // Build per-day totals for month view dayCellContent
  const dayTotals: Record<string, number> = {};
  worklogs?.forEach((wl) => {
    const day = wl.start.slice(0, 10);
    dayTotals[day] = (dayTotals[day] ?? 0) + wl.timeSpentSeconds;
  });

  return (
    <div className="relative h-full flex flex-col">
      {mounted && (isLoading || createWorklog.isPending || updateWorklog.isPending) && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5 z-10"
          style={{ background: "linear-gradient(90deg, transparent, #E87C2E, transparent)", animation: "slideX 1.2s ease-in-out infinite" }}
        />
      )}

      <style>{`
        @keyframes slideX {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .fc { height: 100%; font-family: var(--font-syne), sans-serif; }
        .fc-theme-standard td, .fc-theme-standard th, .fc-theme-standard .fc-scrollgrid { border-color: rgba(255,255,255,0.06) !important; }
        .fc-col-header-cell-cushion, .fc-daygrid-day-number { color: #9A9AA4 !important; text-decoration: none !important; font-family: var(--font-jetbrains); font-size: 11px; }
        .fc-timegrid-slot-label-cushion { color: #767680 !important; font-family: var(--font-jetbrains); font-size: 10px; }
        .fc-button { background: rgba(255,255,255,0.06) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #B0B0B8 !important; font-family: var(--font-jetbrains) !important; font-size: 11px !important; text-transform: uppercase !important; letter-spacing: 0.08em !important; border-radius: 3px !important; padding: 4px 10px !important; }
        .fc-button:hover { background: rgba(255,255,255,0.1) !important; color: #E8E8E4 !important; }
        .fc-button-active, .fc-button:focus { background: rgba(232,124,46,0.15) !important; border-color: rgba(232,124,46,0.3) !important; color: #E87C2E !important; box-shadow: none !important; }
        .fc-toolbar-title { font-family: var(--font-syne) !important; font-size: 14px !important; font-weight: 700 !important; color: #E8E8E4 !important; }
        .fc-highlight { background: rgba(232,124,46,0.08) !important; }
        .fc-event-mirror { background-color: rgba(232,124,46,0.12) !important; border-color: rgba(232,124,46,0.5) !important; }
        .fc-timegrid-now-indicator-line { border-color: #E87C2E !important; }
        .fc-timegrid-now-indicator-arrow { border-color: #E87C2E !important; border-top-color: transparent !important; border-bottom-color: transparent !important; }
        .fc-event { cursor: pointer !important; border-radius: 4px !important; border-left-width: 3px !important; border-top-width: 0 !important; border-right-width: 0 !important; border-bottom-width: 0 !important; padding: 0 !important; transition: filter 150ms ease, transform 150ms ease !important; }
        .fc-event:hover { filter: brightness(1.15) !important; }
        .fc-event-title { font-family: var(--font-jetbrains) !important; font-size: 10px !important; font-weight: 500 !important; }
        .fc-timegrid-event .fc-event-main { padding: 0 !important; }
        .fc-daygrid-event-dot { display: none !important; }
        .fc-scrollgrid-sync-inner { background: transparent !important; }
        .fc-timegrid-col { background: transparent !important; }
        .fc-day-today { background: rgba(232,124,46,0.02) !important; }
        .fc-toolbar { padding: 12px 16px !important; }
        .fc-daygrid-day-frame { min-height: 80px !important; }
        .fc-event-resizer { opacity: 0.6; }
        .fc-holiday { opacity: 1 !important; }
        .fc-bg-event .fc-event-title { font-family: var(--font-jetbrains) !important; font-size: 9px !important; color: rgba(160,160,230,0.8) !important; padding: 2px 4px !important; text-transform: uppercase !important; letter-spacing: 0.06em !important; }
      `}</style>

      <div className={`flex-1 overflow-hidden px-2 pb-2 transition-opacity duration-300 ${isLoading ? "opacity-50" : "opacity-100"}`}>
        <FullCalendar
          ref={calRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridDay,timeGridWeek,dayGridMonth",
          }}
          buttonText={{ today: "Today", day: "Day", week: "Week", month: "Month" }}
          events={[...holidayEvents, ...(events ?? [])]}

          selectable
          selectMirror
          editable
          eventResizableFromStart
          select={handleSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          datesSet={handleDatesSet}
          nowIndicator
          navLinks
          navLinkDayClick="timeGridDay"
          allDaySlot={false}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:30:00"
          snapDuration="00:05:00"
          height="100%"
          dayCellContent={(arg) => {
            const key = arg.date.toISOString().slice(0, 10);
            const total = dayTotals[key];
            const holiday = holidayMap.get(key);
            return (
              <div className="flex flex-col items-end px-1 pt-0.5 gap-0.5">
                <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, color: "#9A9AA4" }}>
                  {arg.dayNumberText}
                </span>
                {holiday && (
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains)",
                      fontSize: 8,
                      color: "rgba(160,160,230,0.85)",
                      background: "rgba(120,120,200,0.12)",
                      border: "1px solid rgba(120,120,200,0.25)",
                      borderRadius: 3,
                      padding: "1px 5px",
                      letterSpacing: "0.04em",
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={holiday}
                  >
                    {holiday}
                  </span>
                )}
                {total && (
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains)",
                      fontSize: 9,
                      color: "#E87C2E",
                      background: "rgba(232,124,46,0.12)",
                      border: "1px solid rgba(232,124,46,0.2)",
                      borderRadius: 3,
                      padding: "1px 5px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {secondsToHuman(total)}
                  </span>
                )}
              </div>
            );
          }}
          eventContent={(arg: EventContentArg) => {
            // Mirror event shown while dragging to create
            if (arg.isMirror) {
              const start = arg.event.start;
              const end = arg.event.end;
              if (start && end) {
                const secs = Math.round((end.getTime() - start.getTime()) / 1000);
                const fmt = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: false });
                return (
                  <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, padding: "4px 8px", color: "#E8E8E4", display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ color: "#E87C2E", fontWeight: 500 }}>{secondsToHuman(secs)}</span>
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 9 }}>{fmt(start)} → {fmt(end)}</span>
                  </div>
                );
              }
            }

            if (arg.event.extendedProps.isHoliday) return null;

            const wl = arg.event.extendedProps as WorklogEvent;
            const color = projectColor(wl.projectKey);
            const view = arg.view.type;

            if (view === "dayGridMonth") {
              return (
                <div
                  className="px-1.5 py-0.5 rounded text-[10px] truncate w-full"
                  style={{
                    fontFamily: "var(--font-jetbrains)",
                    background: `${color}20`,
                    borderLeft: `3px solid ${color}`,
                    color: "#E8E8E4",
                  }}
                >
                  {wl.issueKey} · {secondsToHuman(wl.timeSpentSeconds)}
                </div>
              );
            }

            // timeGridDay / timeGridWeek — custom block
            const durationMins = Math.round(wl.timeSpentSeconds / 60);
            const isShort = durationMins < 45;
            return (
              <div
                className="h-full w-full flex flex-col px-2 py-1.5 overflow-hidden"
                style={{ gap: isShort ? 0 : 3 }}
              >
                <span
                  className="font-medium truncate leading-none"
                  style={{
                    fontFamily: "var(--font-jetbrains)",
                    fontSize: 10,
                    color,
                    letterSpacing: "0.03em",
                  }}
                >
                  {wl.issueKey}
                </span>
                {!isShort && (
                  <span
                    className="truncate leading-none opacity-75"
                    style={{
                      fontFamily: "var(--font-jetbrains)",
                      fontSize: 9,
                      color: "#D4D4D0",
                    }}
                  >
                    {wl.issueName}
                  </span>
                )}
                <span
                  className="leading-none mt-auto"
                  style={{
                    fontFamily: "var(--font-jetbrains)",
                    fontSize: 9,
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {secondsToHuman(wl.timeSpentSeconds)}
                </span>
              </div>
            );
          }}
        />
      </div>

      {popup?.type === "new" && (
        <WorklogPopup
          start={popup.start}
          end={popup.end}
          position={popup.position}
          onConfirm={handleConfirm}
          onCancel={() => setPopup(null)}
        />
      )}

      {popup?.type === "detail" && (
        <WorklogDetailPopup
          worklog={popup.worklog}
          position={popup.position}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}
