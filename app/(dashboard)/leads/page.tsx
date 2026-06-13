"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Download, Upload, Eye, Pencil, Trash2 } from "lucide-react";
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
import { RoleGuard } from "@/components/shared/Guards";
import { useLeadFilterStore } from "@/store/filter.store";
import { useLeadsList, useLeadMutations } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import { leadsService } from "@/services/leads/leads.service";
import { getErrorMessage } from "@/services/api/client";
import { downloadBlob, formatDate } from "@/lib/utils";
import type { Lead } from "@/types";

export default function LeadsPage() {
  const router = useRouter();
  const { can } = useAuth();
  const { filters, setFilter, resetFilters } = useLeadFilterStore();
  const { data, isLoading, isError, refetch } = useLeadsList(filters);
  const { remove } = useLeadMutations();

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
    { key: "project", header: "Project", render: (l) => l.projectName ?? "—" },
    { key: "status", header: "Status", render: (l) => <StatusBadge status={l.leadStatus} /> },
    { key: "priority", header: "Priority", render: (l) => <PriorityBadge priority={l.leadPriority} /> },
    {
      key: "assigned",
      header: "Assigned",
      render: (l) =>
        l.assignedUser ? (
          <span className="text-sm text-slate-700">{l.assignedUser.fullName}</span>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        ),
    },
    { key: "followup", header: "Follow Up", render: (l) => formatDate(l.followUpDate) },
    { key: "created", header: "Created", render: (l) => formatDate(l.createdAt) },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (l) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Link href={`/leads/${l.id}`} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <Eye className="h-4 w-4" />
          </Link>
          <Link href={`/leads/${l.id}/edit`} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600">
            <Pencil className="h-4 w-4" />
          </Link>
          <RoleGuard permission="leads.delete">
            <button
              onClick={() => setDeleteId(l.id)}
              className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </RoleGuard>
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
            <Button variant="outline" onClick={handleExport} loading={exporting}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <RoleGuard permission="leads.import">
              <Button variant="outline" onClick={() => router.push("/leads/import")}>
                <Upload className="h-4 w-4" /> Import
              </Button>
            </RoleGuard>
            <Button onClick={() => router.push("/leads/create")}>
              <Plus className="h-4 w-4" /> Create Lead
            </Button>
          </>
        }
      />

      <Card className="p-4">
        <LeadFilters filters={filters} onChange={setFilter} onReset={resetFilters} />
      </Card>

      <BulkActions selectedIds={selected} onClear={() => setSelected([])} />

      <Card>
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
          selectable={can("leads.assign")}
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
            onPageChange={(p) => setFilter("page", p)}
            onPageSizeChange={(s) => setFilter("pageSize", s)}
          />
        )}
      </Card>

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
