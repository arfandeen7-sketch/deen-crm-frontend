"use client";

import { formatDateTime } from "@/lib/utils";
import { getAuditColor } from "@/lib/leaveUtils";
import type { LeaveAudit } from "@/types";

export function LeaveAuditTrail({ audits }: { audits: LeaveAudit[] }) {
  if (!audits.length) {
    return (
      <p className="py-6 text-center text-sm text-foreground-muted">
        No audit records found.
      </p>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-5">
        {audits.map((audit) => (
          <div key={audit.id} className="relative flex gap-4 pl-0">
            <div
              className={`z-10 mt-1 h-3 w-3 shrink-0 rounded-full ${getAuditColor(audit.action)}`}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {audit.action.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-foreground-muted">
                  {formatDateTime(audit.createdAt)}
                </p>
              </div>
              {audit.changer && (
                <p className="text-xs text-foreground-secondary">
                  by {audit.changer.fullName}
                </p>
              )}
              {audit.reason && (
                <p className="mt-1 text-xs text-foreground-secondary">
                  {audit.reason}
                </p>
              )}
              {audit.oldStatus && audit.newStatus && (
                <p className="mt-1 text-xs text-foreground-muted">
                  {audit.oldStatus} → {audit.newStatus}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
