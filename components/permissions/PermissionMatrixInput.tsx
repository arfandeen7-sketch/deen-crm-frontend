"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { permissionsService } from "@/services/permissions/permissions.service";
import {
  buildGrantsFromSelection,
  initSelectionFromGrants,
  type PermissionSelection,
} from "@/lib/buildGrants";
import type { GrantEntry, RegistryModule, RegistryPage } from "@/types";

// ── Indeterminate checkbox ──────────────────────────────────────────────────

interface IndeterminateCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  indeterminate?: boolean;
}

function IndeterminateCheckbox({
  indeterminate,
  className,
  ...props
}: IndeterminateCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border-slate-300 text-gray-900 accent-gray-900 cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

type ModuleState = "checked" | "indeterminate" | "unchecked";
type PageState = "checked" | "indeterminate" | "unchecked";

function getModuleState(mod: RegistryModule, sel: PermissionSelection): ModuleState {
  const modSel = sel[mod.key];
  if (!modSel) return "unchecked";
  let total = 0;
  let selected = 0;
  for (const page of mod.pages) {
    total += page.actions.length;
    selected += modSel[page.key]?.size ?? 0;
  }
  if (selected === 0) return "unchecked";
  if (selected === total) return "checked";
  return "indeterminate";
}

function getPageState(moduleKey: string, page: RegistryPage, sel: PermissionSelection): PageState {
  const pageSel = sel[moduleKey]?.[page.key];
  if (!pageSel || pageSel.size === 0) return "unchecked";
  if (pageSel.size === page.actions.length) return "checked";
  return "indeterminate";
}

// ── Main Component ───────────────────────────────────────────────────────────

interface PermissionMatrixInputProps {
  userId?: string;
  onChange: (grants: GrantEntry[]) => void;
}

export function PermissionMatrixInput({ userId, onChange }: PermissionMatrixInputProps) {
  const [registry, setRegistry] = useState<RegistryModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<PermissionSelection>({});
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [openPages, setOpenPages] = useState<Set<string>>(new Set());

  // Notify parent whenever selection changes
  const notifyParent = useCallback(
    (sel: PermissionSelection) => {
      onChange(buildGrantsFromSelection(sel));
    },
    [onChange],
  );

  // Fetch registry + optional initial grants
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [reg, grants] = await Promise.all([
          permissionsService.getRegistry(),
          userId ? permissionsService.getUserGrants(userId).then((r) => r.grants) : Promise.resolve<GrantEntry[]>([]),
        ]);
        if (cancelled) return;
        setRegistry(reg);
        const initialSel = initSelectionFromGrants(grants);
        setSelection(initialSel);
        // Auto-expand modules that have any grants
        const expanded = new Set(Object.keys(initialSel));
        setOpenModules(expanded);
        notifyParent(initialSel);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId, notifyParent]);

  // ── Toggle logic ─────────────────────────────────────────────────────────

  function toggleModule(mod: RegistryModule, checked: boolean) {
    setSelection((prev) => {
      const next = { ...prev };
      if (checked) {
        next[mod.key] = {};
        for (const page of mod.pages) {
          next[mod.key][page.key] = new Set(page.actions.map((a) => a.key));
        }
      } else {
        delete next[mod.key];
      }
      notifyParent(next);
      return next;
    });
  }

  function togglePage(moduleKey: string, page: RegistryPage, checked: boolean) {
    setSelection((prev) => {
      const next = { ...prev };
      if (checked) {
        if (!next[moduleKey]) next[moduleKey] = {};
        next[moduleKey] = { ...next[moduleKey], [page.key]: new Set(page.actions.map((a) => a.key)) };
      } else {
        if (next[moduleKey]) {
          const mod = { ...next[moduleKey] };
          delete mod[page.key];
          if (Object.keys(mod).length === 0) {
            delete next[moduleKey];
          } else {
            next[moduleKey] = mod;
          }
        }
      }
      notifyParent(next);
      return next;
    });
  }

  function toggleAction(moduleKey: string, pageKey: string, actionKey: string, checked: boolean) {
    setSelection((prev) => {
      const next = { ...prev };
      if (checked) {
        if (!next[moduleKey]) next[moduleKey] = {};
        const pageSet = new Set(next[moduleKey][pageKey] ?? []);
        pageSet.add(actionKey);
        next[moduleKey] = { ...next[moduleKey], [pageKey]: pageSet };
      } else {
        if (next[moduleKey]?.[pageKey]) {
          const pageSet = new Set(next[moduleKey][pageKey]);
          pageSet.delete(actionKey);
          if (pageSet.size === 0) {
            const mod = { ...next[moduleKey] };
            delete mod[pageKey];
            if (Object.keys(mod).length === 0) {
              delete next[moduleKey];
            } else {
              next[moduleKey] = mod;
            }
          } else {
            next[moduleKey] = { ...next[moduleKey], [pageKey]: pageSet };
          }
        }
      }
      notifyParent(next);
      return next;
    });
  }

  // ── Accordion toggles ────────────────────────────────────────────────────

  function toggleModuleOpen(key: string) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function togglePageOpen(key: string) {
    setOpenPages((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-gray-900" />
      </div>
    );
  }

  if (registry.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-400">
        Permission registry could not be loaded.
      </p>
    );
  }

  return (
    <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200">
      {registry.map((mod) => {
        const modState = getModuleState(mod, selection);
        const modOpen = openModules.has(mod.key);

        return (
          <div key={mod.key}>
            {/* Module row */}
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-3">
              <button
                type="button"
                onClick={() => toggleModuleOpen(mod.key)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
                aria-label={modOpen ? "Collapse" : "Expand"}
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform duration-150",
                    modOpen && "rotate-90",
                  )}
                />
              </button>
              <IndeterminateCheckbox
                checked={modState === "checked"}
                indeterminate={modState === "indeterminate"}
                onChange={(e) => toggleModule(mod, e.target.checked)}
              />
              <span className="text-sm font-semibold text-slate-800">{mod.label}</span>
            </div>

            {/* Pages */}
            {modOpen && (
              <div className="divide-y divide-slate-100">
                {mod.pages.map((page) => {
                  const pageState = getPageState(mod.key, page, selection);
                  const pageKey = `${mod.key}:${page.key}`;
                  const pageOpen = openPages.has(pageKey);

                  return (
                    <div key={page.key} className="pl-10">
                      {/* Page row */}
                      <div className="flex items-center gap-3 px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => togglePageOpen(pageKey)}
                          className="text-slate-400 hover:text-slate-700 transition-colors"
                          aria-label={pageOpen ? "Collapse" : "Expand"}
                        >
                          <ChevronRight
                            className={cn(
                              "h-3.5 w-3.5 transition-transform duration-150",
                              pageOpen && "rotate-90",
                            )}
                          />
                        </button>
                        <IndeterminateCheckbox
                          checked={pageState === "checked"}
                          indeterminate={pageState === "indeterminate"}
                          onChange={(e) => togglePage(mod.key, page, e.target.checked)}
                        />
                        <span className="text-sm font-medium text-slate-700">{page.label}</span>
                      </div>

                      {/* Actions */}
                      {pageOpen && (
                        <div className="flex flex-wrap gap-x-6 gap-y-2 px-14 pb-3 pt-1">
                          {page.actions.map((action) => {
                            const checked =
                              selection[mod.key]?.[page.key]?.has(action.key) ?? false;
                            return (
                              <label
                                key={action.key}
                                className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) =>
                                    toggleAction(mod.key, page.key, action.key, e.target.checked)
                                  }
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-gray-900 accent-gray-900 cursor-pointer"
                                />
                                <span className="capitalize">{action.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
