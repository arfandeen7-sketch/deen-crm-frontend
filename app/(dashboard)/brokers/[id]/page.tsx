"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Phone, Building2, User as UserIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { BrokerStatusBadge, StatusBadge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/Avatar";
import { CanAccess } from "@/components/shared/Guards";
import { useBroker, useBrokerLeads } from "@/hooks/useBrokers";
import { formatDate } from "@/lib/utils";

export default function BrokerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: broker, isLoading, isError, refetch } = useBroker(params.id);
  const leads = useBrokerLeads(params.id);

  if (isLoading) return <LoadingState />;
  if (isError || !broker) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-5">
      <Link href="/brokers" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to brokers
      </Link>

      <PageHeader
        title={broker.brokerName}
        subtitle={broker.companyName ?? "Independent broker"}
        actions={
          <CanAccess module="brokers" page="all_brokers" action="create">
            <Button variant="outline" onClick={() => router.push(`/brokers/${broker.id}/edit`)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          </CanAccess>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Broker Details" />
          <CardBody className="space-y-3 text-sm">
            <div className="flex items-center gap-2"><BrokerStatusBadge status={broker.status} /></div>
            <p className="flex items-center gap-2 text-slate-700"><Phone className="h-4 w-4 text-slate-400" /> {broker.mobileNumber}</p>
            <p className="flex items-center gap-2 text-slate-700"><Building2 className="h-4 w-4 text-slate-400" /> {broker.companyName ?? "—"}</p>
            <p className="flex items-center gap-2 text-slate-700"><UserIcon className="h-4 w-4 text-slate-400" /> Posted by {broker.poster?.fullName ?? "—"}</p>
            <p className="text-xs text-slate-400">Added {formatDate(broker.createdAt)}</p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Broker Lead Mapping" subtitle="Leads attributed to this broker" />
          <CardBody className="p-0">
            {leads.isLoading ? (
              <LoadingState />
            ) : (leads.data?.data?.length ?? 0) === 0 ? (
              <EmptyState title="No leads" message="No leads are linked to this broker yet." />
            ) : (
              <div className="divide-y divide-slate-100">
                {leads.data?.data?.map((l) => (
                  <Link key={l.id} href={`/leads/${l.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <UserAvatar name={l.leadName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{l.leadName}</p>
                      <p className="text-xs text-slate-500">{l.source} · {l.mobileNumber}</p>
                    </div>
                    <StatusBadge status={l.leadStatus} />
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
