"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Mail, ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { StatusBadge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { useLeadsList } from "@/hooks/useLeads";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { formatDate } from "@/lib/utils";
import type { Lead } from "@/types";

interface EmployeeLeadsModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export function EmployeeLeadsModal({ open, onClose, userId, userName }: EmployeeLeadsModalProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");

  const params = { assignedTo: userId, page, pageSize, search };
  const { data, isLoading, isError, refetch } = useLeadsList(params);
  const rows = data?.data ?? [];

  const columns: Column<Lead>[] = [
    {
      key: "leadName",
      header: "Lead",
      render: (l) => (
        <div>
          <p className="font-medium text-slate-900">{l.leadName}</p>
          {l.projectName && <p className="text-xs text-slate-500">{l.projectName}</p>}
        </div>
      ),
    },
    {
      key: "mobile",
      header: "Mobile",
      render: (l) => (
        <span className="flex items-center gap-1.5 text-sm text-slate-700">
          <Phone className="h-3.5 w-3.5 text-slate-400" /> {l.mobileNumber}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (l) =>
        l.email ? (
          <span className="flex items-center gap-1.5 text-sm text-slate-700">
            <Mail className="h-3.5 w-3.5 text-slate-400" /> {l.email}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (l) => <StatusBadge status={l.leadStatus} />,
    },
    {
      key: "source",
      header: "Source",
      render: (l) => <span className="text-sm text-slate-600">{l.source}</span>,
    },
    {
      key: "created",
      header: "Created",
      render: (l) => <span className="text-sm text-slate-500">{formatDate(l.leadDate ?? l.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      stickyRight: true,
      headerClassName: "text-right",
      className: "text-right",
      render: (l) => (
        <Link
          href={`/leads/${l.id}`}
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          title="View lead detail"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Leads assigned to ${userName}`}
      size="xl"
    >
      <div className="space-y-4">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by name, mobile, project…"
          className="w-full"
        />

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(l) => l.id}
          loading={isLoading}
          error={isError}
          onRetry={refetch}
          emptyTitle="No leads"
          emptyMessage={`No leads assigned to ${userName}.`}
        />

        {data && data.total > 0 && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            totalPages={data.totalPages}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        )}
      </div>
    </Modal>
  );
}
