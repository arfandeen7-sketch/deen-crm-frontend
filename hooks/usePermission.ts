"use client";

import { usePermissions } from "@/contexts/PermissionContext";
import { useAuth } from "@/hooks/useAuth";

/**
 * Maps a dotted permission key to the 3-level permission system.
 * Examples:
 *   "hrms.attendance.view"            → canPage("hrms", "attendance")
 *   "hrms.attendance_dashboard.view"  → canPage("hrms", "attendance_dashboard")
 *   "hrms.attendance.create"          → canAction("hrms", "attendance", "create")
 */
export function usePermission(key: string): boolean {
  const { isMaster } = useAuth();
  const { canModule, canPage, canAction } = usePermissions();

  if (isMaster) return true;

  const parts = key.split(".");
  if (parts.length < 2) return canModule(parts[0]);

  const [module, page, action] = parts;

  if (!action) return canPage(module, page);
  if (action === "view") return canPage(module, page);
  return canAction(module, page, action);
}
