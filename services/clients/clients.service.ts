import { api, getData, putData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { Client, Paginated } from "@/types";
import type { ClientFormOutput } from "@/schemas/client.schema";

export interface ClientQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const clientsService = {
  /** GET /api/clients — paginated list */
  async list(params: ClientQueryParams = {}): Promise<Paginated<Client>> {
    const res = await api.get<Paginated<Client>>(`/clients${buildQuery(params)}`);
    return res.data;
  },

  /** GET /api/clients/:leadId — fetch client by lead ID (returns null if none) */
  getByLeadId(leadId: string): Promise<Client | null> {
    return getData<Client | null>(`/clients/${leadId}`);
  },

  /** PUT /api/clients/:leadId — upsert text fields */
  upsert(leadId: string, body: Partial<ClientFormOutput>): Promise<Client> {
    return putData<Client>(`/clients/${leadId}`, body);
  },

  /** POST /api/clients/:leadId/documents/passport — upload / replace passport PDF */
  async uploadPassport(leadId: string, file: File): Promise<Client> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: Client }>(
      `/clients/${leadId}/documents/passport`,
      form,
    );
    return res.data.data;
  },

  /** DELETE /api/clients/:leadId/documents/passport */
  async deletePassport(leadId: string): Promise<void> {
    await api.delete(`/clients/${leadId}/documents/passport`);
  },

  /** POST /api/clients/:leadId/documents/emirates-id — upload / replace Emirates ID PDF */
  async uploadEmiratesId(leadId: string, file: File): Promise<Client> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: Client }>(
      `/clients/${leadId}/documents/emirates-id`,
      form,
    );
    return res.data.data;
  },

  /** DELETE /api/clients/:leadId/documents/emirates-id */
  async deleteEmiratesId(leadId: string): Promise<void> {
    await api.delete(`/clients/${leadId}/documents/emirates-id`);
  },
};
