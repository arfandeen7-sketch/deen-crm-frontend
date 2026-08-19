"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/Avatar";
import { useRecentLeads } from "@/hooks/useDashboard";
import { formatDate, formatDateTime, displayValue, isEmptyDisplayValue } from "@/lib/utils";
import type { Lead } from "@/types";

const Dash: React.FC = () => <span className="text-sm text-slate-400">—</span>;

const columns: Column<Lead>[] = [
  {
    key: "name",
    header: "Name",
    render: (l) => (
      <div className="flex items-center gap-2.5">
        <UserAvatar name={l.leadName} size="sm" />
        <div>
          <p className="font-medium text-slate-900">
            {l.leadName}
            {l.lastName ? ` ${l.lastName}` : ""}
          </p>
          {l.email && <p className="text-xs text-slate-400">{l.email}</p>}
        </div>
      </div>
    ),
  },
  {
    key: "contact",
    header: "Contact",
    render: (l) => (
      <div>
        <p className="text-sm text-slate-700">{displayValue(l.mobileNumber)}</p>
        {!isEmptyDisplayValue(l.alternateMobile) && (
          <p className="text-xs text-slate-400">{displayValue(l.alternateMobile)}</p>
        )}
      </div>
    ),
  },
  {
    key: "source",
    header: "Source",
    render: (l) => <span className="text-sm text-slate-700">{l.source}</span>,
  },
  { key: "status", header: "Status", render: (l) => <StatusBadge status={l.leadStatus} /> },
  {
    key: "assigned",
    header: "Assigned To",
    render: (l) =>
      l.assignedUser ? (
        <span className="text-sm text-slate-700">{l.assignedUser.fullName}</span>
      ) : (
        <span className="text-xs text-slate-400">Unassigned</span>
      ),
  },
  { key: "priority", header: "Priority", render: (l) => <PriorityBadge priority={l.leadPriority} /> },
  {
    key: "broker",
    header: "Broker",
    render: (l) =>
      l.broker ? <span className="text-sm text-slate-700">{l.broker.brokerName}</span> : <Dash />,
  },
  {
    key: "project",
    header: "Project",
    render: (l) =>
      l.pfBuildingName ? (
        <span className="text-sm text-slate-700">{l.pfBuildingName}</span>
      ) : l.projectName ? (
        <span className="text-sm text-slate-700">{l.projectName}</span>
      ) : (
        <Dash />
      ),
  },
  {
    key: "community",
    header: "Community",
    render: (l) =>
      l.pfCommunityName ? <span className="text-sm text-slate-700">{l.pfCommunityName}</span> : <Dash />,
  },
  {
    key: "type",
    header: "Type",
    render: (l) =>
      l.pfPropertyType ? (
        <span className="text-sm capitalize text-slate-700">{l.pfPropertyType}</span>
      ) : (
        <Dash />
      ),
  },
  {
    key: "category",
    header: "Category",
    render: (l) =>
      l.pfPropertyCategory ? (
        <span className="text-sm capitalize text-slate-700">{l.pfPropertyCategory}</span>
      ) : (
        <Dash />
      ),
  },
  {
    key: "price",
    header: "Price",
    render: (l) =>
      l.price ? (
        <span className="text-sm font-medium text-slate-800">
          AED {Number(l.price).toLocaleString()}
        </span>
      ) : (
        <Dash />
      ),
  },
  {
    key: "unit",
    header: "Unit",
    render: (l) => (l.unitNumber ? <span className="text-sm text-slate-700">{l.unitNumber}</span> : <Dash />),
  },
  {
    key: "size",
    header: "Size",
    render: (l) =>
      l.propertySize ? <span className="text-sm text-slate-700">{l.propertySize} sqft</span> : <Dash />,
  },
  {
    key: "configuration",
    header: "Configuration",
    render: (l) =>
      l.configuration ? <span className="text-sm text-slate-700">{l.configuration}</span> : <Dash />,
  },
  {
    key: "inquiry",
    header: "Inquiry Date",
    render: (l) => {
      const isPFLead = l.source === "Property Finder";
      return (
        <div className="space-y-0.5">
          <p className="flex items-center gap-1 text-xs text-slate-600">
            <Calendar className="h-3 w-3 text-slate-400" />
            {formatDate(isPFLead ? l.createdAt : l.leadDate)}
          </p>
          {l.followUpDate && (
            <p className="text-xs text-slate-400">Follow up: {formatDate(l.followUpDate)}</p>
          )}
        </div>
      );
    },
  },
  {
    key: "createdBy",
    header: "Created By",
    render: (l) => (
      <div>
        <p className="text-sm text-slate-700">{l.creator?.fullName ?? "—"}</p>
        <p className="text-xs text-slate-400">{formatDateTime(l.createdAt)}</p>
      </div>
    ),
  },
  {
    key: "comments",
    header: "Comments",
    render: (l) =>
      l.comments ? (
        <span className="text-sm text-slate-600 line-clamp-2 max-w-50 truncate" title={l.comments}>
          {l.comments}
        </span>
      ) : (
        <Dash />
      ),
  },
];

export function RecentLeadsTable({
  assignedTo,
  title = "Recent Leads",
  subtitle = "Latest leads first",
  viewAllHref = "/leads",
}: {
  assignedTo?: string;
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
} = {}) {
  const router = useRouter();
  const recent = useRecentLeads(assignedTo);
  const rows = recent.data?.data ?? [];

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center pb-4">
        <div>
          <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary">{title}</h3>
          <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>
        </div>
        <Link href={viewAllHref} className="text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors">
          View all
        </Link>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(l) => l.id}
        loading={recent.isLoading}
        error={recent.isError}
        onRetry={() => recent.refetch()}
        emptyTitle="No leads yet"
        emptyMessage="New leads will appear here."
        onRowClick={(l) => router.push(`/leads/${l.id}`)}
        rowClassName={(l) => (!l.isTouched ? "bg-amber-50 hover:bg-amber-100" : "")}
      />
    </div>
  );
}
