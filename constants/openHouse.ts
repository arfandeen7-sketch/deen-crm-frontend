import type {
  OpenHouseEventStatus,
  OpenHouseLeadInterest,
  OpenHouseLeadPurpose,
} from "@/types";

export const OPEN_HOUSE_MODULE = "open_house_events";
export const OPEN_HOUSE_EVENTS_PAGE = "all_events";
export const OPEN_HOUSE_LEADS_PAGE = "event_leads";

export const EVENT_STATUS_OPTIONS: { value: OpenHouseEventStatus; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const EVENT_STATUS_COLORS: Record<OpenHouseEventStatus, string> = {
  upcoming: "bg-blue-50 text-blue-700",
  ongoing: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-neutral-100 text-neutral-500",
};

export const PROPERTY_TYPE_OPTIONS = [
  "Apartment",
  "Villa",
  "Townhouse",
  "Penthouse",
  "Duplex",
  "Studio",
  "Plot",
  "Office",
  "Retail",
  "Other",
];

export const BEDROOM_OPTIONS = ["Studio", "1 BR", "2 BR", "3 BR", "4 BR", "5 BR", "6+ BR"];

export const LEAD_PURPOSE_OPTIONS: { value: OpenHouseLeadPurpose; label: string }[] = [
  { value: "investment", label: "Investment" },
  { value: "end_use", label: "End Use" },
];

export const LEAD_INTEREST_OPTIONS: { value: OpenHouseLeadInterest; label: string }[] = [
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
];

export const LEAD_INTEREST_COLORS: Record<OpenHouseLeadInterest, string> = {
  hot: "bg-rose-50 text-rose-700",
  warm: "bg-amber-50 text-amber-700",
  cold: "bg-sky-50 text-sky-700",
};

export function labelFor<T extends string>(
  options: { value: T; label: string }[],
  value?: string | null,
): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}
