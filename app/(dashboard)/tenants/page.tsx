"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserCircle2,
  Phone,
  Mail,
  ExternalLink,
  FileText,
  CreditCard,
  CalendarClock,
  Home,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { AccessGuard } from "@/components/shared/Guards";
import { useTenantsList } from "@/hooks/useTenants";
import { displayValue, formatDate } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import type { Tenant } from "@/types";

/** Whole-day difference between an end date and now (negative if already expired). */
function remainingDays(endDate?: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return null;
  const now = new Date();
  // Strip time portion for a clean day count
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ms = endDay.getTime() - todayDay.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function RemainingDaysBadge({ days }: { days: number | null }) {
  if (days == null) return <span className="text-slate-400">—</span>;
  if (days < 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
        Expired
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
        {days}d left
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
        {days}d left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      {days}d left
    </span>
  );
}

export default function TenantsPage() {
  return (
    <AccessGuard module="tenant_details" page="all_tenants" action="view">
      <TenantsPageContent />
    </AccessGuard>
  );
}

function TenantsPageContent() {
  const router = useRouter();
  const [params, setParams] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    search: "",
  });
  const { data, isLoading, isError, refetch } = useTenantsList(params);
  const rows = data?.data ?? [];

  const columns: Column<Tenant>[] = [
    {
      key: "tenant",
      header: "Tenant Name",
      render: (t) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <UserCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{displayValue(t.fullName)}</p>
            <p className="text-xs text-slate-500">{displayValue(t.lead?.leadName)}</p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Email / Phone",
      render: (t) => (
        <div className="space-y-0.5">
          {t.email && (
            <span className="flex items-center gap-1.5 text-sm text-slate-700">
              <Mail className="h-3.5 w-3.5 text-slate-400" /> {t.email}
            </span>
          )}
          {t.mobileNumber && (
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <Phone className="h-3.5 w-3.5 text-slate-400" /> {t.mobileNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "ids",
      header: "Passport / Emirates ID",
      render: (t) => (
        <div className="space-y-0.5">
          <span className="flex items-center gap-1.5 text-sm text-slate-700">
            <FileText className="h-3.5 w-3.5 text-slate-400" /> {displayValue(t.passportNumber)}
          </span>
          <span className="flex items-center gap-1.5 text-sm text-slate-500">
            <CreditCard className="h-3.5 w-3.5 text-slate-400" /> {displayValue(t.emiratesIdNumber)}
          </span>
        </div>
      ),
    },
    {
      key: "dob",
      header: "DOB",
      render: (t) => (
        <span className="text-sm text-slate-700">{formatDate(t.dateOfBirth)}</span>
      ),
    },
    {
      key: "project",
      header: "Property / Project",
      render: (t) => (
        <span className="flex items-center gap-1.5 text-sm text-slate-700">
          <Home className="h-3.5 w-3.5 text-slate-400" /> {displayValue(t.lead?.projectName)}
        </span>
      ),
    },
    {
      key: "agreementStart",
      header: "Agreement Start",
      render: (t) => (
        <span className="whitespace-nowrap text-sm text-slate-700">
          {formatDate(t.agreementStartDate)}
        </span>
      ),
    },
    {
      key: "agreementEnd",
      header: "Agreement End",
      render: (t) => (
        <span className="whitespace-nowrap text-sm text-slate-700">
          {formatDate(t.agreementEndDate)}
        </span>
      ),
    },
    {
      key: "remaining",
      header: "Remaining Days",
      render: (t) => <RemainingDaysBadge days={remainingDays(t.agreementEndDate)} />,
    },
    {
      key: "assigned",
      header: "Assigned To",
      render: (t) => (
        <span className="text-sm text-slate-700">
          {t.lead?.assignedUser?.fullName ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      stickyRight: true,
      headerClassName: "text-right",
      className: "text-right",
      render: (t) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/tenants/${t.leadId}`}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="View tenant profile"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
          <Link
            href={`/leads/${t.leadId}`}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="View lead"
          >
            <CalendarClock className="h-4 w-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tenant Details"
        subtitle={data ? `${data.total} tenants` : "All tenant records"}
      />

      <Card className="flex flex-wrap items-center gap-2 p-4">
        <SearchInput
          value={params.search}
          onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))}
          placeholder="Search by name, mobile, email, passport, Emirates ID…"
          className="w-full sm:w-96"
        />
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        emptyTitle="No tenants"
        emptyMessage="Tenant records are created when rental leads are closed and tenant details are saved."
        onRowClick={(t) => router.push(`/tenants/${t.leadId}`)}
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
    </div>
  );
}
