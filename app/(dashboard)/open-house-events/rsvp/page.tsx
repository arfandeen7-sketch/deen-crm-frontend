"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api/client";
import { openHouseRsvpsService, type OpenHouseRsvpQueryParams } from "@/services/openHouse/openHouse.service";
import { useInvalidateOpenHouse, useOpenHouseEventOptions, useOpenHouseRsvpsList } from "@/hooks/useOpenHouse";
import { displayValue, formatDateTime } from "@/lib/utils";
import {
  OPEN_HOUSE_MODULE as MODULE,
  OPEN_HOUSE_RSVP_PAGE as PAGE,
  RSVP_ARRIVAL_SLOTS,
  RSVP_BUDGET_OPTIONS,
  RSVP_INTEREST_OPTIONS,
  labelFor,
} from "@/constants/openHouse";
import type { OpenHouseRsvp } from "@/types";
import { RsvpFormModal } from "@/components/openHouse/RsvpFormModal";
import { RsvpViewModal } from "@/components/openHouse/RsvpViewModal";
import { RsvpFiltersBar, type RsvpFilters } from "@/components/openHouse/RsvpFiltersBar";
import { OpenHouseTabs, RsvpStatusBadge } from "@/components/openHouse/OpenHouseShared";

type SortKey = NonNullable<OpenHouseRsvpQueryParams["sortBy"]>;

export default function OpenHouseRsvpPage() {
  return (
    <AccessGuard module={MODULE} page={PAGE} action="view">
      <Suspense fallback={null}>
        <OpenHouseRsvpPageContent />
      </Suspense>
    </AccessGuard>
  );
}

