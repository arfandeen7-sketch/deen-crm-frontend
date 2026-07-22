"use client";

import { useAuth } from "@/hooks/useAuth";
import { useTodayAttendance, useLeaveBalance, useAttendanceCalendar } from "@/hooks/useHrms";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { AccessGuard } from "@/components/shared/Guards";
import { ROLE_LABELS, ROLE_BADGE_CLASSES, EMPLOYMENT_STATUS_COLORS } from "@/constants";
import { formatDate } from "@/lib/utils";

export default function MyProfilePage() {
  const { user } = useAuth();
  const now = new Date();
  const { data: todayRecord } = useTodayAttendance();
  const { data: balanceData } = useLeaveBalance();
  const { data: calendarData } = useAttendanceCalendar({ month: now.getMonth() + 1, year: now.getFullYear() });
  const monthSummary = calendarData?.summary;

  if (!user) return null;

  return (
    <AccessGuard module="my_hr">
      <div className="space-y-6">
        <PageHeader title="My Profile" subtitle="Your employee information" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-semibold text-slate-900">{user.fullName}</h2>
            <p className="text-sm text-slate-500">{user.designation || "—"}</p>
            <Badge className={`mt-2 ${ROLE_BADGE_CLASSES[user.role]}`}>{ROLE_LABELS[user.role]}</Badge>
          </div>
          <div className="mt-6 space-y-3 border-t pt-4">
            <InfoRow label="Employee ID" value={user.employeeId || "—"} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Phone" value={user.phone || "—"} />
            <InfoRow label="Department" value={user.department || "—"} />
            <InfoRow label="Joining Date" value={user.joiningDate ? formatDate(user.joiningDate) : "—"} />
            <InfoRow label="Status" value={
              <Badge className={EMPLOYMENT_STATUS_COLORS[user.employmentStatus || "active"]}>
                {(user.employmentStatus || "active").replace("_", " ")}
              </Badge>
            } />
          </div>
        </div>

        {/* Employee Dashboard */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <DashCard label="Today's Status" value={todayRecord?.status ? todayRecord.status.replace("_", " ") : "Not Checked In"} accent={todayRecord?.status === "present" ? "emerald" : "amber"} />
            <DashCard label="Overtime" value={todayRecord?.totalWorkingHours != null ? `${todayRecord.totalWorkingHours.toFixed(1)}h worked` : "—"} accent="indigo" />
          </div>
          {monthSummary && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-900">Current Month Attendance</h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                <MiniStat label="Present" value={monthSummary.present ?? 0} color="emerald" />
                <MiniStat label="Absent" value={monthSummary.absent ?? 0} color="rose" />
                <MiniStat label="Late" value={monthSummary.late ?? 0} color="orange" />
                <MiniStat label="Half Day" value={monthSummary.half_day ?? 0} color="amber" />
                <MiniStat label="Leave" value={monthSummary.leave ?? 0} color="sky" />
              </div>
            </div>
          )}
          {balanceData && balanceData.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-slate-900">Leave Balance</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {balanceData.map((bal) => (
                  <MiniStat key={bal.leaveTypeCode} label={bal.leaveTypeName} value={bal.available} color="indigo" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </AccessGuard>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function DashCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold text-${accent}-700`}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-lg bg-${color}-50 p-2.5 text-center`}>
      <p className={`text-xl font-bold text-${color}-700`}>{value}</p>
      <p className={`text-[10px] text-${color}-600`}>{label}</p>
    </div>
  );
}
