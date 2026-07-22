"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, Eye, X, Paperclip } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { AccessGuard } from "@/components/shared/Guards";
import { StatusBadge, REG_STATUS_COLORS } from "@/components/attendance-correction/StatusBadge";
import { RequestTypeBadge } from "@/components/attendance-correction/RequestTypeBadge";
import { RequestTypeSelect } from "@/components/attendance-correction/RequestTypeSelect";
import { AttachmentUpload } from "@/components/attendance-correction/AttachmentUpload";
import { AttachmentDownload } from "@/components/attendance-correction/AttachmentDownload";
import { AttendanceComparison } from "@/components/attendance-correction/AttendanceComparison";
import { ReviewActions } from "@/components/attendance-correction/ReviewActions";
import { CorrectionTimeline } from "@/components/attendance-correction/CorrectionTimeline";
import { useRegularizationList, useApplyRegularizationWithAttachment, useReviewRegularization, useEmployeeList, type RegularizationApplyFormData } from "@/hooks/useHrms";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api/client";
import { formatDate } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import type { AttendanceRegularization, RequestType } from "@/types";

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" });
}

function RequestModal({
  open, onClose, prefill,
}: {
  open: boolean;
  onClose: () => void;
  prefill?: { date?: string; attendanceId?: string; currentStatus?: string };
}) {
  const apply = useApplyRegularizationWithAttachment();
  const [date, setDate] = useState(prefill?.date ?? "");
  const [requestType, setRequestType] = useState<RequestType>("missed_check_in");
  const [requestedCheckIn, setRequestedCheckIn] = useState("");
  const [requestedCheckOut, setRequestedCheckOut] = useState("");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      setDate(prefill?.date ?? "");
      setRequestType("missed_check_in");
      setRequestedCheckIn("");
      setRequestedCheckOut("");
      setReason("");
      setAttachment(null);
    }
  }, [open, prefill?.date]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 10) { toast.error("Reason must be at least 10 characters"); return; }
    if (date > new Date().toISOString().split("T")[0]) { toast.error("Date cannot be in the future"); return; }
    try {
      const payload: RegularizationApplyFormData = {
        date,
        requestType,
        attendanceId: prefill?.attendanceId || undefined,
        currentStatus: prefill?.currentStatus || undefined,
        requestedCheckIn: requestedCheckIn ? new Date(`${date}T${requestedCheckIn}`).toISOString() : undefined,
        requestedCheckOut: requestedCheckOut ? new Date(`${date}T${requestedCheckOut}`).toISOString() : undefined,
        reason,
        attachment: attachment ?? undefined,
      };
      await apply.mutateAsync(payload);
      toast.success("Correction request submitted");
      onClose();
    } catch (e) {
      const msg = getErrorMessage(e);
      if (msg.includes("409") || msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("pending")) {
        toast.error("A pending request already exists for this date");
      } else {
        toast.error(msg);
      }
    }
  }

  const hintMap: Partial<Record<RequestType, string>> = {
    missed_check_in: "Provide the correct check-in time",
    missed_check_out: "Provide the correct check-out time",
    wrong_check_in_time: "Provide the correct check-in time",
    wrong_check_out_time: "Provide the correct check-out time",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-slate-900">Request Attendance Correction</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]} required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Status</label>
              <input type="text" value={prefill?.currentStatus?.replace("_", " ") ?? "—"} readOnly
                className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Request Type *</label>
            <RequestTypeSelect value={requestType} onChange={setRequestType} />
            {hintMap[requestType] && <p className="mt-1 text-xs text-slate-400">{hintMap[requestType]}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Corrected Check-in</label>
              <input type="time" value={requestedCheckIn} onChange={(e) => setRequestedCheckIn(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Corrected Check-out</label>
              <input type="time" value={requestedCheckOut} onChange={(e) => setRequestedCheckOut(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reason * <span className="text-xs text-slate-400">(min 10 chars)</span>
            </label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required minLength={10}
              placeholder="Explain why you are requesting this correction…"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <p className="text-xs text-slate-400 mt-0.5">{reason.length}/10</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Attachment <span className="text-xs text-slate-400">(optional)</span></label>
            <AttachmentUpload file={attachment} onFileSelect={setAttachment} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={apply.isPending}>
              <RotateCcw className="h-4 w-4" /> Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewDrawer({ req, onClose }: { req: AttendanceRegularization; onClose: () => void }) {
  const review = useReviewRegularization();
  const { isMaster, canPage, canAction } = useAuth();
  const canReview = isMaster || (canPage("hrms", "attendance_regularization") && canAction("hrms", "attendance_regularization", "approve"));

  async function handleApprove() {
    try {
      await review.mutateAsync({ id: req.id, body: { status: "approved" } });
      toast.success("Request approved");
      onClose();
    } catch (e) { toast.error(getErrorMessage(e)); }
  }

  async function handleReject(note: string) {
    try {
      await review.mutateAsync({ id: req.id, body: { status: "rejected", reviewNote: note || undefined } });
      toast.success("Request rejected");
      onClose();
    } catch (e) { toast.error(getErrorMessage(e)); }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-900">Review Correction Request</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          {/* Employee info */}
          {req.user && (
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Employee</p>
              <p className="font-medium text-slate-900">{req.user.fullName}</p>
              {req.user.employeeId && <p className="text-xs text-slate-400">{req.user.employeeId}</p>}
              {req.user.department && <p className="text-xs text-slate-400">{req.user.department}</p>}
            </div>
          )}

          {/* Status + type badges */}
          <div className="flex items-center gap-2">
            <StatusBadge status={req.status} />
            <RequestTypeBadge type={req.requestType} />
          </div>

          {/* Request details */}
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs text-slate-500">Date</p><p className="font-medium">{formatDate(req.date)}</p></div>
            <div><p className="text-xs text-slate-500">Submitted</p><p className="font-medium">{formatDate(req.createdAt)}</p></div>
          </div>
          <div>
            <p className="text-xs text-slate-500">Reason</p>
            <p className="mt-0.5">{req.reason}</p>
          </div>

          {/* Three-column comparison */}
          <AttendanceComparison req={req} />

          {/* Attachment */}
          {req.attachmentSignedUrl && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Attachment</p>
              <AttachmentDownload signedUrl={req.attachmentSignedUrl} filename={req.attachmentUrl ?? undefined} />
            </div>
          )}

          {/* Review note if already reviewed */}
          {req.reviewNote && (
            <div>
              <p className="text-xs text-slate-500">Review Note</p>
              <p className="mt-0.5 text-slate-700">{req.reviewNote}</p>
            </div>
          )}
          {req.reviewer && (
            <div>
              <p className="text-xs text-slate-500">Reviewed by</p>
              <p className="font-medium">{req.reviewer.fullName}</p>
              {req.reviewedAt && <p className="text-xs text-slate-400">{formatDate(req.reviewedAt)}</p>}
            </div>
          )}

          {/* Timeline */}
          <CorrectionTimeline req={req} />

          {/* Review actions */}
          {canReview && req.status === "pending" && (
            <div className="pt-3 border-t border-slate-100">
              <ReviewActions onApprove={handleApprove} onReject={handleReject} loading={review.isPending} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RegularizationPage() {
  const searchParams = useSearchParams();
  const { isMaster, canPage } = useAuth();
  const isHr = isMaster || canPage("hrms", "attendance_regularization");

  const prefill = {
    date: searchParams.get("date") ?? "",
    attendanceId: searchParams.get("attendanceId") ?? "",
    currentStatus: searchParams.get("currentStatus") ?? "",
  };

  const [tab, setTab] = useState<"mine" | "review">(isHr ? "review" : "mine");
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUserId, setFilterUserId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modalOpen, setModalOpen] = useState(Boolean(prefill.date));
  const [detailReq, setDetailReq] = useState<AttendanceRegularization | null>(null);

  const { data: employees } = useEmployeeList({ pageSize: 100 });

  const { data: myRequests, isLoading: myLoading } = useRegularizationList({
    page, pageSize: DEFAULT_PAGE_SIZE,
    status: filterStatus || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { data: reviewRequests, isLoading: reviewLoading } = useRegularizationList({
    page, pageSize: DEFAULT_PAGE_SIZE,
    status: filterStatus || undefined,
    userId: filterUserId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const isHrTab = tab === "review" && isHr;
  const listData = isHrTab ? reviewRequests : myRequests;
  const isLoading = isHrTab ? reviewLoading : myLoading;

  const columns: Column<AttendanceRegularization>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.date) },
    ...(isHrTab ? [{
      key: "employee", header: "Employee",
      render: (r: AttendanceRegularization) => (
        <div>
          <p className="font-medium text-slate-900">{r.user?.fullName ?? "—"}</p>
          {r.user?.employeeId && <p className="text-xs text-slate-400">{r.user.employeeId}</p>}
        </div>
      ),
    }] : []),
    { key: "requestType", header: "Type", render: (r) => <RequestTypeBadge type={r.requestType} /> },
    { key: "checkIn", header: "Corrected In", render: (r) => formatTime(r.requestedCheckIn) },
    { key: "checkOut", header: "Corrected Out", render: (r) => formatTime(r.requestedCheckOut) },
    { key: "reason", header: "Reason", render: (r) => <span className="max-w-[180px] truncate block">{r.reason}</span> },
    {
      key: "attachment",
      header: "",
      render: (r) => r.attachmentUrl ? <Paperclip className="h-4 w-4 text-slate-400" /> : <span className="text-slate-300">—</span>,
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "submitted", header: "Submitted", render: (r) => formatDate(r.createdAt) },
    {
      key: "actions",
      header: "",
      stickyRight: true,
      render: (r) => (
        <button onClick={() => setDetailReq(r)} className="p-1 text-slate-400 hover:text-indigo-600" title="View details">
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <AccessGuard module="hrms" page="attendance_regularization">
      <div className="space-y-6">
        <PageHeader
          title="Correction Requests"
          subtitle="Review and manage attendance correction requests"
          actions={
            <Button onClick={() => setModalOpen(true)}>
              <RotateCcw className="h-4 w-4" />
              New Request
            </Button>
          }
        />

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
          <button
            onClick={() => { setTab("mine"); setPage(1); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "mine" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
          >My Requests</button>
          {isHr && (
            <button
              onClick={() => { setTab("review"); setPage(1); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "review" ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >All Requests</button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          {isHrTab && (
            <select
              value={filterUserId}
              onChange={(e) => { setFilterUserId(e.target.value); setPage(1); }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
            >
              <option value="">All Employees</option>
              {employees?.data?.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
              ))}
            </select>
          )}
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <DataTable<AttendanceRegularization>
          columns={columns}
          rows={listData?.data ?? []}
          rowKey={(r) => r.id}
          loading={isLoading}
          emptyTitle="No requests"
          emptyMessage={tab === "mine" ? "You haven't submitted any correction requests." : "No correction requests found."}
        />

        {listData && (
          <Pagination
            page={listData.page}
            pageSize={listData.pageSize}
            total={listData.total}
            totalPages={listData.totalPages}
            onPageChange={setPage}
            onPageSizeChange={() => {}}
          />
        )}

        <RequestModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          prefill={prefill.date ? prefill : undefined}
        />

        {detailReq && (
          <ReviewDrawer req={detailReq} onClose={() => setDetailReq(null)} />
        )}
      </div>
    </AccessGuard>
  );
}
