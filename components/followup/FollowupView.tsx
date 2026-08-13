"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutList, CalendarDays, Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/Avatar";
import { cn, formatDate } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { useFollowup, type FollowupVariant } from "@/hooks/useFollowup";
import { useLeadMutations } from "@/hooks/useLeads";
import { getErrorMessage } from "@/services/api/client";
import type { Lead, LeadQueryParams } from "@/types";

const TABS: { key: FollowupVariant; label: string; href: string }[] = [
  { key: "today", label: "Today", href: "/followup/today" },
  { key: "missed", label: "Missed", href: "/followup/missed" },
  { key: "upcoming", label: "Upcoming", href: "/followup/upcoming" },
];

export function FollowupView({ variant }: { variant: FollowupVariant }) {
  const router = useRouter();
  const [view, setView] = useState<"table" | "calendar">("table");
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [params, setParams] = useState<LeadQueryParams>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const { data, isLoading, isError, refetch } = useFollowup(variant, params);
  const { update } = useLeadMutations();
  const rows = data?.data ?? [];

  async function handleMarkDone(lead: Lead) {
    setCompletingId(lead.id);
    try {
      await update.mutateAsync({
        id: lead.id,
        body: { followUpDate: null, followUpNote: null },
      });
      toast.success("Follow-up marked as done");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setCompletingId(null);
    }
  }

  const columns: Column<Lead>[] = [
    {
      key: "name",
      header: "Lead",
      render: (l) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={l.leadName} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{l.leadName}</p>
            <p className="text-xs text-slate-500">{l.mobileNumber}</p>
          </div>
        </div>
      ),
    },
    { key: "source", header: "Source", render: (l) => l.source },
    { key: "status", header: "Status", render: (l) => <StatusBadge status={l.leadStatus} /> },
    { key: "priority", header: "Priority", render: (l) => <PriorityBadge priority={l.leadPriority} /> },
    {
      key: "assigned",
      header: "Assigned",
      render: (l) => l.assignedUser?.fullName ?? <span className="text-xs text-slate-400">Unassigned</span>,
    },
    {
      key: "followup",
      header: "Follow Up Date",
      render: (l) => (
        <span className={cn(variant === "missed" && "font-medium text-rose-600")}>
          {formatDate(l.followUpDate)}
        </span>
      ),
    },
    {
      key: "note",
      header: "Note",
      render: (l) =>
        l.followUpNote ? (
          <span className="line-clamp-2 max-w-[220px] text-slate-600" title={l.followUpNote}>
            {l.followUpNote}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      stickyRight: true,
      headerClassName: "text-right",
      className: "text-right",
      render: (l) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            loading={completingId === l.id}
            disabled={completingId !== null && completingId !== l.id}
            onClick={() => handleMarkDone(l)}
            className="gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            Mark Done
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Follow Ups"
        subtitle={data ? `${data.total} follow-up(s)` : "Track your scheduled follow-ups"}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                tab.key === variant
                  ? "bg-gray-900 text-white"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            onClick={() => setView("table")}
            className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm", view === "table" ? "bg-slate-900 text-white" : "text-slate-600")}
          >
            <LayoutList className="h-4 w-4" /> Table
          </button>
          <button
            onClick={() => setView("calendar")}
            className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm", view === "calendar" ? "bg-slate-900 text-white" : "text-slate-600")}
          >
            <CalendarDays className="h-4 w-4" /> Calendar
          </button>
        </div>
      </div>

      <Card className="p-4">
        <SearchInput
          value={params.search ?? ""}
          onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))}
          placeholder="Search name or mobile…"
          className="w-full sm:w-72"
        />
      </Card>

      {view === "calendar" ? (
        <CalendarView
          rows={rows}
          completingId={completingId}
          onSelect={(id) => router.push(`/leads/${id}`)}
          onMarkDone={handleMarkDone}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(l) => l.id}
            loading={isLoading}
            error={isError}
            onRetry={refetch}
            emptyTitle="No follow-ups"
            emptyMessage="There are no follow-ups in this view."
            onRowClick={(l) => router.push(`/leads/${l.id}`)}
          />
          {data && data.total > 0 && (
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              totalPages={data.totalPages}
              onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
              onPageSizeChange={(s) => setParams((prev) => ({ ...prev, pageSize: s, page: 1 }))}
            />
          )}
        </>
      )}
    </div>
  );
}

function CalendarView({
  rows,
  completingId,
  onSelect,
  onMarkDone,
}: {
  rows: Lead[];
  completingId: string | null;
  onSelect: (id: string) => void;
  onMarkDone: (lead: Lead) => void;
}) {
  // Group leads by their follow-up date.
  const groups = rows.reduce<Record<string, Lead[]>>((acc, lead) => {
    const key = lead.followUpDate?.slice(0, 10) ?? "unscheduled";
    (acc[key] ??= []).push(lead);
    return acc;
  }, {});
  const dates = Object.keys(groups).sort();

  if (rows.length === 0) {
    return (
      <Card className="p-10 text-center text-sm text-slate-500">
        No follow-ups to display.
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {dates.map((date) => (
        <Card key={date} className="p-4">
          <p className="mb-3 text-sm font-semibold text-slate-900">
            {date === "unscheduled" ? "Unscheduled" : formatDate(date)}
          </p>
          <ul className="space-y-2">
            {groups[date].map((l) => (
              <li
                key={l.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 p-2 hover:bg-slate-50"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => onSelect(l.id)}
                >
                  <UserAvatar name={l.leadName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{l.leadName}</p>
                    <p className="text-xs text-slate-500">{l.mobileNumber}</p>
                    {l.followUpNote && (
                      <p className="mt-0.5 truncate text-xs text-slate-400" title={l.followUpNote}>
                        {l.followUpNote}
                      </p>
                    )}
                  </div>
                </button>
                <StatusBadge status={l.leadStatus} />
                <Button
                  size="sm"
                  variant="outline"
                  loading={completingId === l.id}
                  disabled={completingId !== null && completingId !== l.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkDone(l);
                  }}
                  className="shrink-0 gap-1"
                  title="Mark Done"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
