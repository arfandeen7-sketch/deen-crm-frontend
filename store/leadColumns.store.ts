"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LeadColumnState {
  order: string[];
  hidden: string[];
  setOrder: (order: string[]) => void;
  toggleHidden: (key: string) => void;
  reset: () => void;
}

export const useLeadColumnStore = create<LeadColumnState>()(
  persist(
    (set) => ({
      order: [],
      hidden: [],
      setOrder: (order) => set({ order }),
      toggleHidden: (key) =>
        set((s) => ({
          hidden: s.hidden.includes(key)
            ? s.hidden.filter((k) => k !== key)
            : [...s.hidden, key],
        })),
      reset: () => set({ order: [], hidden: [] }),
    }),
    { name: "deen-lead-columns" },
  ),
);
