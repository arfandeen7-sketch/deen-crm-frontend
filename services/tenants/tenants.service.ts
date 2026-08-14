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
  async list(params: TenantQueryParams = {}): Promise<Paginated<Tenant>> {
    const res = await api.get<Paginated<Tenant>>(`/tenants${buildQuery(params)}`);
    return res.data;
  },

  getByLeadId(leadId: string): Promise<Tenant | null> {
    return getData<Tenant | null>(`/tenants/${leadId}`);
  },

  upsert(leadId: string, body: Partial<TenantFormOutput>): Promise<Tenant> {
    return putData<Tenant>(`/tenants/${leadId}`, body);
  },

  async uploadPassport(leadId: string, file: File): Promise<Tenant> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: Tenant }>(
      `/tenants/${leadId}/documents/passport`,
      form,
    );
    return res.data.data;
  },

  async deletePassport(leadId: string): Promise<void> {
    await api.delete(`/tenants/${leadId}/documents/passport`);
  },

  async uploadEmiratesId(leadId: string, file: File): Promise<Tenant> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: Tenant }>(
      `/tenants/${leadId}/documents/emirates-id`,
      form,
    );
    return res.data.data;
  },

  async deleteEmiratesId(leadId: string): Promise<void> {
    await api.delete(`/tenants/${leadId}/documents/emirates-id`);
  },
};
