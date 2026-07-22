"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Download, Upload, Pencil, Trash2, ExternalLink, Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/Avatar";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { BulkActions } from "@/components/leads/BulkActions";
import { LeadTabs } from "@/components/leads/LeadTabs";
import { LeadQuickActions } from "@/components/leads/LeadQuickActions";
import { CanAccess, AccessGuard } from "@/components/shared/Guards";
import { useLeadFilterStore } from "@/store/filter.store";
import { useLeadsList, useLeadMutations } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { leadsService } from "@/services/leads/leads.service";
import { getErrorMessage } from "@/services/api/client";
import { downloadBlob, formatDate, formatDateTime } from "@/lib/utils";
import type { Lead } from "@/types";

export default function LeadsPage() {
  return (
    <AccessGuard module="leads" page="all_leads">
      <LeadsContent />
    </AccessGuard>
  );
}

function LeadsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canAction } = useAuth();
  const { filters, setFilter, setFilters, resetFilters } = useLeadFilterStore();
  const { data, isLoading, isError, refetch } = useLeadsList(filters);
  const { remove } = useLeadMutations();

  useEffect(() => {
    const assignedTo = searchParams.get("assignedTo");
    if (assignedTo) {
      setFilter("assignedTo", assignedTo);
    }
  }, [searchParams, setFilter]);

  const [selected, setSelected] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const rows = data?.data ?? [];

  function toggleRow(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function toggleAll(checked: boolean) {
    setSelected(checked ? rows.map((r) => r.id) : []);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await leadsService.export(filters);
      downloadBlob(blob, `leads_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
          <UserAvatar name={l.leadName} size="sm" />
          <div>
            <p className="font-medium text-slate-900">
              {l.leadName}{l.lastName ? ` ${l.lastName}` : ""}
            </p>
            {l.email && <p className="text-xs text-slate-400">{l.email}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (l) => <span className="text-sm text-slate-700">{l.mobileNumber}</span>,
    },
    {
      key: "source",
      header: "Source",
      render: (l) => (
        <div className="space-y-0.5">
          <p className="text-sm text-slate-700">{l.source}</p>
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

  return (
    <div className="space-y-5">
      <LeadTabs />
      <PageHeader
        title="All Leads"
        subtitle={data ? `${data.total} total leads` : "Manage and track your leads"}
        actions={
          <>
            <CanAccess module="leads" page="all_leads" action="export">
              <Button variant="outline" onClick={handleExport} loading={exporting}>
                <Download className="h-4 w-4" /> Export
              </Button>
            </CanAccess>
            <CanAccess module="leads" page="all_leads" action="import">
              <Button variant="outline" onClick={() => router.push("/leads/import")}>
                <Upload className="h-4 w-4" /> Import
              </Button>
            </CanAccess>
            <CanAccess module="leads" page="all_leads" action="create">
              <Button onClick={() => router.push("/leads/create")}>
                <Plus className="h-4 w-4" /> Create Lead
              </Button>
            </CanAccess>
          </>
        }
      />

      <Card className="p-4">
        <LeadFilters filters={filters} onChange={setFilter} onReset={resetFilters} />
      </Card>

      <BulkActions selectedIds={selected} onClear={() => setSelected([])} />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(l) => l.id}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        emptyTitle="No leads found"
        emptyMessage="Try adjusting your filters or create a new lead."
        onRowClick={(l) => router.push(`/leads/${l.id}`)}
        selectable={canAction("leads", "all_leads", "bulk_assign")}
        selectedIds={selected}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        rowClassName={(l) => (!l.isTouched ? "bg-amber-50 hover:bg-amber-100" : "")}
      />
      {data && data.total > 0 && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={(p) => setFilter("page", p)}
          onPageSizeChange={(s) => setFilter("pageSize", s)}
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
