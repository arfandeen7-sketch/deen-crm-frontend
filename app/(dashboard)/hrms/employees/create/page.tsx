"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmployeeForm } from "@/components/hrms/EmployeeForm";
import { useEmployeeMutations } from "@/hooks/useHrms";
import { PermissionGuard } from "@/components/shared/Guards";

export default function CreateEmployeePage() {
  const router = useRouter();
  const { create } = useEmployeeMutations();

  return (
    <PermissionGuard permission="hrms.employees">
    <div className="space-y-6">
      <PageHeader title="Add Employee" subtitle="Create a new employee record" />
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <EmployeeForm
          isLoading={create.isPending}
          onSubmit={(values) => {
            create.mutate(values, {
              onSuccess: () => {
                toast.success("Employee created");
                router.push("/hrms/employees");
              },
              onError: () => toast.error("Failed to create employee"),
            });
          }}
        />
      </div>
    </div>
    </PermissionGuard>
  );
}
