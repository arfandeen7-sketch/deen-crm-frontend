"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Pencil, Trash2, ExternalLink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/Avatar";
import { Select } from "@/components/ui/Input";
import { BulkActions } from "@/components/leads/BulkActions";
import { LeadQuickActions } from "@/components/leads/LeadQuickActions";
import { OfferingTypeBadge } from "@/components/leads/OfferingTypeBadge";
import { LeadTableToolbar, useVisibleLeadColumns } from "@/components/leads/LeadTableToolbar";
import { CanAccess } from "@/components/shared/Guards";
import { ConfirmModal } from "@/components/ui/Modal";
import { useLeadsList, useLeadMutations } from "@/hooks/useLeads";
import { useLeadCustomFields } from "@/hooks/useCustomFields";
import { buildCustomFieldColumns } from "@/components/leads/customFieldColumns";
import { useAssignableUsers } from "@/hooks/useUsers";
import { useFieldOptions } from "@/hooks/useDynamicFields";
import { useAuth } from "@/hooks/useAuth";
import { leadsService } from "@/services/leads/leads.service";
import { getErrorMessage } from "@/services/api/client";
import { downloadBlob, formatDate, formatDateTime, displayValue, isEmptyDisplayValue } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import type { Lead, LeadQueryParams } from "@/types";

type Category = NonNullable<LeadQueryParams["category"]>;

const CATEGORY_PAGE_KEY: Record<Category, string> = {
  untouched: "untouched_leads",
  fresh: "fresh_leads",
  imported: "imported_leads",
  assigned: "assigned_leads",
  unassigned: "unassigned_leads",
};

interface Props {
  category: Category;
  enableBulk?: boolean;
}

