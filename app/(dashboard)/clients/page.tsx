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
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/Badge";
import { AccessGuard } from "@/components/shared/Guards";
import { useClientsList } from "@/hooks/useClients";
import { displayValue, formatDate } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import type { Client } from "@/types";

export default function ClientsPage() {
  return (
    <AccessGuard module="client_details" page="all_clients" action="view">
      <ClientsPageContent />
    </AccessGuard>
  );
}

function DocumentBadge({ has, label }: { has: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        has
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
          : "bg-neutral-100 text-neutral-400"
      }`}
    >
      <FileText className="h-3 w-3" />
      {label}
    </span>
  );
}

function ClientsPageContent() {
  const router = useRouter();
  const [params, setParams] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    search: "",
  });
  const { data, isLoading, isError, refetch } = useClientsList(params);
  const rows = data?.data ?? [];

  const columns: Column<Client>[] = [
    {
      key: "client",
      header: "Client",
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <UserCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{displayValue(c.fullName)}</p>
            <p className="text-xs text-slate-500">{displayValue(c.lead?.leadName)}</p>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (c) => (
        <div className="space-y-0.5">
          {c.mobileNumber && (
            <span className="flex items-center gap-1.5 text-sm text-slate-700">
              <Phone className="h-3.5 w-3.5 text-slate-400" /> {c.mobileNumber}
            </span>
          )}
          {c.email && (
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <Mail className="h-3.5 w-3.5 text-slate-400" /> {c.email}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "dob",
      header: "Date of Birth",
      render: (c) => (
        <span className="text-sm text-slate-700">{formatDate(c.dateOfBirth)}</span>
      ),
    },
    {
      key: "ids",
      header: "Identity Documents",
      render: (c) => (
        <div className="flex flex-wrap gap-1.5">
          <DocumentBadge has={!!c.passportNumber}   label="Passport #" />
          <DocumentBadge has={!!c.emiratesIdNumber} label="Emirates ID #" />
          <DocumentBadge has={!!c.passportFilePath}   label="Passport PDF" />
          <DocumentBadge has={!!c.emiratesIdFilePath} label="Emirates PDF" />
        </div>
      ),
    },
    {
      key: "lead_status",
      header: "Lead Status",
      render: (c) =>
        c.lead?.leadStatus ? <StatusBadge status={c.lead.leadStatus} /> : <span className="text-slate-400">—</span>,
    },
    {
      key: "assigned",
      header: "Assigned To",
      render: (c) => (
        <span className="text-sm text-slate-700">
          {c.lead?.assignedUser?.fullName ?? "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      stickyRight: true,
      headerClassName: "text-right",
      className: "text-right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/clients/${c.leadId}`}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="View client profile"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
          <Link
            href={`/leads/${c.leadId}`}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="View lead"
          >
            <CreditCard className="h-4 w-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Client Details"
        subtitle={data ? `${data.total} clients` : "All client records"}
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
        rowKey={(c) => c.id}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        emptyTitle="No clients"
        emptyMessage="Client records are created when lead details are saved."
        onRowClick={(c) => router.push(`/clients/${c.leadId}`)}
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
