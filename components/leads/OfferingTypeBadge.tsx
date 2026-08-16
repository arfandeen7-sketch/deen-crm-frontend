import { getLeadOfferingType } from "@/lib/leadServiceType";
import type { Lead } from "@/types";

export function OfferingTypeBadge({
  lead,
}: {
  lead: Pick<Lead, "serviceType" | "pfOfferingType">;
}) {
  const ot = getLeadOfferingType(lead);
  if (!ot) return <span className="text-sm text-slate-400">—</span>;
  if (ot === "sale") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        For Sale
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
      For Rent
    </span>
  );
}
