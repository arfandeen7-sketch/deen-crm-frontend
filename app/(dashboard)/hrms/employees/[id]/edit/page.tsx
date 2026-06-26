"use client";

import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmployeeForm } from "@/components/hrms/EmployeeForm";
import { useEmployee, useEmployeeMutations } from "@/hooks/useHrms";
import type { EmployeeFormValues } from "@/schemas/employee.schema";
import { PermissionGuard } from "@/components/shared/Guards";

export default function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: employee, isLoading } = useEmployee(id);
  const { update } = useEmployeeMutations();

  if (isLoading) return <div className="animate-pulse h-96 rounded-xl bg-slate-100" />;
  if (!employee) return <p className="py-12 text-center text-slate-500">Employee not found</p>;

  const defaultValues: Partial<EmployeeFormValues> = {
    fullName: employee.fullName,
    email: employee.email,
    phone: employee.phone,
    role: employee.role,
    employeeId: employee.employeeId,
    department: employee.department,
    designation: employee.designation,
    joiningDate: employee.joiningDate,
    basicSalary: employee.basicSalary,
    allowances: employee.allowances,
    bankName: employee.bankName,
    bankAccountNumber: employee.bankAccountNumber,
    employmentStatus: employee.employmentStatus,
  };

  return (
    <PermissionGuard permission="hrms.employees">
    <div className="space-y-6">
      <PageHeader title="Edit Employee" subtitle={employee.fullName} />
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <EmployeeForm
          defaultValues={defaultValues}
          isLoading={update.isPending}
          onSubmit={(values) => {
            update.mutate(
              { id, body: values },
              {
                onSuccess: () => {
                  toast.success("Employee updated");
                  router.push(`/hrms/employees/${id}`);
                },
                onError: () => toast.error("Failed to update employee"),
              },
            );
          }}
        />
      </div>
    </div>
    </PermissionGuard>
  );
}
