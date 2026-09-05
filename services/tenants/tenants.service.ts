import { api, getData, putData, patchData, deleteData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  Tenant,
  Paginated,
  TenantImportPreviewResult,
  TenantImportResult,
  TenantBulkDeletePreview,
  TenantBulkDeleteResult,
  TenantAgreementHistory,
  GenericDocument,
} from "@/types";
import type { TenantFormOutput, TenantFormValues } from "@/schemas/tenant.schema";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/** A non-rented manual property with owner info — returned by the move-property picker endpoint. */
export interface AvailableManualProperty {
  id: string;
  buildingName?: string | null;
  unitNumber?: string | null;
  community?: string | null;
  emirate?: string | null;
  type?: string | null;
  bedrooms?: string | null;
  listingStatus: string;
  owner: {
    id: string;
    fullName: string;
    mobileNumber: string;
  };
}

/** Shared shape for renewal agreement + financials + cheques. */
export interface TenantRenewalFields {
  newAgreementStartDate?: string;
  newAgreementEndDate: string;
  dateOfNotice?: string;
  annualRent?: string;
  securityDeposit?: string;
  adminFee?: string;
  commission?: string;
  currency?: string;
  modeOfPayment?: string;
  numberOfCheques?: string;
  cheques?: { chequeNumber: number; chequeDate?: string; amount?: string; status?: string }[];
}

export interface TenantRenewBody extends TenantRenewalFields {}

export interface TenantMovePropertyBody extends TenantRenewalFields {
  newOwnerManualPropertyId: string;
}

export interface TenantQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  // Per-field filters (combine with AND)
  fullName?: string;
  mobileNumber?: string;
  email?: string;
  tenantNationality?: string;
  ownerName?: string;
  building?: string;
  unitNumber?: string;
  community?: string;
  emirate?: string;
  agreementStart?: string;
  agreementEnd?: string;
  modeOfPayment?: string;
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

  /** GET /api/tenants/:leadId/history — all completed agreement periods */
  async getHistory(leadId: string): Promise<TenantAgreementHistory[]> {
    const res = await api.get<{ data: TenantAgreementHistory[] }>(
      `/tenants/${leadId}/history`,
    );
    return res.data.data;
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

  /** GET /api/tenants/available-properties — all non-rented manual properties across all owners */
  async availableProperties(params: { search?: string } = {}): Promise<{ data: AvailableManualProperty[] }> {
    const res = await api.get<{ data: AvailableManualProperty[] }>(
      `/tenants/available-properties${buildQuery(params)}`,
    );
    return res.data;
  },

  /** PATCH /api/tenants/:leadId/renew — renew contract on the same property */
  async renewContract(leadId: string, body: TenantRenewBody): Promise<Tenant> {
    return patchData<Tenant>(`/tenants/${leadId}/renew`, body);
  },

  /** PATCH /api/tenants/:leadId/move-property — move tenant to a different property */
  async moveProperty(leadId: string, body: TenantMovePropertyBody): Promise<Tenant> {
    return patchData<Tenant>(`/tenants/${leadId}/move-property`, body);
  },

  /** POST /api/tenants/:leadId/documents/passport — upload / replace passport PDF */
  async uploadPassport(
    leadId: string,
    file: File,
    passportDates?: { passportStartDate?: string; passportEndDate?: string },
  ): Promise<Tenant> {
    const form = new FormData();
    form.append("file", file);
    if (passportDates?.passportStartDate) form.append("passportStartDate", passportDates.passportStartDate);
    if (passportDates?.passportEndDate)   form.append("passportEndDate", passportDates.passportEndDate);
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

  // ── Generic uploaded documents (Ejari, etc.) ────────────────────────────────

  listDocuments(leadId: string): Promise<GenericDocument[]> {
    return getData<GenericDocument[]>(`/tenants/${leadId}/docs`);
  },

  async uploadDocument(
    leadId: string,
    file: File,
    body: { type: string; label?: string },
  ): Promise<GenericDocument> {
    const form = new FormData();
    form.append("file", file);
    form.append("type", body.type);
    if (body.label) form.append("label", body.label);
    const res = await api.post<{ data: GenericDocument }>(
      `/tenants/${leadId}/docs`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data;
  },

  removeDocument(leadId: string, docId: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/tenants/${leadId}/docs/${docId}`);
  },

  /** Authenticated URL to download/view a generic tenant document. */
  documentFileUrl(leadId: string, docId: string): string {
    return `${BASE_URL}/api/tenants/${leadId}/docs/${docId}/file`;
  },

  // ── Per-cheque file upload ──────────────────────────────────────────────────

  /** POST /api/tenants/:leadId/cheques/:chequeId/file — upload/replace cheque file. Returns updated tenant. */
  async uploadChequeFile(leadId: string, chequeId: string, file: File): Promise<Tenant> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: Tenant }>(
      `/tenants/${leadId}/cheques/${chequeId}/file`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data;
  },

  /** DELETE /api/tenants/:leadId/cheques/:chequeId/file — remove cheque file. Returns updated tenant. */
  async deleteChequeFile(leadId: string, chequeId: string): Promise<Tenant> {
    const res = await api.delete<{ data: Tenant }>(`/tenants/${leadId}/cheques/${chequeId}/file`);
    return res.data.data;
  },

  /** Authenticated URL to download/view a cheque file. */
  chequeFileUrl(leadId: string, chequeId: string): string {
    return `${BASE_URL}/api/tenants/${leadId}/cheques/${chequeId}/file`;
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
