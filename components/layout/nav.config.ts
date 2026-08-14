import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users2,
  UserPlus,
  CalendarClock,
  CalendarCheck,
  CalendarX,
  Clock,
  CalendarPlus,
  Handshake,
  Briefcase,
  ClipboardCheck,
  UserCog,
  SlidersHorizontal,
  KeyRound,
  Ghost,
  FileDown,
  UserCheck,
  UserX,
  BarChart2,
  Settings2,
  User,
  CalendarDays,
  Wallet,
  FileText,
  PieChart,
  Plug,
  Activity,
  Calculator,
  Contact,
  TrendingUp,
  Building2,
  Plus,
  ClipboardList,
} from "lucide-react";
import { MANAGED_DYNAMIC_CATEGORIES } from "@/constants";

export interface NavAccess {
  module: string;
  page?: string;
  action?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** If set, item is only visible when the user has this access. */
  navAccess?: NavAccess;
  /** If true, item is only visible to Master users. */
  masterOnly?: boolean;
}

export interface NavGroup {
  id: string;
  title: string;
  icon: LucideIcon;
  items: NavItem[];
  /** Backend module key — if set, group is hidden unless user has module access. */
  moduleKey?: string;
  isSingular?: boolean;
  href?: string;
  section?: "MENU" | "GENERAL";
  /** If true, group is only visible to Master users. */
  masterOnly?: boolean;
  /** If true, group is hidden from Master users (e.g. self-service links). */
  hideForMaster?: boolean;
}

