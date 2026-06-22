import {
  api,
  deleteData,
  getData,
  postData,
  putData,
} from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  ImportResult,
  Lead,
  LeadQueryParams,
  Paginated,
} from "@/types";

export type LeadInput = Partial<Omit<Lead, "id" | "createdAt" | "updatedAt">>;

export const leadsService = {
  async list(params: LeadQueryParams = {}): Promise<Paginated<Lead>> {
    const res = await api.get<Paginated<Lead>>(`/leads${buildQuery(params)}`);
    return res.data;
  },

  get(id: string): Promise<Lead> {
    return getData<Lead>(`/leads/${id}`);
  },

  create(body: LeadInput): Promise<Lead> {
    return postData<Lead>("/leads", body);
  },

  update(id: string, body: LeadInput): Promise<Lead> {
    return putData<Lead>(`/leads/${id}`, body);
  },

  remove(id: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/leads/${id}`);
  },

  bulkAssign(leadIds: string[], assignedTo: string): Promise<{ updated: number }> {
    return postData<{ updated: number }>("/leads/bulk-assign", { leadIds, assignedTo });
  },

  bulkStatus(leadIds: string[], status: string): Promise<{ matched: number; updated: number }> {
    return postData<{ matched: number; updated: number }>("/leads/bulk-status", { leadIds, status });
  },

  async import(file: File): Promise<ImportResult> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: ImportResult } | ImportResult>(
      "/leads/import",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    // Backend returns the structured report; support both envelope styles.
    const body = res.data as { data?: ImportResult } & Partial<ImportResult>;
    return (body.data ?? body) as ImportResult;
  },

  async export(params: LeadQueryParams = {}): Promise<Blob> {
    const res = await api.get(`/leads/export${buildQuery(params)}`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },

  async template(): Promise<Blob> {
    const res = await api.get(`/leads/template`, { responseType: "blob" });
    return res.data as Blob;
  },
};

export const followupService = {
  async today(params: LeadQueryParams = {}): Promise<Paginated<Lead>> {
    const res = await api.get<Paginated<Lead>>(`/followup/today${buildQuery(params)}`);
    return res.data;
  },
  async missed(params: LeadQueryParams = {}): Promise<Paginated<Lead>> {
    const res = await api.get<Paginated<Lead>>(`/followup/missed${buildQuery(params)}`);
    return res.data;
  },
  async upcoming(params: LeadQueryParams = {}): Promise<Paginated<Lead>> {
    const res = await api.get<Paginated<Lead>>(`/followup/upcoming${buildQuery(params)}`);
    return res.data;
  },
};
