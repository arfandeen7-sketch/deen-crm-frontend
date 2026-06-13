"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutList, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/Avatar";
import { cn, formatDate } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { useFollowup, type FollowupVariant } from "@/hooks/useFollowup";
import type { Lead, LeadQueryParams } from "@/types";

const TABS: { key: FollowupVariant; label: string; href: string }[] = [
  { key: "today", label: "Today", href: "/followup/today" },
  { key: "missed", label: "Missed", href: "/followup/missed" },
  { key: "upcoming", label: "Upcoming", href: "/followup/upcoming" },
];

export function FollowupView({ variant }: { variant: FollowupVariant }) {
  const router = useRouter();
  const [view, setView] = useState<"table" | "calendar">("table");
  const [params, setParams] = useState<LeadQueryParams>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const { data, isLoading, isError, refetch } = useFollowup(variant, params);
  const rows = data?.data ?? [];

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
                  ? "bg-indigo-600 text-white"
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
        <CalendarView rows={rows} onSelect={(id) => router.push(`/leads/${id}`)} />
      ) : (
        <Card>
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
        </Card>
      )}
    </div>
  );
}

function CalendarView({ rows, onSelect }: { rows: Lead[]; onSelect: (id: string) => void }) {
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
                onClick={() => onSelect(l.id)}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 p-2 hover:bg-slate-50"
              >
                <UserAvatar name={l.leadName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{l.leadName}</p>
                  <p className="text-xs text-slate-500">{l.mobileNumber}</p>
                </div>
                <StatusBadge status={l.leadStatus} />
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
