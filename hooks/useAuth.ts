"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth/auth.service";
import { loginActivityService } from "@/services/hrms/login-activity.service";
import { isDemoToken } from "@/services/auth/demo";
import { can, type Permission } from "@/lib/rbac";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, hydrated, setAuth, clear } = useAuthStore();

  async function login(email: string, password: string) {
    const res = await authService.login(email, password);
    setAuth(res.token, res.user);
    if (!isDemoToken(res.token)) {
      loginActivityService.recordLogin().catch(() => {});
    }
    return res.user;
  }

  async function logout() {
    if (!isDemoToken(token)) {
      try { await loginActivityService.recordLogout(); } catch { /* ignore */ }
    }
    await authService.logout();
    clear();
    queryClient.clear();
    router.replace("/login");
  }

  /**
   * Returns true if the user has access to the given module key.
   * Uses prefix matching so hasModule("hrms") matches "hrms.attendance" etc.
   * Falls back to true when the user has no modules array (no override set).
   */
  function hasModule(key: string): boolean {
    const modules = user?.modules;
    if (!modules || modules.length === 0) return true;
    return modules.some((m) => m === key || m.startsWith(`${key}.`));
  }

  return {
    user,
    token,
    hydrated,
    isAuthenticated: Boolean(token),
    role: user?.role,
    can: (permission: Permission) => can(user?.role, permission),
    hasModule,
    login,
    logout,
  };
}