export function TypedLeadsView({ category, enableBulk = false }: Props) {
  const router = useRouter();
  const { canAction, canPage } = useAuth();
  const pageKey = CATEGORY_PAGE_KEY[category];

  const [params, setParams] = useState<LeadQueryParams>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    category,
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useLeadsList(params);
  const { data: customFieldDefs } = useLeadCustomFields();
  const { remove } = useLeadMutations();
  const { users } = useAssignableUsers();
  const sources = useFieldOptions("source");
  const statuses = useFieldOptions("lead_status");
  const rows = data?.data ?? [];

  function setParam<K extends keyof LeadQueryParams>(
    key: K,
    value: LeadQueryParams[K],
  ) {
    setParams((p) => ({
      ...p,
      [key]: value,
      ...(key !== "page" ? { page: 1 } : {}),
    }));
  }

  function toggleRow(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function toggleAll(checked: boolean) {
    setSelected(checked ? rows.map((r) => r.id) : []);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await leadsService.export(params);
      downloadBlob(blob, `leads-${category}-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Leads exported");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      toast.success("Lead deleted");
      setDeleteId(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  const isPFLead = (l: Lead) => l.source === "Property Finder";
  const Dash: React.FC = () => <span className="text-sm text-slate-400">—</span>;

  const columns: Column<Lead>[] = [
    {
      key: "name",
      header: "Name",
      render: (l) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={displayValue(l.leadName, "Lead")} size="sm" />
          <div>
            <p className="font-medium text-slate-900">
              {displayValue(l.leadName)}
              {!isEmptyDisplayValue(l.lastName) ? ` ${l.lastName}` : ""}
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
        <span className="text-sm text-slate-700">{displayValue(l.mobileNumber)}</span>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (l) => (
        <div className="space-y-0.5">
          <p className="text-sm text-slate-700">{displayValue(l.source)}</p>
          {l.ingestionSource !== "manual" && l.ingestionSource !== "import"}
        </div>
      ),
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
        l.broker ? (
          <span className="text-sm text-slate-700">{l.broker.brokerName}</span>
        ) : (
          <Dash />
        ),
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
        l.pfCommunityName ? (
          <span className="text-sm text-slate-700">{l.pfCommunityName}</span>
        ) : (
          <Dash />
        ),
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
      key: "offering",
      header: "For Sale / Rent",
      render: (l) => <OfferingTypeBadge lead={l} />,
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
      render: (l) =>
        l.unitNumber ? <span className="text-sm text-slate-700">{l.unitNumber}</span> : <Dash />,
    },
    {
      key: "size",
      header: "Size",
      render: (l) =>
        l.propertySize ? (
          <span className="text-sm text-slate-700">{l.propertySize} sqft</span>
        ) : (
          <Dash />
        ),
    },
    {
      key: "configuration",
      header: "Configuration",
      render: (l) =>
        l.configuration ? (
          <span className="text-sm text-slate-700">{l.configuration}</span>
        ) : (
          <Dash />
        ),
    },
    {
      key: "inquiry",
      header: "Inquiry Date",
      render: (l) => (
        <div className="space-y-0.5">
          <p className="flex items-center gap-1 text-xs text-slate-600">
            <Calendar className="h-3 w-3 text-slate-400" />
            {formatDate(isPFLead(l) ? l.createdAt : l.leadDate)}
          </p>
          {l.followUpDate && (
            <p className="text-xs text-slate-400">Follow up: {formatDate(l.followUpDate)}</p>
          )}
        </div>
      ),
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
          <span className="text-sm text-slate-600 line-clamp-2 max-w-[200px] truncate" title={l.comments}>
            {l.comments}
          </span>
        ) : (
          <Dash />
        ),
    },
    {
      key: "actions",
      header: "",
      stickyRight: true,
      headerClassName: "text-right",
      className: "text-right",
      render: (l) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {l.responseLink && (
            <a
              href={l.responseLink}
              target="_blank"
              rel="noopener noreferrer"
              title="View in Property Finder"
              className="rounded p-1.5 text-slate-400 hover:text-blue-600"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <Link href={`/leads/${l.id}/edit`} className="rounded p-1.5 text-slate-400 hover:text-gray-900">
            <Pencil className="h-4 w-4" />
          </Link>
          <CanAccess module="leads" page="all_leads" action="delete">
            <button
              onClick={() => setDeleteId(l.id)}
              className="rounded p-1.5 text-slate-400 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </CanAccess>
          <LeadQuickActions lead={l} />
        </div>
      ),
    },
  ];
  const customCols = buildCustomFieldColumns(customFieldDefs);
  const actionCol = columns[columns.length - 1];
  const allColumns = [...columns.slice(0, -1), ...customCols, actionCol];
  const displayColumns = useVisibleLeadColumns(allColumns);
  const allowRowSelection = enableBulk && (canAction("leads", "all_leads", "bulk_assign") || canAction("leads", "all_leads", "bulk_status"));

  return (
    <div className="space-y-4">
      <LeadTableToolbar
        search={params.search ?? ""}
        onSearch={(v) => setParam("search", v || undefined)}
        columns={allColumns}
        actions={
          canAction("leads", pageKey, "export") ? (
            <Button variant="outline" onClick={handleExport} loading={exporting}>
              <Download className="h-4 w-4" /> Export
            </Button>
          ) : undefined
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {category !== "imported" && (
            <Select
              value={params.status ?? ""}
              onChange={(e) => setParam("status", e.target.value || undefined)}
              className="h-10 w-auto"
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          )}
          <Select
            value={params.source ?? ""}
            onChange={(e) => setParam("source", e.target.value || undefined)}
            className="h-10 w-auto"
          >
            <option value="">All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
          {category === "assigned" && canPage("leads", "assigned_leads") && (
            <Select
              value={params.assignedTo ?? ""}
              onChange={(e) => setParam("assignedTo", e.target.value || undefined)}
              className="h-10 w-auto"
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </Select>
          )}
          <input
            type="date"
            value={params.dateFrom ?? ""}
            onChange={(e) => setParam("dateFrom", e.target.value || undefined)}
            className="h-10 rounded-lg border border-slate-300 px-2 text-sm text-slate-700"
          />
          <span className="text-sm text-slate-400">to</span>
          <input
            type="date"
            value={params.dateTo ?? ""}
            onChange={(e) => setParam("dateTo", e.target.value || undefined)}
            className="h-10 rounded-lg border border-slate-300 px-2 text-sm text-slate-700"
          />
        </div>
      </LeadTableToolbar>

      {enableBulk && (
        <BulkActions selectedIds={selected} onClear={() => setSelected([])} />
      )}

      <DataTable
        columns={displayColumns}
        rows={rows}
        rowKey={(l) => l.id}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        emptyTitle={`No ${category} leads`}
        emptyMessage="No leads match the current filters."
        onRowClick={(l) => router.push(`/leads/${l.id}`)}
        selectable={allowRowSelection}
        selectedIds={selected}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
      />
      {data && data.total > 0 && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={(p) => setParam("page", p)}
          onPageSizeChange={(s) => setParam("pageSize", s)}
        />
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete lead?"
        message="This will permanently remove the lead and its history."
        confirmLabel="Delete"
        loading={remove.isPending}
      />
    </div>
  );
}
