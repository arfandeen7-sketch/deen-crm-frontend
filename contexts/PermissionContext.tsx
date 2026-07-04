"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { permissionsService } from "@/services/permissions/permissions.service";
import { useAuthStore } from "@/store/auth.store";
import type { ModuleName, PermissionAction } from "@/types";

interface PermissionContextValue {
  permissions: Record<ModuleName, PermissionAction[]> | null;
  loading: boolean;
  hasPermission: (module: ModuleName, action: PermissionAction) => boolean;
  hasModuleAccess: (module: ModuleName) => boolean;
  refetch: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuthStore();
  const [permissions, setPermissions] = useState<Record<ModuleName, PermissionAction[]> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!token || !user) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await permissionsService.getMyPermissions();
      setPermissions(data.permissions);
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    const handler = () => { fetchPermissions(); };
    window.addEventListener("permissions:refetch", handler);
    return () => window.removeEventListener("permissions:refetch", handler);
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (module: ModuleName, action: PermissionAction): boolean => {
      if (!permissions) return false;
      const modulePerms = permissions[module];
      return modulePerms ? modulePerms.includes(action) : false;
    },
    [permissions]
  );

  const hasModuleAccess = useCallback(
    (module: ModuleName): boolean => {
      if (!permissions) return false;
      const modulePerms = permissions[module];
      return modulePerms ? modulePerms.includes("view") : false;
    },
    [permissions]
  );

  const value: PermissionContextValue = {
    permissions,
    loading,
    hasPermission,
    hasModuleAccess,
    refetch: fetchPermissions,
  };

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within PermissionProvider");
  }
  return context;
}
