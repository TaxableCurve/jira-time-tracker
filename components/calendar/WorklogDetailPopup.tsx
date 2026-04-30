"use client";

import { useState, useEffect, useRef } from "react";
import { useUpdateWorklog, useDeleteWorklog } from "@/hooks/useJira";
import { useInvalidateWorklogs, WorklogEvent } from "@/hooks/useWorklogs";
import { secondsToHuman, humanToSeconds } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmberBadge } from "@/components/ui/badge";
import { FieldLabel } from "@/components/ui/section-label";
import { PopupContainer } from "@/components/ui/popup-container";

interface Props {
  worklog: WorklogEvent;
  position: { x: number; y: number };
  onClose: () => void;
}

export function WorklogDetailPopup({ worklog, position, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const updateWorklog = useUpdateWorklog();
  const deleteWorklog = useDeleteWorklog();
  const invalidate = useInvalidateWorklogs();

  const [timeInput, setTimeInput] = useState(secondsToHuman(worklog.timeSpentSeconds));
  const [startInput, setStartInput] = useState(
    new Date(worklog.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
  );
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const positionStyle: React.CSSProperties = {
    position: "fixed",
    left: Math.min(position.x, window.innerWidth - 280),
    top: Math.min(position.y, window.innerHeight - 320),
    zIndex: 1000,
    width: 264,
  };

  const handleSave = async () => {
    const newSeconds = Math.max(humanToSeconds(timeInput), 60);
    const baseDate = new Date(worklog.start);
    const [h, m] = startInput.split(":").map(Number);
    baseDate.setHours(h, m, 0, 0);

    await updateWorklog.mutateAsync({
      issueKey: worklog.issueKey,
      worklogId: worklog.id,
      timeSpentSeconds: newSeconds,
      startedAt: baseDate.toISOString(),
    });
    invalidate();
    onClose();
  };

  const handleDelete = async () => {
    await deleteWorklog.mutateAsync({ issueKey: worklog.issueKey, worklogId: worklog.id });
    invalidate();
    onClose();
  };

  const isPending = updateWorklog.isPending || deleteWorklog.isPending;

  return (
    <PopupContainer ref={ref} positionStyle={positionStyle}>
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-white/7">
        <div className="flex items-center justify-between">
          <AmberBadge>{worklog.issueKey}</AmberBadge>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>✕</Button>
        </div>
        <p className="font-sans text-xs mt-1.5 leading-snug text-[#B0B0B8]">{worklog.issueName}</p>
        <p className="font-mono text-[10px] mt-1 text-[#767680]">{worklog.projectName}</p>
      </div>

      {/* Estimate progress */}
      {worklog.originalEstimateSeconds && (
        <div className="px-3 py-2 border-b border-white/7 space-y-1.5">
          {(() => {
            const spent = worklog.totalTimeSpentSeconds ?? 0;
            const estimate = worklog.originalEstimateSeconds;
            const pct = Math.min(spent / estimate, 1);
            const over = spent > estimate;
            const barColor = over ? "#DE4E4E" : pct >= 0.8 ? "#E8B42E" : "#7ADE9A";
            return (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px]" style={{ color: barColor }}>
                    {secondsToHuman(spent)} logged
                  </span>
                  <span className="font-mono text-[10px] text-[#767680]">
                    {secondsToHuman(estimate)} est.
                  </span>
                </div>
                <div className="h-px w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct * 100}%`, background: barColor }}
                  />
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Fields */}
      <div className="p-3 space-y-2.5">
        <div>
          <FieldLabel>Duration</FieldLabel>
          <Input
            value={timeInput}
            onChange={(e) => { setTimeInput(e.target.value); setEditing(true); }}
            placeholder="e.g. 2h 30m"
          />
        </div>
        <div>
          <FieldLabel>Start time</FieldLabel>
          <Input
            type="time"
            value={startInput}
            onChange={(e) => { setStartInput(e.target.value); setEditing(true); }}
            style={{ colorScheme: "dark" }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 space-y-2">
        {editing && (
          <Button
            variant="primary"
            className="w-full"
            disabled={isPending}
            onClick={handleSave}
          >
            {updateWorklog.isPending ? "Saving..." : "Save changes →"}
          </Button>
        )}

        {!confirmDelete ? (
          <Button
            variant="destructive"
            className="w-full"
            disabled={isPending}
            onClick={() => setConfirmDelete(true)}
          >
            Delete worklog
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive-solid"
              className="flex-1"
              disabled={isPending}
              onClick={handleDelete}
            >
              {deleteWorklog.isPending ? "Deleting..." : "Confirm delete"}
            </Button>
          </div>
        )}
      </div>
    </PopupContainer>
  );
}
