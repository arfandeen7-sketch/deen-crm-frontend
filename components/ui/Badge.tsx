import { cn } from "@/lib/utils";
import {
  ATTENDANCE_STATUS_COLORS,
  BROKER_STATUS_COLORS,
  LEAD_PRIORITY_COLORS,
  LEAD_STATUS_COLORS,
  ROLE_BADGE_CLASSES,
} from "@/constants";
import type { UserRole } from "@/types";
import { humanize } from "@/lib/utils";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        className ?? "bg-slate-100 text-slate-600 ring-slate-500/20",
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-slate-400">—</span>;
  return <Badge className={LEAD_STATUS_COLORS[status]}>{status}</Badge>;
}

export function PriorityBadge({ priority }: { priority?: string | null }) {
  if (!priority) return <span className="text-slate-400">—</span>;
  return <Badge className={LEAD_PRIORITY_COLORS[priority]}>{priority}</Badge>;
}

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge className={ROLE_BADGE_CLASSES[role]}>{humanize(role)}</Badge>;
}

export function BrokerStatusBadge({ status }: { status: string }) {
  return <Badge className={BROKER_STATUS_COLORS[status]}>{humanize(status)}</Badge>;
}

export function AttendanceBadge({ status }: { status: string }) {
  return <Badge className={ATTENDANCE_STATUS_COLORS[status]}>{humanize(status)}</Badge>;
}
