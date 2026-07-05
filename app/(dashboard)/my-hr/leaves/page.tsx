"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useMyLeaves, useLeaveBalance, useApplyLeave } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { LEAVE_STATUS_COLORS, DEFAULT_PAGE_SIZE } from "@/constants";
import { leaveApplySchema, type LeaveApplyFormValues } from "@/schemas/leave.schema";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { LeaveRequest } from "@/types";

export default function MyLeavesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useMyLeaves({ page, pageSize });
  const { data: balance } = useLeaveBalance();
  const apply = useApplyLeave();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeaveApplyFormValues>({
    resolver: zodResolver(leaveApplySchema) as never,
  });

  const onSubmit = (values: LeaveApplyFormValues) => {
    apply.mutate(values, {
      onSuccess: () => {
        toast.success("Leave application submitted");
        reset();
        setShowForm(false);
      },
      onError: () => toast.error("Failed to submit leave"),
    });
  };

  const columns: Column<LeaveRequest>[] = [
    { key: "leaveType", header: "Type", render: (r) => r.leaveType.replace("_", " ") },
    { key: "dateFrom", header: "From", render: (r) => formatDate(r.dateFrom) },
    { key: "dateTo", header: "To", render: (r) => formatDate(r.dateTo) },
    { key: "totalDays", header: "Days", render: (r) => String(r.totalDays) },
    { key: "reason", header: "Reason", render: (r) => <span className="max-w-[200px] truncate block">{r.reason}</span> },
    { key: "status", header: "Status", render: (r) => <Badge className={LEAVE_STATUS_COLORS[r.status]}>{r.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Leaves"
        subtitle="Apply for leave and view history"
        actions={
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Apply Leave
          </button>
        }
      />

      {/* Leave Balance */}
      {balance && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-indigo-700">{balance.leaveBalance.annual}</p>
            <p className="text-xs text-slate-600">Annual Leave</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-rose-700">{balance.leaveBalance.sick}</p>
            <p className="text-xs text-slate-600">Sick Leave</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-amber-700">{balance.leaveBalance.emergency}</p>
            <p className="text-xs text-slate-600">Emergency Leave</p>
          </div>
        </div>
      )}

      {/* Apply Leave Form */}
      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Apply for Leave</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Leave Type *</label>
              <select {...register("leaveType")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="emergency">Emergency Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
              {errors.leaveType && <p className="mt-1 text-xs text-rose-600">{errors.leaveType.message}</p>}
            </div>
            <div />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Start Date *</label>
              <input type="date" {...register("dateFrom")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              {errors.dateFrom && <p className="mt-1 text-xs text-rose-600">{errors.dateFrom.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">End Date *</label>
              <input type="date" {...register("dateTo")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              {errors.dateTo && <p className="mt-1 text-xs text-rose-600">{errors.dateTo.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Reason *</label>
              <textarea {...register("reason")} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              {errors.reason && <p className="mt-1 text-xs text-rose-600">{errors.reason.message}</p>}
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={apply.isPending} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {apply.isPending ? "Submitting…" : "Submit"}
            </button>
          </div>
        </form>
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
    </div>
  );
}
