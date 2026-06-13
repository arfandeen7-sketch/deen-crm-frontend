"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Eye } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/Avatar";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Input";
import { BulkActions } from "@/components/leads/BulkActions";
import { useLeadsList } from "@/hooks/useLeads";
import { useAssignableUsers } from "@/hooks/useUsers";
import { useFieldOptions } from "@/hooks/useDynamicFields";
import { useAuth } from "@/hooks/useAuth";
import { leadsService } from "@/services/leads/leads.service";
import { getErrorMessage } from "@/services/api/client";
import { downloadBlob, formatDate } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import type { Lead, LeadQueryParams } from "@/types";

type Category = NonNullable<LeadQueryParams["category"]>;

interface Props {
  category: Category;
  enableBulk?: boolean;
}

export function TypedLeadsView({ category, enableBulk = false }: Props) {
  const router = useRouter();
  const { can } = useAuth();

  const [params, setParams] = useState<LeadQueryParams>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    category,
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, isError, refetch } = useLeadsList(params);
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
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  }

  const baseColumns: Column<Lead>[] = [
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
  ];

  const extraColumns: Column<Lead>[] = (() => {
    if (category === "imported") {
      return [
        {
          key: "ingestion",
          header: "Import Source",
          render: (l) => (
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
              {l.ingestionSource}
            </code>
          ),
        },
        {
          key: "importDate",
          header: "Import Date",
          render: (l) => formatDate(l.createdAt),
        },
      ];
    }
    if (category === "assigned") {
      return [
        {
          key: "assignedTo",
          header: "Assigned To",
          render: (l) =>
            l.assignedUser ? (
              <span className="text-sm text-slate-700">{l.assignedUser.fullName}</span>
            ) : (
              <span className="text-xs text-slate-400">—</span>
            ),
        },
        {
          key: "assignedDate",
          header: "Assigned Date",
          render: (l) => formatDate(l.updatedAt),
        },
      ];
    }
    return [
      { key: "created", header: "Created", render: (l) => formatDate(l.createdAt) },
    ];
  })();

  const actionColumn: Column<Lead> = {
    key: "actions",
    header: "",
    headerClassName: "text-right",
    className: "text-right",
    render: (l) => (
      <Link
        href={`/leads/${l.id}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <Eye className="h-4 w-4" />
      </Link>
    ),
  };

  const columns: Column<Lead>[] = [...baseColumns, ...extraColumns, actionColumn];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={params.search ?? ""}
            onChange={(v) => setParam("search", v || undefined)}
            placeholder="Search name or mobile…"
            className="w-full sm:w-64"
          />
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
          {category === "assigned" && can("leads.view.all") && (
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
        <Button variant="outline" onClick={handleExport} loading={exporting}>
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      {enableBulk && (
        <BulkActions selectedIds={selected} onClear={() => setSelected([])} />
      )}

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(l) => l.id}
          loading={isLoading}
          error={isError}
          onRetry={refetch}
          emptyTitle={`No ${category} leads`}
          emptyMessage="No leads match the current filters."
          onRowClick={(l) => router.push(`/leads/${l.id}`)}
          selectable={enableBulk && can("leads.assign")}
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
      </Card>
    </div>
  );
}
