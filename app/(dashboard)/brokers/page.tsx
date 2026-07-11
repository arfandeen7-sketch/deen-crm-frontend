"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Download, Eye, Pencil, Trash2, Phone } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Input";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { BrokerStatusBadge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/Avatar";
import { CanAccess } from "@/components/shared/Guards";
import { useBrokersList, useBrokerMutations } from "@/hooks/useBrokers";
import { brokersService } from "@/services/brokers/brokers.service";
import { getErrorMessage } from "@/services/api/client";
import { downloadBlob } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import type { Broker } from "@/types";

export default function BrokersPage() {
  const router = useRouter();
  const [params, setParams] = useState({ page: 1, pageSize: DEFAULT_PAGE_SIZE, search: "", status: "" });
  const { data, isLoading, isError, refetch } = useBrokersList(params);
  const { remove } = useBrokerMutations();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const rows = data?.data ?? [];

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await brokersService.export(params);
      downloadBlob(blob, `brokers_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
      toast.success("Broker deleted");
      setDeleteId(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  const columns: Column<Broker>[] = [
    {
      key: "name",
      header: "Broker",
      render: (b) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={b.brokerName} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{b.brokerName}</p>
            <p className="text-xs text-slate-500">{b.companyName ?? "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "mobile",
      header: "Mobile",
      render: (b) => (
        <span className="flex items-center gap-1.5 text-slate-700">
          <Phone className="h-3.5 w-3.5 text-slate-400" /> {b.mobileNumber}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (b) => <BrokerStatusBadge status={b.status} /> },
    { key: "posted", header: "Posted By", render: (b) => b.poster?.fullName ?? "—" },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (b) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Link href={`/brokers/${b.id}`} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <Eye className="h-4 w-4" />
          </Link>
          <CanAccess module="brokers" page="all_brokers" action="create">
            <Link href={`/brokers/${b.id}/edit`} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-gray-900">
              <Pencil className="h-4 w-4" />
            </Link>
          </CanAccess>
          <CanAccess module="brokers" page="all_brokers" action="delete">
            <button onClick={() => setDeleteId(b.id)} className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
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
        title="Brokers"
        subtitle={data ? `${data.total} brokers` : "Manage your broker network"}
        actions={
          <>
            <CanAccess module="brokers" page="all_brokers" action="create">
              <Button variant="outline" onClick={handleExport} loading={exporting}>
                <Download className="h-4 w-4" /> Export
              </Button>
            </CanAccess>
            <CanAccess module="brokers" page="all_brokers" action="create">
              <Button onClick={() => router.push("/brokers/create")}>
                <Plus className="h-4 w-4" /> Add Broker
              </Button>
            </CanAccess>
          </>
        }
      />

      <Card className="flex flex-wrap items-center gap-2 p-4">
        <SearchInput
          value={params.search}
          onChange={(v) => setParams((p) => ({ ...p, search: v, page: 1 }))}
          placeholder="Search brokers…"
          className="w-full sm:w-72"
        />
        <Select
          value={params.status}
          onChange={(e) => setParams((p) => ({ ...p, status: e.target.value, page: 1 }))}
          className="h-10 w-auto"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </Select>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(b) => b.id}
          loading={isLoading}
          error={isError}
          onRetry={refetch}
          emptyTitle="No brokers"
          emptyMessage="Add your first broker to get started."
          onRowClick={(b) => router.push(`/brokers/${b.id}`)}
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
      </Card>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete broker?"
        message="This will permanently remove the broker."
        confirmLabel="Delete"
        loading={remove.isPending}
      />
    </div>
  );
}
