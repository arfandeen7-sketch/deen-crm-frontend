"use client";

import { useState } from "react";
import { Download, Eye } from "lucide-react";
import { useMyPayslips } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { AccessGuard } from "@/components/shared/Guards";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { payslipService } from "@/services/hrms/payslip.service";
import type { Payslip } from "@/types";

export default function MyPayslipsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { data, isLoading } = useMyPayslips({ page, pageSize });

  const handleDownload = async (id: string, month: number, year: number) => {
    const blob = await payslipService.download(id, true);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payslip-${year}-${month}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<Payslip>[] = [
    {
      key: "month",
      header: "Salary Month",
      render: (r) => `${new Date(2024, r.month - 1).toLocaleString("default", { month: "long" })} ${r.year}`,
    },
    {
      key: "basic",
      header: "Basic",
      render: (r) => `AED ${Number(r.basicSalary).toLocaleString()}`,
    },
    {
      key: "allowances",
      header: "Allowances",
      render: (r) => `AED ${Number(r.allowances).toLocaleString()}`,
    },
    {
      key: "deductions",
      header: "Deductions",
      render: (r) => `AED ${r.deductions.toLocaleString()}`,
    },
    {
      key: "net",
      header: "Net Salary",
      render: (r) => <span className="font-semibold text-emerald-700">AED {r.netSalary.toLocaleString()}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      stickyRight: true,
      render: (r) => (
        <div className="flex gap-1">
          <button onClick={() => handleDownload(r.id, r.month, r.year)} className="rounded p-1 text-gray-900 hover:bg-indigo-50" title="Download PDF">
            <Download className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AccessGuard module="my_hr">
      <div className="space-y-6">
        <PageHeader title="My Payslips" subtitle="View and download your salary slips" />

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
