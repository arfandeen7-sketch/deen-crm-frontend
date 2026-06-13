"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Eye, Pencil, Power, Users2, ShieldCheck, UserCog } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { RoleBadge, Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/Avatar";
import { useUsers, useUserMutations } from "@/hooks/useUsers";
import { getErrorMessage } from "@/services/api/client";
import { ROLE_LABELS } from "@/constants";
import type { User } from "@/types";

export default function UsersPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useUsers();
  const { toggleActive } = useUserMutations();
  const [toggleUser, setToggleUser] = useState<User | null>(null);

  const counts = data?.roleCounts;

  async function handleToggle() {
    if (!toggleUser) return;
    try {
      await toggleActive.mutateAsync(toggleUser.id);
      toast.success(toggleUser.isActive ? "User deactivated" : "User activated");
      setToggleUser(null);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "User",
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <UserAvatar name={u.fullName} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{u.fullName}</p>
            <p className="text-xs text-slate-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (u) => u.phone ?? "—" },
    { key: "role", header: "Role", render: (u) => <RoleBadge role={u.role} /> },
    {
      key: "status",
      header: "Status",
      render: (u) =>
        u.isActive ? (
          <Badge className="bg-emerald-100 text-emerald-700 ring-emerald-600/20">Active</Badge>
        ) : (
          <Badge className="bg-slate-100 text-slate-500 ring-slate-500/20">Inactive</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      headerClassName: "text-right",
      className: "text-right",
      render: (u) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Link href={`/users/${u.id}`} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <Eye className="h-4 w-4" />
          </Link>
          <Link href={`/users/${u.id}/edit`} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600">
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setToggleUser(u)}
            className={`rounded p-1.5 hover:bg-slate-100 ${u.isActive ? "text-rose-400 hover:text-rose-600" : "text-emerald-500 hover:text-emerald-600"}`}
          >
            <Power className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        subtitle="Manage staff accounts and roles"
        actions={
          <Button onClick={() => router.push("/users/create")}>
            <Plus className="h-4 w-4" /> Create User
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <RoleCountCard label={ROLE_LABELS.master} count={counts?.master} icon={ShieldCheck} accent="bg-violet-50 text-violet-600" />
        <RoleCountCard label={ROLE_LABELS.sales_manager} count={counts?.sales_manager} icon={UserCog} accent="bg-blue-50 text-blue-600" />
        <RoleCountCard label={ROLE_LABELS.sales_executive} count={counts?.sales_executive} icon={Users2} accent="bg-emerald-50 text-emerald-600" />
      </div>

      <Card>
        <DataTable
          columns={columns}
          rows={data?.users ?? []}
          rowKey={(u) => u.id}
          loading={isLoading}
          error={isError}
          onRetry={refetch}
          emptyTitle="No users"
          onRowClick={(u) => router.push(`/users/${u.id}`)}
        />
      </Card>

      <ConfirmModal
        open={!!toggleUser}
        onClose={() => setToggleUser(null)}
        onConfirm={handleToggle}
        title={toggleUser?.isActive ? "Deactivate user?" : "Activate user?"}
        message={
          toggleUser?.isActive
            ? "The user will no longer be able to sign in."
            : "The user will regain access to the CRM."
        }
        confirmLabel={toggleUser?.isActive ? "Deactivate" : "Activate"}
        danger={toggleUser?.isActive}
        loading={toggleActive.isPending}
      />
    </div>
  );
}

function RoleCountCard({
  label,
  count,
  icon: Icon,
  accent,
}: {
  label: string;
  count?: number;
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
        <p className="text-xl font-semibold text-slate-900">{count ?? 0}</p>
      </div>
    </div>
  );
}
