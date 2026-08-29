"use client";

import { useAuth } from "@/hooks/useAuth";

/** Returns true when the current user is a master. */
export function useIsMaster(): boolean {
  const { isMaster } = useAuth();
  return isMaster;
}
