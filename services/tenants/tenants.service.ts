import { api, getData, putData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { Tenant, Paginated } from "@/types";
import type { TenantFormOutput } from "@/schemas/tenant.schema";

export interface TenantQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const tenantsService = {
  /** GET /api/tenants — paginated list */
  async list(params: TenantQueryParams = {}): Promise<Paginated<Tenant>> {
    const res = await api.get<Paginated<Tenant>>(`/tenants${buildQuery(params)}`);
    return res.data;
  },

  /** GET /api/tenants/:leadId — fetch tenant by lead ID (returns null if none) */
  getByLeadId(leadId: string): Promise<Tenant | null> {
    return getData<Tenant | null>(`/tenants/${leadId}`);
  },

  /** PUT /api/tenants/:leadId — upsert text fields */
  upsert(leadId: string, body: Partial<TenantFormOutput>): Promise<Tenant> {
    return putData<Tenant>(`/tenants/${leadId}`, body);
  },

  /** POST /api/tenants/:leadId/documents/passport — upload / replace passport PDF */
  async uploadPassport(leadId: string, file: File): Promise<Tenant> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: Tenant }>(
      `/tenants/${leadId}/documents/passport`,
      form,
    );
    return res.data.data;
  },

  /** DELETE /api/tenants/:leadId/documents/passport */
  async deletePassport(leadId: string): Promise<void> {
    await api.delete(`/tenants/${leadId}/documents/passport`);
  },

  /** POST /api/tenants/:leadId/documents/emirates-id — upload / replace Emirates ID PDF */
  async uploadEmiratesId(leadId: string, file: File): Promise<Tenant> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: Tenant }>(
      `/tenants/${leadId}/documents/emirates-id`,
      form,
    );
    return res.data.data;
  },

  /** DELETE /api/tenants/:leadId/documents/emirates-id */
  async deleteEmiratesId(leadId: string): Promise<void> {
    await api.delete(`/tenants/${leadId}/documents/emirates-id`);
  },

  /** POST /api/tenants/:leadId/documents/agreement — upload / replace tenant agreement PDF */
  async uploadAgreement(leadId: string, file: File): Promise<Tenant> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: Tenant }>(
      `/tenants/${leadId}/documents/agreement`,
      form,
    );
    return res.data.data;
  },

  /** DELETE /api/tenants/:leadId/documents/agreement */
  async deleteAgreement(leadId: string): Promise<void> {
    await api.delete(`/tenants/${leadId}/documents/agreement`);
  },
};
