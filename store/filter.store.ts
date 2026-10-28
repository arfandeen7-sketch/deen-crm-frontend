"use client";

import { create } from "zustand";
import type { LeadQueryParams } from "@/types";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { ALL_LEADS_LIST_KEY, LEAD_LIST_FIELDS, writeListState } from "@/lib/leadReturn";

interface LeadFilterState {
  filters: LeadQueryParams;
  /** False until the list page has read the saved filters for this tab. */
  hydrated: boolean;
  setFilter: <K extends keyof LeadQueryParams>(
    key: K,
    value: LeadQueryParams[K],
  ) => void;
  setFilters: (filters: Partial<LeadQueryParams>) => void;
  replaceFilters: (filters: LeadQueryParams) => void;
  resetFilters: () => void;
}

const initial: LeadQueryParams = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

function remember(filters: LeadQueryParams): LeadQueryParams {
  writeListState(ALL_LEADS_LIST_KEY, filters, LEAD_LIST_FIELDS);
  return filters;
}

export const useLeadFilterStore = create<LeadFilterState>((set) => ({
  filters: { ...initial },
  hydrated: false,
  setFilter: (key, value) =>
    set((s) => ({
      // Reset to page 1 whenever a non-page filter changes.
      filters: remember({
        ...s.filters,
        [key]: value,
        ...(key !== "page" ? { page: 1 } : {}),
      }),
    })),
  setFilters: (filters) =>
    set((s) => ({
      filters: remember({ ...s.filters, ...filters }),
    })),
  replaceFilters: (filters) => {
    const next = remember({ ...initial, ...filters });
    set({ filters: next, hydrated: true });
  },
  resetFilters: () => {
    const next = remember({ ...initial });
    set({ filters: next });
  },
}));
