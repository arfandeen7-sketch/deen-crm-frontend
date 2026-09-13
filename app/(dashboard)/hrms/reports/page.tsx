"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy /hrms/reports path — replaced with a redirect to /reports?domain=hr.
 * The old HR reports module was broken (called nonexistent endpoints and
 * rendered raw JSON). The new unified /reports hub handles HR reports.
 */
export default function HrmsReportsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/reports?domain=hr");
  }, [router]);
  return null;
}
