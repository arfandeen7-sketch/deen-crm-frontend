/**
 * Typed Frontend Authorization Manifest
 *
 * Single source of truth for permission requirements across:
 * - Dashboard route requirements
 * - Page route requirements (list, detail, edit, create, import, reports)
 * - Dashboard-widget requirements
 * - Query/read requirements
 * - Mutation, export, import, and other action requirements
 * - Authenticated-only self-service capabilities
 *
 * Used by route guards, navigation, queries, and feature controls.
 * Non-master role values never independently grant access in the frontend.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface PermissionRequirement {
  module: string;
  page?: string;
  action?: string;
}

export type RouteRequirement =
  | { type: "public" }
  | { type: "authenticated" }
  | { type: "master" }
  | { type: "permission"; requirement: PermissionRequirement };

// ── Route Requirements ───────────────────────────────────────────────────────

export const ROUTE_REQUIREMENTS: Record<string, RouteRequirement> = {
  // Dashboard
  "/dashboard/overview": { type: "authenticated" },

  // Leads
  "/leads": { type: "permission", requirement: { module: "leads", page: "all_leads", action: "view" } },
  "/leads/untouched": { type: "permission", requirement: { module: "leads", page: "untouched_leads", action: "view" } },
  "/leads/fresh": { type: "permission", requirement: { module: "leads", page: "fresh_leads", action: "view" } },
  "/leads/deal-closed": { type: "permission", requirement: { module: "leads", page: "deal_closed", action: "view" } },
  "/leads/imported": { type: "permission", requirement: { module: "leads", page: "imported_leads", action: "view" } },
  "/leads/assigned": { type: "permission", requirement: { module: "leads", page: "assigned_leads", action: "view" } },
  "/leads/unassigned": { type: "permission", requirement: { module: "leads", page: "unassigned_leads", action: "view" } },
  "/leads/create": { type: "permission", requirement: { module: "leads", page: "all_leads", action: "create" } },
  "/leads/import": { type: "permission", requirement: { module: "leads", page: "all_leads", action: "import" } },
  "/leads/reports": { type: "permission", requirement: { module: "lead_reports", action: "view" } },
  "/leads/reports/employee/[userId]": { type: "permission", requirement: { module: "lead_reports", action: "view" } },
  // Dynamic lead detail/edit routes
  "/leads/[id]": { type: "permission", requirement: { module: "leads", page: "all_leads", action: "view" } },
  "/leads/[id]/edit": { type: "permission", requirement: { module: "leads", page: "all_leads", action: "edit" } },

  // Follow-up
  "/followup/today": { type: "permission", requirement: { module: "followup", page: "todays_followup", action: "view" } },
  "/followup/missed": { type: "permission", requirement: { module: "followup", page: "missed_followup", action: "view" } },
  "/followup/upcoming": { type: "permission", requirement: { module: "followup", page: "upcoming_followup", action: "view" } },

  // Users
  "/users": { type: "permission", requirement: { module: "users", page: "all_users", action: "view" } },
  "/users/create": { type: "permission", requirement: { module: "users", page: "all_users", action: "create" } },
  "/users/[id]/edit": { type: "permission", requirement: { module: "users", page: "all_users", action: "edit" } },
  "/users/[id]": { type: "permission", requirement: { module: "users", page: "all_users", action: "view" } },

  // Teams
  "/teams": { type: "permission", requirement: { module: "users", page: "teams", action: "view" } },

  // My Team (self-service for sales managers)
  "/my-team": { type: "authenticated" },

  // HRMS
  "/hrms/dashboard": { type: "permission", requirement: { module: "hrms", page: "employees", action: "view" } },
  "/hrms/employees": { type: "permission", requirement: { module: "hrms", page: "employees", action: "view" } },
  "/hrms/employees/create": { type: "permission", requirement: { module: "hrms", page: "employees", action: "create" } },
  "/hrms/employees/[id]": { type: "permission", requirement: { module: "hrms", page: "employees", action: "view" } },
  "/hrms/employees/[id]/edit": { type: "permission", requirement: { module: "hrms", page: "employees", action: "edit" } },
  "/hrms/attendance": { type: "permission", requirement: { module: "hrms", page: "attendance", action: "view" } },
  "/hrms/attendance/records": { type: "permission", requirement: { module: "hrms", page: "attendance", action: "view" } },
  "/hrms/check-in-out": { type: "permission", requirement: { module: "hrms", page: "attendance", action: "view" } },
  "/hrms/attendance/regularization": { type: "permission", requirement: { module: "hrms", page: "attendance_regularization", action: "view" } },
  "/hrms/leave": { type: "permission", requirement: { module: "hrms", page: "leave", action: "view" } },
  "/hrms/leave-types": { type: "permission", requirement: { module: "hrms", page: "leave_types", action: "view" } },
  "/hrms/holidays": { type: "permission", requirement: { module: "hrms", page: "leave_holidays", action: "view" } },
  "/hrms/payroll": { type: "permission", requirement: { module: "hrms", page: "payroll", action: "view" } },
  "/hrms/payroll/preview": { type: "permission", requirement: { module: "hrms", page: "payroll", action: "view" } },
  "/hrms/payslips": { type: "permission", requirement: { module: "hrms", page: "payslips", action: "view" } },
  "/hrms/email-config": { type: "permission", requirement: { module: "hrms", page: "employees", action: "edit" } },
  "/hrms/login-activity": { type: "permission", requirement: { module: "hrms", page: "login_activity", action: "view" } },
  "/hrms/reports": { type: "permission", requirement: { module: "hrms", page: "login_activity", action: "view" } },

  // Brokers
  "/brokers": { type: "permission", requirement: { module: "brokers", page: "all_brokers", action: "view" } },
  "/brokers/create": { type: "permission", requirement: { module: "brokers", page: "all_brokers", action: "create" } },
  "/brokers/[id]": { type: "permission", requirement: { module: "brokers", page: "all_brokers", action: "view" } },
  "/brokers/[id]/edit": { type: "permission", requirement: { module: "brokers", page: "all_brokers", action: "edit" } },

  // Client Details
  "/clients": { type: "permission", requirement: { module: "client_details", page: "all_clients", action: "view" } },
  "/clients/[leadId]": { type: "permission", requirement: { module: "client_details", page: "all_clients", action: "view" } },

  // Owners
  "/owners": { type: "permission", requirement: { module: "owners", page: "all_owners", action: "view" } },
  "/owners/create": { type: "permission", requirement: { module: "owners", page: "all_owners", action: "create" } },
  "/owners/[id]": { type: "permission", requirement: { module: "owners", page: "all_owners", action: "view" } },
  "/owners/[id]/edit": { type: "permission", requirement: { module: "owners", page: "all_owners", action: "edit" } },

  // Pocket Listings
  "/pocket-listings": { type: "permission", requirement: { module: "pocket_listings", page: "all_pocket_listings", action: "view" } },
  "/pocket-listings/create": { type: "permission", requirement: { module: "pocket_listings", page: "all_pocket_listings", action: "create" } },
  "/pocket-listings/[id]": { type: "permission", requirement: { module: "pocket_listings", page: "all_pocket_listings", action: "view" } },
  "/pocket-listings/[id]/edit": { type: "permission", requirement: { module: "pocket_listings", page: "all_pocket_listings", action: "edit" } },

  // Dynamic Fields
  "/dynamic-fields/[category]": { type: "permission", requirement: { module: "dynamic_fields", page: "manage_fields", action: "view" } },

  // Integrations
  "/integrations": { type: "permission", requirement: { module: "integrations", page: "all_integrations", action: "view" } },
  "/integrations/dashboard": { type: "permission", requirement: { module: "integrations", page: "all_integrations", action: "health" } },
  "/integrations/[id]": { type: "permission", requirement: { module: "integrations", page: "all_integrations", action: "view" } },

  // Notifications
  "/notifications": { type: "authenticated" },

  // My HR (self-service — authenticated only)
  "/my-hr/attendance": { type: "authenticated" },
  "/my-hr/attendance-corrections": { type: "authenticated" },
  "/my-hr/leaves": { type: "authenticated" },
  "/my-hr/calendar": { type: "authenticated" },
  "/my-hr/payslips": { type: "authenticated" },
  "/my-hr/profile": { type: "authenticated" },

  // Settings (self-service — authenticated only)
  "/settings/profile": { type: "authenticated" },
  "/settings/change-password": { type: "authenticated" },

  // Activity Stream (Master-only)
  "/activity": { type: "master" },
};

// ── Query / Read Requirements ────────────────────────────────────────────────

export const QUERY_REQUIREMENTS: Record<string, PermissionRequirement> = {
  "leads:list": { module: "leads", page: "all_leads", action: "view" },
  "leads:detail": { module: "leads", page: "all_leads", action: "view" },
  "leads:untouched": { module: "leads", page: "untouched_leads", action: "view" },
  "leads:fresh": { module: "leads", page: "fresh_leads", action: "view" },
  "leads:deal-closed:list": { module: "leads", page: "deal_closed", action: "view" },
  "leads:deal-closed:stats": { module: "leads", page: "deal_closed", action: "view" },
  "leads:deal-closed:employee-summary": { module: "leads", page: "deal_closed", action: "view" },
  "leads:imported": { module: "leads", page: "imported_leads", action: "view" },
  "leads:assigned": { module: "leads", page: "assigned_leads", action: "view" },
  "leads:unassigned": { module: "leads", page: "unassigned_leads", action: "view" },
  "leads:reports:source": { module: "lead_reports", action: "view" },
  "leads:reports:status": { module: "lead_reports", action: "view" },
  "leads:reports:user-performance": { module: "lead_reports", action: "view" },
  "leads:reports:timeseries": { module: "lead_reports", action: "view" },
  "leads:reports:priority": { module: "lead_reports", action: "view" },
  "leads:reports:summary": { module: "lead_reports", action: "view" },
  "leads:reports:employee-list": { module: "lead_reports", action: "view" },
  "leads:reports:send-reminder": { module: "lead_reports", action: "view" },

  "followup:today": { module: "followup", page: "todays_followup", action: "view" },
  "followup:missed": { module: "followup", page: "missed_followup", action: "view" },
  "followup:upcoming": { module: "followup", page: "upcoming_followup", action: "view" },

  "dashboard:summary": { module: "leads", page: "all_leads", action: "view" },
  "dashboard:status-analytics": { module: "leads", page: "all_leads", action: "view" },
  "dashboard:recent-leads": { module: "leads", page: "all_leads", action: "view" },
  "dashboard:followup-today-count": { module: "followup", page: "todays_followup", action: "view" },
  "dashboard:followup-missed-count": { module: "followup", page: "missed_followup", action: "view" },
  "dashboard:followup-upcoming-count": { module: "followup", page: "upcoming_followup", action: "view" },
  "dashboard:status-count": { module: "leads", page: "all_leads", action: "view" },
  "dashboard:category-count": { module: "leads", page: "all_leads", action: "view" },
  "dashboard:employee-activity": { module: "dashboard", page: "dashboard_home", action: "view" },

  "users:list": { module: "users", page: "all_users", action: "view" },
  "users:detail": { module: "users", page: "all_users", action: "view" },
  "users:assignable": { module: "leads", page: "all_leads", action: "assign" },

  "brokers:list": { module: "brokers", page: "all_brokers", action: "view" },
  "brokers:detail": { module: "brokers", page: "all_brokers", action: "view" },

  "hrms:dashboard": { module: "hrms", page: "employees", action: "view" },
  "hrms:employees": { module: "hrms", page: "employees", action: "view" },
  "hrms:employee-detail": { module: "hrms", page: "employees", action: "view" },
  "hrms:attendance": { module: "hrms", page: "attendance", action: "view" },
  "hrms:attendance-records": { module: "hrms", page: "attendance", action: "view" },
  "hrms:check-in-out": { module: "hrms", page: "attendance", action: "view" },
  "hrms:attendance-config": { module: "hrms", page: "attendance", action: "view" },
  "hrms:attendance-regularization": { module: "hrms", page: "attendance_regularization", action: "view" },
  "hrms:leave": { module: "hrms", page: "leave", action: "view" },
  "hrms:leave_types": { module: "hrms", page: "leave_types", action: "view" },
  "hrms:leave_holidays": { module: "hrms", page: "leave_holidays", action: "view" },
  "hrms:payroll": { module: "hrms", page: "payroll", action: "view" },
  "hrms:payslips": { module: "hrms", page: "payslips", action: "view" },
  "hrms:email-config": { module: "hrms", page: "employees", action: "view" },
  "hrms:login-activity": { module: "hrms", page: "login_activity", action: "view" },
  "hrms:reports": { module: "hrms", page: "login_activity", action: "view" },

  "leads:followup": { module: "followup", page: "todays_followup", action: "view" },

  "lead-reports:source": { module: "lead_reports", action: "view" },
  "lead-reports:status": { module: "lead_reports", action: "view" },
  "lead-reports:user-performance": { module: "lead_reports", action: "view" },
  "lead-reports:employee-activity": { module: "lead_reports", action: "view" },

  "teams:all": { module: "users", page: "teams", action: "view" },

  "dynamic-fields:list": { module: "dynamic_fields", page: "manage_fields", action: "view" },

  "integrations:list": { module: "integrations", page: "all_integrations", action: "view" },
  "integrations:dashboard": { module: "integrations", page: "all_integrations", action: "view" },
  "integrations:detail": { module: "integrations", page: "all_integrations", action: "view" },

  "teams:list": { module: "users", page: "teams", action: "view" },

  "clients:list":   { module: "client_details", page: "all_clients", action: "view" },
  "clients:detail": { module: "client_details", page: "all_clients", action: "view" },

  "owners:list":   { module: "owners", page: "all_owners", action: "view" },
  "owners:detail": { module: "owners", page: "all_owners", action: "view" },
  "owners:lookup": { module: "owners", page: "all_owners", action: "view" },

  "pocket-listings:list":   { module: "pocket_listings", page: "all_pocket_listings", action: "view" },
  "pocket-listings:detail": { module: "pocket_listings", page: "all_pocket_listings", action: "view" },

  "custom-fields:list": { module: "leads" },
};

// ── Mutation / Action Requirements ───────────────────────────────────────────

export const ACTION_REQUIREMENTS: Record<string, PermissionRequirement> = {
  "leads:create": { module: "leads", page: "all_leads", action: "create" },
  "leads:edit": { module: "leads", page: "all_leads", action: "edit" },
  "leads:delete": { module: "leads", page: "all_leads", action: "delete" },
  "leads:import": { module: "leads", page: "all_leads", action: "import" },
  "custom-fields:create": { module: "leads", page: "all_leads", action: "import" },
  "leads:export": { module: "leads", page: "all_leads", action: "export" },
  "leads:assign": { module: "leads", page: "all_leads", action: "assign" },
  "leads:bulk-assign": { module: "leads", page: "all_leads", action: "bulk_assign" },
  "leads:bulk-status": { module: "leads", page: "all_leads", action: "bulk_status" },
  "leads:bulk-delete": { module: "leads", page: "all_leads", action: "delete" },

  "brokers:create": { module: "brokers", page: "all_brokers", action: "create" },
  "brokers:edit": { module: "brokers", page: "all_brokers", action: "edit" },
  "brokers:delete": { module: "brokers", page: "all_brokers", action: "delete" },

  "users:create": { module: "users", page: "all_users", action: "create" },
  "users:edit": { module: "users", page: "all_users", action: "edit" },
  "users:toggle-active": { module: "users", page: "all_users", action: "edit" },

  "hrms:employees:create": { module: "hrms", page: "employees", action: "create" },
  "hrms:employees:edit": { module: "hrms", page: "employees", action: "edit" },
  "hrms:attendance:check-in": { module: "hrms", page: "attendance", action: "edit" },
  "hrms:attendance:check-out": { module: "hrms", page: "attendance", action: "edit" },
  "hrms:attendance:override": { module: "hrms", page: "attendance", action: "edit" },
  "hrms:attendance:config": { module: "hrms", page: "attendance", action: "edit" },
  "hrms:attendance-regularization:approve": { module: "hrms", page: "attendance_regularization", action: "approve" },
  "hrms:attendance-regularization:reject": { module: "hrms", page: "attendance_regularization", action: "reject" },
  "hrms:leave:approve": { module: "hrms", page: "leave", action: "approve" },
  "hrms:leave:reject": { module: "hrms", page: "leave", action: "reject" },
  "hrms:leave:apply": { module: "hrms", page: "leave", action: "apply" },
  "hrms:leave:cancel": { module: "hrms", page: "leave", action: "cancel" },
  "hrms:leave:allocate": { module: "hrms", page: "leave", action: "allocate" },
  "hrms:leave_types:create": { module: "hrms", page: "leave_types", action: "create" },
  "hrms:leave_types:edit": { module: "hrms", page: "leave_types", action: "edit" },
  "hrms:leave_types:delete": { module: "hrms", page: "leave_types", action: "delete" },
  "hrms:leave_holidays:create": { module: "hrms", page: "leave_holidays", action: "create" },
  "hrms:leave_holidays:delete": { module: "hrms", page: "leave_holidays", action: "delete" },
  "hrms:payroll:generate": { module: "hrms", page: "payroll", action: "generate" },
  "hrms:payroll:send": { module: "hrms", page: "payroll", action: "send" },
  "hrms:payslips:send": { module: "hrms", page: "payslips", action: "send" },
  "hrms:email:config": { module: "hrms", page: "employees", action: "edit" },
  "hrms:email:test": { module: "hrms", page: "employees", action: "edit" },

  "dynamic-fields:create": { module: "dynamic_fields", page: "manage_fields", action: "create" },
  "dynamic-fields:edit": { module: "dynamic_fields", page: "manage_fields", action: "edit" },
  "dynamic-fields:delete": { module: "dynamic_fields", page: "manage_fields", action: "delete" },

  "clients:edit": { module: "client_details", page: "all_clients", action: "edit" },
  "clients:upload-documents": { module: "client_details", page: "all_clients", action: "upload_documents" },
  "clients:export": { module: "client_details", page: "all_clients", action: "export" },

  "owners:create": { module: "owners", page: "all_owners", action: "create" },
  "owners:edit": { module: "owners", page: "all_owners", action: "edit" },
  "owners:delete": { module: "owners", page: "all_owners", action: "delete" },
  "owners:add-property": { module: "owners", page: "all_owners", action: "create" },
  "owners:edit-property": { module: "owners", page: "all_owners", action: "edit" },
  "owners:delete-property": { module: "owners", page: "all_owners", action: "delete" },

  "pocket-listings:create": { module: "pocket_listings", page: "all_pocket_listings", action: "create" },
  "pocket-listings:edit": { module: "pocket_listings", page: "all_pocket_listings", action: "edit" },
  "pocket-listings:delete": { module: "pocket_listings", page: "all_pocket_listings", action: "delete" },

  "integrations:connect": { module: "integrations", page: "all_integrations", action: "connect" },
  "integrations:edit": { module: "integrations", page: "all_integrations", action: "edit" },
  "integrations:health": { module: "integrations", page: "all_integrations", action: "health" },
  "integrations:sync": { module: "integrations", page: "all_integrations", action: "sync" },
  "integrations:disconnect": { module: "integrations", page: "all_integrations", action: "disconnect" },

  "teams:assign": { module: "users", page: "teams", action: "assign" },
  "teams:reassign": { module: "users", page: "teams", action: "reassign" },
  "teams:unassign": { module: "users", page: "teams", action: "unassign" },

  "leads:reports:export": { module: "lead_reports", action: "export" },
};

// ── Dashboard Widget Requirements ────────────────────────────────────────────

export const WIDGET_REQUIREMENTS: Record<string, PermissionRequirement> = {
  "widget:lead-summary": { module: "leads", page: "all_leads", action: "view" },
  "widget:status-analytics": { module: "leads", page: "all_leads", action: "view" },
  "widget:recent-leads": { module: "leads", page: "all_leads", action: "view" },
  "widget:followup-today": { module: "followup", page: "todays_followup", action: "view" },
  "widget:followup-missed": { module: "followup", page: "missed_followup", action: "view" },
  "widget:followup-upcoming": { module: "followup", page: "upcoming_followup", action: "view" },
  "widget:hr-dashboard": { module: "hrms", page: "employees", action: "view" },
  "widget:quick-actions": { module: "leads", page: "all_leads", action: "view" },
};

// ── Authenticated-Only Self-Service (no permission grants needed) ────────────

export const SELF_SERVICE_QUERIES = new Set([
  "me:profile",
  "me:attendance",
  "me:attendance-regularization",
  "me:leaves",
  "me:payslips",
  "me:leave-balance",
  "notifications:list",
  "notifications:unread-count",
  "my-team:members",
  "hrms:my-attendance",
  "hrms:my-leaves",
  "hrms:my-payslips",
  "hrms:team-calendar",
  "teams:my-team",
  "todos:mine",
  "todos:employees",
]);

// ── Helper: Match dynamic route patterns ─────────────────────────────────────

/**
 * Resolve a concrete pathname (e.g. `/leads/123`) to its manifest entry
 * by checking dynamic patterns like `/leads/[id]`.
 */
export function resolveRouteRequirement(pathname: string): RouteRequirement {
  if (ROUTE_REQUIREMENTS[pathname]) return ROUTE_REQUIREMENTS[pathname];

  // Try dynamic patterns
  for (const [pattern, req] of Object.entries(ROUTE_REQUIREMENTS)) {
    if (pattern.includes("[")) {
      const regex = new RegExp(
        "^" + pattern.replace(/\[.*?\]/g, "[^/]+") + "$",
      );
      if (regex.test(pathname)) return req;
    }
  }

  // Default: authenticated-only for unknown routes
  return { type: "authenticated" };
}

// ── Developer Checklist ──────────────────────────────────────────────────────
//
// When adding a new route, query, or action:
// 1. Add an entry to ROUTE_REQUIREMENTS, QUERY_REQUIREMENTS, or ACTION_REQUIREMENTS.
// 2. Use the manifest entry in the route guard (AccessGuard), query hook (enabled),
//    and UI control (CanAccess) for that capability.
// 3. Ensure the module/page/action keys match the backend permission registry.
// 4. Self-service capabilities that need no grant go in SELF_SERVICE_QUERIES.
