"use client";

import { CheckCircle, Clock, XCircle, FileEdit, CalendarCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { AttendanceRegularization } from "@/types";

export function CorrectionTimeline({ req }: { req: AttendanceRegularization }) {
  const steps: { label: string; icon: React.ElementType; done: boolean; date?: string; user?: string }[] = [
    { label: "Request Submitted", icon: FileEdit, done: true, date: req.createdAt, user: req.user?.fullName },
    { label: "Under Review", icon: Clock, done: req.status !== "pending" },
    {
      label: req.status === "approved" ? "Approved" : req.status === "rejected" ? "Rejected" : "Pending Decision",
      icon: req.status === "approved" ? CheckCircle : req.status === "rejected" ? XCircle : Clock,
      done: req.status !== "pending",
      date: req.reviewedAt ?? undefined,
      user: req.reviewer?.fullName,
    },
  ];

  if (req.status === "approved") {
    steps.push({ label: "Attendance Updated", icon: CalendarCheck, done: true, date: req.reviewedAt ?? undefined });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="mb-3 text-sm font-semibold text-slate-700">Timeline</h4>
      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full ${step.done ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}>
                <step.icon className="h-3.5 w-3.5" />
              </div>
              {i < steps.length - 1 && (
                <div className={`w-0.5 h-6 ${step.done ? "bg-indigo-200" : "bg-slate-100"}`} />
              )}
            </div>
            <div className="pb-3">
              <p className={`text-sm font-medium ${step.done ? "text-slate-900" : "text-slate-400"}`}>{step.label}</p>
              {step.date && (
                <p className="text-xs text-slate-400">{formatDate(step.date)}</p>
              )}
              {step.user && (
                <p className="text-xs text-slate-500">by {step.user}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
