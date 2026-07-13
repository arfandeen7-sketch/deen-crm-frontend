"use client";

import { useState } from "react";
import { Download, Mail, Send } from "lucide-react";
import { usePayslipList, useCalculatePayroll, useSendPayslip, useSendBulkPayslips } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { PAYROLL_STATUS_COLORS, DEFAULT_PAGE_SIZE } from "@/constants";
import { payslipService } from "@/services/hrms/payslip.service";
import { toast } from "sonner";
import { AccessGuard } from "@/components/shared/Guards";
import { Select } from "@/components/ui/Input";
import type { Payslip } from "@/types";

export default function PayrollManagementPage() {
  const now = new Date();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = usePayslipList({ page, pageSize, month, year });
  const calculate = useCalculatePayroll();
  const sendPayslip = useSendPayslip();
  const sendBulk = useSendBulkPayslips();

  const handleCalculate = () => {
    const userId = prompt("Employee user ID to calculate payroll for:");
    if (!userId) return;
    calculate.mutate({ userId, month, year }, {
      onSuccess: () => toast.success("Payslip calculated"),
      onError: () => toast.error("Failed to calculate payroll"),
    });
  };

  const handleDownload = async (id: string) => {
    const blob = await payslipService.download(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payslip-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendBulk = () => {
    sendBulk.mutate({ month, year }, {
      onSuccess: (res) => toast.success(`Sent: ${res.sent} / ${res.total}`),
      onError: () => toast.error("Failed to send bulk payslips"),
    });
  };

  const columns: Column<Payslip>[] = [
    { key: "user", header: "Employee", render: (r) => r.user?.fullName || "—" },
    { key: "department", header: "Department", render: (r) => r.user?.department || "—" },
    { key: "basic", header: "Basic", render: (r) => `AED ${Number(r.basicSalary).toLocaleString()}` },
    { key: "deductions", header: "Deductions", render: (r) => `AED ${r.deductions.toLocaleString()}` },
    { key: "net", header: "Net Salary", render: (r) => <span className="font-semibold">AED {r.netSalary.toLocaleString()}</span> },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge className={PAYROLL_STATUS_COLORS[r.status]}>{r.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      stickyRight: true,
      render: (r) => (
        <div className="flex gap-1">
          <button onClick={() => handleDownload(r.id)} className="rounded p-1 text-gray-900 hover:bg-indigo-50" title="Download">
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => sendPayslip.mutate(r.id, { onSuccess: () => toast.success("Payslip sent") })}
            className="rounded p-1 text-sky-600 hover:bg-sky-50"
            title="Send"
          >
            <Mail className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AccessGuard module="hrms" page="payroll">
    <div className="space-y-6">
      <PageHeader
        title="Payroll Management"
        subtitle="Calculate and manage monthly payslips"
        actions={
          <div className="flex gap-2">
            <button onClick={handleSendBulk} disabled={sendBulk.isPending} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <Send className="h-4 w-4" /> Send Bulk ({month}/{year})
            </button>
            <button onClick={handleCalculate} disabled={calculate.isPending} className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              Calculate Payslip
            </button>
          </div>
        }
      />

      <div className="flex gap-3">
        <Select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setPage(1); }} className="h-10 py-0 w-auto">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString("default", { month: "long" })}</option>
          ))}
        </Select>
        <Select value={year} onChange={(e) => { setYear(Number(e.target.value)); setPage(1); }} className="h-10 py-0 w-auto">
          {Array.from({ length: 5 }, (_, i) => {
            const y = now.getFullYear() - 2 + i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </Select>
      </div>

      <DataTable<Payslip>
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(r) => r.id}
        loading={isLoading}
      />

      {data && (
        <Pagination page={data.page} pageSize={pageSize} total={data.total} totalPages={data.totalPages} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      )}
    </div>
    </AccessGuard>
  );
}
