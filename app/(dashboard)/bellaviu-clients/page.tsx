"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import { bellaviuClientsService } from "@/services/bellaviuClients/bellaviuClients.service";
import { getErrorMessage } from "@/services/api/client";
import { formatDate, formatDateTime, displayValue } from "@/lib/utils";
import type { BellaviuClient, Paginated } from "@/types";
import { BellaviuClientFormModal } from "@/components/bellaviuClients/BellaviuClientFormModal";
import { BellaviuClientViewModal } from "@/components/bellaviuClients/BellaviuClientViewModal";
import {
  BellaviuClientFiltersBar,
  type BellaviuClientFilters,
} from "@/components/bellaviuClients/BellaviuClientFiltersBar";

export default function BellaviuClientsPage() {
  return (
    <AccessGuard module="bellaviu_client_data" page="all_bellaviu_clients" action="view">
      <BellaviuClientsPageContent />
    </AccessGuard>
  );
}

function BellaviuClientsPageContent() {
  const [data, setData] = useState<Paginated<BellaviuClient> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<BellaviuClientFilters>({});

  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<BellaviuClient | null>(null);
  const [viewRecord, setViewRecord] = useState<BellaviuClient | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await bellaviuClientsService.list({
        page,
        pageSize,
        search: search || undefined,
        ...filters,
      });
      setData(res);
    } catch (e) {
      setError(true);
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, filters]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  function setFilter<K extends keyof BellaviuClientFilters>(
    key: K,
    value: BellaviuClientFilters[K] | undefined,
  ) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }
  function resetFilters() {
    setFilters({});
    setPage(1);
  }

  function openCreate() {
    setEditRecord(null);
    setFormOpen(true);
  }
  function openEdit(record: BellaviuClient) {
    setEditRecord(record);
    setViewOpen(false);
    setFormOpen(true);
  }
  function openView(record: BellaviuClient) {
    setViewRecord(record);
    setViewOpen(true);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await bellaviuClientsService.remove(deleteId);
      toast.success("Bellaviu client deleted");
      setDeleteId(null);
      fetchList();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  const rows = data?.data ?? [];
  const Dash: React.FC = () => <span className="text-sm text-slate-400">—</span>;

  const columns: Column<BellaviuClient>[] = [
    {
      key: "name",
      header: "Name",
      render: (c) => <span className="font-medium text-slate-900">{displayValue(c.name)}</span>,
    },
    { key: "phoneNumber", header: "Phone Number", render: (c) => <span className="text-sm text-slate-700">{displayValue(c.phoneNumber)}</span> },
    { key: "alternativeNumber", header: "Alternative Number", render: (c) => <span className="text-sm text-slate-700">{displayValue(c.alternativeNumber)}</span> },
    { key: "email", header: "Email", render: (c) => <span className="text-sm text-slate-700">{displayValue(c.email)}</span> },
    { key: "checkInDate", header: "Check-In Date", render: (c) => <span className="text-sm text-slate-700">{formatDate(c.checkInDate)}</span> },
    { key: "checkOutDate", header: "Check-Out Date", render: (c) => <span className="text-sm text-slate-700">{formatDate(c.checkOutDate)}</span> },
    { key: "bookingChannel", header: "Booking Channel", render: (c) => <span className="text-sm text-slate-700">{displayValue(c.bookingChannel)}</span> },
    { key: "emiratesId", header: "Emirates ID", render: (c) => <span className="text-sm text-slate-700">{displayValue(c.emiratesId)}</span> },
    { key: "passportNumber", header: "Passport Number", render: (c) => <span className="text-sm text-slate-700">{displayValue(c.passportNumber)}</span> },
    { key: "propertyName", header: "Property Name", render: (c) => <span className="text-sm text-slate-700">{displayValue(c.propertyName)}</span> },
    { key: "propertySize", header: "Property Size", render: (c) => <span className="text-sm text-slate-700">{displayValue(c.propertySize)}</span> },
    { key: "unitNo", header: "Unit No.", render: (c) => <span className="text-sm text-slate-700">{displayValue(c.unitNo)}</span> },
    { key: "countryOfClient", header: "Country of Client", render: (c) => <span className="text-sm text-slate-700">{displayValue(c.countryOfClient)}</span> },
    { key: "locationOfProperty", header: "Location of Property", render: (c) => <span className="text-sm text-slate-700">{displayValue(c.locationOfProperty)}</span> },
    {
      key: "passportPdf",
      header: "Passport PDF",
      render: (c) =>
        c.passportFileName && c.passportUrl ? (
          <a
            href={c.passportUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
            title={c.passportFileName}
          >
            <FileText className="h-3.5 w-3.5" /> View
          </a>
        ) : (
          <Dash />
        ),
    },
    {
      key: "emiratesIdPdf",
      header: "Emirates ID PDF",
      render: (c) =>
        c.emiratesIdFileName && c.emiratesIdUrl ? (
          <a
            href={c.emiratesIdUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
            title={c.emiratesIdFileName}
          >
            <FileText className="h-3.5 w-3.5" /> View
          </a>
        ) : (
          <Dash />
        ),
    },
    {
      key: "createdBy",
      header: "Created By",
      render: (c) => (
        <div>
          <p className="text-sm text-slate-700">{c.creator?.fullName ?? "—"}</p>
          <p className="text-xs text-slate-400">{formatDateTime(c.createdAt)}</p>
        </div>
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
          <button
            onClick={() => openView(c)}
            className="rounded p-1.5 text-slate-400 hover:text-blue-600"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <CanAccess module="bellaviu_client_data" page="all_bellaviu_clients" action="edit">
            <button
              onClick={() => openEdit(c)}
              className="rounded p-1.5 text-slate-400 hover:text-gray-900"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </CanAccess>
          <CanAccess module="bellaviu_client_data" page="all_bellaviu_clients" action="delete">
            <button
              onClick={() => setDeleteId(c.id)}
              className="rounded p-1.5 text-slate-400 hover:text-rose-600"
              title="Delete"
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
        title="Bellaviu Client Data"
        subtitle={data ? `${data.total} total records` : "Manage Bellaviu guest records"}
        actions={
          <CanAccess module="bellaviu_client_data" page="all_bellaviu_clients" action="create">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add Client
            </Button>
          </CanAccess>
        }
      />

      <Card className="p-4 space-y-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search across all fields…"
          className="max-w-md"
        />
        <BellaviuClientFiltersBar
          filters={filters}
          onChange={setFilter}
          onReset={resetFilters}
        />
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        loading={loading}
        error={error}
        onRetry={fetchList}
        emptyTitle="No Bellaviu clients found"
        emptyMessage="Try adjusting your filters or add a new client record."
        onRowClick={(c) => openView(c)}
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

      <BellaviuClientFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchList}
        record={editRecord}
      />

      <BellaviuClientViewModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        onEdit={() => viewRecord && openEdit(viewRecord)}
        onChanged={fetchList}
        record={viewRecord}
        setRecord={setViewRecord}
      />

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Bellaviu client?"
        message="This will permanently remove the record and its uploaded documents."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
