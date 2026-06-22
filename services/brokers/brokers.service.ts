import {
  api,
  deleteData,
  getData,
  postData,
  putData,
} from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { Broker, Lead, Paginated } from "@/types";

export interface BrokerInput {
  brokerName: string;
  companyName?: string | null;
  mobileNumber: string;
  status?: string;
}

export interface BrokerQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export const brokersService = {
  async list(params: BrokerQuery = {}): Promise<Paginated<Broker>> {
    const res = await api.get<Paginated<Broker>>(`/brokers${buildQuery(params)}`);
    return res.data;
  },
  get(id: string): Promise<Broker> {
    return getData<Broker>(`/brokers/${id}`);
  },
  async leads(id: string, params: BrokerQuery = {}): Promise<Paginated<Lead>> {
    const res = await api.get<Paginated<Lead>>(
      `/brokers/${id}/leads${buildQuery(params)}`,
    );
    return res.data;
  },
  create(body: BrokerInput): Promise<Broker> {
    return postData<Broker>("/brokers", body);
  },
  update(id: string, body: BrokerInput): Promise<Broker> {
    return putData<Broker>(`/brokers/${id}`, body);
  },
  remove(id: string): Promise<{ id: string }> {
    return deleteData<{ id: string }>(`/brokers/${id}`);
  },
  async export(params: BrokerQuery = {}): Promise<Blob> {
    const res = await api.get(`/brokers/export${buildQuery(params)}`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },

  async import(file: File): Promise<{ imported: number; skipped: number; errors: { row: number; reason: string }[] }> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: { imported: number; skipped: number; errors: { row: number; reason: string }[] } }>(
      "/brokers/import",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data;
  },
};
