const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ASSIGNMENT_NOTIFICATION_PREVIEW = 8;

export function assignmentLeadIds(leads: Array<{ id?: string | null }> | null | undefined): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const lead of leads ?? []) {
    const id = lead?.id?.trim() ?? "";
    if (!UUID.test(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

/**
 * Where a notification click should go.
 * One lead opens that lead. A batch opens All Leads filtered to those ids.
 */
export function assignmentNotificationHref(
  leadId?: string | null,
  leads?: Array<{ id?: string | null }> | null,
): string | null {
  if (leadId && UUID.test(leadId)) return `/leads/${leadId}`;
  const ids = assignmentLeadIds(leads);
  if (ids.length === 1) return `/leads/${ids[0]}`;
  if (ids.length > 1) return `/leads?leadIds=${ids.join(",")}`;
  return null;
}
