"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  TrendingUp,
  Award,
  BarChart2,
  CalendarDays,
  ExternalLink,
  User as UserIcon,
  Eye,
  UserCheck,
  Lock,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LeadTabs } from "@/components/leads/LeadTabs";
import { Card, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { AccessGuard } from "@/components/shared/Guards";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { LeadTableToolbar, useVisibleLeadColumns } from "@/components/leads/LeadTableToolbar";
import { BulkActions } from "@/components/leads/BulkActions";
import { AssignmentHistoryModal } from "@/components/leads/AssignmentHistoryModal";
import { buildLeadColumns } from "@/components/leads/leadTableColumns";
import { buildCustomFieldColumns } from "@/components/leads/customFieldColumns";
import { useLeadCustomFields } from "@/hooks/useCustomFields";
import { useLeadMutations } from "@/hooks/useLeads";
import { useAuth } from "@/hooks/useAuth";
import {
  useDealClosedList,
  useDealClosedStats,
  useDealClosedEmployeeSummary,
  useDealClosedDetail,
  useDealClosedUsers,
  useDealClosedOptions,
} from "@/hooks/useDealClosed";
import { formatCurrency, formatAmount, formatDateTime, formatDate, displayValue } from "@/lib/utils";
import { canMutateDealClosedLead } from "@/lib/dealClosedLock";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { getErrorMessage } from "@/services/api/client";
import type { DealClosedQueryParams, Lead } from "@/types";

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  currency,
  sub,
  iconClass,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  /** When set, the figure is the grouped amount and this code sits beside it. */
  currency?: string;
  sub?: string;
  iconClass?: string;
  className?: string;
}) {
  return (
    <Card className={`flex flex-col gap-3 p-4 sm:p-5 ${className ?? ""}`}>
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass ?? "bg-emerald-50 text-emerald-600"}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          {label}
        </p>
      </div>
      <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5" title={currency && value !== "—" ? `${currency} ${value}` : value}>
        <span className="text-xl font-bold tabular-nums tracking-tight text-neutral-900 sm:text-2xl">
          {value}
        </span>
        {currency && value !== "—" && (
          <span className="text-xs font-semibold text-neutral-400">{currency}</span>
        )}
      </p>
      {sub && <p className="text-xs text-neutral-400">{sub}</p>}
    </Card>
  );
}

// ── Deal Details Modal ─────────────────────────────────────────────────────────

