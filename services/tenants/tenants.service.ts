import { api, getData, putData, patchData, deleteData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  Tenant,
  Paginated,
  TenantImportPreviewResult,
  TenantImportResult,
  TenantBulkDeletePreview,
  TenantBulkDeleteResult,
} from "@/types";
import type { TenantFormOutput, TenantFormValues } from "@/schemas/tenant.schema";

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

  /** POST /api/tenants/from-property — create tenant from owner's manual property */
  async createFromProperty(body: TenantFormValues & { ownerId: string; ownerManualPropertyId: string }): Promise<Tenant> {
    const res = await api.post<{ data: Tenant }>("/tenants/from-property", body);
    return res.data.data;
  },

  /** PATCH /api/tenants/:leadId/end-contract — end tenant contract early */
  async endContract(leadId: string, actualEndDate: string): Promise<Tenant> {
    return patchData<Tenant>(`/tenants/${leadId}/end-contract`, { actualEndDate });
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

  // ── Import ───────────────────────────────────────────────────────────────────

  /** POST /api/tenants/import/preview — parse file and return headers + suggested mapping */
  async importPreview(file: File): Promise<TenantImportPreviewResult> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: TenantImportPreviewResult }>(
      "/tenants/import/preview",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data;
  },

  /** POST /api/tenants/import — execute import with confirmed column mapping */
  async importTenants(file: File, mapping: Record<string, string>): Promise<TenantImportResult> {
    const form = new FormData();
    form.append("file", file);
    form.append("mapping", JSON.stringify(mapping));
    const res = await api.post<{ data: TenantImportResult }>(
      "/tenants/import",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data;
  },

  // ── Bulk Delete Imported Data ────────────────────────────────────────────────

  /** GET /api/tenants/import/all/preview — preview what would be deleted */
  bulkDeletePreview(): Promise<TenantBulkDeletePreview> {
    return getData<TenantBulkDeletePreview>("/tenants/import/all/preview");
  },

  /** DELETE /api/tenants/import/all — delete all imported tenant data */
  bulkDelete(): Promise<TenantBulkDeleteResult> {
    return deleteData<TenantBulkDeleteResult>("/tenants/import/all");
  },
};
