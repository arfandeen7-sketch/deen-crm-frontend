"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Input";
import { LeaveCalendar } from "@/components/calendar/LeaveCalendar";
import {
  useTeamCalendar,
  useHolidayMutations,
  useMyLeaveTypes,
  useApplyLeave,
} from "@/hooks/useHrms";
import { useAuth } from "@/hooks/useAuth";
import { leaveApplySchema, holidaySchema } from "@/schemas/leave.schema";
import type { LeaveApplyFormValues, HolidayFormValues } from "@/schemas/leave.schema";
import { toast } from "sonner";
import { getErrorMessage } from "@/services/api/client";
import type { Holiday } from "@/types";

export default function LeaveCalendarPage() {
  const nowParts = new Intl.DateTimeFormat("en-CA", {
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Dubai",
  }).formatToParts(new Date());
  const [year, setYear] = useState(Number(nowParts.find((p) => p.type === "year")?.value ?? new Date().getFullYear()));
  const [month, setMonth] = useState(Number(nowParts.find((p) => p.type === "month")?.value ?? new Date().getMonth() + 1));

  // Holiday management state
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState<HolidayFormValues>({
    name: "",
    date: "",
    isRecurring: false,
  });
  const [holidayErrors, setHolidayErrors] = useState<Record<string, string>>({});
  const [confirmRemove, setConfirmRemove] = useState<Holiday | null>(null);

  // Apply leave state
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  const { data, isLoading } = useTeamCalendar(year, month);
  const { create: createHoliday, remove: removeHoliday } = useHolidayMutations();
  const { data: leaveTypes } = useMyLeaveTypes();
  const applyLeave = useApplyLeave();
  const { canAction, role } = useAuth();

  const canManageHolidays =
    canAction("hrms", "leave_holidays", "create") ||
    canAction("hrms", "leave_holidays", "delete");

  // ── Apply Leave Form ───────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeaveApplyFormValues>({
    resolver: zodResolver(leaveApplySchema) as never,
    defaultValues: { isHalfDay: false },
  });

  const isHalfDay = watch("isHalfDay");
  const selectedTypeCode = watch("leaveTypeCode");
  const selectedType = leaveTypes?.find((t) => t.code === selectedTypeCode);

  // ── Holiday handlers ───────────────────────────────────────────────────────
  const handleAddHolidayClick = (date: string) => {
    setHolidayForm({ name: "", date, isRecurring: false });
    setHolidayErrors({});
    setHolidayModalOpen(true);
  };

  const handleHolidaySubmit = () => {
    const result = holidaySchema.safeParse(holidayForm);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      setHolidayErrors(fieldErrors);
      return;
    }
    createHoliday.mutate(
      { name: result.data.name, date: result.data.date, isRecurring: result.data.isRecurring },
      {
        onSuccess: () => {
          toast.success("Holiday added");
          setHolidayModalOpen(false);
        },
        onError: (err: unknown) => {
          toast.error(getErrorMessage(err));
        },
      },
    );
  };

  const confirmRemoveHoliday = () => {
    if (!confirmRemove) return;
    removeHoliday.mutate(confirmRemove.id, {
      onSuccess: () => {
        toast.success("Holiday removed");
        setConfirmRemove(null);
      },
      onError: (err: unknown) => {
        toast.error(getErrorMessage(err));
      },
    });
  };

  // ── Apply Leave handler ────────────────────────────────────────────────────
  const handleApplyLeaveClick = (date: string) => {
    reset({ dateFrom: date, dateTo: date, isHalfDay: false });
    setApplyModalOpen(true);
  };

  const onApplySubmit = (values: LeaveApplyFormValues) => {
    applyLeave.mutate(
      { body: { ...values } },
      {
        onSuccess: () => {
          toast.success("Leave application submitted");
          reset();
          setApplyModalOpen(false);
        },
        onError: (err: unknown) => {
          toast.error(getErrorMessage(err));
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Calendar"
        subtitle={
          role === "sales_executive" || role === "sales_manager"
            ? "Your leaves and public holidays at a glance"
            : "Team leaves and public holidays at a glance"
        }
      />

      <LeaveCalendar
        year={year}
        month={month}
        holidays={data?.holidays ?? []}
        leaves={data?.leaves ?? []}
        canManageHolidays={canManageHolidays}
        canApplyLeave
        onMonthChange={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
        onAddHoliday={canManageHolidays ? handleAddHolidayClick : undefined}
        onRemoveHoliday={canManageHolidays ? (h) => setConfirmRemove(h) : undefined}
        onApplyLeave={handleApplyLeaveClick}
        isLoading={isLoading}
      />

      {/* ── Add Holiday Modal ────────────────────────────────────────── */}
      <Modal
        open={holidayModalOpen}
        onClose={() => setHolidayModalOpen(false)}
        title="Add Public Holiday"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setHolidayModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleHolidaySubmit} loading={createHoliday.isPending}>
              Add Holiday
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Holiday Name" required error={holidayErrors.name}>
            <Input
              value={holidayForm.name}
              onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
              placeholder="e.g. UAE National Day"
              invalid={!!holidayErrors.name}
            />
          </Field>
          <Field label="Date" required error={holidayErrors.date}>
            <Input
              type="date"
              value={holidayForm.date}
              onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
              invalid={!!holidayErrors.date}
            />
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground-secondary">
            <input
              type="checkbox"
              checked={holidayForm.isRecurring}
              onChange={(e) =>
                setHolidayForm({ ...holidayForm, isRecurring: e.target.checked })
              }
              className="h-4 w-4 rounded border-border accent-accent"
            />
            Recurring (repeats every year)
          </label>
        </div>
      </Modal>

      {/* ── Confirm Remove Holiday ───────────────────────────────────── */}
      <ConfirmModal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={confirmRemoveHoliday}
        title="Remove Holiday?"
        message={`Remove "${confirmRemove?.name}" from the calendar? This action cannot be undone.`}
        confirmLabel="Remove"
        loading={removeHoliday.isPending}
        danger
      />

      {/* ── Apply Leave Modal ────────────────────────────────────────── */}
      <Modal
        open={applyModalOpen}
        onClose={() => {
          setApplyModalOpen(false);
          reset();
        }}
        title="Apply for Leave"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setApplyModalOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onApplySubmit)}
              loading={applyLeave.isPending}
            >
              Submit Application
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onApplySubmit)} className="space-y-4">
          <Field label="Leave Type" required error={errors.leaveTypeCode?.message}>
            <Select
              {...register("leaveTypeCode")}
              invalid={!!errors.leaveTypeCode}
            >
              <option value="">Select leave type…</option>
              {leaveTypes?.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name}
                  {t.balance ? ` (${t.balance.remaining} days remaining)` : ""}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" required error={errors.dateFrom?.message}>
              <Input
                type="date"
                {...register("dateFrom")}
                invalid={!!errors.dateFrom}
              />
            </Field>
            <Field
              label="End Date"
              required
              error={errors.dateTo?.message}
            >
              <Input
                type="date"
                {...register("dateTo")}
                invalid={!!errors.dateTo}
                disabled={!!isHalfDay}
              />
            </Field>
          </div>

          {selectedType?.halfDayAllowed && (
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground-secondary">
                <input
                  type="checkbox"
                  checked={Boolean(isHalfDay)}
                  onChange={(e) => setValue("isHalfDay", e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-accent"
                />
                Half Day
              </label>
              {isHalfDay && (
                <Select {...register("halfDayPeriod")} className="w-auto">
                  <option value="first_half">First Half</option>
                  <option value="second_half">Second Half</option>
                </Select>
              )}
            </div>
          )}

          <Field label="Reason" error={errors.reason?.message}>
            <textarea
              {...register("reason")}
              rows={3}
              placeholder="Optional reason for leave"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
