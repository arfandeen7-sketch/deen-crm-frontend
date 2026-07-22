"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLeaveBalanceAll, useLeaveTypes } from "@/hooks/useHrms";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { AccessGuard } from "@/components/shared/Guards";
import { LeaveBalanceTable } from "@/components/leave/LeaveBalanceTable";
import { AdjustBalanceDialog } from "@/components/leave/AdjustBalanceDialog";
import type { LeaveBalanceEntry } from "@/types";

export default function HrLeaveBalancePage() {
  const { canAction } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustUserName, setAdjustUserName] = useState("");
  const [adjustLeaveTypeCode, setAdjustLeaveTypeCode] = useState<string | undefined>();

  const { data: rows, isLoading } = useLeaveBalanceAll(year);
  const { data: types } = useLeaveTypes(false);
  const canAdjust = canAction("hrms", "leave", "adjust_balance");

  const handleAdjust = (userId: string, userName: string, leaveTypeCode?: string) => {
    setAdjustUserId(userId);
    setAdjustUserName(userName);
    setAdjustLeaveTypeCode(leaveTypeCode);
    setAdjustOpen(true);
  };

  return (
    <AccessGuard module="hrms" page="leave">
      <div className="space-y-6">
        <PageHeader
          title="Leave Balances"
          subtitle="View and adjust employee leave balances"
        />

        <div className="flex items-center gap-3">
          <Select
            value={String(year)}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-10 py-0 w-auto"
          >
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-foreground-muted">Loading balances…</p>
        ) : !rows || rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground-muted">No balance records found.</p>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <Card key={row.userId}>
                <CardHeader
                  title={row.fullName}
                  subtitle={`${row.employeeId || "—"} · ${row.department || "—"}`}
                  action={
                    canAdjust && (
                      <button
                        onClick={() => handleAdjust(row.userId, row.fullName)}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        Adjust Balance
                      </button>
                    )
                  }
                />
                <CardBody className="pt-0">
                  <LeaveBalanceTable
                    balances={row.balances}
                    canAdjust={canAdjust}
                    onAdjust={(bal: LeaveBalanceEntry) =>
                      handleAdjust(row.userId, row.fullName, bal.leaveTypeCode)
                    }
                  />
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        <AdjustBalanceDialog
          open={adjustOpen}
          onClose={() => setAdjustOpen(false)}
          userId={adjustUserId}
          userName={adjustUserName}
          presetLeaveTypeCode={adjustLeaveTypeCode}
        />
      </div>
    </AccessGuard>
  );
}
