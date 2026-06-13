"use client";

import { create } from "zustand";
import type { LeadQueryParams } from "@/types";
import { DEFAULT_PAGE_SIZE } from "@/constants";

interface LeadFilterState {
  filters: LeadQueryParams;
  setFilter: <K extends keyof LeadQueryParams>(
    key: K,
    value: LeadQueryParams[K],
  ) => void;
  setFilters: (filters: Partial<LeadQueryParams>) => void;
  resetFilters: () => void;
}

const initial: LeadQueryParams = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

export const useLeadFilterStore = create<LeadFilterState>((set) => ({
  filters: { ...initial },
  setFilter: (key, value) =>
    set((s) => ({
      // Reset to page 1 whenever a non-page filter changes.
      filters: {
        ...s.filters,
        [key]: value,
        ...(key !== "page" ? { page: 1 } : {}),
      },
    })),
  setFilters: (filters) =>
    set((s) => ({ filters: { ...s.filters, ...filters } })),
  resetFilters: () => set({ filters: { ...initial } }),
}));
