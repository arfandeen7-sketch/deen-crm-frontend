"use client";

import { Badge } from "@/components/ui/Badge";
import type { RegularizationStatus } from "@/types";

const COLORS: Record<RegularizationStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

export function StatusBadge({ status, className }: { status: RegularizationStatus; className?: string }) {
  return (
    <Badge className={className ?? COLORS[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export { COLORS as REG_STATUS_COLORS };