function OpenHouseRsvpPageContent() {
  const { user, isMaster } = useAuth();
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId") ?? undefined;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<RsvpFilters>({ eventId: eventIdParam });
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "createdAt",
    direction: "desc",
  });

  const [prevEventIdParam, setPrevEventIdParam] = useState(eventIdParam);
  if (eventIdParam !== prevEventIdParam) {
    setPrevEventIdParam(eventIdParam);
    setFilters((f) => ({ ...f, eventId: eventIdParam }));
    setPage(1);
  }

  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<OpenHouseRsvp | null>(null);
  const [viewRecord, setViewRecord] = useState<OpenHouseRsvp | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<OpenHouseRsvp | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading, isError, refetch } = useOpenHouseRsvpsList({
    page,
    pageSize,
    search: search || undefined,
    sortBy: sort.key,
    sortDir: sort.direction,
    ...filters,
  });
  const eventsQuery = useOpenHouseEventOptions();
  const events = eventsQuery.data ?? [];
  const invalidate = useInvalidateOpenHouse();

  function setFilter<K extends keyof RsvpFilters>(key: K, value: RsvpFilters[K] | undefined) {
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
    eventsQuery.refetch();
  }
  function openEdit(record: OpenHouseRsvp) {
    setViewRecord(null);
    setEditRecord(record);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteRecord) return;
    setDeleting(true);
    try {
      await openHouseRsvpsService.remove(deleteRecord.id);
      toast.success("RSVP deleted");
      setDeleteRecord(null);
      if (data && data.data.length === 1 && page > 1) setPage(page - 1);
      invalidate();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  const selectedEvent = filters.eventId ? events.find((e) => e.id === filters.eventId) : undefined;
  const rows = (data?.data ?? []).filter((row) => isMaster || row.createdBy === user?.id);
  const subtitle = !data
    ? "Guest responses for open house events"
    : isMaster
      ? `${data.total} RSVP${data.total === 1 ? "" : "s"}${selectedEvent ? ` for ${selectedEvent.eventName}` : " across all events"}`
      : `${data.total} RSVP${data.total === 1 ? "" : "s"} you added${selectedEvent ? ` for ${selectedEvent.eventName}` : ""}`;

  const columns: Column<OpenHouseRsvp>[] = [
    {
      key: "guestName",
      header: "Guest Name",
      sortKey: "guestName",
      render: (r) => <span className="font-medium text-slate-900">{r.guestName}</span>,
    },
    {
      key: "mobile",
      header: "Mobile",
      render: (r) => <span className="text-sm text-slate-700">{r.mobile}</span>,
    },
    {
      key: "eventName",
      header: "Event Name",
      sortKey: "eventName",
      render: (r) => (
        <div className="max-w-[220px]">
          <p className="truncate text-sm text-slate-700">{r.event?.eventName ?? "—"}</p>
          {r.event?.developerName && <p className="truncate text-xs text-slate-400">{r.event.developerName}</p>}
        </div>
      ),
    },
    {
      key: "peopleComingWith",
      header: "People Coming With",
      sortKey: "peopleComingWith",
      render: (r) => <span className="text-sm text-slate-700">{r.peopleComingWith}</span>,
    },
    {
      key: "expectedArrival",
      header: "Expected Arrival",
      sortKey: "expectedArrival",
      render: (r) => <span className="text-sm text-slate-700">{labelFor(RSVP_ARRIVAL_SLOTS, r.expectedArrival)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortKey: "status",
      render: (r) => <RsvpStatusBadge status={r.status} />,
    },
    {
      key: "interestedIn",
      header: "Interested In",
      render: (r) => <span className="text-sm text-slate-700">{labelFor(RSVP_INTEREST_OPTIONS, r.interestedIn)}</span>,
    },
    {
      key: "budget",
      header: "Budget",
      render: (r) => <span className="whitespace-nowrap text-sm text-slate-700">{labelFor(RSVP_BUDGET_OPTIONS, r.budget)}</span>,
    },
    {
      key: "createdAt",
      header: "Created By",
      sortKey: "createdAt",
      render: (r) => (
        <div>
          <p className="text-sm text-slate-700">{r.creator?.fullName ?? "—"}</p>
          <p className="text-xs text-slate-400">{formatDateTime(r.createdAt)}</p>
        </div>
      ),
    },
    {
      key: "notes",
      header: "Notes",
      render: (r) => <span className="block max-w-[180px] truncate text-sm text-slate-700">{displayValue(r.notes)}</span>,
    },
    {
      key: "actions",
      header: "",
      stickyRight: true,
      headerClassName: "text-right",
      className: "text-right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
          <button onClick={() => setViewRecord(r)} className="rounded p-1.5 text-slate-400 hover:text-blue-600" title="View" aria-label="View RSVP">
            <Eye className="h-4 w-4" />
          </button>
          <CanAccess module={MODULE} page={PAGE} action="edit">
            <button onClick={() => openEdit(r)} className="rounded p-1.5 text-slate-400 hover:text-gray-900" title="Edit" aria-label="Edit RSVP">
              <Pencil className="h-4 w-4" />
            </button>
          </CanAccess>
          <CanAccess module={MODULE} page={PAGE} action="delete">
            <button onClick={() => setDeleteRecord(r)} className="rounded p-1.5 text-slate-400 hover:text-rose-600" title="Delete" aria-label="Delete RSVP">
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
        title="RSVP"
        subtitle={subtitle}
        actions={
          <CanAccess module={MODULE} page={PAGE} action="create">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add RSVP
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
          placeholder="Search guest, mobile, notes, event…"
          className="max-w-md"
        />
        <RsvpFiltersBar
          filters={filters}
          events={events}
          onChange={setFilter}
          onReset={() => {
            setFilters({});
            setPage(1);
          }}
        />
      </Card>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={isLoading}
        error={isError}
        onRetry={() => refetch()}
        emptyTitle="No RSVPs found"
        emptyMessage={
          isMaster
            ? "Try adjusting your filters or add a guest response."
            : "You only see RSVPs you created. Add one, or adjust your filters."
        }
        onRowClick={(r) => setViewRecord(r)}
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
        <RsvpFormModal
          key={editRecord?.id ?? "new"}
          open
          onClose={() => setFormOpen(false)}
          onSaved={invalidate}
          record={editRecord}
          events={events}
          eventsLoading={eventsQuery.isLoading}
          defaultEventId={filters.eventId}
        />
      )}

      <RsvpViewModal
        open={!!viewRecord}
        onClose={() => setViewRecord(null)}
        onEdit={() => viewRecord && openEdit(viewRecord)}
        record={viewRecord}
      />

      <ConfirmModal
        open={!!deleteRecord}
        onClose={() => setDeleteRecord(null)}
        onConfirm={handleDelete}
        title="Delete RSVP?"
        message={`“${deleteRecord?.guestName}” will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