function DealDetailsModal({
  saleId,
  onClose,
}: {
  saleId: string | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useDealClosedDetail(saleId);

  return (
    <Modal
      open={!!saleId}
      onClose={onClose}
      title="Deal Details"
      size="xl"
    >
      {isLoading && (
        <div className="flex items-center justify-center py-12 text-sm text-neutral-500">
          Loading…
        </div>
      )}
      {data && (
        <div className="space-y-6 text-sm">
          {/* Deal Information */}
          <section>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Deal Information
            </h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailRow label="Lead Name" value={data.leadName} />
              <DetailRow label="Client Name" value={data.client?.fullName} />
              <DetailRow label="Sales User" value={data.salesUser?.fullName} />
              <DetailRow label="Sales Manager" value={data.salesManager?.fullName} />
              <DetailRow
                label="Sales Value"
                value={formatCurrency(data.salesValue)}
                highlight
              />
              <DetailRow label="Deal Closed" value={formatDateTime(data.closedAt)} />
              <DetailRow label="Closed By" value={data.closedBy?.fullName} />
              <DetailRow label="Lead Status" value={data.leadStatus} isStatus />
            </dl>
          </section>

          {/* Property Information */}
          <section>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Property Information
            </h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailRow label="Project Name" value={data.projectName} />
              <DetailRow label="Community" value={data.community} />
              <DetailRow label="Property Type" value={data.propertyType} />
              <DetailRow label="Unit Number" value={data.unitNumber} />
              <DetailRow label="Building No." value={data.buildingNo} />
              <DetailRow label="Size" value={data.propertySize} />
              <DetailRow label="Property Price" value={data.propertyPrice} />
            </dl>
          </section>

          {/* Lead Information */}
          <section>
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Lead Information
            </h3>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailRow label="Lead Source" value={data.leadSource} />
              <DetailRow label="Mobile" value={data.mobileNumber} />
              <DetailRow label="Created By" value={data.createdBy?.fullName} />
              <DetailRow label="Assigned To" value={data.assignedTo?.fullName} />
              <DetailRow label="Lead Created" value={formatDate(data.leadCreatedAt)} />
            </dl>
          </section>

          {/* Client Information */}
          {data.client && (
            <section>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Client Information
              </h3>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailRow label="Client Name" value={data.client.fullName} />
                <DetailRow label="Mobile" value={data.client.mobileNumber} />
                <DetailRow label="Email" value={data.client.email} />
                <DetailRow label="Date of Birth" value={formatDate(data.client.dateOfBirth)} />
                <DetailRow
                  label="Passport #"
                  value={data.client.passportNumber}
                  badge={data.client.hasPassportFile ? "PDF uploaded" : undefined}
                />
                <DetailRow
                  label="Emirates ID #"
                  value={data.client.emiratesIdNumber}
                  badge={data.client.hasEmiratesIdFile ? "PDF uploaded" : undefined}
                />
              </dl>
            </section>
          )}

          {/* Owner Conversion */}
          {data.convertedToOwnerId && data.convertedOwner && (
            <section>
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Owner Record
              </h3>
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <UserCheck className="h-4 w-4 shrink-0" />
                <span>
                  Converted to Owner:{" "}
                  <span className="font-semibold">{data.convertedOwner.fullName}</span>
                </span>
              </div>
            </section>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
            <Link
              href={`/leads/${data.leadId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Lead
            </Link>
            <Link
              href={`/clients/${data.leadId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <UserIcon className="h-3.5 w-3.5" />
              View Client
            </Link>
            {data.convertedToOwnerId && (
              <Link
                href={`/owners/${data.convertedToOwnerId}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <UserCheck className="h-3.5 w-3.5" />
                View Owner
              </Link>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function DetailRow({
  label,
  value,
  highlight,
  isStatus,
  badge,
}: {
  label: string;
  value?: string | null;
  highlight?: boolean;
  isStatus?: boolean;
  badge?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </dt>
      <dd className="text-sm">
        {isStatus ? (
          <StatusBadge status={value} />
        ) : highlight ? (
          <span className="font-bold text-emerald-700">{displayValue(value)}</span>
        ) : (
          <span className={value ? "text-neutral-900" : "text-neutral-400"}>
            {displayValue(value)}
          </span>
        )}
        {badge && (
          <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            {badge}
          </span>
        )}
      </dd>
    </div>
  );
}

// ── Employee Summary Table ─────────────────────────────────────────────────────

function EmployeeSummaryTable({
  closedFrom,
  closedTo,
}: {
  closedFrom?: string;
  closedTo?: string;
}) {
  const { data = [], isLoading, isError } = useDealClosedEmployeeSummary({ closedFrom, closedTo });

  if (isLoading) {
    return (
      <div className="space-y-2 px-5 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 animate-pulse rounded-lg bg-neutral-100" />
        ))}
      </div>
    );
  }

  if (isError || data.length === 0) {
    return (
      <p className="px-5 py-6 text-center text-sm text-neutral-400">
        {isError ? "Failed to load summary." : "No closed deals yet."}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100">
            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-500 w-8">#</th>
            <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Sales User</th>
            <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Closed Deals</th>
            <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Total Sales Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.employeeId} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
              <td className="px-5 py-3 text-xs font-medium text-neutral-400">{i + 1}</td>
              <td className="px-5 py-3">
                <p className="font-medium text-neutral-900">{row.employeeName}</p>
                {row.managerName && (
                  <p className="text-xs text-neutral-400">Manager: {row.managerName}</p>
                )}
              </td>
              <td className="px-5 py-3 text-right font-semibold text-neutral-900">{row.closedDeals}</td>
              <td className="px-5 py-3 text-right font-bold text-emerald-700">
                {formatCurrency(row.totalSalesValue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DealClosedPageContent() {
  const router = useRouter();
  const { role, canAction } = useAuth();
  const isMaster = role === "master";
  const [params, setParams] = useState<DealClosedQueryParams>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    search: "",
    sortBy: "updatedAt",
    sortDir: "desc",
  });
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [historyLead, setHistoryLead] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isError, refetch } = useDealClosedList(params);
  const { data: stats } = useDealClosedStats();
  const { data: users = [] } = useDealClosedUsers();
  const { data: filterOptions } = useDealClosedOptions();
  const { data: customFieldDefs } = useLeadCustomFields();
  const { remove } = useLeadMutations();

  const rows = (data?.data ?? []).map((item) => item.lead);
  const summaryDates =
    !params.dateField || params.dateField === "closed"
      ? { closedFrom: params.dateFrom ?? params.closedFrom, closedTo: params.dateTo ?? params.closedTo }
      : {};

  function setFilter<K extends keyof DealClosedQueryParams>(key: K, value: DealClosedQueryParams[K]) {
    setParams((current) => ({ ...current, [key]: value, page: 1 }));
  }

  function onSort(key: string) {
    setParams((current) => ({
      ...current,
      page: 1,
      sortBy: key as DealClosedQueryParams["sortBy"],
      sortDir: current.sortBy === key && current.sortDir === "desc" ? "asc" : "desc",
    }));
  }

  function toggleRow(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      toast.success("Lead deleted");
      setDeleteId(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columns = buildLeadColumns({
    dateField: params.dateField === "closed" ? undefined : params.dateField,
    onOpenHistory: (lead) => setHistoryLead(lead),
    onDelete: (id) => setDeleteId(id),
    canMutate: (lead) => canMutateDealClosedLead(role, lead.leadStatus),
  });
  const closedColumns: Column<Lead>[] = [
    {
      key: "salesUser",
      header: "Sales User",
      render: (lead) => (
        <div>
          <p className="text-sm text-slate-800">{lead.salesUser?.fullName ?? "—"}</p>
          {lead.salesManager && <p className="text-xs text-slate-400">{lead.salesManager.fullName}</p>}
        </div>
      ),
    },
    {
      key: "closedBy",
      header: "Closed By",
      render: (lead) => <span className="text-sm text-slate-700">{lead.closedBy?.fullName ?? "—"}</span>,
    },
    {
      key: "closedAt",
      header: "Deal Closed",
      sortKey: "closedAt",
      render: (lead) => (
        <span className="whitespace-nowrap text-sm text-slate-700">
          {lead.closedAt ? formatDateTime(lead.closedAt) : "—"}
        </span>
      ),
    },
    {
      key: "salesValue",
      header: "Sales Value",
      sortKey: "salesValue",
      render: (lead) =>
        lead.salesValue != null ? (
          <span className="font-semibold text-emerald-700">{formatCurrency(lead.salesValue)}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ];
  const actionCol = columns[columns.length - 1];
  const allColumns = [
    ...columns.slice(0, -1),
    ...buildCustomFieldColumns(customFieldDefs),
    ...closedColumns,
    actionCol,
  ];
  const displayColumns = useVisibleLeadColumns(allColumns);
  const canSelect =
    isMaster &&
    (canAction("leads", "all_leads", "bulk_assign") ||
      canAction("leads", "all_leads", "bulk_status") ||
      canAction("leads", "all_leads", "bulk_update") ||
      canAction("leads", "all_leads", "delete"));

  return (
    <div className="space-y-5">
      <LeadTabs />
      <PageHeader
        title="Deal Closed"
        subtitle={data ? `${data.total} closed deals` : "Closed deals and sales performance"}
      />

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          {isMaster
            ? "You can see every closed deal. These leads are locked for every other user. Only a Master user can edit a lead or change its status. Moving it to another status returns it to All Leads."
            : "You can see closed deals credited to you or closed by you. These leads are locked. Only a Master user can edit them or change their status."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard
          icon={TrendingUp}
          label="Total Sales Value"
          value={stats ? formatAmount(stats.totalSalesValue) : "—"}
          currency="AED"
          iconClass="bg-emerald-50 text-emerald-600"
          className="col-span-2 lg:col-span-1"
        />
        <StatCard
          icon={Award}
          label="Total Closed Deals"
          value={stats ? new Intl.NumberFormat("en-AE").format(stats.totalDeals) : "—"}
          iconClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={BarChart2}
          label="Avg Deal Value"
          value={stats ? formatAmount(stats.avgDealValue) : "—"}
          currency="AED"
          iconClass="bg-violet-50 text-violet-600"
          className="col-span-2 lg:col-span-1"
        />
        <StatCard
          icon={CalendarDays}
          label="This Month Sales"
          value={stats ? formatAmount(stats.thisMonthSalesValue) : "—"}
          currency="AED"
          iconClass="bg-amber-50 text-amber-600"
          className="col-span-2 lg:col-span-1"
        />
        <StatCard
          icon={CalendarDays}
          label="This Month Deals"
          value={stats ? new Intl.NumberFormat("en-AE").format(stats.thisMonthDeals) : "—"}
          iconClass="bg-rose-50 text-rose-600"
        />
      </div>

      <Card>
        <CardHeader title="Sales by Employee" subtitle="Sorted by total sales value" />
        <EmployeeSummaryTable closedFrom={summaryDates.closedFrom} closedTo={summaryDates.closedTo} />
      </Card>

      <Card className="p-4">
        <LeadTableToolbar
          search={params.search ?? ""}
          onSearch={(value) => setParams((current) => ({ ...current, search: value, page: 1 }))}
          columns={allColumns}
          searchPlaceholder="Search lead, client, project, mobile…"
        >
          <LeadFilters
            variant="dealClosed"
            filters={params}
            onChange={setFilter}
            onReset={() =>
              setParams((current) => ({
                page: 1,
                pageSize: current.pageSize ?? DEFAULT_PAGE_SIZE,
                search: "",
                sortBy: current.sortBy,
                sortDir: current.sortDir,
              }))
            }
            userOptions={isMaster ? users : undefined}
            filterOptions={filterOptions}
          />
        </LeadTableToolbar>
      </Card>

      <BulkActions
        selectedIds={selected}
        selectedLeads={rows.filter((row) => selected.includes(row.id))}
        onClear={() => setSelected([])}
      />

      <DataTable
        columns={displayColumns}
        rows={rows}
        rowKey={(lead) => lead.id}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        emptyTitle="No closed deals"
        emptyMessage="Deals appear here when a lead status is set to Deal Closed."
        onRowClick={(lead) => router.push(`/leads/${lead.id}`)}
        selectable={canSelect}
        selectedIds={selected}
        onToggleRow={toggleRow}
        onToggleAll={(checked) => setSelected(checked ? rows.map((lead) => lead.id) : [])}
        sort={{ key: params.sortBy ?? "updatedAt", direction: params.sortDir ?? "desc" }}
        onSort={onSort}
      />

      {data && data.total > 0 && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={(page) => setParams((current) => ({ ...current, page }))}
          onPageSizeChange={(pageSize) => setParams((current) => ({ ...current, pageSize, page: 1 }))}
        />
      )}

      <DealDetailsModal saleId={selectedSaleId} onClose={() => setSelectedSaleId(null)} />
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

// ── Page export ───────────────────────────────────────────────────────────────

export default function DealClosedPage() {
  return (
    <AccessGuard module="leads" page="deal_closed" action="view">
      <DealClosedPageContent />
    </AccessGuard>
  );
}
