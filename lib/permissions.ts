import type { AccessMap } from "@/types";

export function canAccessModule(
  access: AccessMap | null | undefined,
  moduleKey: string,
): boolean {
  if (!access) return false;
  if (access.isMaster) return true;
  if (!Array.isArray(access.modules)) return false;
  return access.modules.includes(moduleKey);
}

export function canAccessPage(
  access: AccessMap | null | undefined,
  moduleKey: string,
  pageKey: string,
): boolean {
  if (!access) return false;
  if (access.isMaster) return true;
  if (!access.pages || typeof access.pages !== "object") return false;
  return access.pages[moduleKey]?.includes(pageKey) ?? false;
}

export function canDoAction(
  access: AccessMap | null | undefined,
  moduleKey: string,
  pageKey: string,
  actionKey: string,
): boolean {
  if (!access) return false;
  if (access.isMaster) return true;
  if (!access.actions || typeof access.actions !== "object") return false;
  return access.actions[`${moduleKey}:${pageKey}`]?.includes(actionKey) ?? false;
}
