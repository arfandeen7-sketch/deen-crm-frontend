import { api, getData, postData, putData, deleteData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { BellaviuClient, Paginated } from "@/types";
import type { BellaviuClientFormOutput } from "@/schemas/bellaviuClient.schema";

export interface BellaviuClientQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  // Per-field filters (combine with AND)
  name?: string;
  phoneNumber?: string;
  email?: string;
  checkInDate?: string;
  checkOutDate?: string;
  bookingChannel?: string;
  propertyName?: string;
  unitNo?: string;
  countryOfClient?: string;
  locationOfProperty?: string;
}

export const bellaviuClientsService = {
  /** GET /api/bellaviu-clients — paginated list */
  async list(params: BellaviuClientQueryParams = {}): Promise<Paginated<BellaviuClient>> {
    const res = await api.get<Paginated<BellaviuClient>>(
      `/bellaviu-clients${buildQuery(params)}`,
    );
    return res.data;
  },

  /** GET /api/bellaviu-clients/:id */
  getById(id: string): Promise<BellaviuClient> {
    return getData<BellaviuClient>(`/bellaviu-clients/${id}`);
  },

  /** POST /api/bellaviu-clients */
  create(body: Partial<BellaviuClientFormOutput>): Promise<BellaviuClient> {
    return postData<BellaviuClient>(`/bellaviu-clients`, body);
  },

  /** PUT /api/bellaviu-clients/:id */
  update(id: string, body: Partial<BellaviuClientFormOutput>): Promise<BellaviuClient> {
    return putData<BellaviuClient>(`/bellaviu-clients/${id}`, body);
  },

  /** DELETE /api/bellaviu-clients/:id */
  remove(id: string): Promise<void> {
    return deleteData<void>(`/bellaviu-clients/${id}`);
  },

  /** POST /api/bellaviu-clients/:id/documents/passport — upload / replace passport PDF */
  async uploadPassport(id: string, file: File): Promise<BellaviuClient> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: BellaviuClient }>(
      `/bellaviu-clients/${id}/documents/passport`,
      form,
    );
    return res.data.data;
  },

  /** DELETE /api/bellaviu-clients/:id/documents/passport */
  async deletePassport(id: string): Promise<void> {
    await api.delete(`/bellaviu-clients/${id}/documents/passport`);
  },

  /** POST /api/bellaviu-clients/:id/documents/emirates-id — upload / replace Emirates ID PDF */
  async uploadEmiratesId(id: string, file: File): Promise<BellaviuClient> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: BellaviuClient }>(
      `/bellaviu-clients/${id}/documents/emirates-id`,
      form,
    );
    return res.data.data;
  },

  /** DELETE /api/bellaviu-clients/:id/documents/emirates-id */
  async deleteEmiratesId(id: string): Promise<void> {
    await api.delete(`/bellaviu-clients/${id}/documents/emirates-id`);
  },
};
