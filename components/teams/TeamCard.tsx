"use client";

import { Users2, TrendingUp, UserCheck } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/Avatar";
import type { TeamOverview } from "@/types";

interface TeamCardProps {
  team: TeamOverview;
  onViewDetails?: (team: TeamOverview) => void;
  onManageTeam?: (team: TeamOverview) => void;
}

export function TeamCard({ team, onViewDetails, onManageTeam }: TeamCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardBody>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar name={team.fullName} size="md" />
              <div>
                <h3 className="font-semibold text-slate-900">{team.fullName}</h3>
                <p className="text-sm text-slate-500">{team.email}</p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-700 ring-blue-600/20">
              Sales Manager
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3">
              <Users2 className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Team Size</p>
                <p className="text-lg font-semibold text-slate-900">{team.stats.teamSize}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-xs text-emerald-600">Team Leads</p>
                <p className="text-lg font-semibold text-emerald-700">{team.stats.teamLeads}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-indigo-50 p-3">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <div>
                <p className="text-xs text-indigo-600">Total</p>
                <p className="text-lg font-semibold text-indigo-700">{team.stats.totalLeads}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-slate-500">Team Members</p>
            <div className="space-y-1.5">
              {team.teamMembers.length === 0 ? (
                <p className="text-sm text-slate-400">No team members assigned</p>
              ) : (
                team.teamMembers.slice(0, 3).map((member) => (
                  <div key={member.id} className="flex items-center gap-2 text-sm">
                    <UserAvatar name={member.fullName} size="xs" />
                    <span className="text-slate-700">{member.fullName}</span>
                  </div>
                ))
              )}
              {team.teamMembers.length > 3 && (
                <p className="text-xs text-slate-500">
                  +{team.teamMembers.length - 3} more
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(team)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View Details
              </button>
            )}
            {onManageTeam && (
              <button
                onClick={() => onManageTeam(team)}
                className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Manage Team
              </button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
