"use client";

import { X, Clock } from "lucide-react";
import { useAttendanceAuditLog } from "@/hooks/useHrms";
import type { AttendanceAuditAction, AttendanceAuditEntry } from "@/types";

const ACTION_LABELS: Record<AttendanceAuditAction, string> = {
  check_in: "Checked In",
  check_out: "Checked Out",
  manual_create: "Manual Created",
  manual_override: "Overridden",
  manual_update: "Updated",
  regularized: "Regularization Approved",
};

const ACTION_COLORS: Record<AttendanceAuditAction, string> = {
  check_in: "bg-emerald-100 text-emerald-700",
  check_out: "bg-sky-100 text-sky-700",
  manual_create: "bg-indigo-100 text-indigo-700",
  manual_override: "bg-amber-100 text-amber-700",
  manual_update: "bg-violet-100 text-violet-700",
  regularized: "bg-orange-100 text-orange-700",
};

function formatVal(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function DiffRow({ label, old: o, next: n }: { label: string; old: unknown; next: unknown }) {
  if (formatVal(o) === formatVal(n)) return null;
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="w-24 shrink-0 font-medium text-slate-500">{label}</span>
      <span className="text-rose-600 line-through">{formatVal(o)}</span>
      <span className="text-slate-400">→</span>
      <span className="text-emerald-600">{formatVal(n)}</span>
    </div>
  );
}

function AuditRow({ entry }: { entry: AttendanceAuditEntry }) {
  const label = ACTION_LABELS[entry.action] ?? entry.action;
  const color = ACTION_COLORS[entry.action] ?? "bg-slate-100 text-slate-600";
  const old = entry.oldData ?? {};
  const next = entry.newData ?? {};

  const diffKeys = Array.from(
    new Set([...Object.keys(old), ...Object.keys(next)])
  ).filter((k) => formatVal((old as Record<string, unknown>)[k]) !== formatVal((next as Record<string, unknown>)[k]));

  return (
    <div className="relative pl-6">
      <span className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full bg-indigo-400 ring-2 ring-white" />
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
            {label}
          </span>
          <span className="text-xs text-slate-500">
            {new Date(entry.createdAt).toLocaleString("en-AE", {
              dateStyle: "short",
              timeStyle: "short",
              timeZone: "Asia/Dubai",
            })}
          </span>
          {entry.performer && (
            <span className="text-xs text-slate-400">by {entry.performer.fullName}</span>
          )}
        </div>
        {diffKeys.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {diffKeys.map((k) => (
              <DiffRow
                key={k}
                label={k}
                old={(old as Record<string, unknown>)[k]}
                next={(next as Record<string, unknown>)[k]}
              />
            ))}
          </div>
        )}
        {entry.reason && (
          <p className="mt-1.5 text-xs text-slate-500 italic">"{entry.reason}"</p>
        )}
      </div>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  attendanceId: string | null;
  employeeName?: string;
  date?: string;
}

export function AuditLogDrawer({ open, onClose, attendanceId, employeeName, date }: Props) {
  const { data: entries, isLoading } = useAttendanceAuditLog(attendanceId ?? undefined);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-slate-50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Audit Log</h3>
            {(employeeName || date) && (
              <p className="text-xs text-slate-500 mt-0.5">
                {[employeeName, date].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-200" />
              ))}
            </div>
          )}

          {!isLoading && (!entries || entries.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No audit entries</p>
              <p className="text-xs text-slate-400 mt-1">No changes recorded for this record</p>
            </div>
          )}

          {!isLoading && entries && entries.length > 0 && (
            <div className="relative space-y-4">
              <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-slate-200" />
              {entries.map((entry) => (
                <AuditRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
