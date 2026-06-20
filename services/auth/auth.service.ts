import { api } from "@/services/api/client";
import { getStoredToken } from "@/store/auth.store";
import type { AuthResponse } from "@/types";
import {
  DEMO_CREDENTIALS,
  isDemoToken,
  tryDemoLogin,
} from "@/services/auth/demo";

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    // Sample/demo credentials short-circuit the API (no backend required).
    const demo = tryDemoLogin(email, password);
    if (demo) return demo;

    // /login returns { data: { token, user } } — unwrap the envelope.
    const res = await api.post<{ data: AuthResponse }>("/auth/login", { email, password });
    return res.data.data;
  },

  async logout(): Promise<void> {
    if (isDemoToken(getStoredToken())) return; // No server session to end.
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore — local session is cleared regardless.
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (isDemoToken(getStoredToken())) {
      // Demo session: validate locally, nothing is persisted.
      if (currentPassword !== DEMO_CREDENTIALS.password) {
        throw new Error("Current password is incorrect");
      }
      return;
    }
    await api.put("/auth/change-password", { currentPassword, newPassword });
  },
};
