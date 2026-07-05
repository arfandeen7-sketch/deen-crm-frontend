"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { ModuleName, PermissionAction } from "@/types";

const MODULE_METADATA = [
  { module: "leads" as ModuleName, label: "Leads", category: "Sales", actions: ["view", "add", "edit", "delete"] as PermissionAction[] },
  { module: "leads_reports" as ModuleName, label: "Leads Reports", category: "Sales", actions: ["view", "edit"] as PermissionAction[] },
  { module: "followup" as ModuleName, label: "Follow-up", category: "Sales", actions: ["view", "add", "edit", "delete"] as PermissionAction[] },
  { module: "brokers" as ModuleName, label: "Brokers", category: "Sales", actions: ["view", "add", "edit", "delete"] as PermissionAction[] },
  { module: "hrms_attendance" as ModuleName, label: "Attendance", category: "HRMS", actions: ["view", "add", "edit", "delete"] as PermissionAction[] },
  { module: "hrms_leave" as ModuleName, label: "Leave Management", category: "HRMS", actions: ["view", "add", "edit", "delete"] as PermissionAction[] },
  { module: "hrms_payroll" as ModuleName, label: "Payroll", category: "HRMS", actions: ["view", "add", "edit"] as PermissionAction[] },
  { module: "hrms_employees" as ModuleName, label: "Employees", category: "HRMS", actions: ["view", "add", "edit"] as PermissionAction[] },
  { module: "users" as ModuleName, label: "Users", category: "Administration", actions: ["view", "add", "edit"] as PermissionAction[] },
  { module: "dynamic_fields" as ModuleName, label: "Dynamic Fields", category: "Administration", actions: ["view", "add", "edit", "delete"] as PermissionAction[] },
];

const CATEGORIES = ["Sales", "HRMS", "Administration"];
const ACTIONS: PermissionAction[] = ["view", "add", "edit", "delete"];

interface PermissionMatrixInputProps {
  value: Record<ModuleName, PermissionAction[]>;
  onChange: (permissions: Record<ModuleName, PermissionAction[]>) => void;
  disabled?: boolean;
}

export function PermissionMatrixInput({ value, onChange, disabled = false }: PermissionMatrixInputProps) {
  const [permissions, setPermissions] = useState<Record<ModuleName, PermissionAction[]>>(value);

  useEffect(() => {
    setPermissions(value);
  }, [value]);

  const toggleAction = (module: ModuleName, action: PermissionAction) => {
    if (disabled) return;

    const current = permissions[module] || [];
    let updated: PermissionAction[];

    if (current.includes(action)) {
      updated = current.filter((a) => a !== action);
      if (action === "view") {
        updated = [];
      }
    } else {
      updated = [...current, action];
      if (action !== "view" && !current.includes("view")) {
        updated = ["view", ...updated];
      }
    }

    const newPermissions = { ...permissions, [module]: updated };
    setPermissions(newPermissions);
    onChange(newPermissions);
  };

  const hasAction = (module: ModuleName, action: PermissionAction): boolean => {
    const modulePerms = permissions[module];
    return modulePerms ? modulePerms.includes(action) : false;
  };

  return (
    <div className="space-y-6">
      {CATEGORIES.map((category) => {
        const modules = MODULE_METADATA.filter((m) => m.category === category);
        if (modules.length === 0) return null;

        return (
          <div key={category}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{category}</h4>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-slate-700">Module</th>
                    {ACTIONS.map((action) => (
                      <th key={action} className="px-4 py-2.5 text-center font-medium text-slate-700 capitalize">
                        {action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modules.map((mod) => (
                    <tr key={mod.module} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">{mod.label}</td>
                      {ACTIONS.map((action) => {
                        const available = mod.actions.includes(action);
                        const checked = hasAction(mod.module, action);
                        return (
                          <td key={action} className="px-4 py-3 text-center">
                            {available ? (
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={disabled}
                                onChange={() => toggleAction(mod.module, action)}
                                className={cn(
                                  "h-4 w-4 rounded border-slate-300 text-gray-900 focus:ring-indigo-500",
                                  disabled && "cursor-not-allowed opacity-50"
                                )}
                              />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
