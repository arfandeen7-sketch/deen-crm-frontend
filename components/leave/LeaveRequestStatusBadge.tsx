"use client";

import { Badge } from "@/components/ui/Badge";
import { leaveStatusConfig } from "@/lib/leaveUtils";
import type { LeaveStatus } from "@/types";

export function LeaveRequestStatusBadge({ status }: { status: LeaveStatus }) {
  const config = leaveStatusConfig[status];
  return <Badge className={config.badgeClass}>{config.label}</Badge>;
}
