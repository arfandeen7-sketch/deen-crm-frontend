"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useEmployee, useEmployeeMutations } from "@/hooks/useHrms";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS, ROLE_BADGE_CLASSES, EMPLOYMENT_STATUS_COLORS } from "@/constants";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { AccessGuard } from "@/components/shared/Guards";

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: employee, isLoading } = useEmployee(id);
  // Delete functionality not supported by API yet

  if (isLoading) return <div className="animate-pulse h-96 rounded-xl bg-slate-100" />;
  if (!employee) return <p className="py-12 text-center text-slate-500">Employee not found</p>;

  return (
    <AccessGuard module="hrms" page="employees">
    <div className="space-y-6">
      <PageHeader
        title={employee.fullName}
        subtitle={`${employee.designation || "—"} · ${employee.department || "—"}`}
        actions={
          <div className="flex gap-2">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={() => router.push(`/hrms/employees/${id}/edit`)} className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              <Edit className="h-4 w-4" /> Edit
            </button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700">
              {employee.fullName.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{employee.fullName}</h2>
            <Badge className={`mt-2 ${ROLE_BADGE_CLASSES[employee.role]}`}>{ROLE_LABELS[employee.role]}</Badge>
            <Badge className={`mt-2 ${EMPLOYMENT_STATUS_COLORS[employee.employmentStatus || "active"]}`}>
              {(employee.employmentStatus || "active").replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4 lg:col-span-2">
          <Section title="Personal Information">
            <InfoGrid items={[
              { label: "Employee ID", value: employee.employeeId || "—" },
              { label: "Email", value: employee.email },
              { label: "Phone", value: employee.phone || "—" },
              { label: "Joining Date", value: employee.joiningDate ? formatDate(employee.joiningDate) : "—" },
            ]} />
          </Section>

          <Section title="Employment Details">
            <InfoGrid items={[
              { label: "Department", value: employee.department || "—" },
              { label: "Designation", value: employee.designation || "—" },
              { label: "Role", value: ROLE_LABELS[employee.role] },
              { label: "Status", value: (employee.employmentStatus || "active").replace("_", " ") },
            ]} />
          </Section>

          <Section title="Salary & Bank">
            <InfoGrid items={[
              { label: "Basic Salary", value: employee.basicSalary != null ? `AED ${employee.basicSalary.toLocaleString()}` : "—" },
              { label: "Allowances", value: employee.allowances != null ? `AED ${employee.allowances.toLocaleString()}` : "—" },
              { label: "Bank Name", value: employee.bankName || "—" },
              { label: "Account No.", value: employee.bankAccountNumber || "—" },
            ]} />
          </Section>
        </div>
      </div>
    </div>
    </AccessGuard>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  );
}

function InfoGrid({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-xs text-slate-500">{item.label}</p>
          <p className="text-sm font-medium text-slate-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
