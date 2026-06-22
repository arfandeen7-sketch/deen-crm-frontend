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

  return {
    user,
    token,
    hydrated,
    isAuthenticated: Boolean(token),
    role: user?.role,
    can: (permission: Permission) => can(user?.role, permission),
    login,
    logout,
  };
}
