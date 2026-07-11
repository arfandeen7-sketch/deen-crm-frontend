import type { GrantEntry } from "@/types";

export type PermissionSelection = Record<string, Record<string, Set<string>>>;

export function buildGrantsFromSelection(selection: PermissionSelection): GrantEntry[] {
  const grants: GrantEntry[] = [];

  for (const moduleKey of Object.keys(selection)) {
    const pages = selection[moduleKey];
    const activePageKeys = Object.keys(pages).filter((pk) => pages[pk].size > 0);
    if (activePageKeys.length === 0) continue;

    grants.push({ moduleKey, pageKey: "", actionKey: "", granted: true });

    for (const pageKey of activePageKeys) {
      grants.push({ moduleKey, pageKey, actionKey: "", granted: true });
      for (const actionKey of pages[pageKey]) {
        grants.push({ moduleKey, pageKey, actionKey, granted: true });
      }
    }
  }

  return grants;
}

export function initSelectionFromGrants(grants: GrantEntry[]): PermissionSelection {
  const selection: PermissionSelection = {};

  for (const grant of grants) {
    if (!grant.granted || !grant.moduleKey || !grant.pageKey || !grant.actionKey) continue;
    if (!selection[grant.moduleKey]) selection[grant.moduleKey] = {};
    if (!selection[grant.moduleKey][grant.pageKey]) {
      selection[grant.moduleKey][grant.pageKey] = new Set<string>();
    }
    selection[grant.moduleKey][grant.pageKey].add(grant.actionKey);
  }

  return selection;
}
