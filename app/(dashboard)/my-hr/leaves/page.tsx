"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X, Paperclip, Clock } from "lucide-react";
import { useMyLeaves, useLeaveBalance, useApplyLeave, useCancelLeave, useMyLeaveTypes } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Field, Input, Textarea, Select } from "@/components/ui/Input";
import { LEAVE_STATUS_COLORS, DEFAULT_PAGE_SIZE } from "@/constants";
import { leaveApplySchema, type LeaveApplyFormValues } from "@/schemas/leave.schema";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { LeaveRequest } from "@/types";

export default function MyLeavesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useMyLeaves({ page, pageSize });
  const { data: balance } = useLeaveBalance();
  const { data: leaveTypes } = useMyLeaveTypes();
  const apply = useApplyLeave();
  const cancelLeave = useCancelLeave();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<LeaveApplyFormValues>({
    resolver: zodResolver(leaveApplySchema) as never,
  });

  const isHalfDay = watch("isHalfDay");
  const selectedTypeCode = watch("leaveTypeCode");
  const selectedType = leaveTypes?.find((t) => t.code === selectedTypeCode);

  const onSubmit = (values: LeaveApplyFormValues) => {
    apply.mutate(
      { body: values, file: selectedFile ?? undefined },
      {
        onSuccess: () => {
          toast.success("Leave application submitted");
          reset();
          setSelectedFile(null);
          setModalOpen(false);
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Failed to submit leave";
          toast.error(msg);
        },
      },
    );
  };

  function openApplyModal() {
    reset();
    setSelectedFile(null);
    setModalOpen(true);
  }

  function handleCancel() {
    if (!cancelTarget) return;
    cancelLeave.mutate(
      { id: cancelTarget.id },
      {
        onSuccess: () => {
          toast.success("Leave request cancelled");
          setCancelTarget(null);
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : "Failed to cancel leave";
          toast.error(msg);
        },
      },
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large. Maximum 10 MB.");
        return;
      }
      setSelectedFile(file);
    }
  }

  const columns: Column<LeaveRequest>[] = [
    {
      key: "leaveType",
      header: "Type",
      render: (r) => r.leaveTypeConfig?.name ?? r.leaveType.replace("_", " "),
    },
    { key: "dateFrom", header: "From", render: (r) => formatDate(r.dateFrom) },
    { key: "dateTo", header: "To", render: (r) => formatDate(r.dateTo) },
    {
      key: "totalDays",
      header: "Days",
      render: (r) => (r.isHalfDay ? `${r.totalDays} (Half Day)` : String(r.totalDays)),
    },
    { key: "reason", header: "Reason", render: (r) => <span className="max-w-[200px] truncate block">{r.reason ?? "—"}</span> },
    {
      key: "attachment",
      header: "Attachment",
      render: (r) => (r.attachmentUrl ? <Paperclip className="h-4 w-4 text-foreground-muted" /> : "—"),
    },
    { key: "status", header: "Status", render: (r) => <Badge className={LEAVE_STATUS_COLORS[r.status]}>{r.status}</Badge> },
    {
      key: "actions",
      header: "Actions",
      stickyRight: true,
      render: (r) =>
        r.status === "pending" || r.status === "approved" ? (
          <button
            onClick={() => setCancelTarget(r)}
            disabled={cancelLeave.isPending}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
          >
            <X className="h-3 w-3" /> Cancel
          </button>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Leaves"
        subtitle="Apply for leave and view history"
        actions={
          <Button onClick={openApplyModal} size="sm">
            <Plus className="h-4 w-4" /> Apply Leave
          </Button>
        }
      />

      {/* Leave Balance Cards */}
      {balance && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {balance.balances.map((b) => (
            <div key={b.leaveTypeCode} className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">{b.leaveTypeName}</p>
                {b.carryForward > 0 && (
                  <Badge className="bg-blue-50 text-blue-600">+{b.carryForward} CF</Badge>
                )}
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{b.remaining}</p>
              <p className="mt-1 text-xs text-foreground-muted">
                {b.allocated + b.carryForward + b.adjustment} allocated · {b.used} used
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{
                    width: `${Math.min(100, b.allocated + b.carryForward + b.adjustment > 0 ? (b.used / (b.allocated + b.carryForward + b.adjustment)) * 100 : 0)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <DataTable<LeaveRequest>
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(r) => r.id}
        loading={isLoading}
      />

      {data && (
        <Pagination page={data.page} pageSize={pageSize} total={data.total} totalPages={data.totalPages} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      )}

      {/* Apply Leave Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Apply for Leave"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} loading={apply.isPending}>Submit</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Leave Type" required error={errors.leaveTypeCode?.message}>
            <Select {...register("leaveTypeCode")} invalid={!!errors.leaveTypeCode}>
              <option value="">Select leave type…</option>
              {leaveTypes?.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name} ({t.balance?.remaining ?? 0} days remaining)
                </option>
              ))}
            </Select>
          </Field>

          {selectedType?.description && (
            <p className="rounded-lg bg-panel px-3 py-2 text-xs text-foreground-muted">{selectedType.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" required error={errors.dateFrom?.message}>
              <Input type="date" {...register("dateFrom")} invalid={!!errors.dateFrom} />
            </Field>
            <Field label="End Date" required error={errors.dateTo?.message}>
              <Input type="date" {...register("dateTo")} invalid={!!errors.dateTo} disabled={isHalfDay} />
            </Field>
          </div>

          {selectedType?.halfDayAllowed && (
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground-secondary">
                <input
                  type="checkbox"
                  checked={Boolean(isHalfDay)}
                  onChange={(e) => setValue("isHalfDay", e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-accent"
                />
                <Clock className="h-4 w-4" /> Half Day
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
            <Textarea {...register("reason")} rows={3} placeholder="Optional reason for your leave request" />
          </Field>

          {(selectedType?.requiresMedicalCertificate || selectedType?.requiresAttachment) && (
            <Field
              label={selectedType.requiresMedicalCertificate ? "Medical Certificate" : "Attachment"}
              required={selectedType.requiresMedicalCertificate || selectedType.requiresAttachment}
              hint="Accepted: JPG, PNG, WebP, PDF, DOCX (max 10 MB)"
            >
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                  {selectedFile ? "Change File" : "Choose File"}
                </Button>
                {selectedFile && (
                  <span className="text-sm text-foreground-secondary">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                )}
              </div>
            </Field>
          )}
        </form>
      </Modal>

      <ConfirmModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel Leave Request?"
        message={
          cancelTarget?.status === "approved"
            ? "This leave has already been approved. Cancelling will restore your leave balance. Continue?"
            : "Are you sure you want to cancel this leave request?"
        }
        confirmLabel="Yes, Cancel"
        loading={cancelLeave.isPending}
        danger
      />
    </div>
  );
}
