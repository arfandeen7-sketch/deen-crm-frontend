"use client";

import { TrendingUp, Target, CheckCircle2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { UserAvatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { TeamMember } from "@/types";

interface TeamMemberCardProps {
  member: TeamMember;
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  const conversionRate = member.stats
    ? member.stats.totalLeads > 0
      ? Math.round((member.stats.convertedLeads / member.stats.totalLeads) * 100)
      : 0
    : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardBody>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar name={member.fullName} size="md" />
              <div>
                <h3 className="font-semibold text-slate-900">{member.fullName}</h3>
                <p className="text-sm text-slate-500">{member.email}</p>
                {member.designation && (
                  <p className="text-xs text-slate-400">{member.designation}</p>
                )}
              </div>
            </div>
            {member.isActive ? (
              <Badge className="bg-emerald-100 text-emerald-700 ring-emerald-600/20">
                Active
              </Badge>
            ) : (
              <Badge className="bg-slate-100 text-slate-500 ring-slate-500/20">
                Inactive
              </Badge>
            )}
          </div>

          {member.stats && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Target className="h-3.5 w-3.5" />
                    <p className="text-xs">Total</p>
                  </div>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {member.stats.totalLeads}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <p className="text-xs">Active</p>
                  </div>
                  <p className="mt-1 text-lg font-semibold text-blue-700">
                    {member.stats.activeLeads}
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3">
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <p className="text-xs">Converted</p>
                  </div>
                  <p className="mt-1 text-lg font-semibold text-emerald-700">
                    {member.stats.convertedLeads}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-500">Conversion Rate</p>
                  <p className="text-sm font-semibold text-slate-900">{conversionRate}%</p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all"
                    style={{ width: `${Math.min(conversionRate, 100)}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
