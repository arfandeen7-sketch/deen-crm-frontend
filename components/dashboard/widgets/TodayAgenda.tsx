"use client";

import Link from "next/link";
import { AlarmClock, ArrowRight, CalendarCheck, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/States";
import { PanelHeading } from "./DashboardShell";
import { useFollowup } from "@/hooks/useFollowup";
import type { Lead } from "@/types";

function timeOf(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function Row({ lead, overdue }: { lead: Lead; overdue?: boolean }) {
  return (
    <li>
      <Link
        href={`/leads/${lead.id}`}
        className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-zinc-50"
      >
        <span
          className={cn(
            "flex h-9 w-14 shrink-0 flex-col items-center justify-center rounded-lg border text-[10px] font-bold tabular-nums",
            overdue
              ? "border-red-200/70 bg-red-50/70 text-red-700"
              : "border-zinc-200/70 bg-white text-zinc-600",
          )}
        >
          {timeOf(lead.followUpDate)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold text-zinc-800">
            {lead.leadName}
          </span>
          <span className="flex items-center gap-1.5 truncate text-[11px] text-zinc-400">
            <Phone className="h-2.5 w-2.5 shrink-0" />
            {lead.mobileNumber}
            <span className="truncate">· {lead.leadStatus}</span>
          </span>
        </span>

        {lead.followUpNote && (
          <span className="hidden max-w-40 truncate text-[11px] italic text-zinc-400 sm:block">
            {lead.followUpNote}
          </span>
        )}

        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-600" />
      </Link>
    </li>
  );
}

/**
 * The executive's hero panel: exactly the calls to make right now.
 *
 * Overdue items are pinned above today's list because they are the ones at risk
 * of going cold, and both share one scroll area so the whole workload reads as
 * a single queue rather than two separate widgets.
 */
export function TodayAgenda({ pageSize = 8 }: { pageSize?: number }) {
  const missed = useFollowup("missed", { page: 1, pageSize });
  const today = useFollowup("today", { page: 1, pageSize });

  const overdue = missed.data?.data ?? [];
  const dueToday = today.data?.data ?? [];
  const loading = missed.isLoading || today.isLoading;
  const totalOverdue = missed.data?.total ?? 0;
  const totalToday = today.data?.total ?? 0;
  const isEmpty = overdue.length === 0 && dueToday.length === 0;

  return (
    <div className="flex h-full flex-col">
      <PanelHeading
        title="Today's Agenda"
        subtitle={
          loading
            ? "Loading your queue"
            : `${totalToday} due today${totalOverdue > 0 ? ` · ${totalOverdue} overdue` : ""}`
        }
        href="/followup/today"
      />

      <div className="mt-3 flex-1">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex h-full min-h-52 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-teal-200 bg-teal-50/30 p-6 text-center">
            <CalendarCheck className="h-6 w-6 text-teal-700" />
            <p className="text-xs font-bold text-zinc-700">Nothing scheduled today</p>
            <p className="max-w-xs text-[11px] text-zinc-500">
              Set follow-up dates on your open leads so they show up here.
            </p>
            <Link
              href="/leads"
              className="mt-1 text-[11px] font-bold uppercase tracking-wider text-zinc-900 underline underline-offset-4"
            >
              Open my leads
            </Link>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto pr-1">
            {overdue.length > 0 && (
              <>
                <p className="flex items-center gap-1.5 px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-red-700">
                  <AlarmClock className="h-3 w-3" />
                  Overdue
                </p>
                <ul className="mb-2">
                  {overdue.map((lead) => (
                    <Row key={lead.id} lead={lead} overdue />
                  ))}
                </ul>
              </>
            )}

            {dueToday.length > 0 && (
              <>
                <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Due today
                </p>
                <ul>
                  {dueToday.map((lead) => (
                    <Row key={lead.id} lead={lead} />
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
