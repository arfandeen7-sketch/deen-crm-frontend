"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/contexts/PermissionContext";
import { MasterDashboard } from "./role-specific/MasterDashboard";
import { HrManagerDashboard } from "./role-specific/HrManagerDashboard";
import { SalesManagerDashboard } from "./role-specific/SalesManagerDashboard";
import { SalesExecutiveDashboard } from "./role-specific/SalesExecutiveDashboard";
import { LoadingState } from "@/components/ui/States";

export function RoleDashboardRouter() {
  const { isMaster, role, hydrated, permissionStatus } = useAuth();
  const { canModule } = usePermissions();

  if (!hydrated || permissionStatus !== "ready") {
    return <LoadingState label="Loading dashboard..." />;
  }

  // Route by the user's actual role — inferring from module permissions is
  // unreliable because roles like sales_manager have cross-module access
  // (e.g. hrms:leave, users:teams) that would falsely match the master pattern.
  if (isMaster || role === "master") return <MasterDashboard />;
  if (role === "hr_manager") return <HrManagerDashboard />;
  if (role === "sales_manager") return <SalesManagerDashboard />;
  if (role === "sales_executive") return <SalesExecutiveDashboard />;

  // Fallback for unknown roles: infer from module access.
  const hasHrms = canModule("hrms");
  const hasLeads = canModule("leads");
  const hasUsers = canModule("users");

  if (hasHrms && hasUsers && hasLeads) return <MasterDashboard />;
  if (hasHrms && !hasLeads) return <HrManagerDashboard />;
  if (hasLeads && hasUsers) return <SalesManagerDashboard />;
  if (hasLeads) return <SalesExecutiveDashboard />;

  return <MasterDashboard />;
}
