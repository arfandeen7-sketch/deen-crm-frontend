import { resolveRouteRequirement, type PermissionRequirement } from "@/lib/auth-manifest";

export interface ForbiddenRequired {
  module?: string;
  page?: string;
  action?: string;
}

/**
 * Hard-redirect to the dashboard only when a 403 is about the *current page's*
 * permission — not incidental 403s from the header bell, todos, or other
 * always-mounted widgets. Those used to kick limited users off /bellaviu-clients.
 */
export function shouldHardRedirectOn403(
  pathname: string,
  required?: ForbiddenRequired | null,
): boolean {
  if (!required?.module) return false;

  const route = resolveRouteRequirement(pathname);
  if (route.type !== "permission") return false;

  return requirementsOverlap(route.requirement, required);
}

function requirementsOverlap(
  pageReq: PermissionRequirement,
  denied: ForbiddenRequired,
): boolean {
  if (denied.module !== pageReq.module) return false;
  if (pageReq.page && denied.page && denied.page !== pageReq.page) return false;
  return true;
}
