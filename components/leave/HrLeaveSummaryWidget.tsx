"use client";

import { useRouter } from "next/navigation";
import { Clock, Check, X, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HrLeaveDashboard } from "@/types";

export function HrLeaveSummaryWidget({ data }: { data: HrLeaveDashboard }) {
  const router = useRouter();

  const cards = [
    {
      label: "Pending Requests",
      value: data.pendingCount,
      icon: Clock,
      color: "text-amber-600 bg-amber-50",
      onClick: () => router.push("/hrms/leave/requests?status=pending"),
    },
    {
      label: "Approved Today",
      value: data.approvedToday,
      icon: Check,
      color: "text-emerald-600 bg-emerald-50",
      onClick: () => router.push("/hrms/leave/requests?status=approved"),
    },
    {
      label: "Rejected Today",
      value: data.rejectedToday,
      icon: X,
      color: "text-rose-600 bg-rose-50",
      onClick: () => router.push("/hrms/leave/requests?status=rejected"),
    },
    {
      label: "On Leave Today",
      value: data.onLeaveToday,
      icon: CalendarDays,
      color: "text-sky-600 bg-sky-50",
      onClick: () => router.push("/hrms/leave/calendar"),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <button
            key={card.label}
            onClick={card.onClick}
            className="rounded-xl border border-border bg-background p-4 text-left shadow-sm transition-colors hover:bg-panel"
          >
            <div className={cn("inline-flex rounded-lg p-2", card.color)}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-foreground-muted">{card.label}</p>
          </button>
        );
      })}
    </div>
  );
}
