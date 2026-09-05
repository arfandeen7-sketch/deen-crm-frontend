import { api, getData, deleteData } from "@/services/api/client";
import type {
  ManualProperty,
  ManualPropertyInput,
  ManualPropertyImage,
  OwnerImportPreviewResult,
  OwnerImportResult,
  BulkDeleteImportedPreview,
  BulkDeleteImportedResult,
  Paginated,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const ownerManualPropertiesService = {
  // ── CRUD ────────────────────────────────────────────────────────────────────

  /**
   * List manual properties for an owner.
   * Uses `api.get` directly (not `getData`) because the backend returns
   * `paginatedResponse(...)` = `{ data, total, page, ... }` without an outer
   * `{ data: ... }` envelope.  `getData` would unwrap one level too many.
   */
  async list(ownerId: string, params: { page?: number; pageSize?: number } = {}): Promise<Paginated<ManualProperty>> {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.pageSize) q.set("pageSize", String(params.pageSize));
    const qs = q.toString() ? `?${q.toString()}` : "";
    const res = await api.get<Paginated<ManualProperty>>(`/owners/${ownerId}/manual-properties${qs}`);
    return res.data;
  },

  get(ownerId: string, propId: string): Promise<ManualProperty> {
    return getData<ManualProperty>(`/owners/${ownerId}/manual-properties/${propId}`);
  },

  create(ownerId: string, body: ManualPropertyInput): Promise<ManualProperty> {
    return api
      .post<{ data: ManualProperty }>(`/owners/${ownerId}/manual-properties`, body)
      .then((r) => r.data.data);
  },

  update(ownerId: string, propId: string, body: ManualPropertyInput): Promise<ManualProperty> {
    return api
      .put<{ data: ManualProperty }>(`/owners/${ownerId}/manual-properties/${propId}`, body)
      .then((r) => r.data.data);
  },

  remove(ownerId: string, propId: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/owners/${ownerId}/manual-properties/${propId}`);
  },

  // ── Images ──────────────────────────────────────────────────────────────────

  async addImages(ownerId: string, propId: string, files: File[]): Promise<ManualProperty> {
    const form = new FormData();
    files.forEach((f) => form.append("images", f));
    const res = await api.post<{ data: ManualProperty }>(
      `/owners/${ownerId}/manual-properties/${propId}/images`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data;
  },

  removeImage(ownerId: string, propId: string, imageId: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(
      `/owners/${ownerId}/manual-properties/${propId}/images/${imageId}`
    );
  },

  // ── Owner Documents ──────────────────────────────────────────────────────────

  async uploadPassport(
    ownerId: string,
    file: File,
    passportDates?: { passportStartDate?: string; passportEndDate?: string },
  ): Promise<Record<string, unknown>> {
    const form = new FormData();
    form.append("file", file);
    if (passportDates?.passportStartDate) form.append("passportStartDate", passportDates.passportStartDate);
    if (passportDates?.passportEndDate)   form.append("passportEndDate", passportDates.passportEndDate);
    const res = await api.post<{ data: Record<string, unknown> }>(
      `/owners/${ownerId}/passport`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data;
  },

  removePassport(ownerId: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/owners/${ownerId}/passport`);
  },

  async uploadEmiratesId(ownerId: string, file: File): Promise<Record<string, unknown>> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: Record<string, unknown> }>(
      `/owners/${ownerId}/emirates-id`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data;
  },

  removeEmiratesId(ownerId: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/owners/${ownerId}/emirates-id`);
  },

  /** Returns the authenticated URL for the owner's passport document. */
  passportUrl(ownerId: string): string {
    return `${BASE_URL}/api/owners/${ownerId}/documents/passport`;
  },

  /** Returns the authenticated URL for the owner's Emirates ID document. */
  emiratesIdUrl(ownerId: string): string {
    return `${BASE_URL}/api/owners/${ownerId}/documents/emirates-id`;
  },

  // ── Import ───────────────────────────────────────────────────────────────────

  async importPreview(file: File): Promise<OwnerImportPreviewResult> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: OwnerImportPreviewResult }>(
      "/owners/import/preview",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data;
  },

  async importOwners(file: File, mapping: Record<string, string>): Promise<OwnerImportResult> {
    const form = new FormData();
    form.append("file", file);
    form.append("mapping", JSON.stringify(mapping));
    const res = await api.post<{ data: OwnerImportResult }>(
      "/owners/import",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data.data;
  },

  // ── Bulk Delete Imported Data ────────────────────────────────────────────────

  bulkDeletePreview(): Promise<BulkDeleteImportedPreview> {
    return getData<BulkDeleteImportedPreview>("/owners/import/all/preview");
  },

  bulkDelete(): Promise<BulkDeleteImportedResult> {
    return deleteData<BulkDeleteImportedResult>("/owners/import/all");
  },
};
