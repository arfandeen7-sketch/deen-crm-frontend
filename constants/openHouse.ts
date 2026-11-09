import type {
  OpenHouseEventStatus,
  OpenHouseLeadInterest,
  OpenHouseLeadPurpose,
  OpenHouseRsvpBudget,
  OpenHouseRsvpInterest,
  OpenHouseRsvpStatus,
} from "@/types";

export const OPEN_HOUSE_MODULE = "open_house_events";
export const OPEN_HOUSE_EVENTS_PAGE = "all_events";
export const OPEN_HOUSE_LEADS_PAGE = "event_leads";
export const OPEN_HOUSE_RSVP_PAGE = "rsvp";

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

export const RSVP_STATUS_OPTIONS: { value: OpenHouseRsvpStatus; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "maybe", label: "Maybe" },
  { value: "awaiting", label: "Awaiting" },
  { value: "declined", label: "Declined" },
];

export const RSVP_STATUS_COLORS: Record<OpenHouseRsvpStatus, string> = {
  confirmed: "bg-emerald-50 text-emerald-700",
  maybe: "bg-amber-50 text-amber-700",
  awaiting: "bg-sky-50 text-sky-700",
  declined: "bg-neutral-100 text-neutral-500",
};

export const RSVP_INTEREST_OPTIONS: { value: OpenHouseRsvpInterest; label: string }[] = [
  { value: "studio", label: "Studio" },
  { value: "1_br", label: "1 BR" },
  { value: "2_br", label: "2 BR" },
  { value: "3_br_plus", label: "3 BR+" },
  { value: "villa_townhouse", label: "Villa / Townhouse" },
  { value: "investment", label: "Investment" },
  { value: "commercial", label: "Commercial" },
  { value: "not_sure", label: "Not Sure Yet" },
];

export const RSVP_BUDGET_OPTIONS: { value: OpenHouseRsvpBudget; label: string }[] = [
  { value: "aed_1m_1_5m", label: "AED 1 – 1.5 Million" },
  { value: "aed_1_5m_2m", label: "AED 1.5 – 2 Million" },
  { value: "aed_2m_3m", label: "AED 2 – 3 Million" },
  { value: "aed_3m_4m", label: "AED 3 – 4 Million" },
  { value: "aed_4m_5m", label: "AED 4 – 5 Million" },
  { value: "aed_5m_plus", label: "AED 5+ Million" },
];

/** 9:00 AM through 9:30 PM, every 30 minutes. `value` is 24-hour HH:mm. */
export const RSVP_ARRIVAL_SLOTS: { value: string; label: string }[] = (() => {
  const slots: { value: string; label: string }[] = [];
  for (let minutes = 9 * 60; minutes <= 21 * 60 + 30; minutes += 30) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const suffix = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    slots.push({ value, label: `${hour}:${String(m).padStart(2, "0")} ${suffix}` });
  }
  return slots;
})();

export function labelFor<T extends string>(
  options: { value: T; label: string }[],
  value?: string | null,
): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}
