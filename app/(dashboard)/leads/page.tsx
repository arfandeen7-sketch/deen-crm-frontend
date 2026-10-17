"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, Download, Upload } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { DataTable } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { LeadTableToolbar, useVisibleLeadColumns } from "@/components/leads/LeadTableToolbar";
import { BulkActions } from "@/components/leads/BulkActions";
import { LeadTabs } from "@/components/leads/LeadTabs";
import { buildLeadColumns } from "@/components/leads/leadTableColumns";
import { AssignmentHistoryModal } from "@/components/leads/AssignmentHistoryModal";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import { useLeadFilterStore } from "@/store/filter.store";
import { useLeadsList, useLeadMutations } from "@/hooks/useLeads";
import { useLeadCustomFields } from "@/hooks/useCustomFields";
import { buildCustomFieldColumns } from "@/components/leads/customFieldColumns";
import { useAuth } from "@/hooks/useAuth";
import { useLeadSelection } from "@/hooks/useLeadSelection";
import { leadsService } from "@/services/leads/leads.service";
import { getErrorMessage } from "@/services/api/client";
import { downloadBlob } from "@/lib/utils";

export default function LeadsPage() {
  return (
    <AccessGuard module="leads" page="all_leads" action="view">
      <LeadsPageContent />
    </AccessGuard>
  );
}

function LeadsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canAction } = useAuth();
  const { filters, setFilter, resetFilters } = useLeadFilterStore();
  const leadIdsParam = searchParams.get("leadIds");
  // The dropdown always has a selection. Property Finder enquiry is the default,
  // so a date range on this page uses that enquiry date unless another option is chosen.
  const listFilters = useMemo(() => {
    const base = { ...filters, dateField: filters.dateField ?? ("pf_enquiry" as const) };
    if (!leadIdsParam) return base;
    return { ...base, leadIds: leadIdsParam, page: 1, pageSize: 100 };
  }, [filters, leadIdsParam]);
  const { data, isLoading, isError, refetch } = useLeadsList(listFilters);
  const { data: customFieldDefs } = useLeadCustomFields();
  const { remove } = useLeadMutations();

  useEffect(() => {
    const assignedTo = searchParams.get("assignedTo");
    if (assignedTo) {
      setFilter("assignedTo", assignedTo);
    }
  }, [searchParams, setFilter]);

  const rows = data?.data ?? [];
  const { selected, toggleRow, toggleAll, lockAssigned, clear } = useLeadSelection(rows.map((row) => row.id));
  const openedFromNotification = Boolean(leadIdsParam);
  const [exporting, setExporting] = useState(false);
  const [historyLead, setHistoryLead] = useState<{ id: string; name: string } | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await leadsService.export(listFilters);
      downloadBlob(blob, `leads_${new Date().toISOString().slice(0, 10)}.xlsx`);
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

  const columns = buildLeadColumns({
    dateField: filters.dateField,
    onOpenHistory: (lead) => setHistoryLead(lead),
    onDelete: (id) => setDeleteId(id),
  });

  const customCols = buildCustomFieldColumns(customFieldDefs);
  const actionCol = columns[columns.length - 1];
  const allColumns = [...columns.slice(0, -1), ...customCols, actionCol];
  const displayColumns = useVisibleLeadColumns(allColumns);

  return (
    <div className="space-y-5">
      <LeadTabs />
      <PageHeader
        title="All Leads"
        subtitle={
          data
            ? `${data.total} total leads${
                filters.dateField === "manual" || filters.dateField === "master_assigned"
                  ? " · includes leads converted to owners"
                  : ""
              }`
            : "Manage and track your leads"
        }
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
        <LeadTableToolbar
          search={filters.search ?? ""}
          onSearch={(v) => setFilter("search", v || undefined)}
          columns={allColumns}
        >
          <LeadFilters filters={filters} onChange={setFilter} onReset={resetFilters} />
        </LeadTableToolbar>
      </Card>

      <BulkActions
        selectedIds={selected}
        onAssigned={lockAssigned}
        onClear={clear}
      />

      {openedFromNotification && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-950">
            {isLoading
              ? "Loading leads from an assignment notification."
              : `Showing ${rows.length} lead${rows.length === 1 ? "" : "s"} from an assignment notification.`}
          </p>
          <button
            type="button"
            onClick={() => router.push("/leads")}
            className="text-sm font-semibold text-amber-950 underline underline-offset-4"
          >
            Show all leads
          </button>
        </div>
      )}

      <DataTable
        columns={displayColumns}
        rows={rows}
        rowKey={(l) => l.id}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        emptyTitle="No leads found"
        emptyMessage="Try adjusting your filters or create a new lead."
        onRowClick={(l) => router.push(`/leads/${l.id}`)}
        selectable={
          canAction("leads", "all_leads", "bulk_assign") ||
          canAction("leads", "all_leads", "bulk_status") ||
          canAction("leads", "all_leads", "bulk_update") ||
          canAction("leads", "all_leads", "delete")
        }
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

      <AssignmentHistoryModal
        leadId={historyLead?.id ?? null}
        leadName={historyLead?.name}
        open={!!historyLead}
        onClose={() => setHistoryLead(null)}
      />
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
