"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/contexts/PermissionContext";
import { MasterDashboard } from "./role-specific/MasterDashboard";
import { HrManagerDashboard } from "./role-specific/HrManagerDashboard";
import { SalesManagerDashboard } from "./role-specific/SalesManagerDashboard";
import { SalesExecutiveDashboard } from "./role-specific/SalesExecutiveDashboard";
import { LoadingState } from "@/components/ui/States";

export function RoleDashboardRouter() {
  const { isMaster, hydrated, permissionStatus } = useAuth();
  const { canModule } = usePermissions();

  if (!hydrated || permissionStatus !== "ready") {
    return <LoadingState label="Loading dashboard..." />;
  }

  if (isMaster) return <MasterDashboard />;

  const hasHrms = canModule("hrms");
  const hasLeads = canModule("leads");
  const hasUsers = canModule("users");

  if (hasHrms && hasUsers && hasLeads) return <MasterDashboard />;
  if (hasHrms && !hasLeads) return <HrManagerDashboard />;
  if (hasLeads && hasUsers) return <SalesManagerDashboard />;
  if (hasLeads) return <SalesExecutiveDashboard />;

  return <MasterDashboard />;
}
