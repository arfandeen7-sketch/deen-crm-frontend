"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, AccessMap } from "@/types";
import { TOKEN_STORAGE_KEY } from "@/constants";

interface AuthState {
  token: string | null;
  user: User | null;
  access: AccessMap | null;
  hydrated: boolean;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  setAccess: (access: AccessMap) => void;
  clear: () => void;
  setHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      access: null,
      hydrated: false,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      setAccess: (access) => set({ access }),
      clear: () => set({ token: null, user: null, access: null }),
      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: TOKEN_STORAGE_KEY,
      partialize: (state) => ({ token: state.token, user: state.user }),
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
