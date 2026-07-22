"use client";

import { Badge } from "@/components/ui/Badge";
import { REQUEST_TYPE_LABELS } from "./RequestTypeSelect";
import type { RequestType } from "@/types";

const COLORS: Record<RequestType, string> = {
  missed_check_in: "bg-rose-100 text-rose-700",
  missed_check_out: "bg-orange-100 text-orange-700",
  wrong_check_in_time: "bg-amber-100 text-amber-700",
  wrong_check_out_time: "bg-amber-100 text-amber-700",
  wrong_working_hours: "bg-sky-100 text-sky-700",
  wrong_attendance_status: "bg-violet-100 text-violet-700",
  other: "bg-slate-100 text-slate-600",
};

export function RequestTypeBadge({ type }: { type: RequestType }) {
  return (
    <Badge className={COLORS[type] ?? "bg-slate-100 text-slate-600"}>
      {REQUEST_TYPE_LABELS[type] ?? type.replace("_", " ")}
    </Badge>
  );
}
