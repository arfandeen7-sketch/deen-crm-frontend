"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/contexts/PermissionContext";
import { LoadingState } from "@/components/ui/States";

/**
 * Page-level guard using the 3-level permission system.
 * Waits for both auth hydration AND permission readiness before evaluating access.
 * Redirects silently to /dashboard/overview when the user lacks module/page/action access.
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
  const { hydrated, permissionStatus } = useAuth();
  const { canModule, canPage, canAction } = usePermissions();

  const permissionsReady = permissionStatus === "ready";

  function hasAccess(): boolean {
    if (action && page) return canAction(module, page, action);
    if (page) return canPage(module, page);
    return canModule(module);
  }

  useEffect(() => {
    if (hydrated && permissionsReady && !hasAccess()) {
      router.replace("/dashboard/overview");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, permissionsReady, module, page, action]);

  // Wait for auth hydration and permission readiness before rendering anything.
  if (!hydrated || !permissionsReady) {
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
 * Returns fallback when permissions are not yet ready (loading state).
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
  const { permissionStatus } = useAuth();
  const { canModule, canPage, canAction } = usePermissions();

  // While permissions are loading, don't render protected content.
  if (permissionStatus !== "ready") return <>{fallback}</>;

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
 * Page-level guard for Master-only routes.
 * Redirects non-master users to /dashboard/overview.
 */
export function MasterGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { hydrated, isMaster, permissionStatus } = useAuth();

  const ready = hydrated && permissionStatus === "ready";

  useEffect(() => {
    if (ready && !isMaster) {
      router.replace("/dashboard/overview");
    }
  }, [ready, isMaster, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingState label="Checking access…" />
      </div>
    );
  }

  if (!isMaster) return null;

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
