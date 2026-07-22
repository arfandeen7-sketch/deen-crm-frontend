"use client";

import Link from "next/link";
import { Mail, Phone, KeyRound, Plug, Activity } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RoleBadge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/Avatar";
import { LoadingState } from "@/components/ui/States";
import { CanAccess } from "@/components/shared/Guards";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return <LoadingState />;

  return (
    <div className="space-y-5">
      <PageHeader title="Profile" subtitle="Your account information" />

      <Card className="max-w-xl">
        <CardHeader
          title="Account"
          action={
            <Link href="/settings/change-password">
              <Button variant="outline" size="sm">
                <KeyRound className="h-4 w-4" /> Change Password
              </Button>
            </Link>
          }
        />
        <CardBody className="space-y-5">
          <div className="flex items-center gap-4">
            <UserAvatar name={user.fullName} size="lg" />
            <div>
              <p className="text-lg font-semibold text-slate-900">{user.fullName}</p>
              <RoleBadge role={user.role} />
            </div>
          </div>
          <div className="space-y-2 text-sm text-slate-700">
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> {user.email}</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {user.phone ?? "Not set"}</p>
          </div>
        </CardBody>
      </Card>

      <CanAccess module="integrations" page="all_integrations">
        <Card className="max-w-xl">
          <CardHeader title="Integrations" />
          <CardBody className="space-y-3">
            <p className="text-sm text-foreground-muted">Manage OAuth-based lead source integrations.</p>
            <div className="flex gap-2">
              <CanAccess module="integrations" page="all_integrations">
                <Link href="/integrations">
                  <Button variant="outline" size="sm">
                    <Plug className="h-4 w-4" /> Manage Integrations
                  </Button>
                </Link>
              </CanAccess>
              <CanAccess module="integrations" page="all_integrations" action="health">
                <Link href="/integrations/dashboard">
                  <Button variant="outline" size="sm">
                    <Activity className="h-4 w-4" /> Dashboard
                  </Button>
                </Link>
              </CanAccess>
            </div>
          </CardBody>
        </Card>
      </CanAccess>
    </div>
  );
}
