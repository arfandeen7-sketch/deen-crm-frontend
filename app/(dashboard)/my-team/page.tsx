"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users2, TrendingUp, Target, Award } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TeamMemberCard } from "@/components/teams/TeamMemberCard";
import { useMyTeam } from "@/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton, LoadingState } from "@/components/ui/States";

export default function MyTeamPage() {
  const router = useRouter();
  const { role, hydrated } = useAuth();
  const { data, isLoading, isError } = useMyTeam();

  useEffect(() => {
    if (hydrated && role !== "sales_manager") {
      router.replace("/dashboard/overview");
    }
  }, [hydrated, role, router]);

  if (!hydrated || role !== "sales_manager") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingState label="Checking access…" />
      </div>
    );
  }

  const teamMembers = data?.teamMembers ?? [];
  const totalLeads = teamMembers.reduce((sum, m) => sum + (m.stats?.totalLeads ?? 0), 0);
  const activeLeads = teamMembers.reduce((sum, m) => sum + (m.stats?.activeLeads ?? 0), 0);
  const convertedLeads = teamMembers.reduce((sum, m) => sum + (m.stats?.convertedLeads ?? 0), 0);
  const avgConversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-5">
        <PageHeader title="My Team" subtitle="View your team's performance" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-5">
        <PageHeader title="My Team" subtitle="View your team's performance" />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
          <p className="text-sm text-rose-600">Failed to load team data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Team"
        subtitle={`Manage and track performance of ${teamMembers.length} team member${teamMembers.length !== 1 ? 's' : ''}`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Team Size"
          value={teamMembers.length}
          icon={Users2}
          accent="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Total Leads"
          value={totalLeads}
          icon={Target}
          accent="bg-slate-50 text-slate-600"
        />
        <StatCard
          label="Active Leads"
          value={activeLeads}
          icon={TrendingUp}
          accent="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Avg. Conversion"
          value={avgConversionRate}
          icon={Award}
          accent="bg-emerald-50 text-emerald-600"
          suffix="%"
        />
      </div>

      {teamMembers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Users2 className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">No team members yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Your team members will appear here once they are assigned to you.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Team Members</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  suffix,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${accent}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-semibold text-slate-900">
          {value}
          {suffix}
        </p>
      </div>
    </div>
  );
}
