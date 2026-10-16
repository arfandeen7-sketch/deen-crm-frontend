import axios from "axios";

export interface AssignedLeadConflict {
  leadId?: string;
  leadName?: string;
  assignedToName: string;
}

export function alreadyAssignedMessage(conflicts: AssignedLeadConflict[]): string {
  const name = conflicts[0]?.assignedToName?.trim() || "another user";
  if (conflicts.length <= 1) return `This lead is already assigned to ${name}.`;
  const others = conflicts.length - 1;
  const otherLabel = `${others} other selected lead${others === 1 ? "" : "s"}`;
  const samePerson = conflicts.every((conflict) => conflict.assignedToName === conflicts[0].assignedToName);
  if (samePerson) {
    return `This lead is already assigned to ${name}. ${otherLabel} ${others === 1 ? "is" : "are"} already assigned to ${name}.`;
  }
  return `This lead is already assigned to ${name}. ${otherLabel} ${others === 1 ? "is" : "are"} already assigned to other users.`;
}

export function alreadyAssignedMessageFromError(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null;
  const data = error.response?.data as { error?: string; code?: string } | undefined;
  if (error.response?.status !== 409 || data?.code !== "ALREADY_ASSIGNED") return null;
  return data.error?.trim() || "This lead is already assigned to another user.";
}
