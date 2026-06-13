"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { can, type Permission } from "@/lib/rbac";
import { LoadingState } from "@/components/ui/States";

/** Blocks rendering until auth is hydrated; redirects to /login if unauthenticated. */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hydrated, isAuthenticated } = useAuth();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Authenticating…" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}

/** Renders children only if the current user has the given permission. */
export function RoleGuard({
  permission,
  fallback = null,
  children,
}: {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { role } = useAuth();
  if (!can(role, permission)) return <>{fallback}</>;
  return <>{children}</>;
}
