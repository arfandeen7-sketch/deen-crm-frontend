"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Building2, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { can } from "@/lib/rbac";
import { NAV_GROUPS, type NavItem } from "./nav.config";
import { APP_NAME } from "@/constants";

const SIDEBAR_STORAGE_KEY = "deen_sidebar_open";

/**
 * Named sub-routes that have their own dedicated nav items.
 * The parent "list" route must NOT be highlighted when on these paths.
 */
const PARENT_EXCLUSIONS: Record<string, string[]> = {
  "/leads": [
    "/leads/untouched",
    "/leads/imported",
    "/leads/assigned",
    "/leads/unassigned",
    "/leads/reports",
    "/leads/create",
    "/leads/import",
  ],
  "/brokers": ["/brokers/create"],
  "/users": ["/users/create"],
  "/hrms/employees": ["/hrms/employees/create"],
};

function isItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  const exclusions = PARENT_EXCLUSIONS[href];
  if (exclusions?.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return false;
  }
  return pathname.startsWith(`${href}/`);
}

function groupContainsActive(pathname: string, items: NavItem[]): boolean {
  return items.some((item) => isItemActive(pathname, item.href));
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role, hasModule } = useAuth();

  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set<string>());

  // On mount: hydrate from localStorage and ensure the active group is open.
  useEffect(() => {
    let persisted: string[] = [];
    try {
      const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (raw) persisted = JSON.parse(raw) as string[];
    } catch {
      // ignore parse errors
    }

    const activeIds = NAV_GROUPS.filter((g) => {
      const visible = g.items.filter(
        (i) => !i.permission || can(role, i.permission),
      );
      return visible.length > 0 && groupContainsActive(pathname, visible);
    }).map((g) => g.id);

    setOpenGroups(new Set([...persisted, ...activeIds]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-expand the group of the current route on every navigation.
  useEffect(() => {
    setOpenGroups((prev) => {
      let changed = false;
      const next = new Set(prev);
      NAV_GROUPS.forEach((g) => {
        const visible = g.items.filter(
          (i) => !i.permission || can(role, i.permission),
        );
        if (
          visible.length > 0 &&
          groupContainsActive(pathname, visible) &&
          !next.has(g.id)
        ) {
          next.add(g.id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [pathname, role]);

  // Persist open-group state to localStorage.
  useEffect(() => {
    try {
      localStorage.setItem(
        SIDEBAR_STORAGE_KEY,
        JSON.stringify([...openGroups]),
      );
    } catch {
      // ignore storage errors
    }
  }, [openGroups]);

  const toggleGroup = useCallback((id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-400 border-r border-zinc-800/50">
      {/* ── Logo ── */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/50 px-6 py-5">
        <Link
          href="/dashboard/overview"
          className="flex items-center gap-2.5"
          onClick={onNavigate}
        >
          <Image
            src="/deen-new-logo.png"
            alt="DEEN Properties"
            width={200}
            height={40}
            className="h-12 w-auto object-contain"
            priority
          />
        </Link>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="rounded p-1 text-zinc-500 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-zinc-800">
        {NAV_GROUPS.map((group) => {
          if (group.moduleKey && !hasModule(group.moduleKey)) return null;
          const visibleItems = group.items.filter(
            (item) => !item.permission || can(role, item.permission),
          );
          if (visibleItems.length === 0) return null;

          const isOpen = openGroups.has(group.id);
          const isActive = groupContainsActive(pathname, visibleItems);
          const GroupIcon = group.icon;

          return (
            <div key={group.id} className="mb-0.5">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-all duration-200",
                  isActive
                    ? "font-medium text-white"
                    : "font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white",
                )}
              >
                <GroupIcon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-amber-500" : "text-zinc-500",
                  )}
                />
                <span className="flex-1 truncate">{group.title}</span>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 shrink-0 text-zinc-600 transition-transform duration-200",
                    isOpen && "rotate-90",
                  )}
                />
              </button>

              {/* Collapsible items panel */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200 ease-in-out",
                  isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0",
                )}
              >
                <ul className="mb-1 mt-0.5 space-y-0.5">
                  {visibleItems.map((item) => {
                    const itemActive = isItemActive(pathname, item.href);
                    const ItemIcon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onNavigate}
                          className={cn(
                            "flex items-center gap-3 rounded-md py-1.5 pl-10 pr-3 text-sm transition-all duration-200",
                            itemActive
                              ? "bg-amber-500/10 font-medium text-amber-500"
                              : "font-medium text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300",
                          )}
                        >
                          <ItemIcon className={cn("h-4 w-4 shrink-0", itemActive ? "text-amber-500" : "text-zinc-600")} />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-zinc-800/50 px-6 py-4 text-[10px] font-medium uppercase tracking-widest text-zinc-600">
        {APP_NAME}
      </div>
    </div>
  );
}
