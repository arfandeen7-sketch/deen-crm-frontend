"use client";

import { useAuth } from "@/hooks/useAuth";

/**
 * Returns true when the current user has Master-level access to the
 * Owner and Tenant modules. This is true for:
 *  - Master users (always)
 *  - Any user with the `fullOwnerTenantAccess` flag set on their profile
 *
 * Use this instead of `useIsMaster()` in Owner and Tenant module pages
 * to gate UI elements like Import, Delete, Add Property, identity documents, etc.
 */
export function useOwnerTenantFullAccess(): boolean {
  const { isMaster, user } = useAuth();
  return isMaster || !!user?.fullOwnerTenantAccess;
}
