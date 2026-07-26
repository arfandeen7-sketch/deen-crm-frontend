"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/contexts/PermissionContext";
import { useTodayAttendance, useLeaveBalance, useAttendanceUserSummary } from "@/hooks/useHrms";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS, ROLE_BADGE_CLASSES, EMPLOYMENT_STATUS_COLORS } from "@/constants";
import { formatDate } from "@/lib/utils";

export default function MyProfilePage() {
  const { user } = useAuth();
  const { canModule } = usePermissions();
  const now = new Date();
  const { data: todayRecord } = useTodayAttendance();
  const { data: balanceData } = useLeaveBalance();
  const { data: monthSummary } = useAttendanceUserSummary(user?.id ?? "", { month: now.getMonth() + 1, year: now.getFullYear() }, canModule("hrms"));

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" subtitle="Your employee information" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-2xs lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-2xl font-bold text-neutral-900 border border-neutral-200/60 shadow-2xs">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-bold text-neutral-900">{user.fullName}</h2>
            <p className="text-xs text-neutral-500">{user.designation || "—"}</p>
            <Badge className={`mt-2 ${ROLE_BADGE_CLASSES[user.role]}`}>{ROLE_LABELS[user.role]}</Badge>
          </div>
          <div className="mt-6 space-y-3 border-t border-neutral-100 pt-4">
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
            <DashCard label="Overtime" value={todayRecord?.totalWorkingHours != null ? `${todayRecord.totalWorkingHours.toFixed(1)}h worked` : "—"} accent="neutral" />
          </div>
          {monthSummary && (
            <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-2xs">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Current Month Attendance</h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                <MiniStat label="Present" value={monthSummary.presentDays ?? monthSummary.present} color="emerald" />
                <MiniStat label="Absent" value={monthSummary.absentDays ?? monthSummary.absent} color="rose" />
                <MiniStat label="Late" value={monthSummary.lateDays ?? monthSummary.late} color="orange" />
                <MiniStat label="Half Day" value={monthSummary.halfDays ?? monthSummary.half_day} color="amber" />
                <MiniStat label="Leave" value={monthSummary.leaveDays ?? monthSummary.leave} color="sky" />
              </div>
            </div>
          )}
          {(user.leaveBalance || balanceData?.balances) && (
            <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-2xs">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-500">Leave Balance</h3>
              <div className="grid grid-cols-3 gap-4">
                <MiniStat label="Annual" value={user.leaveBalance?.annual ?? balanceData?.balances?.find(b => b.leaveTypeCode === "annual")?.remaining ?? 0} color="neutral" />
                <MiniStat label="Sick" value={user.leaveBalance?.sick ?? balanceData?.balances?.find(b => b.leaveTypeCode === "sick")?.remaining ?? 0} color="rose" />
                <MiniStat label="Emergency" value={user.leaveBalance?.emergency ?? balanceData?.balances?.find(b => b.leaveTypeCode === "emergency")?.remaining ?? 0} color="amber" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-neutral-500 font-medium">{label}</span>
      <span className="font-semibold text-neutral-900">{value}</span>
    </div>
  );
}

function DashCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-2xs">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-lg font-bold tracking-tight text-neutral-900">{value}</p>
    </div>
  );
}

function MiniStat({ label, value = 0, color }: { label: string; value?: number; color: string }) {
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50/80 p-2.5 text-center">
      <p className="text-xl font-extrabold tracking-tight text-neutral-900">{value}</p>
      <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}
