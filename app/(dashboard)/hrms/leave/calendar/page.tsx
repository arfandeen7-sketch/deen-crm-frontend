"use client";

import { useState } from "react";
import { useLeaveCalendar } from "@/hooks/useHrms";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { AccessGuard } from "@/components/shared/Guards";
import { LeaveCalendar } from "@/components/leave/LeaveCalendar";

export default function HrLeaveCalendarPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const { data: days, isLoading } = useLeaveCalendar(month + 1, year);

  return (
    <AccessGuard module="hrms" page="leave">
      <div className="space-y-6">
        <PageHeader
          title="Leave Calendar"
          subtitle="View team leave and attendance calendar"
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
