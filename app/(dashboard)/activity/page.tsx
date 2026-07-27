"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Activity as ActivityIcon,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
} from "lucide-react";
import { MasterGuard } from "@/components/shared/Guards";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/States";
import { useActivityFeed, useActivityFiltersMeta } from "@/hooks/useActivity";
import { getStoredToken } from "@/store/auth.store";
import { formatDateTime, timeAgo, humanize } from "@/lib/utils";
import type {
  ActivityEvent,
  ActivityListParams,
  ActivityOutcome,
} from "@/types";

const OUTCOME_COLORS: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-700",
  failure: "bg-red-100 text-red-700",
  partial: "bg-amber-100 text-amber-700",
};

const ACTOR_TYPE_COLORS: Record<string, string> = {
  user: "bg-blue-100 text-blue-700",
  system: "bg-slate-100 text-slate-600",
  external: "bg-purple-100 text-purple-700",
  unknown: "bg-neutral-100 text-neutral-500",
};

function getUAETodayStr(): string {
  return new Date().toLocaleString("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

interface LeadDetailItem {
  id: string;
  leadName: string;
  source?: string;
  serviceType?: string;
  projectName?: string;
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  const [expanded, setExpanded] = useState(false);
  const leadDetails = Array.isArray(event.metadata?.leads)
    ? (event.metadata.leads as LeadDetailItem[])
    : [];
  const hasLeadDetails = leadDetails.length > 0;

  return (
    <div className="hover:bg-neutral-50/80 transition-colors border-b border-neutral-100 last:border-0">
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={OUTCOME_COLORS[event.outcome] ?? "bg-neutral-100 text-neutral-600"}>
              {event.outcome}
            </Badge>
            <span className="text-xs font-semibold text-neutral-900">{event.summary}</span>
            {hasLeadDetails && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 transition-colors cursor-pointer"
              >
                {expanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {leadDetails.length} lead{leadDetails.length !== 1 ? "s" : ""}
              </button>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-neutral-500">
            <span className="font-medium text-neutral-600">{event.eventName}</span>
            <span>·</span>
            <span>{event.actorName ?? event.actorType}</span>
            {event.actorRole && (
              <>
                <span>·</span>
                <span>{humanize(event.actorRole)}</span>
              </>
            )}
            {event.subjectLabel && !hasLeadDetails && (
              <>
                <span>·</span>
                <span className="truncate max-w-48">{event.subjectLabel}</span>
              </>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 flex-wrap text-[10px] text-neutral-400">
            <span>{formatDateTime(event.occurredAt)}</span>
            <span>·</span>
            <span>{timeAgo(event.occurredAt)}</span>
            {event.route && (
              <>
                <span>·</span>
                <span className="font-mono">
                  {event.httpMethod ?? ""} {event.route}
                </span>
              </>
            )}
            {event.ipAddress && (
              <>
                <span>·</span>
                <span>{event.ipAddress}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge className={ACTOR_TYPE_COLORS[event.actorType] ?? "bg-neutral-100 text-neutral-500"}>
            {event.actorType}
          </Badge>
          <span className="text-[10px] text-neutral-400">{event.source}</span>
        </div>
      </div>
      {expanded && hasLeadDetails && (
        <div className="px-4 pb-3 pl-8">
          <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
            {leadDetails.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 px-3 py-2 text-[11px]">
                <span className="font-semibold text-neutral-900 min-w-0 truncate">{lead.leadName}</span>
                {lead.source && (
                  <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-neutral-600">{lead.source}</span>
                )}
                {lead.serviceType && (
                  <span className="shrink-0 text-neutral-500">{lead.serviceType}</span>
                )}
                {lead.projectName && (
                  <span className="shrink-0 text-neutral-400 truncate max-w-32">{lead.projectName}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterBar({
  params,
  onChange,
  meta,
}: {
  params: Omit<ActivityListParams, "cursor">;
  onChange: (next: Partial<Omit<ActivityListParams, "cursor">>) => void;
  meta?: ReturnType<typeof useActivityFiltersMeta>["data"];
}) {
  const hasFilters = !!(params.category || params.eventName || params.actorType || params.outcome || params.source || params.search);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
        <Filter className="h-3.5 w-3.5" />
        Filters:
      </div>

      <select
        value={params.category ?? ""}
        onChange={(e) => onChange({ category: e.target.value || undefined })}
        className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 focus:border-neutral-400 focus:outline-none cursor-pointer"
      >
        <option value="">All categories</option>
        {meta?.categories.map((c) => (
          <option key={c} value={c}>{humanize(c)}</option>
        ))}
      </select>

      <select
        value={params.eventName ?? ""}
        onChange={(e) => onChange({ eventName: e.target.value || undefined })}
        className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 focus:border-neutral-400 focus:outline-none cursor-pointer max-w-48"
      >
        <option value="">All events</option>
        {meta?.eventNames.map((e) => (
          <option key={e} value={e}>{e}</option>
        ))}
      </select>

      <select
        value={params.actorType ?? ""}
        onChange={(e) => onChange({ actorType: (e.target.value || undefined) as ActivityListParams["actorType"] })}
        className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 focus:border-neutral-400 focus:outline-none cursor-pointer"
      >
        <option value="">All actors</option>
        <option value="user">User</option>
        <option value="system">System</option>
        <option value="external">External</option>
        <option value="unknown">Unknown</option>
      </select>

      <select
        value={params.outcome ?? ""}
        onChange={(e) => onChange({ outcome: (e.target.value || undefined) as ActivityOutcome })}
        className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 focus:border-neutral-400 focus:outline-none cursor-pointer"
      >
        <option value="">All outcomes</option>
        <option value="success">Success</option>
        <option value="failure">Failure</option>
        <option value="partial">Partial</option>
      </select>

      <input
        type="text"
        placeholder="Search summary…"
        value={params.search ?? ""}
        onChange={(e) => onChange({ search: e.target.value || undefined })}
        className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 focus:border-neutral-400 focus:outline-none w-40"
      />

      {hasFilters && (
        <button
          onClick={() => onChange({ category: undefined, eventName: undefined, actorType: undefined, outcome: undefined, source: undefined, search: undefined })}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}
    </div>
  );
}

function ActivityPageContent() {
  const [date, setDate] = useState(getUAETodayStr());
  const [filters, setFilters] = useState<Omit<ActivityListParams, "cursor" | "date">>({});

  const params = useMemo<Omit<ActivityListParams, "cursor">>(() => ({
    date,
    pageSize: 50,
    ...filters,
  }), [date, filters]);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useActivityFeed(params);

  const { data: filterMeta } = useActivityFiltersMeta();

  const handleFilterChange = useCallback(
    (next: Partial<Omit<ActivityListParams, "cursor">>) => {
      setFilters((prev) => ({ ...prev, ...next }));
    },
    [],
  );

  const handleExport = useCallback(async () => {
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    const qs = new URLSearchParams();
    qs.set("date", date);
    if (filters.category) qs.set("category", filters.category);
    if (filters.eventName) qs.set("eventName", filters.eventName);
    if (filters.actorType) qs.set("actorType", filters.actorType);
    if (filters.outcome) qs.set("outcome", filters.outcome);
    if (filters.search) qs.set("search", filters.search);

    const token = getStoredToken();
    const res = await fetch(`${BASE_URL}/api/activity/export?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }, [date, filters]);

  const allEvents = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((p) => p.data);
  }, [data]);

  const total = data?.pages[0]?.meta.total ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Activity Stream"
        subtitle="Universal audit log of every completed user-triggered action"
        actions={
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        }
      />

      {/* Date picker + filters */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDate(shiftDate(date, -1))}
            className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 focus:border-neutral-400 focus:outline-none cursor-pointer"
          />
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDate(getUAETodayStr())}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            Today
          </button>
          <span className="ml-auto text-xs font-medium text-neutral-500">
            {total.toLocaleString()} event{total !== 1 ? "s" : ""}
          </span>
        </div>

        <FilterBar params={params} onChange={handleFilterChange} meta={filterMeta} />
      </div>

      {/* Activity feed */}
      <Card>
        {isLoading ? (
          <LoadingState label="Loading activity…" />
        ) : isError ? (
          <ErrorState message="Failed to load activity stream." onRetry={() => refetch()} />
        ) : allEvents.length === 0 ? (
          <EmptyState
            title="No activity"
            message="No events recorded for this day with the current filters."
            icon={<ActivityIcon className="h-5 w-5 text-neutral-400" />}
          />
        ) : (
          <>
            <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
              {allEvents.map((event) => (
                <ActivityRow key={event.id} event={event} />
              ))}
            </div>
            {hasNextPage && (
              <div className="border-t border-neutral-100 p-3 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 disabled:opacity-50 cursor-pointer"
                >
                  {isFetchingNextPage ? "Loading more…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

export default function ActivityPage() {
  return (
    <MasterGuard>
      <ActivityPageContent />
    </MasterGuard>
  );
}
