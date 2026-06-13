"use client";

import { useState } from "react";
import { Download, Play, DollarSign, Users2, Clock, CheckCircle2 } from "lucide-react";
import { usePayrollList, usePayrollDashboard, useGeneratePayroll, useProcessPayroll } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { PAYROLL_STATUS_COLORS, DEFAULT_PAGE_SIZE } from "@/constants";
import { payrollService } from "@/services/hrms/payroll.service";
import { toast } from "sonner";
import type { PayrollRecord } from "@/types";

export default function PayrollManagementPage() {
  const now = new Date();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = usePayrollList({ page, pageSize, month, year });
  const { data: dashboard } = usePayrollDashboard({ month, year });
  const generate = useGeneratePayroll();
  const process = useProcessPayroll();

  const handleGenerate = () => {
    generate.mutate({ month, year }, {
      onSuccess: (res) => toast.success(`Payroll generated for ${res.count} employees`),
      onError: () => toast.error("Failed to generate payroll"),
    });
  };

  const handleProcess = (id: string) => {
    process.mutate(id, { onSuccess: () => toast.success("Payroll processed") });
  };

  const handleExport = async () => {
    const blob = await payrollService.export({ month, year });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${year}-${month}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<PayrollRecord>[] = [
    { key: "user", header: "Employee", render: (r) => r.user?.fullName || "—" },
    { key: "department", header: "Department", render: (r) => r.user?.department || "—" },
    { key: "grossSalary", header: "Gross", render: (r) => `AED ${r.grossSalary.toLocaleString()}` },
    { key: "deductions", header: "Deductions", render: (r) => `AED ${(r.deductions + r.leaveDeductions + r.latePenalty).toLocaleString()}` },
    { key: "netSalary", header: "Net Salary", render: (r) => <span className="font-semibold">AED {r.netSalary.toLocaleString()}</span> },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge className={PAYROLL_STATUS_COLORS[r.status]}>{r.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      render: (r) =>
        r.status === "pending" ? (
          <button onClick={() => handleProcess(r.id)} className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
            Process
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Management"
        subtitle="Generate and manage monthly payroll"
        actions={
          <div className="flex gap-2">
            <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Download className="h-4 w-4" /> Export
            </button>
            <button onClick={handleGenerate} disabled={generate.isPending} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              <Play className="h-4 w-4" /> Generate Payroll
            </button>
          </div>
        }
      />

      {/* Dashboard Cards */}
      {dashboard && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Employees" value={dashboard.totalEmployees} icon={Users2} />
          <StatCard label="Payroll Pending" value={dashboard.payrollPending} icon={Clock} accent="amber" />
          <StatCard label="Payroll Processed" value={dashboard.payrollProcessed} icon={CheckCircle2} accent="emerald" />
          <StatCard label="Total Salary (AED)" value={dashboard.totalSalary} icon={DollarSign} accent="indigo" />
        </div>
      )}

      {/* Month/Year Filter */}
      <div className="flex gap-3">
        <select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString("default", { month: "long" })}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => { setYear(Number(e.target.value)); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          {Array.from({ length: 5 }, (_, i) => {
            const y = now.getFullYear() - 2 + i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>
      </div>

      <DataTable<PayrollRecord>
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(r) => r.id}
        loading={isLoading}
      />

      {data && (
        <Pagination page={data.page} pageSize={pageSize} total={data.total} totalPages={data.totalPages} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      )}
    </div>
  );
}
