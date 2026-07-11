"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Mail, Phone, Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { RoleBadge, Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/Avatar";
import { useUser } from "@/hooks/useUsers";
import { formatDateTime } from "@/lib/utils";
import { AccessGuard } from "@/components/shared/Guards";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: user, isLoading, isError, refetch } = useUser(params.id);

  if (isLoading) return <LoadingState />;
  if (isError || !user) return <ErrorState onRetry={refetch} />;

  return (
    <AccessGuard module="users" page="all_users">
    <div className="space-y-5">
      <Link href="/users" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <PageHeader
        title={user.fullName}
        actions={
          <Button variant="outline" onClick={() => router.push(`/users/${user.id}/edit`)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        }
      />

      <Card className="max-w-xl">
        <CardHeader title="Profile" />
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3">
            <UserAvatar name={user.fullName} size="lg" />
            <div className="flex flex-wrap items-center gap-2">
              <RoleBadge role={user.role} />
              {user.isActive ? (
                <Badge className="bg-emerald-100 text-emerald-700 ring-emerald-600/20">Active</Badge>
              ) : (
                <Badge className="bg-slate-100 text-slate-500 ring-slate-500/20">Inactive</Badge>
              )}
            </div>
          </div>
          <div className="space-y-2 text-sm text-slate-700">
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> {user.email}</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {user.phone ?? "—"}</p>
            <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" /> Joined {formatDateTime(user.createdAt)}</p>
          </div>
        </CardBody>
      </Card>
    </div>
    </AccessGuard>
  );
}
