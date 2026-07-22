"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLeaveCalendar } from "@/hooks/useHrms";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { AccessGuard } from "@/components/shared/Guards";
import { LeaveCalendar } from "@/components/leave/LeaveCalendar";

export default function LeaveCalendarPage() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const { data: days, isLoading } = useLeaveCalendar(month + 1, year);

  return (
    <AccessGuard module="my_hr" page="my_leave">
      <div className="space-y-6">
        <PageHeader
          title="Leave Calendar"
          subtitle="View your leave and attendance calendar"
          actions={
            <Button variant="outline" onClick={() => router.push("/my-hr/leave")}>
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Button>
          }
        />
        <Card>
          <CardBody>
            {isLoading ? (
              <p className="py-8 text-center text-sm text-foreground-muted">Loading calendar…</p>
            ) : (
              <LeaveCalendar
                days={days ?? []}
                month={month}
                year={year}
                onMonthChange={(m, y) => { setMonth(m); setYear(y); }}
              />
            )}
          </CardBody>
        </Card>
      </div>
    </AccessGuard>
  );
}
