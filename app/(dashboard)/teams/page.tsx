"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Users2, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { TeamCard } from "@/components/teams/TeamCard";
import { UnassignedExecutives } from "@/components/teams/UnassignedExecutives";
import { AssignTeamModal } from "@/components/teams/AssignTeamModal";
import { ConfirmModal } from "@/components/ui/Modal";
import { PermissionGuard } from "@/components/shared/Guards";
import { useAllTeams, useTeamMutations } from "@/hooks/useTeams";
import { useUsers } from "@/hooks/useUsers";
import { getErrorMessage } from "@/services/api/client";
import { Skeleton } from "@/components/ui/States";
import type { TeamOverview, User } from "@/types";

export default function TeamsPage() {
  const { data, isLoading, refetch } = useAllTeams();
  const { data: usersData } = useUsers();
  const { assignExecutives, unassignExecutive, reassignExecutive } = useTeamMutations();
  
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedExecutive, setSelectedExecutive] = useState<Pick<User, "id" | "fullName" | "email"> | null>(null);
  const [unassignTarget, setUnassignTarget] = useState<{ executiveId: string; executiveName: string } | null>(null);

  const managers = usersData?.users.filter((u) => u.role === "sales_manager" && u.isActive) ?? [];
  const unassignedExecutives = data?.unassignedExecutives ?? [];

  const handleAssignExecutives = async (managerId: string, executiveIds: string[]) => {
    try {
      await assignExecutives.mutateAsync({ managerId, executiveIds });
      toast.success(`${executiveIds.length} executive(s) assigned successfully`);
      setAssignModalOpen(false);
      setSelectedExecutive(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const handleUnassign = async () => {
    if (!unassignTarget) return;
    try {
      await unassignExecutive.mutateAsync({ executiveId: unassignTarget.executiveId });
      toast.success("Executive removed from team");
      setUnassignTarget(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const handleAssignClick = (executive?: Pick<User, "id" | "fullName" | "email">) => {
    setSelectedExecutive(executive ?? null);
    setAssignModalOpen(true);
  };

  if (isLoading) {
    return (
      <PermissionGuard permission="users.manage">
        <div className="space-y-5">
          <PageHeader title="Teams" subtitle="Manage sales teams and assignments" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permission="users.manage">
      <div className="space-y-5">
        <PageHeader
          title="Teams"
          subtitle="Manage sales teams and assignments"
          actions={
            <Button onClick={() => handleAssignClick()}>
              <UserPlus className="h-4 w-4" />
              Assign Team
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Teams"
            value={data?.totalTeams ?? 0}
            icon={Users2}
            accent="bg-indigo-50 text-indigo-600"
          />
          <StatCard
            label="Total Executives"
            value={(data?.teams.reduce((sum, t) => sum + t.stats.teamSize, 0) ?? 0) + (data?.totalUnassigned ?? 0)}
            icon={Users2}
            accent="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            label="Unassigned"
            value={data?.totalUnassigned ?? 0}
            icon={Users2}
            accent="bg-amber-50 text-amber-600"
          />
        </div>

        {data?.teams && data.teams.length > 0 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Sales Teams</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {data.teams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  onManageTeam={() => handleAssignClick()}
                />
              ))}
            </div>
          </div>
        )}

        {unassignedExecutives.length > 0 && (
          <UnassignedExecutives
            executives={unassignedExecutives}
            onAssign={handleAssignClick}
          />
        )}

        {data?.teams.length === 0 && unassignedExecutives.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <Users2 className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">No teams yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              Create sales managers and executives, then assign them to teams.
            </p>
          </div>
        )}

        <AssignTeamModal
          open={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false);
            setSelectedExecutive(null);
          }}
          onConfirm={handleAssignExecutives}
          managers={managers}
          executives={unassignedExecutives}
          loading={assignExecutives.isPending}
          preselectedExecutive={selectedExecutive ?? undefined}
        />

        <ConfirmModal
          open={!!unassignTarget}
          onClose={() => setUnassignTarget(null)}
          onConfirm={handleUnassign}
          title="Remove from team?"
          message={`${unassignTarget?.executiveName} will be unassigned and can be reassigned to another manager.`}
          confirmLabel="Remove"
          loading={unassignExecutive.isPending}
        />
      </div>
    </PermissionGuard>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
