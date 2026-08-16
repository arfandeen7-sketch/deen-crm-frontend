import type { Lead } from "@/types";

/**
 * Determines whether a lead is a rental (tenant flow) vs a sale (buyer flow).
 *
 * Checks TWO sources because they can diverge for Property Finder leads:
 *  1. `serviceType` — the manual dropdown value ("Buy", "Sell", "Rent", "Mortgage").
 *     For PF leads this is hardcoded to "Buy" at ingestion time, so it alone
 *     is NOT reliable.
 *  2. `pfOfferingType` — derived from the PF listing's `price.type`
 *     ("sale" → sale, "yearly"/anything else → rent). Only present on PF leads.
 *
 * A lead is considered a rental if EITHER field indicates rent.
 */
export function isRentalLead(lead: Pick<Lead, "serviceType" | "pfOfferingType">): boolean {
  const st = lead.serviceType?.toLowerCase();
  const ot = lead.pfOfferingType?.toLowerCase();
  return st === "rent" || ot === "rent";
}

/**
 * Returns the effective service type for display purposes.
 *
 * For PF leads where `serviceType` is the ingestion default "Buy" but
 * `pfOfferingType` indicates rent, this returns "Rent" so the UI shows
 * the correct value. For non-PF leads, returns `serviceType` as-is.
 */
export function getEffectiveServiceType(lead: Pick<Lead, "serviceType" | "pfOfferingType">): string {
  if (isRentalLead(lead)) return "Rent";
  return lead.serviceType ?? "Buy";
}

/**
 * Returns the listing offering type for the For Sale / For Rent column.
 *
 * Prefers the PF-derived `pfOfferingType`. Falls back to an explicit
 * `serviceType` of Rent / Sell so manually created leads still show a value.
 * Does not map the PF ingestion default "Buy" to sale — that would mislabel
 * rental listings whose offering type was never stored.
 */
export function getLeadOfferingType(
  lead: Pick<Lead, "serviceType" | "pfOfferingType">,
): "sale" | "rent" | null {
  const ot = lead.pfOfferingType?.trim().toLowerCase();
  if (ot === "sale") return "sale";
  if (ot === "rent" || ot === "yearly" || ot === "monthly" || ot === "weekly" || ot === "daily") {
    return "rent";
  }

  const st = lead.serviceType?.trim().toLowerCase();
  if (st === "rent") return "rent";
  if (st === "sell") return "sale";
  return null;
}
