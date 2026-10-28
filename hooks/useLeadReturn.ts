"use client";

import { useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { buildLeadDetailHref, buildLeadEditHref, sanitizeReturnTo } from "@/lib/leadReturn";

function currentReturnTo(pathname: string, from: string | null, search: string): string {
  const existing = sanitizeReturnTo(from);
  if (existing) return existing;
  return search ? `${pathname}?${search}` : pathname;
}

/** Lead detail URL that remembers the list the user is on. */
export function useLeadDetailHref() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const search = searchParams.toString();
  return useCallback(
    (id: string) => buildLeadDetailHref(id, currentReturnTo(pathname, from, search)),
    [pathname, from, search],
  );
}

/** Edit URL that keeps the same return target as the detail page. */
export function useLeadEditHref() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const search = searchParams.toString();
  return useCallback(
    (id: string) => buildLeadEditHref(id, currentReturnTo(pathname, from, search)),
    [pathname, from, search],
  );
}
