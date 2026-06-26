"use client";

import { useState, useMemo } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserValues,
  type UpdateUserValues,
} from "@/schemas/user.schema";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import { MODULE_ACCESS_OPTIONS, ROLE_LABELS } from "@/constants";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

type SubmitValues = CreateUserValues & Pick<UpdateUserValues, "moduleAccess" | "moduleAccessOverridden">;

const MODULE_GROUPS = Array.from(
  new Set(MODULE_ACCESS_OPTIONS.map((m) => m.group)),
);

export function UserForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: User;
  submitting?: boolean;
  onSubmit: (values: SubmitValues) => void;
  onCancel?: () => void;
}) {
  const isEdit = !!initial;

  const [overrideEnabled, setOverrideEnabled] = useState<boolean>(
    initial?.moduleAccessOverridden ?? false,
  );
  const [selectedModules, setSelectedModules] = useState<string[]>(
    initial?.moduleAccess ?? [],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(
      isEdit ? updateUserSchema : createUserSchema,
    ) as unknown as Resolver<CreateUserValues>,
    defaultValues: {
      fullName: initial?.fullName ?? "",
      email: initial?.email ?? "",
      password: "",
      phone: initial?.phone ?? "",
      role: initial?.role ?? "sales_executive",
    },
  });

  function toggleModule(key: string) {
    setSelectedModules((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function toggleGroup(group: string, checked: boolean) {
    const keys = MODULE_ACCESS_OPTIONS.filter((m) => m.group === group).map((m) => m.key);
    if (checked) {
      setSelectedModules((prev) => Array.from(new Set([...prev, ...keys])));
    } else {
      setSelectedModules((prev) => prev.filter((k) => !keys.includes(k)));
    }
  }

  function isGroupAllSelected(group: string) {
    const keys = MODULE_ACCESS_OPTIONS.filter((m) => m.group === group).map((m) => m.key);
    return keys.every((k) => selectedModules.includes(k));
  }

  const groupedOptions = useMemo(
    () =>
      MODULE_GROUPS.map((group) => ({
        group,
        options: MODULE_ACCESS_OPTIONS.filter((m) => m.group === group),
      })),
    [],
  );

  function handleFormSubmit(values: CreateUserValues) {
    if (isEdit) {
      onSubmit({
        ...values,
        moduleAccess: overrideEnabled ? selectedModules : undefined,
        moduleAccessOverridden: overrideEnabled,
      });
    } else {
      onSubmit(values as SubmitValues);
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" required error={errors.fullName?.message}>
          <Input invalid={!!errors.fullName} {...register("fullName")} />
        </Field>
        <Field label="Email" required error={errors.email?.message}>
          <Input type="email" disabled={isEdit} invalid={!!errors.email} {...register("email")} />
        </Field>
        {!isEdit && (
          <Field label="Password" required error={errors.password?.message}>
            <Input type="password" invalid={!!errors.password} {...register("password")} />
          </Field>
        )}
        <Field label="Phone" error={errors.phone?.message}>
          <Input {...register("phone")} />
        </Field>
        <Field label="Role" required error={errors.role?.message}>
          <Select {...register("role")}>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
      </div>

      {isEdit && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Custom Module Access</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Override the role defaults and grant specific module access to this user.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={overrideEnabled}
              onClick={() => setOverrideEnabled((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
                overrideEnabled ? "bg-indigo-600" : "bg-slate-200",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform",
                  overrideEnabled ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>

          {overrideEnabled && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {selectedModules.length} of {MODULE_ACCESS_OPTIONS.length} modules selected
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-xs text-indigo-600 hover:underline"
                    onClick={() => setSelectedModules(MODULE_ACCESS_OPTIONS.map((m) => m.key))}
                  >
                    Select all
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    className="text-xs text-slate-500 hover:underline"
                    onClick={() => setSelectedModules([])}
                  >
                    Clear all
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {groupedOptions.map(({ group, options }) => (
                  <div key={group} className="rounded-lg border border-slate-200 bg-white p-3">
                    <label className="mb-2.5 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isGroupAllSelected(group)}
                        onChange={(e) => toggleGroup(group, e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {group}
                      </span>
                    </label>
                    <ul className="space-y-2">
                      {options.map((mod) => (
                        <li key={mod.key}>
                          <label className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={selectedModules.includes(mod.key)}
                              onChange={() => toggleModule(mod.key)}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-slate-700 group-hover:text-slate-900">
                              {mod.label}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {selectedModules.length === 0 && (
                <p className="text-xs text-amber-600">
                  No modules selected — the user will have no access when override is enabled.
                </p>
              )}
            </div>
          )}

          {!overrideEnabled && (
            <p className="text-xs text-slate-400">
              Access is currently determined by the user&apos;s role. Enable the toggle above to assign custom modules.
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {isEdit ? "Save Changes" : "Create User"}
        </Button>
      </div>
    </form>
  );
}
