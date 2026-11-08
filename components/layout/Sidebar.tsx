"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
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
    "/leads/deal-closed",
    "/leads/imported",
    "/leads/assigned",
    "/leads/unassigned",
    "/leads/reports",
  ],
  "/brokers": ["/brokers/create"],
  "/users": ["/users/create"],
  "/hrms/employees": ["/hrms/employees/create"],
  "/hrms/attendance": ["/hrms/attendance/regularization"],
  "/hrms/payroll": ["/hrms/payroll/preview"],
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
  const { user, logout, isMaster } = useAuth();
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
        (i) =>
          (!i.masterOnly || isMaster) &&
          checkNavAccess(canModule, canPage, canAction, i.navAccess),
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
          (i) =>
            (!i.masterOnly || isMaster) &&
            checkNavAccess(canModule, canPage, canAction, i.navAccess),
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
    <div className="flex h-full flex-col bg-black font-sans text-white">
      {/* ── Wordmark ── */}
      <div className="flex items-center justify-between gap-2 px-6 pb-4 pt-7">
        <Link
          href="/dashboard/overview"
          className="inline-flex"
          onClick={onNavigate}
          aria-label="DEEN Properties"
        >
          <Image src="/logo.png" alt="" width={139} height={47} className="h-10 w-auto" priority />
        </Link>
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav-scroll flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {["MENU", "GENERAL"].map((sectionName) => {
          const sectionGroups = NAV_GROUPS.filter(
            (g) => (g.section || "MENU") === sectionName
          );

          const visibleGroups = sectionGroups.filter((group) => {
            if (group.masterOnly && !isMaster) return false;
            if (group.hideForMaster && isMaster) return false;
            if (group.moduleKey && !canModule(group.moduleKey)) return false;
            const visibleItems = group.items.filter(
              (item) =>
                (!item.masterOnly || isMaster) &&
                checkNavAccess(canModule, canPage, canAction, item.navAccess)
            );
            return visibleItems.length > 0;
          });

          if (visibleGroups.length === 0) return null;

          return (
            <div key={sectionName}>
              <div className="mb-2 px-3 text-[12px] capitalize text-white/50">
                {sectionName.toLowerCase()}
              </div>
              <div className="space-y-1">
                {visibleGroups.map((group, gi) => {
                  const visibleItems = group.items.filter(
                    (item) =>
                      (!item.masterOnly || isMaster) &&
                      checkNavAccess(canModule, canPage, canAction, item.navAccess)
                  );

                  const isOpen = openGroups.has(group.id);
                  const isActive = groupContainsActive(pathname, visibleItems);
                  const GroupIcon = group.icon;
                  const stagger = { "--i": gi } as React.CSSProperties;

                  if (group.isSingular && group.href) {
                    const isSingularActive = pathname === group.href || pathname.startsWith(`${group.href}/`);
                    return (
                      <Link
                        key={group.id}
                        href={group.href}
                        onClick={onNavigate}
                        style={stagger}
                        className={cn(
                          "enter-left flex h-11 w-full items-center gap-3 rounded-lg px-3 text-[14px] transition-[background-color,color,transform] duration-[220ms] active:scale-[0.985]",
                          isSingularActive
                            ? "bg-white/15 font-medium text-white"
                            : "text-white/80 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        <GroupIcon
                          strokeWidth={1.5}
                          className={cn("h-5 w-5 shrink-0", isSingularActive ? "text-white" : "text-white/55")}
                        />
                        <span className="flex-1 truncate">{group.title}</span>
                      </Link>
                    );
                  }

                  return (
                    <div key={group.id} className="enter-left" style={stagger}>
                      <button
                        onClick={() => toggleGroup(group.id)}
                        aria-expanded={isOpen}
                        className={cn(
                          "flex h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-[14px] transition-[background-color,color,transform] duration-[220ms] active:scale-[0.985]",
                          isActive
                            ? "bg-white/15 font-medium text-white"
                            : "text-white/80 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        <GroupIcon
                          strokeWidth={1.5}
                          className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-white/55")}
                        />
                        <span className="flex-1 truncate">{group.title}</span>
                        <ChevronDown
                          strokeWidth={1.5}
                          className={cn(
                            "h-4 w-4 shrink-0 text-white/55 transition-transform duration-[220ms]",
                            isOpen && "rotate-180 text-white",
                          )}
                        />
                      </button>

                      <div
                        className={cn(
                          "overflow-hidden transition-[max-height,opacity] duration-[320ms] ease-[var(--ease-out)]",
                          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0",
                        )}
                      >
                        <ul className="mb-1 mt-1 ml-5 space-y-0.5 border-l border-white/20 pl-3">
                          {visibleItems.map((item) => {
                            const itemActive = isItemActive(pathname, item.href);
                            const ItemIcon = item.icon;
                            return (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  onClick={onNavigate}
                                  tabIndex={isOpen ? 0 : -1}
                                  className={cn(
                                    "flex h-10 items-center gap-3 rounded-lg px-3 text-[13.5px] transition-[background-color,color,transform] duration-[220ms] active:scale-[0.985]",
                                    itemActive
                                      ? "bg-white/15 font-medium text-white"
                                      : "text-white/65 hover:bg-white/10 hover:text-white",
                                  )}
                                >
                                  <ItemIcon
                                    strokeWidth={1.5}
                                    className={cn("h-4 w-4 shrink-0", itemActive ? "text-white" : "text-white/55")}
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

      {/* ── Profile pinned to bottom ── */}
      <div className="relative p-3" ref={profileRef}>
        {profileOpen && (
          <div className="pop-in absolute bottom-full left-3 right-3 z-50 mb-2 origin-bottom overflow-hidden rounded-xl border border-white/15 bg-neutral-950 py-1 text-sm shadow-md">
            <div className="border-b border-white/15 px-4 py-3">
              <p className="font-medium text-white">{user?.fullName}</p>
              <p className="truncate text-xs text-white/60">{user?.email}</p>
            </div>
            <Link
              href="/settings/profile"
              onClick={() => {
                setProfileOpen(false);
                if (onNavigate) onNavigate();
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <UserCircle className="h-4 w-4 text-white/55" strokeWidth={1.5} /> Profile
            </Link>
            <Link
              href="/settings/change-password"
              onClick={() => {
                setProfileOpen(false);
                if (onNavigate) onNavigate();
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <KeyRound className="h-4 w-4 text-white/55" strokeWidth={1.5} /> Change Password
            </Link>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-[background-color,transform] duration-[220ms] hover:bg-white/10 active:scale-[0.985]"
          >
            <UserAvatar name={user?.fullName} online className="border-white/20 bg-white/10 text-white" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-white">{user?.fullName}</p>
              <p className="mt-0.5 truncate text-[12px] text-white/60">
                {user ? ROLE_LABELS[user.role] : ""}
              </p>
            </div>
          </button>
          <button
            onClick={() => logout()}
            title="Log out"
            aria-label="Log out"
            className="cursor-pointer rounded-lg p-2.5 text-white/60 transition-[background-color,color,transform] duration-[220ms] hover:bg-white/10 hover:text-white active:scale-95"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
