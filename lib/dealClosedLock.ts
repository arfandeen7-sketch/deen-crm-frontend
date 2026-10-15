/** Status value that moves a lead into the Deal Closed module and locks it. */
export const DEAL_CLOSED_STATUS = "Deal Closed";

export function isDealClosedStatus(status: string | null | undefined): boolean {
  return (status ?? "").trim().toLowerCase() === DEAL_CLOSED_STATUS.toLowerCase();
}

/**
 * Unlock rule: only a Master user can edit a Deal Closed lead or change its
 * status. Every other role, including the user who closed the deal, is locked.
 * Leads that are not Deal Closed stay editable under the normal permissions.
 */
export function canMutateDealClosedLead(
  role: string | null | undefined,
  status: string | null | undefined,
): boolean {
  if (!isDealClosedStatus(status)) return true;
  return role === "master";
}
