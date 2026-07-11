"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/contexts/PermissionContext";
import { LoadingState } from "@/components/ui/States";

/**
 * Page-level guard using the new 3-level permission system.
 * Redirects to /dashboard/overview when the user lacks module/page/action access.
 */
export function AccessGuard({
  module,
  page,
  action,
  children,
}: {
  module: string;
  page?: string;
  action?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { hydrated } = useAuth();
  const { canModule, canPage, canAction } = usePermissions();

  function hasAccess(): boolean {
    if (action && page) return canAction(module, page, action);
    if (page) return canPage(module, page);
    return canModule(module);
  }

  useEffect(() => {
    if (hydrated && !hasAccess()) {
      router.replace("/dashboard/overview");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, module, page, action]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingState label="Checking access…" />
      </div>
    );
  }

  if (!hasAccess()) return null;

  return <>{children}</>;
}

/**
 * Inline conditional: renders children only when the user has the given access.
 * Does not redirect; use AccessGuard for page-level protection.
 */
export function CanAccess({
  module,
  page,
  action,
  fallback = null,
  children,
}: {
  module: string;
  page?: string;
  action?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { canModule, canPage, canAction } = usePermissions();

  function hasAccess(): boolean {
    if (action && page) return canAction(module, page, action);
    if (page) return canPage(module, page);
    return canModule(module);
  }

  return hasAccess() ? <>{children}</> : <>{fallback}</>;
}

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

/**
 * @deprecated Use AccessGuard instead.
 * Kept for compatibility; internally delegates to AccessGuard with module-level check.
 */
export function PermissionGuard({
  module,
  children,
}: {
  module: string;
  children: React.ReactNode;
}) {
  return <AccessGuard module={module}>{children}</AccessGuard>;
}

/**
 * @deprecated Use CanAccess instead.
 */
export function RoleGuard({
  module,
  page,
  action,
  fallback = null,
  children,
}: {
  module: string;
  page?: string;
  action?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <CanAccess module={module} page={page} action={action} fallback={fallback}>
      {children}
    </CanAccess>
  );
}
