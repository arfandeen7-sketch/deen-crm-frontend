import axios from "axios";
import { api, getData, postData, putData, deleteData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  OpenHouseEvent,
  OpenHouseEventLead,
  OpenHouseEventOption,
  Paginated,
} from "@/types";

export type SortDir = "asc" | "desc";

export interface OpenHouseEventQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  developerName?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "eventDate" | "eventName" | "developerName" | "location" | "status" | "createdAt";
  sortDir?: SortDir;
}

export interface OpenHouseEventLeadQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  eventId?: string;
  nationality?: string;
  propertyType?: string;
  interestedProject?: string;
  interestLevel?: string;
  purpose?: string;
  budgetMin?: string;
  budgetMax?: string;
  createdFrom?: string;
  createdTo?: string;
  sortBy?: "createdAt" | "clientName" | "budget" | "nationality" | "eventName" | "eventDate";
  sortDir?: SortDir;
}

export type OpenHouseEventPayload = Record<string, string | number | null>;
export type OpenHouseEventLeadPayload = Record<string, string | number | null>;

export const openHouseEventsService = {
  /** GET /api/open-house/events — paginated list */
  async list(params: OpenHouseEventQueryParams = {}): Promise<Paginated<OpenHouseEvent>> {
    const res = await api.get<Paginated<OpenHouseEvent>>(`/open-house/events${buildQuery(params)}`);
    return res.data;
  },

  /** GET /api/open-house/events/options — all events for dropdowns */
  options(): Promise<OpenHouseEventOption[]> {
    return getData<OpenHouseEventOption[]>(`/open-house/events/options`);
  },

  getById(id: string): Promise<OpenHouseEvent> {
    return getData<OpenHouseEvent>(`/open-house/events/${id}`);
  },

  create(body: OpenHouseEventPayload): Promise<OpenHouseEvent> {
    return postData<OpenHouseEvent>(`/open-house/events`, body);
  },

  update(id: string, body: OpenHouseEventPayload): Promise<OpenHouseEvent> {
    return putData<OpenHouseEvent>(`/open-house/events/${id}`, body);
  },

  remove(id: string): Promise<void> {
    return deleteData<void>(`/open-house/events/${id}`);
  },
};

export const openHouseEventLeadsService = {
  /** GET /api/open-house/leads — paginated list */
  async list(params: OpenHouseEventLeadQueryParams = {}): Promise<Paginated<OpenHouseEventLead>> {
    const res = await api.get<Paginated<OpenHouseEventLead>>(`/open-house/leads${buildQuery(params)}`);
    return res.data;
  },

  getById(id: string): Promise<OpenHouseEventLead> {
    return getData<OpenHouseEventLead>(`/open-house/leads/${id}`);
  },

  create(body: OpenHouseEventLeadPayload): Promise<OpenHouseEventLead> {
    return postData<OpenHouseEventLead>(`/open-house/leads`, body);
  },

  update(id: string, body: OpenHouseEventLeadPayload): Promise<OpenHouseEventLead> {
    return putData<OpenHouseEventLead>(`/open-house/leads/${id}`, body);
  },

  remove(id: string): Promise<void> {
    return deleteData<void>(`/open-house/leads/${id}`);
  },
};

/** Maps the backend's `{ details: [{ path, message }] }` validation payload to field errors. */
export function serverFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError(error)) return {};
  const details = (error.response?.data as { details?: unknown } | undefined)?.details;
  if (!Array.isArray(details)) return {};
  const out: Record<string, string> = {};
  for (const d of details as { path?: string; message?: string }[]) {
    const key = d.path?.split(".")[0];
    if (key && d.message && !out[key]) out[key] = d.message;
  }
  return out;
}
