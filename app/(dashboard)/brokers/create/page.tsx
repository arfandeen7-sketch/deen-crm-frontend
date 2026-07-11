"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { BrokerForm } from "@/components/forms/BrokerForm";
import { useBrokerMutations } from "@/hooks/useBrokers";
import { brokerSchema, type BrokerFormValues } from "@/schemas/broker.schema";
import { getErrorMessage } from "@/services/api/client";
import { AccessGuard } from "@/components/shared/Guards";

export default function CreateBrokerPage() {
  const router = useRouter();
  const { create } = useBrokerMutations();

  async function onSubmit(values: BrokerFormValues) {
    try {
      const parsed = brokerSchema.parse(values);
      const broker = await create.mutateAsync(parsed);
      toast.success("Broker created");
      router.push(`/brokers/${broker.id}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  return (
    <AccessGuard module="brokers" page="all_brokers" action="create">
    <div className="space-y-5">
      <Link href="/brokers" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to brokers
      </Link>
      <PageHeader title="Add Broker" subtitle="Register a new broker" />
      <Card>
        <CardBody>
          <BrokerForm submitting={create.isPending} onSubmit={onSubmit} onCancel={() => router.push("/brokers")} />
        </CardBody>
      </Card>
    </div>
    </AccessGuard>
  );
}
