"use client";

import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { LeaveRequestStatusBadge } from "./LeaveRequestStatusBadge";
import type { LeaveCalendarDay } from "@/types";

export function LeaveCalendarDayPopover({
  day,
  onClose,
}: {
  day: LeaveCalendarDay;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} title={formatDate(day.date)} size="sm">
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-foreground-muted">Type:</span>{" "}
          <span className="font-medium capitalize">{day.type.replace("_", " ")}</span>
        </div>
        {day.leaveTypeName && (
          <div>
            <span className="text-foreground-muted">Leave Type:</span>{" "}
            <span className="font-medium">{day.leaveTypeName}</span>
          </div>
        )}
        {day.leaveStatus && (
          <div>
            <span className="text-foreground-muted">Status:</span>{" "}
            <LeaveRequestStatusBadge status={day.leaveStatus} />
          </div>
        )}
        {day.leaveRequestId && (
          <div>
            <span className="text-foreground-muted">Request ID:</span>{" "}
            <span className="font-mono text-xs">{day.leaveRequestId}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
