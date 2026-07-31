"use client";

import { useState } from "react";
import { Download, Mail, Send, Printer } from "lucide-react";
import { usePayslipList, useSendPayslip, useSendBulkPayslips } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { payslipService } from "@/services/hrms/payslip.service";
import { toast } from "sonner";
import { getErrorMessage } from "@/services/api/client";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import { useAuth } from "@/hooks/useAuth";
import { Select } from "@/components/ui/Input";
import type { Payslip } from "@/types";

export default function PayslipsPage() {
  const now = new Date();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selected, setSelected] = useState<string[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const { canAction } = useAuth();

  const { data, isLoading } = usePayslipList({ page, pageSize, month, year });
  const sendPayslip = useSendPayslip();
  const sendBulk = useSendBulkPayslips();

  const handleDownload = async (id: string) => {
    setDownloadingId(id);
    try {
      const blob = await payslipService.download(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Payslip downloaded");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrint = async (id: string) => {
    setPrintingId(id);
    try {
      const blob = await payslipService.download(id);
      const url = URL.createObjectURL(blob);
      const win = window.open(url);
      win?.addEventListener("load", () => { win.print(); URL.revokeObjectURL(url); });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setPrintingId(null);
    }
  };

  const handleSendBulk = () => {
    sendBulk.mutate({ month, year }, {
      onSuccess: (res) => toast.success(`Sent: ${res.sent} / ${res.total}`),
      onError: (e) => toast.error(getErrorMessage(e)),
    });
  };

  const columns: Column<Payslip>[] = [
    { key: "user", header: "Employee", render: (r) => r.user?.fullName || "—" },
    { key: "empId", header: "Emp ID", render: (r) => r.user?.employeeId || "—" },
    { key: "department", header: "Department", render: (r) => r.user?.department || "—" },
    { key: "month", header: "Month", render: (r) => `${new Date(2024, r.month - 1).toLocaleString("default", { month: "short" })} ${r.year}` },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const colors: Record<string, string> = { draft: "bg-slate-100 text-slate-600", generated: "bg-sky-100 text-sky-700", sent: "bg-emerald-100 text-emerald-700" };
        return <Badge className={colors[r.status] ?? "bg-slate-100 text-slate-600"}>{r.status}</Badge>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      stickyRight: true,
      render: (r) => (
        <div className="flex gap-1">
          {canAction("hrms", "payslips", "download") && (
            <IconButton
              icon={Download}
              title="Download PDF"
              loading={downloadingId === r.id}
              onClick={() => handleDownload(r.id)}
            />
          )}
          {canAction("hrms", "payslips", "print") && (
            <IconButton
              icon={Printer}
              title="Print Payslip"
              variant="info"
              loading={printingId === r.id}
              onClick={() => handlePrint(r.id)}
            />
          )}
          {canAction("hrms", "payslips", "send") && (
            <IconButton
              icon={Mail}
              title="Send Payslip"
              variant="info"
              loading={sendPayslip.isPending && sendPayslip.variables === r.id}
              onClick={() => sendPayslip.mutate(r.id, {
                onSuccess: () => toast.success("Payslip sent"),
                onError: (e) => toast.error(getErrorMessage(e)),
              })}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <AccessGuard module="hrms" page="payslips" action="view">
    <div className="space-y-6">
      <PageHeader
        title="Payslips"
        subtitle="View, download, and email payslips"
        actions={
          <CanAccess module="hrms" page="payslips" action="send">
            <Button onClick={handleSendBulk} loading={sendBulk.isPending}>
              <Send className="h-4 w-4" /> Send Bulk ({month}/{year})
            </Button>
          </CanAccess>
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
        selectable
        selectedIds={selected}
        onToggleRow={(id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
        onToggleAll={(checked) => setSelected(checked ? (data?.data ?? []).map((r) => r.id) : [])}
      />

      {data && (
        <Pagination page={data.page} pageSize={pageSize} total={data.total} totalPages={data.totalPages} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      )}
    </div>
    </AccessGuard>
  );
}
