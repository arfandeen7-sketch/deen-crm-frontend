"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/Avatar";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { cn, timeAgo, humanize } from "@/lib/utils";
import { useEmployeeActivity } from "@/hooks/useDashboard";
import {
  ROLE_BADGE_CLASSES,
  ROLE_LABELS,
  LEAD_STATUS_COLORS,
} from "@/constants";
import type { EmployeeActivityRow, UserRole } from "@/types";

const ATTENDANCE_BADGE: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700",
  late: "bg-orange-100 text-orange-700",
  half_day: "bg-amber-100 text-amber-700",
  absent: "bg-rose-100 text-rose-700",
  not_checked_in: "bg-slate-100 text-slate-500",
  on_leave: "bg-sky-100 text-sky-700",
  weekend: "bg-slate-100 text-slate-500",
  holiday: "bg-violet-100 text-violet-700",
};

const ATTENDANCE_LABEL: Record<string, string> = {
  present: "Present",
  late: "Late",
  half_day: "Half Day",
  absent: "Absent",
  not_checked_in: "Not Checked In",
  on_leave: "On Leave",
  weekend: "Weekend",
  holiday: "Holiday",
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

interface EmployeeActivitySectionProps {
  showLeadData: boolean;
}

export function EmployeeActivitySection({ showLeadData }: EmployeeActivitySectionProps) {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "absent" | "leave">("all");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const query = useEmployeeActivity(selectedDate);
  const data = query.data;
  const isLoading = query.isLoading;

  const summary = data?.summary;
  const employees = data?.employees ?? [];

  const filteredEmployees = useMemo(() => {
    let list = employees;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          (e.department ?? "").toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((e) => {
        const status = e.attendance.status;
        if (statusFilter === "present")
          return ["present", "late", "half_day"].includes(status);
        if (statusFilter === "absent")
          return ["absent", "not_checked_in"].includes(status);
        if (statusFilter === "leave") return status === "on_leave";
        return true;
      });
    }

    return list;
  }, [employees, searchQuery, statusFilter]);

  const summaryBadges = useMemo(() => {
    if (!summary) return [];
    const badges = [
      { label: "Present", count: summary.present, color: "bg-emerald-500" },
      { label: "Late", count: summary.late, color: "bg-orange-500" },
      { label: "Half Day", count: summary.halfDay, color: "bg-amber-400" },
      { label: "Not Checked In", count: summary.notCheckedIn, color: "bg-slate-400" },
      { label: "Absent", count: summary.absent, color: "bg-rose-500" },
      { label: "On Leave", count: summary.onLeave, color: "bg-sky-500" },
    ];
    return badges.filter((b) => b.count > 0);
  }, [summary]);

  return (
    <div className="py-8 border-b border-zinc-200">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary flex items-center gap-2">
            <Users className="h-6 w-6 text-zinc-400" />
            Employee Activity
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time overview of your team&apos;s attendance and lead activity
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Picker */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              max={todayISO()}
              onChange={(e) => setSelectedDate(e.target.value || todayISO())}
              className="pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── Summary Bar ── */}
      {isLoading ? (
        <LoadingState label="Loading employee activity..." />
      ) : !data || employees.length === 0 ? (
        <EmptyState
          title="No employees found"
          message="Active employees will appear here."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mr-2">
              {summary!.totalEmployees} Total
            </span>
            {summaryBadges.map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-50 border border-zinc-200/80"
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", b.color)} />
                {b.count} {b.label}
              </span>
            ))}
            {showLeadData && (
              <>
                <span className="mx-1 h-4 w-px bg-zinc-200" />
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <TrendingUp className="h-3 w-3" />
                  {summary!.totalFollowupsToday} Follow-ups
                </span>
                {summary!.totalMissedFollowups > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                    <AlertCircle className="h-3 w-3" />
                    {summary!.totalMissedFollowups} Missed
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100">
                  {summary!.totalActivitiesToday} Activities
                </span>
              </>
            )}
          </div>

          {/* ── Filters ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-zinc-200 bg-white text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {(["all", "present", "absent", "leave"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize",
                    statusFilter === f
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100 border border-zinc-200/80",
                  )}
                >
                  {f === "all" ? "All" : f === "leave" ? "On Leave" : f}
                </button>
              ))}
            </div>
          </div>

          {/* ── Employee Rows ── */}
          <div className="divide-y divide-zinc-100 border border-zinc-200/80 rounded-2xl overflow-hidden bg-white shadow-sm">
            {filteredEmployees.length === 0 ? (
              <div className="py-12">
                <EmptyState title="No matches" message="Try adjusting your filters." />
              </div>
            ) : (
              filteredEmployees.map((emp) => (
                <EmployeeRow
                  key={emp.userId}
                  employee={emp}
                  showLeadData={showLeadData}
                  isExpanded={expandedUserId === emp.userId}
                  onToggle={() =>
                    setExpandedUserId(expandedUserId === emp.userId ? null : emp.userId)
                  }
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EmployeeRow({
  employee,
  showLeadData,
  isExpanded,
  onToggle,
}: {
  employee: EmployeeActivityRow;
  showLeadData: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const attStatus = employee.attendance.status;
  const attBadgeClass = ATTENDANCE_BADGE[attStatus] ?? "bg-zinc-100 text-zinc-600";
  const attLabel = ATTENDANCE_LABEL[attStatus] ?? humanize(attStatus);

  const activityCount = employee.activitiesToday
    ? Object.values(employee.activitiesToday).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div>
      {/* ── Collapsed Row ── */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50/50 transition-colors text-left group"
      >
        <span className="shrink-0 text-zinc-400 group-hover:text-zinc-600 transition-colors">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>

        <UserAvatar
          name={employee.fullName}
          size="sm"
          className="w-9 h-9 shrink-0 ring-2 ring-zinc-50"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-zinc-900 truncate font-secondary">
              {employee.fullName}
            </p>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shrink-0",
                ROLE_BADGE_CLASSES[employee.role as UserRole] ?? "bg-zinc-100 text-zinc-600",
              )}
            >
              {ROLE_LABELS[employee.role as UserRole] ?? employee.role}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {employee.designation ?? employee.department ?? "—"}
          </p>
        </div>

        {/* Attendance status badge */}
        <div className="shrink-0 text-center min-w-[90px]">
          <span className={cn("px-3 py-1 rounded-full text-xs font-semibold inline-block", attBadgeClass)}>
            {attLabel}
          </span>
          <p className="text-[10px] text-zinc-400 mt-1">
            {employee.attendance.checkInTime
              ? `${formatTime(employee.attendance.checkInTime)} – ${formatTime(employee.attendance.checkOutTime)}`
              : "No check-in"}
          </p>
        </div>

        {/* Lead data columns (master only) */}
        {showLeadData && (
          <div className="hidden md:flex items-center gap-6 shrink-0">
            <div className="text-center min-w-[60px]">
              <p className="text-sm font-bold text-zinc-900">{employee.leadsAssigned ?? 0}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Leads</p>
            </div>
            <div className="text-center min-w-[60px]">
              <p className="text-sm font-bold text-zinc-900">{employee.followupsToday ?? 0}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">F/U</p>
            </div>
            <div className="text-center min-w-[60px]">
              <p className={cn(
                "text-sm font-bold",
                (employee.missedFollowups ?? 0) > 0 ? "text-rose-600" : "text-zinc-900",
              )}>
                {employee.missedFollowups ?? 0}
              </p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Missed</p>
            </div>
            <div className="text-center min-w-[60px]">
              <p className="text-sm font-bold text-zinc-900">{activityCount}</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Activity</p>
            </div>
          </div>
        )}

        {/* Last activity time */}
        {showLeadData && (
          <div className="hidden lg:block shrink-0 text-right min-w-[80px]">
            <p className="text-xs font-medium text-zinc-500">
              {employee.lastActivityAt ? timeAgo(employee.lastActivityAt) : "—"}
            </p>
            <p className="text-[10px] text-zinc-400">Last activity</p>
          </div>
        )}
      </button>

      {/* ── Expanded Detail ── */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 bg-zinc-50/40 border-t border-zinc-100">
          {showLeadData ? (
            <ExpandedLeadDetail employee={employee} />
          ) : (
            <ExpandedAttendanceDetail employee={employee} />
          )}
        </div>
      )}
    </div>
  );
}

function ExpandedAttendanceDetail({ employee }: { employee: EmployeeActivityRow }) {
  const att = employee.attendance;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3">
      <div>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status</p>
        <p className="text-sm font-semibold text-zinc-700 mt-1">
          {ATTENDANCE_LABEL[att.status] ?? humanize(att.status)}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Check In</p>
        <p className="text-sm font-semibold text-zinc-700 mt-1">{formatTime(att.checkInTime)}</p>
      </div>
      <div>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Check Out</p>
        <p className="text-sm font-semibold text-zinc-700 mt-1">{formatTime(att.checkOutTime)}</p>
      </div>
      <div>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Working Hours</p>
        <p className="text-sm font-semibold text-zinc-700 mt-1">
          {att.workingHours ? `${att.workingHours}h` : "—"}
        </p>
      </div>
    </div>
  );
}

function ExpandedLeadDetail({ employee }: { employee: EmployeeActivityRow }) {
  const leads = employee.leads ?? [];
  const timeline = employee.activityTimeline ?? [];
  const activitiesToday = employee.activitiesToday ?? {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-3">
      {/* Assigned Leads */}
      <div>
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
          Assigned Leads ({leads.length})
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {leads.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4">No leads assigned</p>
          ) : (
            leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white border border-zinc-200/60 hover:border-zinc-300 hover:bg-zinc-50/50 transition-all group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-zinc-900 truncate font-secondary group-hover:text-zinc-950">
                    {lead.leadName}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {lead.source} · {lead.mobileNumber}
                  </p>
                </div>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0",
                    LEAD_STATUS_COLORS[lead.leadStatus] ?? "bg-zinc-100 text-zinc-600",
                  )}
                >
                  {lead.leadStatus}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div>
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          Activity Timeline
          {Object.keys(activitiesToday).length > 0 && (
            <span className="flex flex-wrap gap-1">
              {Object.entries(activitiesToday).map(([action, count]) => (
                <span
                  key={action}
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-100 text-zinc-600"
                >
                  {count} {humanize(action)}
                </span>
              ))}
            </span>
          )}
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {timeline.length === 0 ? (
            <p className="text-xs text-zinc-400 py-4">No activity recorded for this date</p>
          ) : (
            timeline.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-2 px-3 py-2 rounded-xl bg-white border border-zinc-200/60"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-700">
                    <span className="text-zinc-400">{humanize(entry.action)}</span>
                    {" — "}
                    <span className="text-zinc-900 font-bold">{entry.leadName}</span>
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {new Date(entry.createdAt).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
