"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, Search } from "lucide-react";
import { useEmployeeList } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS, EMPLOYMENT_STATUS_COLORS, DEFAULT_PAGE_SIZE } from "@/constants";
import { employeeService } from "@/services/hr/hr.service";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import { Select } from "@/components/ui/Input";
import type { User } from "@/types";

export default function EmployeesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading } = useEmployeeList({
    page,
    pageSize,
    search: search || undefined,
    status: status || undefined,
  });

  const handleExport = async () => {
    const blob = await employeeService.export({ search, status });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employees.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<User>[] = [
    { key: "employeeId", header: "Emp ID", render: (u) => u.employeeId || "—" },
    { key: "fullName", header: "Name", render: (u) => u.fullName },
    { key: "department", header: "Department", render: (u) => u.department || "—" },
    { key: "designation", header: "Designation", render: (u) => u.designation || "—" },
    { key: "role", header: "Role", render: (u) => ROLE_LABELS[u.role] },
    {
      key: "employmentStatus",
      header: "Status",
      render: (u) => {
        const s = u.employmentStatus || "active";
        return <Badge className={EMPLOYMENT_STATUS_COLORS[s]}>{s.replace("_", " ")}</Badge>;
      },
    },
  ];

  return (
    <AccessGuard module="hrms" page="employees">
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        subtitle="Manage all employees"
        actions={
          <div className="flex gap-2">
            <CanAccess module="hrms" page="employees" action="export">
              <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Download className="h-4 w-4" /> Export
              </button>
            </CanAccess>
            <CanAccess module="hrms" page="employees" action="create">
              <button onClick={() => router.push("/hrms/employees/create")} className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                <Plus className="h-4 w-4" /> Add Employee
              </button>
            </CanAccess>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search employees…"
            className="rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-10 py-0 w-auto"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="probation">Probation</option>
          <option value="on_notice">On Notice</option>
          <option value="resigned">Resigned</option>
          <option value="terminated">Terminated</option>
        </Select>
      </div>

      <DataTable<User>
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(u) => u.id}
        loading={isLoading}
        onRowClick={(row) => router.push(`/hrms/employees/${row.id}`)}
      />

      {data && (
        <Pagination
          page={data.page}
          pageSize={pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      )}
    </div>
    </AccessGuard>
  );
}
