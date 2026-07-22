"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useManualAttendance, useEmployeeList } from "@/hooks/useHrms";
import { getErrorMessage } from "@/services/api/client";
import type { AttendanceRecord, AttendanceStatus } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  record?: AttendanceRecord | null;
}

const STATUS_OPTIONS = ["present", "late", "half_day", "absent", "leave"];

export function ManualAttendanceModal({ open, onClose, record }: Props) {
  const { create, update } = useManualAttendance();
  const { data: employees } = useEmployeeList({ page: 1, pageSize: 100 });

  const [userId, setUserId] = useState(record?.userId ?? "");
  const [date, setDate] = useState(record?.date?.split("T")[0] ?? "");
  const [status, setStatus] = useState<string>(record?.status ?? "present");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => {
    if (record) {
      setUserId(record.userId);
      setDate(record.date?.split("T")[0] ?? "");
      setStatus(record.status);
      const fmt = (iso: string | null | undefined) =>
        iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Dubai" }) : "";
      setCheckIn(fmt(record.checkInTime));
      setCheckOut(fmt(record.checkOutTime));
      setOverrideReason("");
    } else {
      setUserId("");
      setDate(new Date().toISOString().split("T")[0]);
      setStatus("present");
      setCheckIn("");
      setCheckOut("");
      setOverrideReason("");
    }
  }, [record, open]);

  if (!open) return null;

  const isEdit = Boolean(record);
  const isPending = create.isPending || update.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!overrideReason.trim()) {
      toast.error("Override reason is required");
      return;
    }
    try {
      if (isEdit && record) {
        await update.mutateAsync({
          id: record.id,
          body: { status, checkInTime: checkIn || null, checkOutTime: checkOut || null, overrideReason },
        });
        toast.success("Attendance record updated");
      } else {
        await create.mutateAsync({ userId, date, status, checkInTime: checkIn || null, checkOutTime: checkOut || null, overrideReason });
        toast.success("Attendance record created");
      }
      onClose();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit Attendance Record" : "Manual Attendance Entry"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Employee *</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select employee…</option>
                {employees?.data.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                required
                disabled={isEdit}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace("_", " ")}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Check-in Time</label>
              <input
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Check-out Time</label>
              <input
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Override Reason *</label>
            <textarea
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              rows={2}
              required
              placeholder="Reason for manual entry…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={isPending}>
              <Save className="h-4 w-4" />
              {isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
