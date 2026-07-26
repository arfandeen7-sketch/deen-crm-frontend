"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Calendar as CalendarIcon, Repeat } from "lucide-react";
import { useHolidayList, useHolidayMutations, useTeamCalendar } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Input";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import { LeaveCalendar } from "@/components/calendar/LeaveCalendar";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getErrorMessage } from "@/services/api/client";
import { formatDate } from "@/lib/utils";
import type { Holiday } from "@/types";
import { holidaySchema } from "@/schemas/leave.schema";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function PublicHolidaysPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const { data, isLoading } = useHolidayList(year);
  const { data: calendarData, isLoading: calendarLoading } = useTeamCalendar(year, month);
  const { create, remove } = useHolidayMutations();
  const { canAction } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", date: "", isRecurring: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canManageHolidays =
    canAction("hrms", "leave_holidays", "create") ||
    canAction("hrms", "leave_holidays", "delete");

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear - 1; y <= currentYear + 2; y++) years.push(y);
    return years;
  }, [currentYear]);

  const holidaysByMonth = useMemo(() => {
    const grouped: Record<number, Holiday[]> = {};
    for (let m = 0; m < 12; m++) grouped[m] = [];
    for (const h of data ?? []) {
      const monthIdx = new Date(h.date).getUTCMonth();
      if (grouped[monthIdx]) grouped[monthIdx].push(h);
    }
    for (const m of Object.keys(grouped)) {
      grouped[Number(m)].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return grouped;
  }, [data]);

  function openCreate(prefilledDate?: string) {
    setForm({ name: "", date: prefilledDate ?? "", isRecurring: false });
    setErrors({});
    setModalOpen(true);
  }

  function handleSubmit() {
    const result = holidaySchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    create.mutate(
      { name: result.data.name, date: result.data.date, isRecurring: result.data.isRecurring },
      {
        onSuccess: () => {
          toast.success("Holiday added");
          setModalOpen(false);
        },
        onError: (err: unknown) => {
          toast.error(getErrorMessage(err));
        },
      },
    );
  }

  function handleDelete(id: string) {
    setConfirmId(id);
  }

  function handleCalendarMonthChange(y: number, m: number) {
    setYear(y);
    setMonth(m);
  }

  function confirmDelete() {
    if (!confirmId) return;
    remove.mutate(confirmId, {
      onSuccess: () => {
        toast.success("Holiday removed");
        setConfirmId(null);
      },
      onError: (err: unknown) => {
        toast.error(getErrorMessage(err));
      },
    });
  }

  const columns: Column<Holiday>[] = [
    { key: "name", header: "Holiday Name", render: (r) => <span className="font-medium text-foreground">{r.name}</span> },
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    { key: "day", header: "Day", render: (r) => new Date(r.date).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }) },
    {
      key: "isRecurring",
      header: "Recurring",
      render: (r) => (r.isRecurring ? <Badge className="bg-blue-100 text-blue-700"><Repeat className="mr-1 h-3 w-3" />Recurring</Badge> : <span className="text-foreground-muted">—</span>),
    },
    {
      key: "actions",
      header: "Actions",
      stickyRight: true,
      render: (r) =>
        canAction("hrms", "leave_holidays", "delete") ? (
          <button onClick={() => handleDelete(r.id)} className="rounded p-1 text-rose-500 hover:bg-rose-50" title="Remove Holiday">
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null,
    },
  ];

  return (
    <AccessGuard module="hrms" page="leave_holidays" action="view">
      <div className="space-y-6">
        <PageHeader
          title="Public Holidays"
          subtitle="Manage public holidays for leave calculation"
          actions={
            <div className="flex items-center gap-2">
              <Select value={String(year)} onChange={(e) => setYear(Number(e.target.value))} className="h-10 py-0 w-auto">
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </Select>
              <CanAccess module="hrms" page="leave_holidays" action="create">
                <Button onClick={() => openCreate()} size="sm">
                  <Plus className="h-4 w-4" />
                  Add Holiday
                </Button>
              </CanAccess>
            </div>
          }
        />

        {/* Interactive Calendar */}
        <LeaveCalendar
          year={year}
          month={month}
          holidays={calendarData?.holidays ?? data?.filter((h) => new Date(h.date).getUTCMonth() + 1 === month) ?? []}
          leaves={calendarData?.leaves ?? []}
          canManageHolidays={canManageHolidays}
          onMonthChange={handleCalendarMonthChange}
          onAddHoliday={(date) => openCreate(date)}
          onRemoveHoliday={(holiday) => handleDelete(holiday.id)}
          isLoading={calendarLoading}
        />

        {/* Calendar Grid View */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MONTHS.map((monthName, monthIdx) => {
            const holidays = holidaysByMonth[monthIdx] ?? [];
            return (
              <div key={monthIdx} className="rounded-lg border border-border bg-background p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-foreground-muted" />
                  <h3 className="text-sm font-semibold text-foreground">{monthName}</h3>
                  {holidays.length > 0 && (
                    <Badge className="bg-accent/10 text-accent">{holidays.length}</Badge>
                  )}
                </div>
                {holidays.length === 0 ? (
                  <p className="text-xs text-foreground-muted">No holidays</p>
                ) : (
                  <ul className="space-y-2">
                    {holidays.map((h) => (
                      <li key={h.id} className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex flex-col">
                          <span className="text-foreground-secondary">{h.name}</span>
                          <span className="text-xs text-foreground-muted">{formatDate(h.date)}</span>
                        </div>
                        {h.isRecurring && <Repeat className="h-3 w-3 text-blue-500" />}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* Table View */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">All Holidays — {year}</h2>
          <DataTable<Holiday>
            columns={columns}
            rows={data ?? []}
            rowKey={(r) => r.id}
            loading={isLoading}
            emptyTitle="No holidays configured"
            emptyMessage="Add public holidays for this year."
          />
        </div>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Add Public Holiday"
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} loading={create.isPending}>Add</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Holiday Name" required error={errors.name}>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. UAE National Day" invalid={!!errors.name} />
            </Field>
            <Field label="Date" required error={errors.date}>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} invalid={!!errors.date} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-foreground-secondary">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                className="h-4 w-4 rounded border-border accent-accent"
              />
              Recurring (repeats every year)
            </label>
          </div>
        </Modal>

        <ConfirmModal
          open={!!confirmId}
          onClose={() => setConfirmId(null)}
          onConfirm={confirmDelete}
          title="Remove Holiday?"
          message="This holiday will be removed from the calendar. This action cannot be undone."
          confirmLabel="Remove"
          loading={remove.isPending}
          danger
        />
      </div>
    </AccessGuard>
  );
}