export const NAV_GROUPS: NavGroup[] = [
  // ── 1. Dashboard ────────────────────────────────────────────────────────
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard/overview",
    isSingular: true,
    section: "MENU",
    items: [
      { label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
    ],
  },
  // ── 2. Leads ────────────────────────────────────────────────────────────
  {
    id: "leads",
    title: "Leads",
    icon: Users2,
    moduleKey: "leads",
    section: "MENU",
    items: [
      { label: "All Leads", href: "/leads", icon: Users2, navAccess: { module: "leads", page: "all_leads" } },
      { label: "Untouched Leads", href: "/leads/untouched", icon: Ghost, navAccess: { module: "leads", page: "untouched_leads" } },
      { label: "Deal Closed", href: "/leads/deal-closed", icon: TrendingUp, navAccess: { module: "leads", page: "deal_closed" } },
      { label: "Imported Leads", href: "/leads/imported", icon: FileDown, navAccess: { module: "leads", page: "imported_leads" } },
      { label: "Assigned Leads", href: "/leads/assigned", icon: UserCheck, navAccess: { module: "leads", page: "assigned_leads" } },
      { label: "Non Assigned Leads", href: "/leads/unassigned", icon: UserX, navAccess: { module: "leads", page: "unassigned_leads" } },
      { label: "Lead Reports", href: "/leads/reports", icon: BarChart2, navAccess: { module: "lead_reports" } },
    ],
  },
  // ── 3. Follow Up ────────────────────────────────────────────────────────
  {
    id: "followup",
    title: "Follow Up",
    icon: CalendarClock,
    moduleKey: "followup",
    section: "MENU",
    items: [
      { label: "Today's Follow Ups", href: "/followup/today", icon: CalendarCheck, navAccess: { module: "followup", page: "todays_followup" } },
      { label: "Missed Follow Ups", href: "/followup/missed", icon: CalendarX, navAccess: { module: "followup", page: "missed_followup" } },
      { label: "Upcoming Follow Ups", href: "/followup/upcoming", icon: CalendarPlus, navAccess: { module: "followup", page: "upcoming_followup" } },
    ],
  },
  // ── 4. Brokers ──────────────────────────────────────────────────────────
  {
    id: "brokers",
    title: "Brokers",
    icon: Handshake,
    moduleKey: "brokers",
    section: "MENU",
    items: [
      { label: "All Brokers", href: "/brokers", icon: Handshake, navAccess: { module: "brokers", page: "all_brokers" } },
      { label: "Create Broker", href: "/brokers/create", icon: UserPlus, navAccess: { module: "brokers", page: "all_brokers", action: "create" } },
    ],
  },
  // ── 5. Properties ───────────────────────────────────────────────────────
  {
    id: "properties",
    title: "Properties",
    icon: Building2,
    href: "/properties",
    isSingular: true,
    section: "MENU",
    items: [
      { label: "All Properties", href: "/properties", icon: Building2 },
      { label: "Add Property", href: "/properties/create", icon: Plus },
      { label: "Submissions", href: "/properties/submissions", icon: ClipboardList, masterOnly: true },
    ],
  },
  // ── 6. Buyer Details (direct link — no dropdown) ─────────────────────────
  {
    id: "client_details",
    title: "Buyer Details",
    icon: Contact,
    href: "/clients",
    isSingular: true,
    moduleKey: "client_details",
    section: "MENU",
    items: [
      { label: "All Buyers", href: "/clients", icon: Contact, navAccess: { module: "client_details", page: "all_clients", action: "view" } },
    ],
  },
  // ── 7. Tenant Details (direct link — no dropdown) ────────────────────────
  {
    id: "tenant_details",
    title: "Tenant Details",
    icon: Users2,
    href: "/tenants",
    isSingular: true,
    moduleKey: "tenant_details",
    section: "MENU",
    items: [
      { label: "All Tenants", href: "/tenants", icon: Users2, navAccess: { module: "tenant_details", page: "all_tenants", action: "view" } },
    ],
  },
  // ── 8. Human Resource ───────────────────────────────────────────────────
  {
    id: "hrms",
    title: "Human Resource",
    icon: Briefcase,
    moduleKey: "hrms",
    section: "MENU",
    items: [
      { label: "Employees", href: "/hrms/employees", icon: Users2, navAccess: { module: "hrms", page: "employees" } },
      { label: "Attendance", href: "/hrms/attendance", icon: ClipboardCheck, navAccess: { module: "hrms", page: "attendance" } },
      { label: "Attendance Corrections", href: "/hrms/attendance/regularization", icon: ClipboardCheck, navAccess: { module: "hrms", page: "attendance_regularization" } },
      { label: "Check-In / Check-Out", href: "/hrms/check-in-out", icon: Clock, navAccess: { module: "hrms", page: "attendance" } },
      { label: "Leave Management", href: "/hrms/leave", icon: CalendarDays, navAccess: { module: "hrms", page: "leave" } },
      { label: "Leave Types", href: "/hrms/leave-types", icon: SlidersHorizontal, navAccess: { module: "hrms", page: "leave_types" } },
      { label: "Public Holidays", href: "/hrms/holidays", icon: CalendarX, navAccess: { module: "hrms", page: "leave_holidays" } },
      { label: "Payroll Management", href: "/hrms/payroll", icon: Wallet, navAccess: { module: "hrms", page: "payroll" } },
      { label: "Payroll Preview", href: "/hrms/payroll/preview", icon: Calculator, navAccess: { module: "hrms", page: "payroll" } },
      { label: "Payslips", href: "/hrms/payslips", icon: FileText, navAccess: { module: "hrms", page: "payslips" } },
      { label: "HR Reports", href: "/hrms/reports", icon: PieChart, navAccess: { module: "hrms", page: "login_activity" } },
    ],
  },
  // ── 9. Users ────────────────────────────────────────────────────────────
  {
    id: "users",
    title: "Users",
    icon: UserCog,
    moduleKey: "users",
    section: "MENU",
    items: [
      { label: "All Users", href: "/users", icon: UserCog, navAccess: { module: "users", page: "all_users" } },
      { label: "Create User", href: "/users/create", icon: UserPlus, navAccess: { module: "users", page: "all_users", action: "create" } },
      { label: "Teams", href: "/teams", icon: Users2, navAccess: { module: "users", page: "teams" } },
    ],
  },
  // ── 10. Rest of existing modules (GENERAL section) ───────────────────────
  {
    id: "my-team",
    title: "My Team",
    icon: Users2,
    href: "/my-team",
    isSingular: true,
    section: "GENERAL",
    hideForMaster: true,
    items: [
      { label: "My Team", href: "/my-team", icon: Users2, navAccess: { module: "users", page: "teams" } },
    ],
  },
  {
    id: "my-hr",
    title: "My HR",
    icon: User,
    section: "GENERAL",
    hideForMaster: true,
    items: [
      { label: "My Attendance", href: "/my-hr/attendance", icon: ClipboardCheck },
      { label: "My Corrections", href: "/my-hr/attendance-corrections", icon: ClipboardCheck },
      { label: "My Leaves", href: "/my-hr/leaves", icon: CalendarDays },
      { label: "Leave Calendar", href: "/my-hr/calendar", icon: CalendarDays },
      { label: "My Payslips", href: "/my-hr/payslips", icon: FileText },
      { label: "My Profile", href: "/my-hr/profile", icon: User },
    ],
  },
  {
    id: "dynamic-fields",
    title: "Dynamic Fields",
    icon: SlidersHorizontal,
    moduleKey: "dynamic_fields",
    section: "GENERAL",
    items: MANAGED_DYNAMIC_CATEGORIES.map(
      (c): NavItem => ({
        label: c.label,
        href: `/dynamic-fields/${c.slug}`,
        icon: SlidersHorizontal,
        navAccess: { module: "dynamic_fields", page: "manage_fields" },
      }),
    ),
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings2,
    section: "GENERAL",
    items: [
      { label: "Profile", href: "/settings/profile", icon: User },
      { label: "Change Password", href: "/settings/change-password", icon: KeyRound },
    ],
  },
  {
    id: "integrations",
    title: "Integrations",
    icon: Plug,
    moduleKey: "integrations",
    section: "GENERAL",
    items: [
      { label: "All Integrations", href: "/integrations", icon: Plug, navAccess: { module: "integrations", page: "all_integrations" } },
      { label: "Dashboard", href: "/integrations/dashboard", icon: Activity, navAccess: { module: "integrations", page: "all_integrations", action: "health" } },
    ],
  },
  {
    id: "activity",
    title: "Activity Stream",
    icon: Activity,
    href: "/activity",
    isSingular: true,
    masterOnly: true,
    section: "GENERAL",
    items: [
      { label: "Activity Stream", href: "/activity", icon: Activity, masterOnly: true },
    ],
  },
];

// Re-export the followup icon used elsewhere if needed.
export const FollowUpIcon = CalendarClock;
