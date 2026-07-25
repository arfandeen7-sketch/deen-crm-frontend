"use client";

import { usePermissions } from "@/contexts/PermissionContext";
import { useAuth } from "@/hooks/useAuth";
import type { PermissionRequirement } from "@/lib/auth-manifest";
import { SELF_SERVICE_QUERIES } from "@/lib/auth-manifest";

/**
 * Returns `true` if the current user has the permission required for a query.
 * For self-service queries (e.g. me:profile, notifications), always returns true
 * as long as the user is authenticated and permissions are ready.
 */
export function useQueryEnabled(
  requirement: PermissionRequirement | string | undefined,
): boolean {
  const { permissionStatus } = useAuth();
  const { canModule, canPage, canAction } = usePermissions();

  // Wait for permissions to be ready before enabling any protected query.
  if (permissionStatus !== "ready") return false;

  // Self-service queries only need authentication.
  if (typeof requirement === "string" && SELF_SERVICE_QUERIES.has(requirement)) {
    return true;
  }

  // No requirement means self-service / authenticated-only.
  if (!requirement) return true;

  const req: PermissionRequirement =
    typeof requirement === "string"
      ? { module: requirement }
      : requirement;

  if (req.action && req.page) {
    return canAction(req.module, req.page, req.action);
  }
  if (req.page) {
    return canPage(req.module, req.page);
  }
  return canModule(req.module);
}

/**
 * Retry function that does not retry on 403 (forbidden) or 401 (unauthorized).
 * Retries up to 2 times for other errors.
 */
export function retrySkipAuth(failCount: number, error: unknown): boolean {
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 403 || status === 401) return false;
  return failCount < 2;
}
