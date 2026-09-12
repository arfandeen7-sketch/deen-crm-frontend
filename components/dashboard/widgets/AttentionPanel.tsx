"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronDown,
  CircleCheck,
  Clock,
  Info,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/States";
import { PanelHeading } from "./DashboardShell";
import type { AttentionBucket, AttentionResponse, AttentionSeverity } from "@/types";

const SEVERITY_STYLE: Record<
  AttentionSeverity,
  { dot: string; text: string; chip: string }
> = {
  critical: {
    dot: "bg-red-600",
    text: "text-red-700",
    chip: "bg-red-50 text-red-700 border-red-200/70",
  },
  warning: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    chip: "bg-amber-50 text-amber-700 border-amber-200/70",
  },
  info: {
    dot: "bg-zinc-400",
    text: "text-zinc-600",
    chip: "bg-zinc-50 text-zinc-600 border-zinc-200/70",
  },
};

function relativeDays(iso: string | null): string | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

/** One expandable risk bucket with a peek at the actual records inside. */
function Bucket({ bucket }: { bucket: AttentionBucket }) {
  const [open, setOpen] = useState(false);
  const style = SEVERITY_STYLE[bucket.severity];
  const hasSamples = bucket.samples.length > 0;

  return (
    <li className="border-b border-zinc-100 last:border-b-0">
      <div className="flex items-center gap-3 py-2.5">
        <button
          type="button"
          onClick={() => hasSamples && setOpen((v) => !v)}
          aria-expanded={hasSamples ? open : undefined}
          disabled={!hasSamples}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-3 text-left",
            hasSamples && "cursor-pointer",
          )}
        >
          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-zinc-800">
              {bucket.label}
            </span>
            <span className="block truncate text-[11px] text-zinc-400">
              {bucket.description}
            </span>
          </span>
          <span
            className={cn(
              "shrink-0 rounded-md border px-2 py-0.5 font-secondary text-xs font-bold tabular-nums",
              style.chip,
            )}
          >
            {bucket.count}
          </span>
          {hasSamples && (
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-zinc-300 transition-transform",
                open && "rotate-180",
              )}
            />
          )}
        </button>

        <Link
          href={bucket.href}
          className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-900"
        >
          Open
        </Link>
      </div>

      {open && hasSamples && (
        <ul className="mb-2 space-y-1 rounded-lg bg-zinc-50/70 p-2">
          {bucket.samples.map((lead) => (
            <li key={lead.id}>
              <Link
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-white"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-zinc-800">
                    {lead.leadName}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <Phone className="h-2.5 w-2.5" />
                    {lead.mobileNumber}
                    {lead.assignedToName && <span>· {lead.assignedToName}</span>}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[11px] font-medium text-zinc-500">
                    {lead.leadStatus}
                  </span>
                  {relativeDays(lead.followUpDate ?? lead.assignedAt) && (
                    <span className="flex items-center justify-end gap-1 text-[10px] text-zinc-400">
                      <Clock className="h-2.5 w-2.5" />
                      {relativeDays(lead.followUpDate ?? lead.assignedAt)}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * The "what do I do now" panel.
 *
 * Ordered by severity rather than count so a single hot lead nobody has called
 * outranks a long tail of stale ones.
 */
export function AttentionPanel({
  data,
  loading,
  title = "Needs Attention",
  subtitle = "Ranked by urgency — click a row to preview",
}: {
  data: AttentionResponse | undefined;
  loading?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const buckets = data?.buckets ?? [];
  const alerts = data?.systemAlerts ?? [];
  const totalIssues = buckets.reduce((sum, b) => sum + b.count, 0);

  return (
    <div className="flex h-full flex-col">
      <PanelHeading
        title={title}
        subtitle={subtitle}
        action={
          !loading && totalIssues === 0 ? (
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-700">
              <CircleCheck className="h-3.5 w-3.5" />
              All clear
            </span>
          ) : undefined
        }
      />

      <div className="mt-3 flex-1">
        {loading ? (
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : totalIssues === 0 && alerts.length === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-teal-200 bg-teal-50/30 p-6 text-center">
            <CircleCheck className="h-5 w-5 text-teal-700" />
            <p className="text-xs font-semibold text-zinc-700">
              No leads are slipping
            </p>
            <p className="text-[11px] text-zinc-500">
              Every follow-up is on schedule and nothing is sitting untouched.
            </p>
          </div>
        ) : (
          <>
            <ul>
              {buckets.map((bucket) => (
                <Bucket key={bucket.key} bucket={bucket} />
              ))}
            </ul>

            {alerts.length > 0 && (
              <div className="mt-4 space-y-1.5 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <Info className="h-3 w-3" />
                  System
                </p>
                {alerts.map((alert) => (
                  <Link
                    key={alert.key}
                    href={alert.href}
                    className="flex items-center justify-between gap-3 rounded-md px-1 py-1 transition-colors hover:bg-white"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <AlertTriangle
                        className={cn(
                          "h-3 w-3 shrink-0",
                          SEVERITY_STYLE[alert.severity].text,
                        )}
                      />
                      <span className="truncate text-xs font-medium text-zinc-700">
                        {alert.label}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-zinc-900">
                      {alert.count}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
