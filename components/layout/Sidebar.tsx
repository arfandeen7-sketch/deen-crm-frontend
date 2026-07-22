"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, X, LogOut, KeyRound, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/contexts/PermissionContext";
import { NAV_GROUPS, type NavItem, type NavAccess } from "./nav.config";
import { ROLE_LABELS } from "@/constants";
import { UserAvatar } from "@/components/ui/Avatar";

const SIDEBAR_STORAGE_KEY = "deen_sidebar_open";

/**
 * Named sub-routes that have their own dedicated nav items.
 * The parent "list" route must NOT be highlighted when on these paths.
 */
const PARENT_EXCLUSIONS: Record<string, string[]> = {
  "/leads": [
    "/leads/untouched",
    "/leads/fresh",
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
  "/my-hr/attendance": ["/my-hr/attendance-history", "/my-hr/calendar", "/my-hr/attendance-correction", "/my-hr/leave", "/my-hr/payslips", "/my-hr/profile"],
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

function checkNavAccess(
  canModule: (m: string) => boolean,
  canPage: (m: string, p: string) => boolean,
  canAction: (m: string, p: string, a: string) => boolean,
  navAccess: NavAccess | undefined,
): boolean {
  if (!navAccess) return true;
  const { module, page, action } = navAccess;
  if (action && page) return canAction(module, page, action);
  if (page) return canPage(module, page);
  return canModule(module);
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { role, user, logout } = useAuth();
  const { canModule, canPage, canAction } = usePermissions();

  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set<string>());
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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
        (i) => checkNavAccess(canModule, canPage, canAction, i.navAccess),
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
          (i) => checkNavAccess(canModule, canPage, canAction, i.navAccess),
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
  }, [pathname, canModule, canPage, canAction]);

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
    <div className="flex h-full flex-col bg-[#151515] text-zinc-400 border-r border-zinc-800/30 font-sans">
      {/* ── Logo ── */}
      <div className="flex items-center justify-between gap-2 px-6 py-6">
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
      <nav className="flex-1 overflow-y-auto px-4 py-2 sidebar-nav-scroll space-y-6">
        {["MENU", "GENERAL"].map((sectionName) => {
          const sectionGroups = NAV_GROUPS.filter(
            (g) => (g.section || "MENU") === sectionName
          );

          // Filter by visibility/permissions
          const visibleGroups = sectionGroups.filter((group) => {
            if (group.roles && role && !group.roles.includes(role)) return false;
            if (group.moduleKey && !canModule(group.moduleKey)) return false;
            const visibleItems = group.items.filter(
              (item) => checkNavAccess(canModule, canPage, canAction, item.navAccess)
            );
            return visibleItems.length > 0 || group.isSingular;
          });

          if (visibleGroups.length === 0) return null;

          return (
            <div key={sectionName}>
              <div className="px-3 mb-3 text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                {sectionName}
              </div>
              <div className="space-y-1">
                {visibleGroups.map((group) => {
                  const visibleItems = group.items.filter(
                    (item) => checkNavAccess(canModule, canPage, canAction, item.navAccess)
                  );

                  const isOpen = openGroups.has(group.id);
                  const isActive = groupContainsActive(pathname, visibleItems);
                  const GroupIcon = group.icon;

                  // Singular items like Dashboard (Overview)
                  if (group.isSingular && group.href) {
                    const isSingularActive = pathname === group.href || pathname.startsWith(`${group.href}/`);
                    return (
                      <Link
                        key={group.id}
                        href={group.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 font-medium",
                          isSingularActive
                            ? "bg-[#242424] text-white"
                            : "text-zinc-400 hover:bg-[#242424]/40 hover:text-white",
                        )}
                      >
                        <GroupIcon
                          className={cn(
                            "h-5 w-5 shrink-0",
                            isSingularActive ? "text-white" : "text-zinc-500",
                          )}
                        />
                        <span className="flex-1 truncate">{group.title}</span>
                      </Link>
                    );
                  }

                  return (
                    <div key={group.id} className="mb-1">
                      {/* Group header */}
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-200 font-medium",
                          isActive
                            ? "text-white bg-[#242424]/30"
                            : "text-zinc-400 hover:bg-[#242424]/40 hover:text-white",
                        )}
                      >
                        <GroupIcon
                          className={cn(
                            "h-5 w-5 shrink-0",
                            isActive ? "text-white" : "text-zinc-500",
                          )}
                        />
                        <span className="flex-1 truncate">{group.title}</span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-zinc-600 transition-transform duration-200",
                            isOpen && "rotate-180 text-zinc-400",
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
                        <ul className="mb-1 mt-1 space-y-1 pl-4 border-l border-zinc-800/50 ml-5">
                          {visibleItems.map((item) => {
                            const itemActive = isItemActive(pathname, item.href);
                            const ItemIcon = item.icon;
                            return (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  onClick={onNavigate}
                                  className={cn(
                                    "flex items-center gap-3 rounded-md py-2 px-3 text-sm transition-all duration-200 font-medium",
                                    itemActive
                                      ? "bg-[#242424] text-white"
                                      : "text-zinc-500 hover:bg-[#242424]/20 hover:text-zinc-300",
                                  )}
                                >
                                  <ItemIcon
                                    className={cn(
                                      "h-4 w-4 shrink-0",
                                      itemActive ? "text-white" : "text-zinc-600"
                                    )}
                                  />
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
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Footer with Profile Card ── */}
      <div className="relative border-t border-zinc-800/40 p-4" ref={profileRef}>
        {profileOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 z-50 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-2xl text-sm">
            <div className="border-b border-zinc-800 px-4 py-3">
              <p className="font-semibold text-white">{user?.fullName}</p>
              <p className="truncate text-xs font-medium text-zinc-400">{user?.email}</p>
            </div>
            <Link
              href="/settings/profile"
              onClick={() => {
                setProfileOpen(false);
                if (onNavigate) onNavigate();
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <UserCircle className="h-4 w-4 text-zinc-500" /> Profile
            </Link>
            <Link
              href="/settings/change-password"
              onClick={() => {
                setProfileOpen(false);
                if (onNavigate) onNavigate();
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <KeyRound className="h-4 w-4 text-zinc-500" /> Change Password
            </Link>
            <button
              onClick={() => {
                setProfileOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2.5 border-t border-zinc-800 px-4 py-2.5 font-medium text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        )}

        <button
          onClick={() => setProfileOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-xl bg-[#242424] p-3 text-left hover:bg-[#2b2b2b] transition-colors border border-zinc-800/30 cursor-pointer"
        >
          <UserAvatar name={user?.fullName} className="ring-2 ring-zinc-800 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
            <p className="text-[11px] font-medium text-zinc-400 truncate mt-0.5">
              {user ? ROLE_LABELS[user.role] : ""}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
