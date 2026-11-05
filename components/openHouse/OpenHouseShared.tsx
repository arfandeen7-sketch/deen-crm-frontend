"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarRange, UserPlus } from "lucide-react";
import { CanAccess } from "@/components/shared/Guards";
import { Badge } from "@/components/ui/Badge";
import { cn, formatDate } from "@/lib/utils";
import {
  EVENT_STATUS_COLORS,
  EVENT_STATUS_OPTIONS,
  LEAD_INTEREST_COLORS,
  LEAD_INTEREST_OPTIONS,
  OPEN_HOUSE_EVENTS_PAGE,
  OPEN_HOUSE_LEADS_PAGE,
  OPEN_HOUSE_MODULE,
  labelFor,
} from "@/constants/openHouse";
import type { OpenHouseEventStatus, OpenHouseLeadInterest } from "@/types";

const TABS = [
  { href: "/open-house-events", label: "Events", icon: CalendarRange, page: OPEN_HOUSE_EVENTS_PAGE },
  { href: "/open-house-events/leads", label: "Event Leads", icon: UserPlus, page: OPEN_HOUSE_LEADS_PAGE },
];

/** Switches between the Event Management and Event Leads tables. */
export function OpenHouseTabs() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-1 sm:inline-flex">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <CanAccess key={t.href} module={OPEN_HOUSE_MODULE} page={t.page} action="view">
            <Link
              href={t.href}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors sm:flex-none",
                active ? "bg-white text-neutral-900 shadow-2xs" : "text-neutral-500 hover:text-neutral-900",
              )}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </Link>
          </CanAccess>
        );
      })}
    </div>
  );
}

export function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  className?: string;
}) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{label}</span>
      <span className="whitespace-pre-wrap break-words text-sm text-neutral-900">{empty ? "—" : value}</span>
    </div>
  );
}

export function EventStatusBadge({ status }: { status?: OpenHouseEventStatus | null }) {
  if (!status) return <span className="text-slate-400">—</span>;
  return <Badge className={EVENT_STATUS_COLORS[status]}>{labelFor(EVENT_STATUS_OPTIONS, status)}</Badge>;
}

export function InterestBadge({ level }: { level?: OpenHouseLeadInterest | null }) {
  if (!level) return <span className="text-slate-400">—</span>;
  return <Badge className={LEAD_INTEREST_COLORS[level]}>{labelFor(LEAD_INTEREST_OPTIONS, level)}</Badge>;
}

/** "20 Nov 2026 · 10:00–18:00" */
export function formatEventWhen(date: string, startTime?: string | null, endTime?: string | null): string {
  const d = formatDate(date);
  if (startTime && endTime) return `${d} · ${startTime}–${endTime}`;
  if (startTime) return `${d} · ${startTime}`;
  return d;
}

/** ISO date → `YYYY-MM-DD` for `<input type="date">`. Event dates are stored at UTC midnight. */
export function toDateInput(iso?: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export const filterInputClass =
  "h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-800 shadow-2xs placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black sm:w-40";

/** Text filter that only reports changes after the user pauses typing. */
export function DebouncedFilterInput({
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
  placeholder: string;
  type?: "text" | "number";
  className?: string;
}) {
  const [local, setLocal] = useState(value ?? "");
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setLocal(value ?? "");
  }
  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== (value ?? "")) onChange(local.trim() || undefined);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);
  return (
    <input
      type={type}
      min={type === "number" ? 0 : undefined}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className={cn(filterInputClass, className)}
    />
  );
}
