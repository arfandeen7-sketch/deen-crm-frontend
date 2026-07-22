"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useLeaveReports } from "@/hooks/useHrms";
import { leaveService } from "@/services/hrms/leave.service";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Select } from "@/components/ui/Input";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { AccessGuard } from "@/components/shared/Guards";
import { MONTH_NAMES, MONTH_SHORT } from "@/lib/leaveUtils";
import { downloadBlob } from "@/lib/utils";
import { toast } from "sonner";
import type { LeaveReportRow } from "@/types";

export default function HrLeaveReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: rows, isLoading } = useLeaveReports(month, year);

  const handleExport = async () => {
    try {
      const blob = await leaveService.exportReports(month, year);
      downloadBlob(blob, `leave-reports-${MONTH_SHORT[month - 1]}-${year}.csv`);
      toast.success("Report exported");
    } catch {
      toast.error("Failed to export report");
    }
  };

  const columns: Column<LeaveReportRow>[] = [
    { key: "fullName", header: "Employee", render: (r) => r.fullName },
    { key: "employeeId", header: "Emp ID", render: (r) => r.employeeId || "—" },
    { key: "department", header: "Department", render: (r) => r.department || "—" },
    { key: "totalLeaveDays", header: "Total Days", render: (r) => String(r.totalLeaveDays) },
    { key: "paidLeaveDays", header: "Paid", render: (r) => String(r.paidLeaveDays) },
    { key: "unpaidLeaveDays", header: "Unpaid", render: (r) => String(r.unpaidLeaveDays) },
    { key: "pendingCount", header: "Pending", render: (r) => String(r.pendingCount) },
    { key: "approvedCount", header: "Approved", render: (r) => String(r.approvedCount) },
    { key: "rejectedCount", header: "Rejected", render: (r) => String(r.rejectedCount) },
  ];

  return (
    <AccessGuard module="hrms" page="leave">
      <div className="space-y-6">
        <PageHeader
          title="Leave Reports"
          subtitle="Leave usage analytics and summaries"
          actions={
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          }
        />

        <div className="flex items-center gap-3">
          <Select
            value={String(month)}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-10 py-0 w-auto"
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </Select>
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

        <Card>
          <CardBody className="pt-0">
            <DataTable<LeaveReportRow>
              columns={columns}
              rows={rows ?? []}
              rowKey={(r) => r.userId}
              loading={isLoading}
              emptyTitle="No data"
              emptyMessage="No leave reports for the selected period."
            />
          </CardBody>
        </Card>
      </div>
    </AccessGuard>
  );
}
