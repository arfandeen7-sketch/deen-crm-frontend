"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { permissionsService } from "@/services/permissions/permissions.service";
import { useAuthStore, type PermissionStatus } from "@/store/auth.store";
import { isDemoToken } from "@/services/auth/demo";
import { canAccessModule, canAccessPage, canDoAction } from "@/lib/permissions";
import type { AccessMap } from "@/types";

const MASTER_ACCESS: AccessMap = {
  isMaster: true,
  modules: [],
  pages: {},
  actions: {},
};

const PERMISSION_REFRESH_INTERVAL = 5 * 60_000; // 5 minutes

interface PermissionContextValue {
  access: AccessMap | null;
  permissionStatus: PermissionStatus;
  canModule: (moduleKey: string) => boolean;
  canPage: (moduleKey: string, pageKey: string) => boolean;
  canAction: (moduleKey: string, pageKey: string, actionKey: string) => boolean;
  refetch: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(
  undefined,
);

/** Deep-ish comparison of two access maps to detect meaningful changes. */
function accessChanged(a: AccessMap | null, b: AccessMap | null): boolean {
  if (a === b) return false;
  if (!a || !b) return true;
  if (a.isMaster !== b.isMaster) return true;
  if (JSON.stringify(a.modules) !== JSON.stringify(b.modules)) return true;
  if (JSON.stringify(a.pages) !== JSON.stringify(b.pages)) return true;
  if (JSON.stringify(a.actions) !== JSON.stringify(b.actions)) return true;
  return false;
}

export function PermissionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { token, access, permissionStatus, setAccess, setPermissionStatus } =
    useAuthStore();

  // Deduplication: ensure only one fetch runs at a time.
  const inflightRef = useRef<Promise<void> | null>(null);

  const fetchAccess = useCallback(async () => {
    if (!token) return;

    // Demo users get master access immediately.
    if (isDemoToken(token)) {
      setAccess(MASTER_ACCESS);
      setPermissionStatus("ready");
      return;
    }

    // Deduplicate: if a fetch is already running, wait for it.
    if (inflightRef.current) {
      await inflightRef.current;
      return;
    }

    const promise = (async () => {
      try {
        // Only block the UI with a loading state on the very first fetch
        // (no cached access yet). Background refreshes — window focus,
        // periodic interval, route changes — must be silent so open modals
        // and other UI state are never discarded mid-interaction.
        if (!useAuthStore.getState().access) {
          setPermissionStatus("loading");
        }
        const accessMap = await permissionsService.getMyAccess();
        const prev = useAuthStore.getState().access;
        setAccess(accessMap);
        setPermissionStatus("ready");

        // Invalidate protected React Query cache when the access map changes.
        if (accessChanged(prev, accessMap)) {
          queryClient.invalidateQueries();
        }
      } catch {
        setPermissionStatus("error");
      } finally {
        inflightRef.current = null;
      }
    })();

    inflightRef.current = promise;
    await promise;
  }, [token, setAccess, setPermissionStatus, queryClient]);

  // 1. Fetch on authenticated app bootstrap / login.
  useEffect(() => {
    if (token) {
      fetchAccess();
    } else {
      setPermissionStatus("loading");
    }
  }, [token, fetchAccess, setPermissionStatus]);

  // 2. Refresh on browser focus.
  useEffect(() => {
    if (!token) return;
    const handler = () => {
      if (document.visibilityState === "visible") {
        fetchAccess();
      }
    };
    document.addEventListener("visibilitychange", handler);
    window.addEventListener("focus", handler);
    return () => {
      document.removeEventListener("visibilitychange", handler);
      window.removeEventListener("focus", handler);
    };
  }, [token, fetchAccess]);

  // 3. Refresh on route navigation.
  useEffect(() => {
    if (token) fetchAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // 4. Periodic refresh while tab is visible.
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchAccess();
      }
    }, PERMISSION_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [token, fetchAccess]);

  // 5. Listen for manual refetch events (e.g. from 403 handler).
  useEffect(() => {
    const handler = () => {
      fetchAccess();
    };
    window.addEventListener("permissions:refetch", handler);
    return () => window.removeEventListener("permissions:refetch", handler);
  }, [fetchAccess]);

  const value: PermissionContextValue = {
    access,
    permissionStatus,
    canModule: (moduleKey) => canAccessModule(access, moduleKey),
    canPage: (moduleKey, pageKey) => canAccessPage(access, moduleKey, pageKey),
    canAction: (moduleKey, pageKey, actionKey) =>
      canDoAction(access, moduleKey, pageKey, actionKey),
    refetch: fetchAccess,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within PermissionProvider");
  }
  return context;
}
