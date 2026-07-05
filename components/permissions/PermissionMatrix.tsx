"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { permissionsService } from "@/services/permissions/permissions.service";
import { getErrorMessage } from "@/services/api/client";
import type { ModuleName, PermissionAction, PermissionMetadata } from "@/types";

const MODULE_METADATA: PermissionMetadata["modules"] = [
  { module: "leads", label: "Leads", category: "Sales", actions: ["view", "add", "edit", "delete"] },
  { module: "leads_reports", label: "Leads Reports", category: "Sales", actions: ["view", "edit"] },
  { module: "followup", label: "Follow-up", category: "Sales", actions: ["view", "add", "edit", "delete"] },
  { module: "brokers", label: "Brokers", category: "Sales", actions: ["view", "add", "edit", "delete"] },
  { module: "hrms_attendance", label: "Attendance", category: "HRMS", actions: ["view", "add", "edit", "delete"] },
  { module: "hrms_leave", label: "Leave Management", category: "HRMS", actions: ["view", "add", "edit", "delete"] },
  { module: "hrms_payroll", label: "Payroll", category: "HRMS", actions: ["view", "add", "edit"] },
  { module: "hrms_employees", label: "Employees", category: "HRMS", actions: ["view", "add", "edit"] },
  { module: "users", label: "Users", category: "Administration", actions: ["view", "add", "edit"] },
  { module: "dynamic_fields", label: "Dynamic Fields", category: "Administration", actions: ["view", "add", "edit", "delete"] },
];

const CATEGORIES = ["Sales", "HRMS", "Administration"];
const ACTIONS: PermissionAction[] = ["view", "add", "edit", "delete"];

interface PermissionMatrixProps {
  userId: string;
  roleLabel: string;
}

export function PermissionMatrix({ userId, roleLabel }: PermissionMatrixProps) {
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [permissions, setPermissions] = useState<Record<ModuleName, PermissionAction[]>>({} as Record<ModuleName, PermissionAction[]>);
  const [roleDefaults, setRoleDefaults] = useState<Record<ModuleName, PermissionAction[]>>({} as Record<ModuleName, PermissionAction[]>);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    async function loadPermissions() {
      try {
        setLoading(true);
        const data = await permissionsService.getUserPermissions(userId);
        setPermissions(data.permissions);
        setRoleDefaults(data.permissions);
        setOverrideEnabled(false);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    }
    loadPermissions();
  }, [userId]);

  const toggleAction = (module: ModuleName, action: PermissionAction) => {
    setPermissions((prev) => {
      const current = prev[module] || [];
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

      return { ...prev, [module]: updated };
    });
  };

  const hasAction = (module: ModuleName, action: PermissionAction): boolean => {
    const modulePerms = overrideEnabled ? permissions[module] : roleDefaults[module];
    return modulePerms ? modulePerms.includes(action) : false;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await permissionsService.updateUserPermissions(userId, permissions);
      toast.success("Permissions updated");
      setRoleDefaults(permissions);
      setOverrideEnabled(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      const data = await permissionsService.resetUserPermissions(userId);
      setPermissions(data.permissions);
      setRoleDefaults(data.permissions);
      setOverrideEnabled(false);
      setShowResetModal(false);
      toast.success("Permissions reset to role defaults");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-gray-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">Override Role-Based Permissions</p>
          <p className="mt-0.5 text-xs text-slate-500">
            When disabled, permissions are determined by the user&apos;s role ({roleLabel}). Enable to set custom permissions.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={overrideEnabled}
          onClick={() => setOverrideEnabled((v) => !v)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
            overrideEnabled ? "bg-gray-900" : "bg-slate-200",
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

      {!overrideEnabled && (
        <p className="text-xs text-slate-400">
          The grid below shows the current role-based permissions (read-only).
        </p>
      )}

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
                                  disabled={!overrideEnabled}
                                  onChange={() => toggleAction(mod.module, action)}
                                  className={cn(
                                    "h-4 w-4 rounded border-slate-300 text-gray-900 focus:ring-indigo-500",
                                    !overrideEnabled && "cursor-not-allowed opacity-50"
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

      {overrideEnabled && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowResetModal(true)}
            disabled={saving}
          >
            Reset to Role Defaults
          </Button>
          <Button type="button" onClick={handleSave} loading={saving}>
            Save Permissions
          </Button>
        </div>
      )}

      <ConfirmModal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleReset}
        title="Reset to role defaults?"
        message="This will discard all custom permissions and restore the default permissions for this user's role."
        confirmLabel="Reset"
        danger
        loading={saving}
      />
    </div>
  );
}
