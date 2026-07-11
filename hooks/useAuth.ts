"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth/auth.service";
import { permissionsService } from "@/services/permissions/permissions.service";
import { loginActivityService } from "@/services/hrms/login-activity.service";
import { isDemoToken } from "@/services/auth/demo";
import { canAccessModule, canAccessPage, canDoAction } from "@/lib/permissions";
import type { AccessMap } from "@/types";

const MASTER_ACCESS: AccessMap = {
  isMaster: true,
  modules: [],
  pages: {},
  actions: {},
};

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, access, hydrated, setAuth, setAccess, clear } =
    useAuthStore();

  async function login(email: string, password: string) {
    const res = await authService.login(email, password);
    setAuth(res.token, res.user);
    if (isDemoToken(res.token)) {
      setAccess(MASTER_ACCESS);
    } else {
      loginActivityService.recordLogin().catch(() => {});
      try {
        const accessMap = await permissionsService.getMyAccess();
        setAccess(accessMap);
      } catch {
        // ignore — PermissionProvider will retry on mount
      }
    }
    return res.user;
  }

  async function logout() {
    if (!isDemoToken(token)) {
      try {
        await loginActivityService.recordLogout();
      } catch {
        /* ignore */
      }
    }
    await authService.logout();
    clear();
    queryClient.clear();
    router.replace("/login");
  }

  function hasModule(key: string): boolean {
    return canAccessModule(access, key);
  }

  function canPage(moduleKey: string, pageKey: string): boolean {
    return canAccessPage(access, moduleKey, pageKey);
  }

  function canAction(moduleKey: string, pageKey: string, actionKey: string): boolean {
    return canDoAction(access, moduleKey, pageKey, actionKey);
  }

  return {
    user,
    token,
    access,
    hydrated,
    isAuthenticated: Boolean(token),
    role: user?.role,
    isMaster: access?.isMaster ?? false,
    hasModule,
    canPage,
    canAction,
    login,
    logout,
  };
}
