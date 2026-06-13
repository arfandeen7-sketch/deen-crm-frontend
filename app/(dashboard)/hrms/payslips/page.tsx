"use client";

import { useState } from "react";
import { Download, Mail, Send } from "lucide-react";
import { usePayslipList, useSendPayslipEmail, useSendBulkPayslipEmails } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { payslipService } from "@/services/hrms/payslip.service";
import { toast } from "sonner";
import type { Payslip } from "@/types";

export default function PayslipsPage() {
  const now = new Date();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading } = usePayslipList({ page, pageSize, month, year });
  const sendEmail = useSendPayslipEmail();
  const sendBulk = useSendBulkPayslipEmails();

  const handleDownload = async (id: string) => {
    const blob = await payslipService.downloadPdf(id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payslip-${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendBulk = () => {
    if (selected.length === 0) return toast.error("Select payslips to send");
    sendBulk.mutate(selected, {
      onSuccess: (res) => {
        toast.success(`Sent: ${res.sent}, Failed: ${res.failed}`);
        setSelected([]);
      },
    });
  };

  const columns: Column<Payslip>[] = [
    { key: "user", header: "Employee", render: (r) => r.user?.fullName || "—" },
    { key: "empId", header: "Emp ID", render: (r) => r.user?.employeeId || "—" },
    { key: "department", header: "Department", render: (r) => r.user?.department || "—" },
    { key: "month", header: "Month", render: (r) => `${new Date(2024, r.month - 1).toLocaleString("default", { month: "short" })} ${r.year}` },
    {
      key: "emailSent",
      header: "Email",
      render: (r) => r.emailSent
        ? <Badge className="bg-emerald-100 text-emerald-700">Sent</Badge>
        : <Badge className="bg-slate-100 text-slate-600">Not Sent</Badge>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex gap-1">
          <button onClick={() => handleDownload(r.id)} className="rounded p-1 text-indigo-600 hover:bg-indigo-50" title="Download PDF">
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => sendEmail.mutate(r.id, { onSuccess: () => toast.success("Email sent") })}
            className="rounded p-1 text-sky-600 hover:bg-sky-50"
            title="Send Email"
          >
            <Mail className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payslips"
        subtitle="View, download, and email payslips"
        actions={
          <button onClick={handleSendBulk} disabled={sendBulk.isPending || selected.length === 0} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            <Send className="h-4 w-4" /> Send Bulk Emails ({selected.length})
          </button>
        }
      />

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

      <DataTable<Payslip>
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(r) => r.id}
        loading={isLoading}
        selectable
        selectedIds={selected}
        onToggleRow={(id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
        onToggleAll={(checked) => setSelected(checked ? (data?.data ?? []).map((r) => r.id) : [])}
      />

      {data && (
        <Pagination page={data.page} pageSize={pageSize} total={data.total} totalPages={data.totalPages} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      )}
    </div>
  );
}
