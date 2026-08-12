"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Award,
  BarChart2,
  CalendarDays,
  ExternalLink,
  User as UserIcon,
  Eye,
  X,
  ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LeadTabs } from "@/components/leads/LeadTabs";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { AccessGuard } from "@/components/shared/Guards";
import {
  useDealClosedList,
  useDealClosedStats,
  useDealClosedEmployeeSummary,
  useDealClosedDetail,
} from "@/hooks/useDealClosed";
import { formatCurrency, formatDateTime, formatDate, displayValue } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import type { ClosedDeal, DealClosedQueryParams } from "@/types";

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  iconClass?: string;
}) {
  return (
    <Card className="flex items-start gap-4 p-5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass ?? "bg-emerald-50 text-emerald-600"}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          {label}
        </p>
        <p className="mt-0.5 text-xl font-bold text-neutral-900 truncate">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-neutral-400">{sub}</p>}
      </div>
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

function EmployeeSummaryTable() {
  const { data = [], isLoading, isError } = useDealClosedEmployeeSummary();

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

// ── Filters bar ───────────────────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-lg border border-neutral-200 bg-white pl-3 pr-8 text-xs text-neutral-900 shadow-2xs focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all duration-150"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
    </div>
  );
}

// ── Main page content ─────────────────────────────────────────────────────────

function DealClosedPageContent() {
  const [params, setParams] = useState<DealClosedQueryParams>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    search: "",
  });
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useDealClosedList(params);
  const { data: stats } = useDealClosedStats();

  const rows = data?.data ?? [];

  function setFilter(key: keyof DealClosedQueryParams, value: string) {
    setParams((p) => ({ ...p, [key]: value || undefined, page: 1 }));
  }

  const columns: Column<ClosedDeal>[] = [
    {
      key: "lead",
      header: "Lead",
      render: (row) => (
        <div>
          <p className="font-medium text-neutral-900">{row.leadName}</p>
          <p className="text-xs text-neutral-400">{row.mobileNumber}</p>
        </div>
      ),
    },
    {
      key: "client",
      header: "Client Name",
      render: (row) => (
        <span className="text-sm text-neutral-700">
          {row.client?.fullName ?? <span className="text-neutral-400">—</span>}
        </span>
      ),
    },
    {
      key: "salesUser",
      header: "Sales User",
      render: (row) => (
        <div>
          <p className="font-medium text-neutral-900">
            {row.salesUser?.fullName ?? <span className="text-neutral-400">—</span>}
          </p>
          {row.salesManager && (
            <p className="text-xs text-neutral-400">{row.salesManager.fullName}</p>
          )}
        </div>
      ),
    },
    {
      key: "project",
      header: "Project / Community",
      render: (row) => (
        <div>
          <p className="text-sm text-neutral-900">{displayValue(row.projectName)}</p>
          {row.community && (
            <p className="text-xs text-neutral-400">{row.community}</p>
          )}
        </div>
      ),
    },
    {
      key: "property",
      header: "Type / Unit",
      render: (row) => (
        <div>
          <p className="text-sm text-neutral-700">{displayValue(row.propertyType)}</p>
          {row.unitNumber && (
            <p className="text-xs text-neutral-400">Unit {row.unitNumber}</p>
          )}
        </div>
      ),
    },
    {
      key: "size",
      header: "Size",
      render: (row) => (
        <span className="text-sm text-neutral-700">{displayValue(row.propertySize)}</span>
      ),
    },
    {
      key: "salesValue",
      header: "Sales Value",
      headerClassName: "text-right",
      className: "text-right",
      render: (row) => (
        <span className="font-bold text-emerald-700">
          {formatCurrency(row.salesValue)}
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (row) => (
        <span className="text-sm text-neutral-700">{displayValue(row.leadSource)}</span>
      ),
    },
    {
      key: "createdBy",
      header: "Created By",
      render: (row) => (
        <span className="text-sm text-neutral-700">
          {row.createdBy?.fullName ?? <span className="text-neutral-400">—</span>}
        </span>
      ),
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      render: (row) => (
        <span className="text-sm text-neutral-700">
          {row.assignedTo?.fullName ?? <span className="text-neutral-400">—</span>}
        </span>
      ),
    },
    {
      key: "closedBy",
      header: "Closed By",
      render: (row) => (
        <span className="text-sm text-neutral-700">
          {row.closedBy?.fullName ?? <span className="text-neutral-400">—</span>}
        </span>
      ),
    },
    {
      key: "closedAt",
      header: "Deal Closed",
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-neutral-700">
          {formatDateTime(row.closedAt)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.leadStatus} />,
    },
    {
      key: "actions",
      header: "",
      stickyRight: true,
      headerClassName: "text-right",
      className: "text-right",
      render: (row) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setSelectedSaleId(row.id)}
            className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            title="View deal details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <Link
            href={`/leads/${row.leadId}`}
            className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            title="View lead"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
          {row.client && (
            <Link
              href={`/clients/${row.leadId}`}
              className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
              title="View client"
            >
              <UserIcon className="h-4 w-4" />
            </Link>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <LeadTabs />
      <PageHeader
        title="Deal Closed"
        subtitle="All closed deals and sales performance"
      />

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          icon={TrendingUp}
          label="Total Sales Value"
          value={stats ? formatCurrency(stats.totalSalesValue) : "—"}
          iconClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={Award}
          label="Total Closed Deals"
          value={stats ? String(stats.totalDeals) : "—"}
          iconClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={BarChart2}
          label="Avg Deal Value"
          value={stats ? formatCurrency(stats.avgDealValue) : "—"}
          iconClass="bg-violet-50 text-violet-600"
        />
        <StatCard
          icon={CalendarDays}
          label="This Month Sales"
          value={stats ? formatCurrency(stats.thisMonthSalesValue) : "—"}
          iconClass="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={CalendarDays}
          label="This Month Deals"
          value={stats ? String(stats.thisMonthDeals) : "—"}
          iconClass="bg-rose-50 text-rose-600"
        />
      </div>

      {/* ── Employee Summary ── */}
      <Card>
        <CardHeader title="Sales by Employee" subtitle="Sorted by total sales value" />
        <EmployeeSummaryTable />
      </Card>

      {/* ── Filters ── */}
      <Card className="flex flex-wrap items-center gap-2 p-4">
        <SearchInput
          value={params.search ?? ""}
          onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))}
          placeholder="Search lead, client, project, mobile…"
          className="w-full sm:w-72"
        />
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={params.closedFrom ?? ""}
            onChange={(e) => setFilter("closedFrom", e.target.value)}
            className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-900 shadow-2xs focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all"
            placeholder="From"
            title="Closed from"
          />
          <input
            type="date"
            value={params.closedTo ?? ""}
            onChange={(e) => setFilter("closedTo", e.target.value)}
            className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-xs text-neutral-900 shadow-2xs focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-all"
            placeholder="To"
            title="Closed to"
          />
        </div>
        {(params.search || params.closedFrom || params.closedTo || params.source || params.propertyType) && (
          <button
            onClick={() =>
              setParams((p) => ({
                ...p,
                search: "",
                closedFrom: undefined,
                closedTo: undefined,
                source: undefined,
                propertyType: undefined,
                page: 1,
              }))
            }
            className="flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-500 hover:bg-neutral-50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </Card>

      {/* ── Main Table ── */}
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        emptyTitle="No closed deals"
        emptyMessage="Deals will appear here when a lead status is set to Deal Closed."
        onRowClick={(r) => setSelectedSaleId(r.id)}
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

      {/* ── Deal Details Modal ── */}
      <DealDetailsModal
        saleId={selectedSaleId}
        onClose={() => setSelectedSaleId(null)}
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
