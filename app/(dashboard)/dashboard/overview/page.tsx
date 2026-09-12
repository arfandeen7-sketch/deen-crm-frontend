"use client";

import { Suspense } from "react";
import { RoleDashboardRouter } from "@/components/dashboard/RoleDashboardRouter";
import { LoadingState } from "@/components/ui/States";

export default function DashboardOverviewPage() {
  // The dashboards read the active period from the URL via useSearchParams,
  // which needs a Suspense boundary to avoid opting the route out of prerendering.
  return (
    <Suspense fallback={<LoadingState label="Loading dashboard…" />}>
      <RoleDashboardRouter />
    </Suspense>
  );
}
