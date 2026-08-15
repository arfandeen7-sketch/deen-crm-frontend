"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Eye, Pencil, Trash2, Phone, Mail, Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { UserAvatar } from "@/components/ui/Avatar";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import { useOwnersList, useOwnerMutations } from "@/hooks/useOwners";
import { getErrorMessage } from "@/services/api/client";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import type { Owner } from "@/types";

export default function OwnersPage() {
  return (
    <AccessGuard module="owners" page="all_owners" action="view">
      <OwnersPageContent />
    </AccessGuard>
  );
}

function OwnersPageContent() {
  const router = useRouter();
  const [params, setParams] = useState({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    search: "",
  });
  const { data, isLoading, isError, refetch } = useOwnersList(params);
  const { remove } = useOwnerMutations();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const rows = data?.data ?? [];

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      toast.success("Owner deleted");
      setDeleteId(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  const columns: Column<Owner>[] = [
    {
      key: "name",
      header: "Owner",
      render: (o) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={o.fullName} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{o.fullName}</p>
            {o.email && (
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <Mail className="h-3 w-3" /> {o.email}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "mobile",
      header: "Mobile",
      render: (o) => (
        <span className="flex items-center gap-1.5 text-slate-700">
          <Phone className="h-3.5 w-3.5 text-slate-400" /> {o.mobileNumber}
        </span>
      ),
    },
    {
      key: "emirate",
      header: "Emirate",
      render: (o) => o.emirate ?? "—",
    },
    {
      key: "properties",
      header: "Properties",
      render: (o) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          <Building2 className="h-3 w-3" />
          {o._count?.properties ?? 0}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      stickyRight: true,
      headerClassName: "text-right",
      className: "text-right",
      render: (o) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/owners/${o.id}`}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <CanAccess module="owners" page="all_owners" action="edit">
            <Link
              href={`/owners/${o.id}/edit`}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-gray-900"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          </CanAccess>
          <CanAccess module="owners" page="all_owners" action="delete">
            <button
              onClick={() => setDeleteId(o.id)}
              className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </CanAccess>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Owners"
        subtitle={data ? `${data.total} owners` : "Manage property owners and their portfolios"}
        actions={
          <CanAccess module="owners" page="all_owners" action="create">
            <Button onClick={() => router.push("/owners/create")}>
              <Plus className="h-4 w-4" /> Add Owner
            </Button>
          </CanAccess>
        }
      />

      <Card className="flex flex-wrap items-center gap-2 p-4">
        <SearchInput
          value={params.search}
          onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))}
          placeholder="Search owners by name, mobile, email…"
          className="w-full sm:w-80"
        />
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(o) => o.id}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        emptyTitle="No owners yet"
        emptyMessage="Add your first property owner to get started."
        onRowClick={(o) => router.push(`/owners/${o.id}`)}
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

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete owner?"
        message="This will permanently remove the owner and all their linked properties. This cannot be undone."
        confirmLabel="Delete"
        loading={remove.isPending}
      />
    </div>
  );
}
