"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type EmployeeSortKey = "assigned" | "touchRate" | "conversionRate" | "followUpCompletionRate" | "performanceScore";

const SORT_OPTIONS: { key: EmployeeSortKey; label: string }[] = [
  { key: "performanceScore", label: "Performance Score" },
  { key: "assigned", label: "Total Leads" },
  { key: "touchRate", label: "Touch Rate" },
  { key: "conversionRate", label: "Conversion Rate" },
  { key: "followUpCompletionRate", label: "Follow-up Rate" },
];

export function EmployeeFilterBar({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  departments,
  role,
  onRoleChange,
  roles,
  sortKey,
  onSortKeyChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  department: string;
  onDepartmentChange: (v: string) => void;
  departments: string[];
  role: string;
  onRoleChange: (v: string) => void;
  roles: string[];
  sortKey: EmployeeSortKey;
  onSortKeyChange: (v: EmployeeSortKey) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search employee name…"
          className="h-9 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm text-slate-700"
        />
      </div>

      <select
        value={department}
        onChange={(e) => onDepartmentChange(e.target.value)}
        className={cn("h-9 rounded-lg border border-slate-300 px-2 text-sm text-slate-700")}
      >
        <option value="">All Departments</option>
        {departments.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        value={role}
        onChange={(e) => onRoleChange(e.target.value)}
        className="h-9 rounded-lg border border-slate-300 px-2 text-sm text-slate-700"
      >
        <option value="">All Roles</option>
        {roles.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <select
        value={sortKey}
        onChange={(e) => onSortKeyChange(e.target.value as EmployeeSortKey)}
        className="h-9 rounded-lg border border-slate-300 px-2 text-sm text-slate-700"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            Sort: {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
