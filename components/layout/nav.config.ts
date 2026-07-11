import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users2,
  UserPlus,
  Upload,
  CalendarClock,
  CalendarCheck,
  CalendarX,
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
  Mail,
  LogIn,
  PieChart,
} from "lucide-react";
import type { UserRole } from "@/types";
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
  /** If set, group is only visible to these roles. */
  roles?: UserRole[];
}

export const NAV_GROUPS: NavGroup[] = [
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
  {
    id: "leads",
    title: "Leads",
    icon: Users2,
    moduleKey: "leads",
    section: "MENU",
    items: [
      { label: "All Leads", href: "/leads", icon: Users2, navAccess: { module: "leads", page: "all_leads" } },
      { label: "Untouched Leads", href: "/leads/untouched", icon: Ghost, navAccess: { module: "leads", page: "untouched_leads" } },
      { label: "Fresh Leads", href: "/leads/fresh", icon: UserPlus, navAccess: { module: "leads", page: "fresh_leads" } },
      { label: "Imported Leads", href: "/leads/imported", icon: FileDown, navAccess: { module: "leads", page: "imported_leads" } },
      { label: "Assigned Leads", href: "/leads/assigned", icon: UserCheck, navAccess: { module: "leads", page: "assigned_leads" } },
      { label: "Non Assigned Leads", href: "/leads/unassigned", icon: UserX, navAccess: { module: "leads", page: "unassigned_leads" } },
      { label: "Create Lead", href: "/leads/create", icon: UserPlus, navAccess: { module: "leads", page: "all_leads", action: "create" } },
      { label: "Import Leads", href: "/leads/import", icon: Upload, navAccess: { module: "leads", page: "all_leads", action: "import" } },
      { label: "Lead Reports", href: "/leads/reports", icon: BarChart2, navAccess: { module: "lead_reports" } },
    ],
  },
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
  {
    id: "hrms",
    title: "Human Resource",
    icon: Briefcase,
    moduleKey: "hrms",
    section: "MENU",
    items: [
      { label: "HR Dashboard", href: "/hrms/dashboard", icon: LayoutDashboard, navAccess: { module: "hrms", page: "employees" } },
      { label: "Employees", href: "/hrms/employees", icon: Users2, navAccess: { module: "hrms", page: "employees" } },
      { label: "Attendance", href: "/hrms/attendance", icon: ClipboardCheck, navAccess: { module: "hrms", page: "attendance" } },
      { label: "Leave Management", href: "/hrms/leave", icon: CalendarDays, navAccess: { module: "hrms", page: "leave" } },
      { label: "Payroll Management", href: "/hrms/payroll", icon: Wallet, navAccess: { module: "hrms", page: "payroll" } },
      { label: "Payslips", href: "/hrms/payslips", icon: FileText, navAccess: { module: "hrms", page: "payslips" } },
      { label: "Email Configuration", href: "/hrms/email-config", icon: Mail, navAccess: { module: "hrms", page: "employees" } },
      { label: "Login Activity", href: "/hrms/login-activity", icon: LogIn, navAccess: { module: "hrms", page: "login_activity" } },
      { label: "HR Reports", href: "/hrms/reports", icon: PieChart, navAccess: { module: "hrms", page: "login_activity" } },
    ],
  },
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
  {
    id: "my-team",
    title: "My Team",
    icon: Users2,
    href: "/my-team",
    isSingular: true,
    section: "GENERAL",
    roles: ["sales_manager"],
    items: [
      { label: "My Team", href: "/my-team", icon: Users2 },
    ],
  },
  {
    id: "my-hr",
    title: "My HR",
    icon: User,
    section: "GENERAL",
    items: [
      { label: "My Attendance", href: "/my-hr/attendance", icon: ClipboardCheck },
      { label: "My Leaves", href: "/my-hr/leaves", icon: CalendarDays },
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
];

// Re-export the followup icon used elsewhere if needed.
export const FollowUpIcon = CalendarClock;
