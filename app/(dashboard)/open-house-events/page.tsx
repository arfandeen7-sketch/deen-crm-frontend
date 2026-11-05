"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import { usePermissions } from "@/contexts/PermissionContext";
import { getErrorMessage } from "@/services/api/client";
import {
  openHouseEventsService,
  type OpenHouseEventQueryParams,
} from "@/services/openHouse/openHouse.service";
import { useInvalidateOpenHouse, useOpenHouseEventsList } from "@/hooks/useOpenHouse";
import { displayValue, formatDateTime } from "@/lib/utils";
import {
  OPEN_HOUSE_EVENTS_PAGE as PAGE,
  OPEN_HOUSE_LEADS_PAGE,
  OPEN_HOUSE_MODULE as MODULE,
} from "@/constants/openHouse";
import type { OpenHouseEvent } from "@/types";
import { EventFormModal } from "@/components/openHouse/EventFormModal";
import { EventViewModal } from "@/components/openHouse/EventViewModal";
import { EventFiltersBar, type EventFilters } from "@/components/openHouse/EventFiltersBar";
import { EventStatusBadge, OpenHouseTabs, formatEventWhen } from "@/components/openHouse/OpenHouseShared";

type SortKey = NonNullable<OpenHouseEventQueryParams["sortBy"]>;

export default function OpenHouseEventsPage() {
  return (
    <AccessGuard module={MODULE} page={PAGE} action="view">
      <OpenHouseEventsPageContent />
    </AccessGuard>
  );
}

function OpenHouseEventsPageContent() {
  const { canAction } = usePermissions();
  const canViewLeads = canAction(MODULE, OPEN_HOUSE_LEADS_PAGE, "view");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<EventFilters>({});
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "eventDate",
    direction: "desc",
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<OpenHouseEvent | null>(null);
  const [viewRecord, setViewRecord] = useState<OpenHouseEvent | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<OpenHouseEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading, isError, refetch } = useOpenHouseEventsList({
    page,
    pageSize,
    search: search || undefined,
    sortBy: sort.key,
    sortDir: sort.direction,
    ...filters,
  });
  const invalidate = useInvalidateOpenHouse();

  function setFilter<K extends keyof EventFilters>(key: K, value: EventFilters[K] | undefined) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  function onSort(key: string) {
    setSort((s) => ({
      key: key as SortKey,
      direction: s.key === key && s.direction === "desc" ? "asc" : "desc",
    }));
    setPage(1);
  }

  function openCreate() {
    setEditRecord(null);
    setFormOpen(true);
  }
  function openEdit(record: OpenHouseEvent) {
    setViewRecord(null);
    setEditRecord(record);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteRecord) return;
    setDeleting(true);
    try {
      await openHouseEventsService.remove(deleteRecord.id);
      toast.success("Event deleted");
      setDeleteRecord(null);
      if (data && data.data.length === 1 && page > 1) setPage(page - 1);
      invalidate();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  function requestDelete(record: OpenHouseEvent) {
    const n = record._count?.leads ?? 0;
    if (n > 0) {
      toast.error(
        `“${record.eventName}” has ${n} lead${n === 1 ? "" : "s"}. Delete or move them to another event first.`,
      );
      return;
    }
    setDeleteRecord(record);
  }

  const columns: Column<OpenHouseEvent>[] = [
    {
      key: "eventName",
      header: "Event",
      sortKey: "eventName",
      render: (e) => (
        <div className="max-w-[260px]">
          <p className="truncate font-medium text-slate-900">{e.eventName}</p>
          {e.projectName && <p className="truncate text-xs text-slate-400">{e.projectName}</p>}
        </div>
      ),
    },
    {
      key: "eventDate",
      header: "Date",
      sortKey: "eventDate",
      render: (e) => <span className="text-sm text-slate-700">{formatEventWhen(e.eventDate, e.startTime, e.endTime)}</span>,
    },
    {
      key: "developerName",
      header: "Developer",
      sortKey: "developerName",
      render: (e) => <span className="text-sm text-slate-700">{displayValue(e.developerName)}</span>,
    },
    {
      key: "location",
      header: "Location",
      sortKey: "location",
      render: (e) => <span className="text-sm text-slate-700">{displayValue(e.location)}</span>,
    },
    {
      key: "venueName",
      header: "Hotel / Venue",
      render: (e) => <span className="text-sm text-slate-700">{displayValue(e.venueName)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortKey: "status",
      render: (e) => <EventStatusBadge status={e.status} />,
    },
    {
      key: "leads",
      header: "Leads",
      render: (e) => {
        const n = e._count?.leads ?? 0;
        return canViewLeads ? (
          <Link
            href={`/open-house-events/leads?eventId=${e.id}`}
            onClick={(ev) => ev.stopPropagation()}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            {n}
          </Link>
        ) : (
          <span className="text-sm text-slate-700">{n}</span>
        );
      },
    },
    {
      key: "createdAt",
      header: "Created By",
      sortKey: "createdAt",
      render: (e) => (
        <div>
          <p className="text-sm text-slate-700">{e.creator?.fullName ?? "—"}</p>
          <p className="text-xs text-slate-400">{formatDateTime(e.createdAt)}</p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      stickyRight: true,
      headerClassName: "text-right",
      className: "text-right",
      render: (e) => (
        <div className="flex items-center justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
          <button onClick={() => setViewRecord(e)} className="rounded p-1.5 text-slate-400 hover:text-blue-600" title="View" aria-label="View event">
            <Eye className="h-4 w-4" />
          </button>
          <CanAccess module={MODULE} page={PAGE} action="edit">
            <button onClick={() => openEdit(e)} className="rounded p-1.5 text-slate-400 hover:text-gray-900" title="Edit" aria-label="Edit event">
              <Pencil className="h-4 w-4" />
            </button>
          </CanAccess>
          <CanAccess module={MODULE} page={PAGE} action="delete">
            <button onClick={() => requestDelete(e)} className="rounded p-1.5 text-slate-400 hover:text-rose-600" title="Delete" aria-label="Delete event">
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
        title="Open House Events"
        subtitle={data ? `${data.total} total events` : "Manage developer open house events"}
        actions={
          <CanAccess module={MODULE} page={PAGE} action="create">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Create Event
            </Button>
          </CanAccess>
        }
      />

      <OpenHouseTabs />

      <Card className="space-y-3 p-4">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search event, developer, venue, project…"
          className="max-w-md"
        />
        <EventFiltersBar
          filters={filters}
          onChange={setFilter}
          onReset={() => {
            setFilters({});
            setPage(1);
          }}
        />
      </Card>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(e) => e.id}
        loading={isLoading}
        error={isError}
        onRetry={() => refetch()}
        emptyTitle="No open house events found"
        emptyMessage="Try adjusting your filters or create a new event."
        onRowClick={(e) => setViewRecord(e)}
        sort={sort}
        onSort={onSort}
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

      {formOpen && (
        <EventFormModal
          key={editRecord?.id ?? "new"}
          open
          onClose={() => setFormOpen(false)}
          onSaved={invalidate}
          record={editRecord}
        />
      )}

      <EventViewModal
        open={!!viewRecord}
        onClose={() => setViewRecord(null)}
        onEdit={() => viewRecord && openEdit(viewRecord)}
        record={viewRecord}
      />

      <ConfirmModal
        open={!!deleteRecord}
        onClose={() => setDeleteRecord(null)}
        onConfirm={handleDelete}
        title="Delete event?"
        message={`“${deleteRecord?.eventName}” will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
