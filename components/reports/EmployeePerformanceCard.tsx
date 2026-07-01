"use client";

import Link from "next/link";
import { AlertTriangle, Bell, ClipboardList, PhoneCall, Star, Tag, UserPlus2 } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DonutChart } from "@/components/charts/DonutChart";
import { Sparkline } from "@/components/charts/Sparkline";
import type { EmployeePerformance, LeadActivityAction } from "@/types";

const ACTIVITY_ICONS: Record<LeadActivityAction, typeof Tag> = {
  created: UserPlus2,
  status_changed: Tag,
  comment_added: ClipboardList,
  followup_scheduled: PhoneCall,
  assigned: UserPlus2,
  field_updated: ClipboardList,
  imported: ClipboardList,
};

function scoreColor(score: number): string {
  if (score >= 75) return "bg-emerald-100 text-emerald-700 ring-emerald-600/20";
  if (score >= 50) return "bg-amber-100 text-amber-700 ring-amber-600/20";
  return "bg-rose-100 text-rose-700 ring-rose-600/20";
}

export function EmployeePerformanceCard({
  item,
  pinned,
  onTogglePin,
  onSendReminder,
  sendingReminder,
}: {
  item: EmployeePerformance;
  pinned?: boolean;
  onTogglePin?: () => void;
  onSendReminder?: () => void;
  sendingReminder?: boolean;
}) {
  const lowTouch = item.touchRate < 50;
  const highMissed = item.missedFollowUps >= 5;

  const donutData = Object.entries(item.statusBreakdown ?? {}).map(([label, value]) => ({ label, value }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
        <div className="flex items-start gap-3">
          <UserAvatar name={item.fullName} size="lg" />
          <div>
            <p className="text-sm font-semibold text-slate-900">{item.fullName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {item.role && <RoleBadge role={item.role} />}
              {item.department && (
                <span className="text-xs text-slate-500">{item.department}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset", scoreColor(item.performanceScore))}>
            {item.performanceScore}
          </span>
          {onTogglePin && (
            <button
              onClick={onTogglePin}
              title={pinned ? "Unpin" : "Pin to top"}
              className={cn("rounded p-1 hover:bg-slate-100", pinned ? "text-amber-500" : "text-slate-300")}
            >
              <Star className="h-4 w-4" fill={pinned ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </div>

      {(lowTouch || highMissed || item.performanceScore >= 75) && (
        <div className={cn(
          "flex flex-wrap gap-2 border-b border-slate-100 px-4 py-2",
          item.performanceScore >= 75 ? "bg-emerald-50/60" : "bg-rose-50/60"
        )}>
          {item.performanceScore >= 75 ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <Star className="h-3.5 w-3.5" /> On track
            </span>
          ) : (
            <>
              {lowTouch && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                  <AlertTriangle className="h-3.5 w-3.5" /> Low touch rate
                </span>
              )}
              {highMissed && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                  <AlertTriangle className="h-3.5 w-3.5" /> {item.missedFollowUps} missed follow-ups
                </span>
              )}
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 p-4 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-900">{item.assigned}</p>
          <p className="text-[11px] text-slate-500">Assigned</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-emerald-600">{item.touchRate.toFixed(0)}%</p>
          <p className="text-[11px] text-slate-500">Touch Rate</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-indigo-600">{item.conversionRate.toFixed(0)}%</p>
          <p className="text-[11px] text-slate-500">Conversion</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-sky-600">{item.followUpCompletionRate.toFixed(0)}%</p>
          <p className="text-[11px] text-slate-500">Follow-up Rate</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-rose-600">{item.missedFollowUps}</p>
          <p className="text-[11px] text-slate-500">Missed F/U</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-700">{timeAgo(item.lastActivityAt)}</p>
          <p className="text-[11px] text-slate-500">Last Activity</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 px-4 py-3">
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase text-slate-400">Status Mix</p>
          <DonutChart data={donutData} size="sm" showLegend={false} />
        </div>
        <div>
          <p className="mb-1 text-[11px] font-medium uppercase text-slate-400">Last 7 Days</p>
          <Sparkline data={item.weeklyActivity} />
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-3">
        <p className="mb-2 text-[11px] font-medium uppercase text-slate-400">Recent Activity</p>
        {item.recentActivity.length === 0 ? (
          <p className="text-xs text-slate-400">No recent activity.</p>
        ) : (
          <ul className="space-y-1.5">
            {item.recentActivity.slice(0, 5).map((a) => {
              const Icon = ACTIVITY_ICONS[a.action] ?? Tag;
              return (
                <li key={a.id} className="flex items-center gap-2 text-xs text-slate-600">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{a.action.replace(/_/g, " ")}</span>
                  <span className="ml-auto shrink-0 text-slate-400">{timeAgo(a.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 p-3">
        <Link href={`/leads?assignedTo=${item.userId}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            View All Leads
          </Button>
        </Link>
        <Link href={`/leads/reports/employee/${item.userId}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            Full Report
          </Button>
        </Link>
        {highMissed && onSendReminder && (
          <Button size="sm" variant="ghost" loading={sendingReminder} onClick={onSendReminder} title="Send reminder">
            <Bell className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
