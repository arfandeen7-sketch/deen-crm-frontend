"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, Save } from "lucide-react";
import { usePayrollPreview, useCalculatePayroll } from "@/hooks/useHrms";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import { Select } from "@/components/ui/Input";
import { toast } from "sonner";
import { getErrorMessage } from "@/services/api/client";
import type { PayrollFigures } from "@/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currency = (n: number) => `AED ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default function PayrollPreviewPage() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [fetchKey, setFetchKey] = useState<{ month: number; year: number } | null>(null);
  const [commitOpen, setCommitOpen] = useState(false);

  // Only fetch when the user explicitly clicks "Calculate Preview" — avoids
  // running expensive per-employee computations on every month/year change.
  const { data, isLoading, isFetching, refetch } = usePayrollPreview(
    { month: fetchKey?.month ?? month, year: fetchKey?.year ?? year },
    !!fetchKey
  );

  const calculate = useCalculatePayroll();

  const rows: PayrollFigures[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  }, [data]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.basic += r.basicSalary;
        acc.allowances += r.allowances;
        acc.overtime += r.overtimeAmount;
        acc.deductions += r.deductions;
        acc.net += r.netSalary;
        return acc;
      },
      { basic: 0, allowances: 0, overtime: 0, deductions: 0, net: 0 }
    );
  }, [rows]);

  const handleCalculatePreview = () => {
    setFetchKey({ month, year });
    // refetch() not strictly needed — setting fetchKey enables the query and
    // the queryKey change triggers a fresh fetch. Call refetch for safety.
    void refetch();
    toast.success("Preview calculated");
  };

  const handleCommitAll = () => {
    if (rows.length === 0) {
      toast.error("Nothing to save — calculate the preview first.");
      return;
    }
    calculate.mutate(
      { month, year },
      {
        onSuccess: () => {
          toast.success(`Draft payslips saved for ${rows.length} employees`);
          setCommitOpen(false);
          router.push("/hrms/payslips");
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      }
    );
  };

  const columns: Column<PayrollFigures>[] = [
    { key: "name", header: "Employee", render: (r) => r.fullName },
    { key: "empId", header: "Emp ID", render: (r) => r.employeeId ?? "—" },
    { key: "dept", header: "Department", render: (r) => r.department ?? "—" },
    { key: "designation", header: "Designation", render: (r) => r.designation ?? "—" },
    { key: "basic", header: "Basic", render: (r) => currency(r.basicSalary) },
    { key: "allowances", header: "Allowances", render: (r) => currency(r.allowances) },
    { key: "overtime", header: "Overtime", render: (r) => currency(r.overtimeAmount) },
    { key: "present", header: "Present", render: (r) => r.presentDays },
    { key: "half", header: "Half Days", render: (r) => r.halfDays },
    { key: "paidLeave", header: "Paid Leave", render: (r) => r.approvedLeaveDays },
    { key: "unpaid", header: "Unpaid/Absent", render: (r) => r.unpaidLeaveDays },
    { key: "workingDays", header: "Working Days", render: (r) => r.workingDaysInMonth },
    {
      key: "perDay",
      header: "Per-Day Rate",
      render: (r) =>
        r.workingDaysInMonth > 0
          ? currency(r.basicSalary / r.workingDaysInMonth)
          : "—",
    },
    { key: "deductions", header: "Deductions", render: (r) => currency(r.deductions) },
    {
      key: "net",
      header: "Net Salary",
      stickyRight: true,
      render: (r) => <span className="font-semibold text-emerald-700">{currency(r.netSalary)}</span>,
    },
  ];

  return (
    <AccessGuard module="hrms" page="payroll" action="view">
      <div className="space-y-6">
        <PageHeader
          title="Payroll Preview"
          subtitle="Calculate salary figures for every employee before committing payslips"
          actions={
            <CanAccess module="hrms" page="payroll" action="generate">
              <Button
                onClick={() => setCommitOpen(true)}
                loading={calculate.isPending}
                disabled={rows.length === 0}
              >
                <Save className="h-4 w-4" /> Commit &amp; Save All
              </Button>
            </CanAccess>
          }
        />

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-10 py-0 w-auto"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </Select>
          <Select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-10 py-0 w-auto"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const y = now.getFullYear() - 2 + i;
              return <option key={y} value={y}>{y}</option>;
            })}
          </Select>
          <Button
            variant="outline"
            onClick={handleCalculatePreview}
            loading={isLoading || isFetching}
          >
            <Calculator className="h-4 w-4" /> Calculate Preview
          </Button>
        </div>

        {rows.length > 0 && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div>
                <div className="text-xs font-medium uppercase text-neutral-500">Employees</div>
                <div className="text-base font-semibold text-neutral-900">{rows.length}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-neutral-500">Total Basic</div>
                <div className="text-base font-semibold text-neutral-900">{currency(totals.basic)}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-neutral-500">Total Deductions</div>
                <div className="text-base font-semibold text-neutral-900">{currency(totals.deductions)}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-neutral-500">Total Allowances</div>
                <div className="text-base font-semibold text-neutral-900">{currency(totals.allowances)}</div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-neutral-500">Total Net Salary</div>
                <div className="text-base font-semibold text-emerald-700">{currency(totals.net)}</div>
              </div>
            </div>
          </div>
        )}

        <DataTable<PayrollFigures>
          columns={columns}
          rows={rows}
          rowKey={(r) => r.userId}
          loading={isLoading || isFetching}
          emptyTitle="No preview yet"
          emptyMessage="Select a month and year, then click Calculate Preview to compute salary figures for all eligible employees."
        />

        <ConfirmModal
          open={commitOpen}
          onClose={() => setCommitOpen(false)}
          onConfirm={handleCommitAll}
          title="Commit & save all payslips?"
          message={`This will save draft payslips for all ${rows.length} employees for ${MONTH_NAMES[month - 1]} ${year}.`}
          confirmLabel="Commit & Save"
          loading={calculate.isPending}
          danger={false}
        />
      </div>
    </AccessGuard>
  );
}
