"use client";

import { DataTable, type Column } from "@/components/tables/DataTable";
import type { LeaveBalanceEntry } from "@/types";

export function LeaveBalanceTable({
  balances,
  onAdjust,
  canAdjust,
}: {
  balances: LeaveBalanceEntry[];
  onAdjust?: (balance: LeaveBalanceEntry) => void;
  canAdjust?: boolean;
}) {
  const columns: Column<LeaveBalanceEntry>[] = [
    {
      key: "leaveTypeName",
      header: "Leave Type",
      render: (b) => b.leaveTypeName,
    },
    {
      key: "allocated",
      header: "Allocated",
      render: (b) => String(b.allocated),
    },
    {
      key: "carryForward",
      header: "Carry Fwd",
      render: (b) => String(b.carryForward),
    },
    {
      key: "adjustment",
      header: "Adjustment",
      render: (b) => String(b.adjustment),
    },
    {
      key: "consumed",
      header: "Consumed",
      render: (b) => String(b.consumed),
    },
    {
      key: "available",
      header: "Available",
      render: (b) => <span className="font-semibold">{b.available}</span>,
    },
    {
      key: "isPaid",
      header: "Paid",
      render: (b) => (b.isPaid ? "Yes" : "No"),
    },
    ...(canAdjust && onAdjust
      ? [
          {
            key: "actions",
            header: "Actions",
            stickyRight: true as const,
            render: (b: LeaveBalanceEntry) => (
              <button
                onClick={() => onAdjust(b)}
                className="rounded p-1 text-xs font-medium text-accent hover:bg-accent/10"
              >
                Adjust
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <DataTable<LeaveBalanceEntry>
      columns={columns}
      rows={balances}
      rowKey={(b) => b.leaveTypeCode}
      emptyTitle="No balances"
      emptyMessage="No leave balance records found."
    />
  );
}
