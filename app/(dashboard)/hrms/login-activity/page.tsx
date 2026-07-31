"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useLoginActivityList } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { DEFAULT_PAGE_SIZE, ROLE_LABELS } from "@/constants";

import { formatDate } from "@/lib/utils";
import { AccessGuard } from "@/components/shared/Guards";
import type { LoginActivity } from "@/types";

export default function LoginActivityPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");


  const { data, isLoading } = useLoginActivityList({
    page,
    pageSize,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const handleExport = () => {
    toast.info("Export for login activity is not available yet");
  };

  const formatDuration = (mins?: number | null) => {
    if (mins == null) return "—";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const columns: Column<LoginActivity>[] = [
    { key: "user", header: "Employee", render: (r) => r.user?.fullName || "—" },
    { key: "role", header: "Role", render: (r) => r.user?.role ? ROLE_LABELS[r.user.role] : "—" },
    { key: "loginTime", header: "Login Time", render: (r) => `${formatDate(r.loginTime)} ${new Date(r.loginTime).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" })}` },
    { key: "logoutTime", header: "Logout Time", render: (r) => r.logoutTime ? new Date(r.logoutTime).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" }) : "Active" },
    { key: "duration", header: "Duration", render: (r) => formatDuration(r.sessionDuration) },
    { key: "device", header: "Device", render: (r) => r.userAgent || "—" },
  ];

  return (
    <AccessGuard module="hrms" page="login_activity" action="view">
    <div className="space-y-6">
      <PageHeader
        title="Login Activity"
        subtitle="Track employee login and logout activity"
        actions={
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />

      </div>

      <DataTable<LoginActivity>
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
