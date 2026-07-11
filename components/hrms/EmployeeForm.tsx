"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema, type EmployeeFormValues } from "@/schemas/employee.schema";
import { useDynamicFields } from "@/hooks/useDynamicFields";
import { CanAccess } from "@/components/shared/Guards";

interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeFormValues>;
  onSubmit: (values: EmployeeFormValues) => void;
  isLoading?: boolean;
}

export function EmployeeForm({ defaultValues, onSubmit, isLoading }: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema) as unknown as Resolver<EmployeeFormValues>,
    defaultValues: {
      role: "sales_executive",
      employmentStatus: "active",
      ...defaultValues,
    },
  });

  const { data: departments } = useDynamicFields("department");
  const { data: designations } = useDynamicFields("designation");
  const { data: banks } = useDynamicFields("bank_name");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information */}
      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-700">Personal Information</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full Name *</label>
            <input {...register("fullName")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            {errors.fullName && <p className="mt-1 text-xs text-rose-600">{errors.fullName.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
            <input type="email" {...register("email")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
            <input {...register("phone")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Employee ID</label>
            <input {...register("employeeId")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
        </div>
      </fieldset>

      {/* Employment Details */}
      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-700">Employment Details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role *</label>
            <select {...register("role")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option value="master">Master Admin</option>
              <option value="hr_manager">HR Manager</option>
              <option value="sales_manager">Sales Manager</option>
              <option value="sales_executive">Sales Executive</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
            <select {...register("department")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option value="">Select</option>
              {departments?.map((d) => <option key={d.id} value={d.value}>{d.value}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Designation</label>
            <select {...register("designation")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option value="">Select</option>
              {designations?.map((d) => <option key={d.id} value={d.value}>{d.value}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Joining Date</label>
            <input type="date" {...register("joiningDate")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <CanAccess module="hrms" page="employees" action="deactivate">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Employment Status</label>
              <select {...register("employmentStatus")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="active">Active</option>
                <option value="probation">Probation</option>
                <option value="on_notice">On Notice</option>
                <option value="resigned">Resigned</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </CanAccess>
        </div>
      </fieldset>

      {/* Salary & Bank */}
      <fieldset className="rounded-lg border border-slate-200 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-700">Salary & Bank Details</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Basic Salary (AED)</label>
            <input type="number" step="0.01" {...register("basicSalary")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Allowances (AED)</label>
            <input type="number" step="0.01" {...register("allowances")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Bank Name</label>
            <select {...register("bankName")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
              <option value="">Select</option>
              {banks?.map((b) => <option key={b.id} value={b.value}>{b.value}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Bank Account Number</label>
            <input {...register("bankAccountNumber")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? "Saving…" : "Save Employee"}
        </button>
      </div>
    </form>
  );
}
