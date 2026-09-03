"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, AccessMap } from "@/types";
import { TOKEN_STORAGE_KEY } from "@/constants";

export type PermissionStatus = "loading" | "ready" | "error";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  access: AccessMap | null;
  permissionStatus: PermissionStatus;
  hydrated: boolean;
  setAuth: (token: string, user: User, refreshToken?: string | null) => void;
  setUser: (user: User) => void;
  setAccess: (access: AccessMap) => void;
  setPermissionStatus: (status: PermissionStatus) => void;
  clear: () => void;
  setHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      access: null,
      permissionStatus: "loading",
      hydrated: false,
      setAuth: (token, user, refreshToken = null) => set({ token, user, refreshToken }),
      setUser: (user) => set({ user }),
      setAccess: (access) => set({ access }),
      setPermissionStatus: (status) => set({ permissionStatus: status }),
      clear: () => set({ token: null, refreshToken: null, user: null, access: null, permissionStatus: "loading" }),
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: TOKEN_STORAGE_KEY,
      partialize: (state) => ({ token: state.token, refreshToken: state.refreshToken, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

/** Read token outside React (used by the axios interceptor). */
export function getStoredToken(): string | null {
  return useAuthStore.getState().token;
}

/** Read refresh token outside React (used by API refresh flow). */
export function getStoredRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken;
}
