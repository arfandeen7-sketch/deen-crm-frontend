"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useMyPayslips } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { PAYROLL_STATUS_COLORS, DEFAULT_PAGE_SIZE } from "@/constants";
import { payslipService } from "@/services/hrms/payslip.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/services/api/client";
import type { Payslip } from "@/types";

export default function MyPayslipsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isLoading } = useMyPayslips({ page, pageSize });

  const handleDownload = async (id: string, month: number, year: number) => {
    setDownloadingId(id);
    try {
      const blob = await payslipService.download(id, true);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${year}-${month}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Payslip downloaded");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDownloadingId(null);
    }
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
      key: "status",
      header: "Status",
      render: (r) => <Badge className={PAYROLL_STATUS_COLORS[r.status]}>{r.status}</Badge>,
    },
    {
      key: "actions",
      header: "Actions",
      stickyRight: true,
      render: (r) => (
        <div className="flex gap-1">
          <IconButton
            icon={Download}
            title="Download PDF"
            loading={downloadingId === r.id}
            onClick={() => handleDownload(r.id, r.month, r.year)}
          />
        </div>
      ),
    },
  ];

  return (
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
  );
}
