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
import {
  openHouseEventLeadsService,
  type OpenHouseEventLeadQueryParams,
} from "@/services/openHouse/openHouse.service";
import {
  useInvalidateOpenHouse,
  useOpenHouseEventOptions,
  useOpenHouseLeadsList,
} from "@/hooks/useOpenHouse";
import { displayValue, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import {
  OPEN_HOUSE_LEADS_PAGE as PAGE,
  OPEN_HOUSE_MODULE as MODULE,
} from "@/constants/openHouse";
import type { OpenHouseEventLead } from "@/types";
import { EventLeadFormModal } from "@/components/openHouse/EventLeadFormModal";
import { EventLeadViewModal } from "@/components/openHouse/EventLeadViewModal";
import { EventLeadFiltersBar, type EventLeadFilters } from "@/components/openHouse/EventLeadFiltersBar";
import { InterestBadge, OpenHouseTabs } from "@/components/openHouse/OpenHouseShared";

type SortKey = NonNullable<OpenHouseEventLeadQueryParams["sortBy"]>;

export default function OpenHouseEventLeadsPage() {
  return (
    <AccessGuard module={MODULE} page={PAGE} action="view">
      <Suspense fallback={null}>
        <OpenHouseEventLeadsPageContent />
      </Suspense>
    </AccessGuard>
  );
}

function OpenHouseEventLeadsPageContent() {
  const { user, isMaster } = useAuth();
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get("eventId") ?? undefined;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<EventLeadFilters>({ eventId: eventIdParam });
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "createdAt",
    direction: "desc",
  });

  // Follow `?eventId=` when arriving from an event's lead count while already on this page.
  const [prevEventIdParam, setPrevEventIdParam] = useState(eventIdParam);
  if (eventIdParam !== prevEventIdParam) {
    setPrevEventIdParam(eventIdParam);
    setFilters((f) => ({ ...f, eventId: eventIdParam }));
    setPage(1);
  }

  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<OpenHouseEventLead | null>(null);
  const [viewRecord, setViewRecord] = useState<OpenHouseEventLead | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<OpenHouseEventLead | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data, isLoading, isError, refetch } = useOpenHouseLeadsList({
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

  function setFilter<K extends keyof EventLeadFilters>(key: K, value: EventLeadFilters[K] | undefined) {
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
  function openEdit(record: OpenHouseEventLead) {
    setViewRecord(null);
    setEditRecord(record);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteRecord) return;
    setDeleting(true);
    try {
      await openHouseEventLeadsService.remove(deleteRecord.id);
      toast.success("Event lead deleted");
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
  // The API already scopes this. Filtering here too means a response that
  // ignored the rule still cannot render someone else's lead.
  const rows = (data?.data ?? []).filter((lead) => isMaster || lead.createdBy === user?.id);
  const subtitle = !data
    ? "Leads collected at open house events"
    : isMaster
      ? `${data.total} lead${data.total === 1 ? "" : "s"}${selectedEvent ? ` from ${selectedEvent.eventName}` : " across all events"}`
      : `${data.total} lead${data.total === 1 ? "" : "s"} you added${selectedEvent ? ` at ${selectedEvent.eventName}` : ""}`;

  const columns: Column<OpenHouseEventLead>[] = [
    {
      key: "clientName",
      header: "Client",
      sortKey: "clientName",
      render: (l) => (
        <div className="max-w-[220px]">
          <p className="truncate font-medium text-slate-900">{l.clientName}</p>
          {l.email && <p className="truncate text-xs text-slate-400">{l.email}</p>}
        </div>
      ),
    },
    {
      key: "mobileNumber",
      header: "Mobile",
      render: (l) => (
        <div>
          <p className="text-sm text-slate-700">{l.mobileNumber}</p>
          {l.alternativeMobile && <p className="text-xs text-slate-400">{l.alternativeMobile}</p>}
        </div>
      ),
    },
    {
      key: "eventName",
      header: "Event",
      sortKey: "eventName",
      render: (l) => (
        <div className="max-w-[220px]">
          <p className="truncate text-sm text-slate-700">{l.event?.eventName ?? "—"}</p>
          {l.event && <p className="text-xs text-slate-400">{formatDate(l.event.eventDate)}</p>}
        </div>
      ),
    },
    {
      key: "nationality",
      header: "Nationality",
      sortKey: "nationality",
      render: (l) => <span className="text-sm text-slate-700">{displayValue(l.nationality)}</span>,
    },
    {
      key: "budget",
      header: "Budget",
      sortKey: "budget",
      render: (l) => <span className="text-sm text-slate-700">{formatCurrency(l.budget)}</span>,
    },
    {
      key: "interestedProject",
      header: "Interested Project",
      render: (l) => <span className="text-sm text-slate-700">{displayValue(l.interestedProject)}</span>,
    },
    {
      key: "propertyType",
      header: "Property Type",
      render: (l) => (
        <span className="text-sm text-slate-700">
          {displayValue([l.propertyType, l.bedrooms].filter(Boolean).join(" · "))}
        </span>
      ),
    },
    {
      key: "interestLevel",
      header: "Interest",
      render: (l) => <InterestBadge level={l.interestLevel} />,
    },
    {
      key: "createdAt",
      header: "Added By",
      sortKey: "createdAt",
      render: (l) => (
        <div>
          <p className="text-sm text-slate-700">{l.creator?.fullName ?? "—"}</p>
          <p className="text-xs text-slate-400">{formatDateTime(l.createdAt)}</p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      stickyRight: true,
      headerClassName: "text-right",
      className: "text-right",
      render: (l) => (
        <div className="flex items-center justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
          <button onClick={() => setViewRecord(l)} className="rounded p-1.5 text-slate-400 hover:text-blue-600" title="View" aria-label="View lead">
            <Eye className="h-4 w-4" />
          </button>
          <CanAccess module={MODULE} page={PAGE} action="edit">
            <button onClick={() => openEdit(l)} className="rounded p-1.5 text-slate-400 hover:text-gray-900" title="Edit" aria-label="Edit lead">
              <Pencil className="h-4 w-4" />
            </button>
          </CanAccess>
          <CanAccess module={MODULE} page={PAGE} action="delete">
            <button onClick={() => setDeleteRecord(l)} className="rounded p-1.5 text-slate-400 hover:text-rose-600" title="Delete" aria-label="Delete lead">
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
        title="Event Leads"
        subtitle={subtitle}
        actions={
          <CanAccess module={MODULE} page={PAGE} action="create">
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add Event Lead
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
          placeholder="Search name, mobile, email, project, event…"
          className="max-w-md"
        />
        <EventLeadFiltersBar
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
        rowKey={(l) => l.id}
        loading={isLoading}
        error={isError}
        onRetry={() => refetch()}
        emptyTitle="No event leads found"
        emptyMessage={
          isMaster
            ? "Try adjusting your filters or add a lead collected at an event."
            : "You only see leads you created. Add one from an event, or adjust your filters."
        }
        onRowClick={(l) => setViewRecord(l)}
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
        <EventLeadFormModal
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

      <EventLeadViewModal
        open={!!viewRecord}
        onClose={() => setViewRecord(null)}
        onEdit={() => viewRecord && openEdit(viewRecord)}
        record={viewRecord}
      />

      <ConfirmModal
        open={!!deleteRecord}
        onClose={() => setDeleteRecord(null)}
        onConfirm={handleDelete}
        title="Delete event lead?"
        message={`“${deleteRecord?.clientName}” will be permanently removed from this event. This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
