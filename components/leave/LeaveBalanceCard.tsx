"use client";

import { cn } from "@/lib/utils";
import { balanceColor, balanceBgColor } from "@/lib/leaveUtils";
import type { LeaveBalanceEntry } from "@/types";

export function LeaveBalanceCard({ balance }: { balance: LeaveBalanceEntry }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 text-center shadow-sm",
        balanceBgColor(balance.available),
      )}
    >
      <p className={cn("text-2xl font-bold", balanceColor(balance.available))}>
        {balance.available}
      </p>
      <p className="mt-1 text-xs font-medium text-slate-700">{balance.leaveTypeName}</p>
      <div className="mt-3 flex justify-center gap-3 text-[10px] text-slate-500">
        <span>Alloc: {balance.allocated}</span>
        <span>Used: {balance.consumed}</span>
        {balance.carryForward > 0 && <span>CF: {balance.carryForward}</span>}
      </div>
    </div>
  );
}
