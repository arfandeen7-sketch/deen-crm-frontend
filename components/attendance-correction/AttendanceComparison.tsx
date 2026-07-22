"use client";

import { Badge } from "@/components/ui/Badge";
import { ATTENDANCE_STATUS_COLORS, SHIFT_CONFIG } from "@/constants";
import type { AttendanceRegularization, AttendanceStatus } from "@/types";

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" });
}

function formatHours(val: number | null | undefined): string {
  if (val === null || val === undefined) return "—";
  return `${Number(val).toFixed(1)}h`;
}

function calcWorkingHours(checkIn: string | null | undefined, checkOut: string | null | undefined): number | null {
  if (!checkIn || !checkOut) return null;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (diff <= 0) return null;
  return diff / (1000 * 60 * 60);
}

function estimateStatus(checkIn: string | null | undefined, workingHours: number | null): AttendanceStatus | null {
  if (!checkIn) return "absent";
  const checkInDate = new Date(checkIn);
  const checkInStr = checkInDate.toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Dubai" });
  if (workingHours !== null && workingHours < 4) return "half_day";
  if (checkInStr > SHIFT_CONFIG.halfDayThreshold) return "half_day";
  if (checkInStr > SHIFT_CONFIG.lateThreshold) return "late";
  return "present";
}

function calcLateMinutes(checkIn: string | null | undefined): number | null {
  if (!checkIn) return null;
  const checkInDate = new Date(checkIn);
  const checkInStr = checkInDate.toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Dubai" });
  if (checkInStr <= SHIFT_CONFIG.lateThreshold) return 0;
  const [lateH, lateM] = SHIFT_CONFIG.lateThreshold.split(":").map(Number);
  const [inH, inM] = checkInStr.split(":").map(Number);
  return (inH * 60 + inM) - (lateH * 60 + lateM);
}

function Row({ label, current, requested, preview }: { label: string; current: React.ReactNode; requested: React.ReactNode; preview?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b border-slate-100 py-2.5 text-sm last:border-0">
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="font-medium text-slate-700">{current}</p>
      </div>
      <div>
        <p className="text-xs text-slate-400">&nbsp;</p>
        <p className="font-medium text-slate-700">{requested}</p>
      </div>
      <div>
        <p className="text-xs text-slate-400">&nbsp;</p>
        <p className="font-medium text-slate-700">{preview}</p>
      </div>
    </div>
  );
}

export function AttendanceComparison({ req }: { req: AttendanceRegularization }) {
  const current = req.attendance;
  const previewHours = calcWorkingHours(req.requestedCheckIn, req.requestedCheckOut);
  const previewStatus = estimateStatus(req.requestedCheckIn, previewHours);
  const lateMins = calcLateMinutes(req.requestedCheckIn);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-3 gap-2 border-b border-slate-200 pb-2 mb-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Field</p>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current</p>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Requested</p>
      </div>

      <Row
        label="Check-In"
        current={formatTime(current?.checkInTime)}
        requested={formatTime(req.requestedCheckIn)}
      />
      <Row
        label="Check-Out"
        current={formatTime(current?.checkOutTime)}
        requested={formatTime(req.requestedCheckOut)}
      />
      <Row
        label="Working Hours"
        current={formatHours(current?.totalWorkingHours)}
        requested={previewHours !== null ? `${previewHours.toFixed(1)}h` : "—"}
      />
      <Row
        label="Status"
        current={
          current?.status ? (
            <Badge className={ATTENDANCE_STATUS_COLORS[current.status]}>{current.status.replace("_", " ")}</Badge>
          ) : "—"
        }
        requested={
          previewStatus ? (
            <Badge className={ATTENDANCE_STATUS_COLORS[previewStatus]}>{previewStatus.replace("_", " ")}</Badge>
          ) : "—"
        }
      />

      {lateMins !== null && lateMins > 0 && (
        <div className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
          Late by {lateMins} minutes
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5">
        <span className="text-xs text-indigo-600">Final attendance will be calculated by backend.</span>
      </div>
    </div>
  );
}
