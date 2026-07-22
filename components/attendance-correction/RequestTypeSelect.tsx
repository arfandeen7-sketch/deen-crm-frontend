"use client";

import type { RequestType } from "@/types";

const OPTIONS: { value: RequestType; label: string }[] = [
  { value: "missed_check_in", label: "Missed Check-In" },
  { value: "missed_check_out", label: "Missed Check-Out" },
  { value: "wrong_check_in_time", label: "Wrong Check-In Time" },
  { value: "wrong_check_out_time", label: "Wrong Check-Out Time" },
  { value: "wrong_working_hours", label: "Wrong Working Hours" },
  { value: "wrong_attendance_status", label: "Wrong Attendance Status" },
  { value: "other", label: "Other" },
];

export function RequestTypeSelect({
  value,
  onChange,
  disabled,
  className,
}: {
  value: RequestType;
  onChange: (v: RequestType) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as RequestType)}
      disabled={disabled}
      className={className ?? "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = Object.fromEntries(
  OPTIONS.map((o) => [o.value, o.label]),
) as Record<RequestType, string>;
