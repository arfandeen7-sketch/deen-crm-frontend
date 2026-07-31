"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X, Eye } from "lucide-react";
import {
  useMyRegularizations,
  useApplyRegularization,
  useCancelRegularization,
} from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Field, Input, Textarea, Select } from "@/components/ui/Input";
import {
  REGULARIZATION_STATUS_COLORS,
  REGULARIZATION_STATUS_LABELS,
  REGULARIZATION_REQUEST_TYPE_LABELS,
  ATTENDANCE_STATUS_COLORS,
  DEFAULT_PAGE_SIZE,
} from "@/constants";
import {
  regularizationApplySchema,
  type RegularizationApplyFormValues,
} from "@/schemas/attendance.schema";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { getErrorMessage } from "@/services/api/client";
import type { AttendanceRegularization } from "@/types";

const REQUEST_TYPE_OPTIONS = Object.entries(REGULARIZATION_REQUEST_TYPE_LABELS);
const STATUS_OPTIONS = Object.entries(REGULARIZATION_STATUS_LABELS);

function formatTime(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-AE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  });
}

export default function MyAttendanceCorrectionsPage() {
  return (
    <Suspense fallback={null}>
      <MyAttendanceCorrectionsContent />
    </Suspense>
  );
}

function MyAttendanceCorrectionsContent() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<AttendanceRegularization | null>(null);
  const [detailTarget, setDetailTarget] = useState<AttendanceRegularization | null>(null);
  const searchParams = useSearchParams();
  const preselectedDate = searchParams.get("date") ?? "";

  const { data, isLoading } = useMyRegularizations({
    page,
    pageSize,
    status: status || undefined,
  });
  const apply = useApplyRegularization();
  const cancelReq = useCancelRegularization();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RegularizationApplyFormValues>({
    resolver: zodResolver(regularizationApplySchema) as never,
    defaultValues: { date: preselectedDate, requestType: "other" },
  });

  const requestType = watch("requestType");

  const onSubmit = (values: RegularizationApplyFormValues) => {
    apply.mutate(values, {
      onSuccess: () => {
        toast.success("Correction request submitted");
        reset({ date: "", requestType: "other" });
        setModalOpen(false);
      },
      onError: (err: unknown) => toast.error(getErrorMessage(err)),
    });
  };

  function openApplyModal() {
    reset({ date: preselectedDate, requestType: "other" });
    setModalOpen(true);
  }

  function handleCancel() {
    if (!cancelTarget) return;
    cancelReq.mutate(cancelTarget.id, {
      onSuccess: () => {
        toast.success("Correction request cancelled");
        setCancelTarget(null);
      },
      onError: (err: unknown) => toast.error(getErrorMessage(err)),
    });
  }

  const columns: Column<AttendanceRegularization>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    {
      key: "requestType",
      header: "Type",
      render: (r) => REGULARIZATION_REQUEST_TYPE_LABELS[r.requestType] ?? r.requestType,
    },
    {
      key: "requested",
      header: "Requested",
      render: (r) => (
        <div className="text-xs text-foreground-secondary">
          {r.requestedStatus && (
            <div>
              Status:{" "}
              <Badge className={ATTENDANCE_STATUS_COLORS[r.requestedStatus]}>
                {r.requestedStatus.replace("_", " ")}
              </Badge>
            </div>
          )}
          {r.requestedCheckIn && <div>In: {formatTime(r.requestedCheckIn)}</div>}
          {r.requestedCheckOut && <div>Out: {formatTime(r.requestedCheckOut)}</div>}
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (r) => <span className="max-w-[220px] truncate block">{r.reason}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge className={REGULARIZATION_STATUS_COLORS[r.status]}>
          {REGULARIZATION_STATUS_LABELS[r.status]}
        </Badge>
      ),
    },
    {
      key: "reviewer",
      header: "Reviewer",
      render: (r) =>
        r.reviewer?.fullName ? (
          <div className="text-xs">
            <div>{r.reviewer.fullName}</div>
            {r.reviewNote && <div className="text-foreground-muted truncate max-w-[200px]">{r.reviewNote}</div>}
          </div>
        ) : (
          "—"
        ),
    },
    {
      key: "actions",
      header: "Actions",
      stickyRight: true,
      render: (r) => (
        <div className="flex gap-1">
          <button
            onClick={() => setDetailTarget(r)}
            className="rounded p-1 text-foreground-secondary hover:bg-panel"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {r.status === "pending" && (
            <button
              onClick={() => setCancelTarget(r)}
              disabled={cancelReq.isPending}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-300 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
              title="Cancel Request"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Attendance Corrections"
        subtitle="Raise a correction request for an incorrect attendance entry"
        actions={
          <Button onClick={openApplyModal} size="sm">
            <Plus className="h-4 w-4" /> Raise Correction
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-10 py-0 w-auto"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>

      <DataTable<AttendanceRegularization>
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(r) => r.id}
        loading={isLoading}
      />

      {data && (
        <Pagination
          page={data.page}
          pageSize={pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      )}

      {/* Apply Correction Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Raise Attendance Correction"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={apply.isPending}>
              Submit
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Date" required error={errors.date?.message}>
            <Input type="date" {...register("date")} invalid={!!errors.date} />
          </Field>

          <Field label="Correction Type" required error={errors.requestType?.message}>
            <Select {...register("requestType")} invalid={!!errors.requestType}>
              <option value="">Select type…</option>
              {REQUEST_TYPE_OPTIONS.map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Requested Status" error={errors.requestedStatus?.message} hint="Optional — what the status should be">
            <Select {...register("requestedStatus")}>
              <option value="">Leave unchanged</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
              <option value="absent">Absent</option>
              <option value="leave">Leave</option>
              <option value="weekend">Weekend</option>
              <option value="holiday">Holiday</option>
            </Select>
          </Field>

          {(requestType === "missed_check_in" ||
            requestType === "wrong_check_in_time" ||
            requestType === "wrong_working_hours") && (
            <Field label="Requested Check-In Time" error={errors.requestedCheckIn?.message}>
              <Input type="datetime-local" {...register("requestedCheckIn")} />
            </Field>
          )}

          {(requestType === "missed_check_out" ||
            requestType === "wrong_check_out_time" ||
            requestType === "wrong_working_hours") && (
            <Field label="Requested Check-Out Time" error={errors.requestedCheckOut?.message}>
              <Input type="datetime-local" {...register("requestedCheckOut")} />
            </Field>
          )}

          <Field label="Reason" required error={errors.reason?.message}>
            <Textarea
              {...register("reason")}
              rows={3}
              placeholder="Explain why this attendance entry is incorrect…"
            />
          </Field>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={!!detailTarget}
        onClose={() => setDetailTarget(null)}
        title="Correction Request Details"
        size="md"
        footer={<Button variant="outline" onClick={() => setDetailTarget(null)}>Close</Button>}
      >
        {detailTarget && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-foreground-muted">Date</p>
                <p className="font-medium">{formatDate(detailTarget.date)}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Type</p>
                <p className="font-medium">
                  {REGULARIZATION_REQUEST_TYPE_LABELS[detailTarget.requestType] ?? detailTarget.requestType}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Requested Status</p>
                <p className="font-medium">
                  {detailTarget.requestedStatus ? (
                    <Badge className={ATTENDANCE_STATUS_COLORS[detailTarget.requestedStatus]}>
                      {detailTarget.requestedStatus.replace("_", " ")}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Status</p>
                <p className="font-medium">
                  <Badge className={REGULARIZATION_STATUS_COLORS[detailTarget.status]}>
                    {REGULARIZATION_STATUS_LABELS[detailTarget.status]}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Requested Check-In</p>
                <p className="font-medium">{formatTime(detailTarget.requestedCheckIn)}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Requested Check-Out</p>
                <p className="font-medium">{formatTime(detailTarget.requestedCheckOut)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-foreground-muted">Reason</p>
              <p className="rounded-lg bg-panel p-3">{detailTarget.reason}</p>
            </div>
            {detailTarget.reviewNote && (
              <div>
                <p className="text-xs text-foreground-muted">Reviewer Note</p>
                <p className="rounded-lg bg-panel p-3">{detailTarget.reviewNote}</p>
              </div>
            )}
            {detailTarget.reviewer && (
              <p className="text-xs text-foreground-muted">
                Reviewed by {detailTarget.reviewer.fullName}
                {detailTarget.reviewedAt && ` on ${formatDate(detailTarget.reviewedAt)}`}
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel Confirm */}
      <ConfirmModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel Correction Request?"
        message="This pending correction request will be permanently cancelled."
        confirmLabel="Yes, Cancel"
        loading={cancelReq.isPending}
        danger
      />
    </div>
  );
}
