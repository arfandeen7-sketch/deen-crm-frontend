import axios from "axios";
import { api, getData, postData, putData, deleteData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  ImportMapping,
  ImportSystemField,
  OpenHouseEvent,
  OpenHouseEventLead,
  OpenHouseEventOption,
  OpenHouseRsvp,
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
export type OpenHouseRsvpPayload = Record<string, string | number | null>;

export interface OpenHouseRsvpQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  eventId?: string;
  status?: string;
  expectedArrival?: string;
  sortBy?: "createdAt" | "guestName" | "expectedArrival" | "status" | "peopleComingWith" | "eventName";
  sortDir?: SortDir;
}

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

export interface RsvpImportAgentOption {
  id: string;
  fullName: string;
  employeeId: string | null;
  role: string;
  isActive: boolean;
}

export interface RsvpImportParseResult {
  headers: string[];
  previewRows: Record<string, string>[];
  totalRows: number;
  systemFields: ImportSystemField[];
}

export interface RsvpImportIssue {
  row: number;
  outcome: "invalid" | "duplicate";
  reason: string;
  guestName: string;
  mobile: string;
  agentName: string;
}

export interface RsvpImportPreview {
  total: number;
  valid: number;
  invalid: number;
  duplicate: number;
  unmatchedAgents: string[];
  ready: number;
  eventId: string | null;
  agents: { name: string; count: number; userId: string | null }[];
  blankCounts: { expectedArrival: number; interestedIn: number; budget: number };
  unmappedValues: {
    status: string[];
    expectedArrival: string[];
    interestedIn: string[];
    budget: string[];
  };
  issues: RsvpImportIssue[];
  validSample: Array<{
    row: number;
    guestName: string;
    mobile: string;
    agentName: string;
    createdByName: string;
    status: string;
    peopleComingWith: number | null;
    expectedArrival: string;
  }>;
}

export interface RsvpImportResult {
  imported: number;
  skipped: number;
  failed: number;
  duplicate: number;
  eventId: string;
  errors: RsvpImportIssue[];
}

export interface RsvpImportRequest {
  eventId?: string;
  mapping: ImportMapping;
  agentMap: Record<string, string>;
  defaults?: { expectedArrival?: string; interestedIn?: string; budget?: string };
  valueMaps?: {
    status?: Record<string, string>;
    expectedArrival?: Record<string, string>;
    interestedIn?: Record<string, string>;
    budget?: Record<string, string>;
  };
}

function rsvpImportForm(file: File, body: RsvpImportRequest): FormData {
  const form = new FormData();
  form.append("file", file);
  form.append("mapping", JSON.stringify(body.mapping));
  form.append("agentMap", JSON.stringify(body.agentMap));
  if (body.eventId) form.append("eventId", body.eventId);
  form.append("defaults", JSON.stringify(body.defaults ?? {}));
  form.append("valueMaps", JSON.stringify(body.valueMaps ?? {}));
  return form;
}

export const openHouseRsvpsService = {
  /** GET /api/open-house/rsvps — paginated list */
  async list(params: OpenHouseRsvpQueryParams = {}): Promise<Paginated<OpenHouseRsvp>> {
    const res = await api.get<Paginated<OpenHouseRsvp>>(`/open-house/rsvps${buildQuery(params)}`);
    return res.data;
  },

  getById(id: string): Promise<OpenHouseRsvp> {
    return getData<OpenHouseRsvp>(`/open-house/rsvps/${id}`);
  },

  create(body: OpenHouseRsvpPayload): Promise<OpenHouseRsvp> {
    return postData<OpenHouseRsvp>(`/open-house/rsvps`, body);
  },

  update(id: string, body: OpenHouseRsvpPayload): Promise<OpenHouseRsvp> {
    return putData<OpenHouseRsvp>(`/open-house/rsvps/${id}`, body);
  },

  remove(id: string): Promise<void> {
    return deleteData<void>(`/open-house/rsvps/${id}`);
  },

  async importAgents(): Promise<RsvpImportAgentOption[]> {
    return getData<RsvpImportAgentOption[]>("/open-house/rsvps/import/agents");
  },

  async parseImport(file: File): Promise<RsvpImportParseResult> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: RsvpImportParseResult }>("/open-house/rsvps/import/parse", form);
    return res.data.data;
  },

  async previewImport(file: File, body: RsvpImportRequest): Promise<RsvpImportPreview> {
    const res = await api.post<{ data: RsvpImportPreview }>("/open-house/rsvps/import/preview", rsvpImportForm(file, body));
    return res.data.data;
  },

  async importFile(file: File, body: RsvpImportRequest): Promise<RsvpImportResult> {
    const res = await api.post<{ data: RsvpImportResult }>("/open-house/rsvps/import", rsvpImportForm(file, body));
    return res.data.data;
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
