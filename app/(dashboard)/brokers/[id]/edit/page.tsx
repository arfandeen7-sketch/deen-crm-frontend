"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { BrokerForm } from "@/components/forms/BrokerForm";
import { useBroker, useBrokerMutations } from "@/hooks/useBrokers";
import { brokerSchema, type BrokerFormValues } from "@/schemas/broker.schema";
import { getErrorMessage } from "@/services/api/client";
import { AccessGuard } from "@/components/shared/Guards";

export default function EditBrokerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: broker, isLoading, isError, refetch } = useBroker(params.id);
  const { update } = useBrokerMutations();

  async function onSubmit(values: BrokerFormValues) {
    try {
      const parsed = brokerSchema.parse(values);
      await update.mutateAsync({ id: params.id, body: parsed });
      toast.success("Broker updated");
      router.push(`/brokers/${params.id}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <AccessGuard module="brokers" page="all_brokers" action="create">
    <div className="space-y-5">
      <Link href={`/brokers/${params.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to broker
      </Link>
      <PageHeader title="Edit Broker" subtitle={broker?.brokerName} />
      <Card>
        <CardBody>
          {isLoading ? (
            <LoadingState />
          ) : isError || !broker ? (
            <ErrorState onRetry={refetch} />
          ) : (
            <BrokerForm
              initial={broker}
              submitting={update.isPending}
              onSubmit={onSubmit}
              onCancel={() => router.push(`/brokers/${params.id}`)}
            />
          )}
        </CardBody>
      </Card>
    </div>
    </AccessGuard>
  );
}
