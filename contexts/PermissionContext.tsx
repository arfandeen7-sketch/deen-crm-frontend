"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { permissionsService } from "@/services/permissions/permissions.service";
import { useAuthStore } from "@/store/auth.store";
import { isDemoToken } from "@/services/auth/demo";
import { canAccessModule, canAccessPage, canDoAction } from "@/lib/permissions";
import type { AccessMap } from "@/types";

const MASTER_ACCESS: AccessMap = {
  isMaster: true,
  modules: [],
  pages: {},
  actions: {},
};

interface PermissionContextValue {
  access: AccessMap | null;
  canModule: (moduleKey: string) => boolean;
  canPage: (moduleKey: string, pageKey: string) => boolean;
  canAction: (moduleKey: string, pageKey: string, actionKey: string) => boolean;
  refetch: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(
  undefined,
);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { token, access, setAccess } = useAuthStore();

  const fetchAccess = useCallback(async () => {
    if (!token) return;

    if (isDemoToken(token)) {
      setAccess(MASTER_ACCESS);
      return;
    }

    try {
      const accessMap = await permissionsService.getMyAccess();
      setAccess(accessMap);
    } catch {
      // Keep existing access on failure
    }
  }, [token, setAccess]);

  useEffect(() => {
    if (token) fetchAccess();
  }, [token, fetchAccess]);

  useEffect(() => {
    const handler = () => {
      fetchAccess();
    };
    window.addEventListener("permissions:refetch", handler);
    return () => window.removeEventListener("permissions:refetch", handler);
  }, [fetchAccess]);

  const value: PermissionContextValue = {
    access,
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
