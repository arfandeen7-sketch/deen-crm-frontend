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
    <Card className="hover:border-foreground/20 transition-colors">
      <CardBody>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar name={team.fullName} size="md" />
              <div>
                <h3 className="font-semibold text-foreground">{team.fullName}</h3>
                <p className="text-sm text-foreground-muted">{team.email}</p>
              </div>
            </div>
            <Badge className="bg-panel text-foreground-secondary">
              Sales Manager
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 rounded-[6px] bg-panel p-3">
              <Users2 className="h-4 w-4 text-foreground-muted" />
              <div>
                <p className="text-xs text-foreground-muted">Team Size</p>
                <p className="text-lg font-semibold text-foreground">{team.stats.teamSize}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-[6px] bg-panel p-3">
              <UserCheck className="h-4 w-4 text-foreground-muted" />
              <div>
                <p className="text-xs text-foreground-muted">Team Leads</p>
                <p className="text-lg font-semibold text-foreground">{team.stats.teamLeads}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-[6px] bg-panel p-3">
              <TrendingUp className="h-4 w-4 text-foreground-muted" />
              <div>
                <p className="text-xs text-foreground-muted">Total</p>
                <p className="text-lg font-semibold text-foreground">{team.stats.totalLeads}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-foreground-muted">Team Members</p>
            <div className="space-y-1.5">
              {team.teamMembers.length === 0 ? (
                <p className="text-sm text-foreground-muted">No team members assigned</p>
              ) : (
                team.teamMembers.slice(0, 3).map((member) => (
                  <div key={member.id} className="flex items-center gap-2 text-sm">
                    <UserAvatar name={member.fullName} size="sm" />
                    <span className="text-foreground-secondary">{member.fullName}</span>
                  </div>
                ))
              )}
              {team.teamMembers.length > 3 && (
                <p className="text-xs text-foreground-muted">
                  +{team.teamMembers.length - 3} more
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(team)}
                className="flex-1 rounded-[6px] border border-border bg-background px-3 py-2 text-sm font-medium text-foreground-secondary hover:bg-panel"
              >
                View Details
              </button>
            )}
            {onManageTeam && (
              <button
                onClick={() => onManageTeam(team)}
                className="flex-1 rounded-[6px] bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90"
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
