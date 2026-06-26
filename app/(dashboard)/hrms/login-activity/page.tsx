"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useLoginActivityList } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { DEFAULT_PAGE_SIZE, ROLE_LABELS } from "@/constants";
import { loginActivityService } from "@/services/hrms/login-activity.service";
import { formatDate } from "@/lib/utils";
import { PermissionGuard } from "@/components/shared/Guards";
import type { LoginActivity } from "@/types";

export default function LoginActivityPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [role, setRole] = useState("");

  const { data, isLoading } = useLoginActivityList({
    page,
    pageSize,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    role: role || undefined,
  });

  const handleExport = async () => {
    const blob = await loginActivityService.export({ dateFrom, dateTo, role });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "login-activity.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (mins?: number | null) => {
    if (mins == null) return "—";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const columns: Column<LoginActivity>[] = [
    { key: "user", header: "Employee", render: (r) => r.user?.fullName || "—" },
    { key: "role", header: "Role", render: (r) => ROLE_LABELS[r.role] },
    { key: "loginTime", header: "Login Time", render: (r) => `${formatDate(r.loginTime)} ${new Date(r.loginTime).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" })}` },
    { key: "logoutTime", header: "Logout Time", render: (r) => r.logoutTime ? new Date(r.logoutTime).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" }) : "Active" },
    { key: "duration", header: "Duration", render: (r) => formatDuration(r.sessionDuration) },
    { key: "device", header: "Device", render: (r) => r.deviceInfo || "—" },
  ];

  return (
    <PermissionGuard permission="hrms.reports">
    <div className="space-y-6">
      <PageHeader
        title="Login Activity"
        subtitle="Track employee login and logout activity"
        actions={
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export
          </button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="">All Roles</option>
          <option value="master">Master Admin</option>
          <option value="hr_manager">HR Manager</option>
          <option value="sales_manager">Sales Manager</option>
          <option value="sales_executive">Sales Executive</option>
        </select>
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
    </PermissionGuard>
  );
}
