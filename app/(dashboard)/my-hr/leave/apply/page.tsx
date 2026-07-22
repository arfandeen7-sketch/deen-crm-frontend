"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { AccessGuard } from "@/components/shared/Guards";
import { LeaveApplyForm } from "@/components/leave/LeaveApplyForm";

export default function LeaveApplyPage() {
  const router = useRouter();

  return (
    <AccessGuard module="my_hr" page="my_leave">
      <div className="space-y-6">
        <PageHeader
          title="Apply for Leave"
          subtitle="Submit a new leave request"
          actions={
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          }
        />
        <Card>
          <CardBody>
            <LeaveApplyForm onSuccess={() => router.push("/my-hr/leave")} />
          </CardBody>
        </Card>
      </div>
    </AccessGuard>
  );
}
