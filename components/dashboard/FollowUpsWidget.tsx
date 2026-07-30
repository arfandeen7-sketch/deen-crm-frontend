"use client";

import { EmptyState, LoadingState } from "@/components/ui/States";
import { useFollowup } from "@/hooks/useFollowup";
import type { Lead } from "@/types";

function formatFollowUpDate(dateStr?: string | null): { day: string; month: string } {
  if (!dateStr) return { day: "--", month: "---" };
  try {
    const d = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
    if (isNaN(d.getTime())) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const day = parts[0].padStart(2, "0");
        const monthIndex = parseInt(parts[1], 10) - 1;
        return { day, month: months[monthIndex] || "---" };
      }
      return { day: "--", month: "---" };
    }
    const day = d.getDate().toString().padStart(2, "0");
    const month = months[d.getMonth()];
    return { day, month };
  } catch {
    return { day: "--", month: "---" };
  }
}

export function FollowUpsWidget({
  pageSize = 5,
  subtitle = "Upcoming follow-ups, with overdue pinned to the top",
  emptyMessage = "You're all caught up! 🎉",
  showAssignedTo = true,
}: {
  pageSize?: number;
  subtitle?: string;
  emptyMessage?: string;
  showAssignedTo?: boolean;
} = {}) {
  const missedQuery = useFollowup("missed", { page: 1, pageSize });
  const upcomingQuery = useFollowup("upcoming", { page: 1, pageSize });

  const missedList = (missedQuery.data?.data ?? []) as Lead[];
  const upcomingList = (upcomingQuery.data?.data ?? []) as Lead[];

  // Pin missed follow-ups to the top, then fill with upcoming.
  const missed = missedList.slice(0, pageSize);
  const remaining = Math.max(0, pageSize - missed.length);
  const upcoming = remaining > 0 ? upcomingList.slice(0, remaining) : [];
  const combined = [...missed, ...upcoming];

  const isLoading = missedQuery.isLoading || upcomingQuery.isLoading;

  return (
    <div className="flex flex-col h-full">
      <div>
        <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary">Follow-Ups</h3>
        <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>
      </div>

      <div className="mt-4 flex-1 divide-y divide-zinc-100">
        {isLoading ? (
          <LoadingState />
        ) : combined.length === 0 ? (
          <div className="h-full flex items-center justify-center py-8">
            <EmptyState title="No follow-ups" message={emptyMessage} />
          </div>
        ) : (
          combined.map((lead) => {
            const { day, month } = formatFollowUpDate(lead.followUpDate);
            const isMissed = missed.some((m) => m.id === lead.id);
            return (
              <div key={lead.id} className="flex items-center justify-between py-4.5 first:pt-2 last:pb-0">
                <div className="min-w-0 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-zinc-900 truncate font-secondary">
                      {lead.leadName}
                    </h4>
                    {isMissed && (
                      <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {showAssignedTo ? (
                      <>Assigned to: <span className="text-zinc-600 font-semibold">{lead.assignedUser?.fullName ?? "Unassigned"}</span></>
                    ) : (
                      <span className="text-zinc-600 font-semibold">Due: {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString("en-GB") : "—"}</span>
                    )}
                  </p>
                </div>
                <div
                  className={`flex flex-col items-center justify-center border rounded-2xl w-14 h-14 shrink-0 ${
                    isMissed
                      ? "bg-rose-50 border-rose-100/50 text-red-500"
                      : "bg-amber-50 border-amber-100/50 text-amber-600"
                  }`}
                >
                  <span className="text-xl font-extrabold leading-none">{day}</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider mt-0.5">{month}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
