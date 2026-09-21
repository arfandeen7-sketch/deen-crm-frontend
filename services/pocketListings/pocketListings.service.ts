import { api, deleteData, getData, withAccessToken } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { PocketListing, PocketListingDocument, PocketListingQueryParams, Paginated } from "@/types";

const PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const pocketListingsService = {
  async list(params: PocketListingQueryParams = {}): Promise<Paginated<PocketListing>> {
    const res = await api.get<Paginated<PocketListing>>(`/pocket-listings${buildQuery(params)}`);
    return res.data;
  },

  get(id: string): Promise<PocketListing> {
    return getData<PocketListing>(`/pocket-listings/${id}`);
  },

  /**
   * Downloads the branded DEEN Properties brochure PDF for a pocket listing.
   * Returns a Blob ready to be saved via `downloadBlob`.
   */
  async downloadPdf(id: string): Promise<Blob> {
    const res = await api.get(`/pocket-listings/${id}/pdf`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },

  /**
   * Fetches full pocket listing details from the public (unauthenticated)
   * endpoint. Used by the shareable pocket listing microsite page.
   */
  async getPublic(id: string): Promise<PocketListing> {
    const res = await fetch(`${PUBLIC_BASE_URL}/api/public/pocket-listings/${id}`);
    if (!res.ok) throw new Error(`Failed to load pocket listing (status ${res.status})`);
    const body = await res.json();
    return body.data as PocketListing;
  },

  /** Pocket listings not yet linked to any owner — for the property picker. */
  async available(params: { page?: number; pageSize?: number; search?: string } = {}): Promise<Paginated<PocketListing>> {
    const res = await api.get<Paginated<PocketListing>>(`/pocket-listings/available${buildQuery(params)}`);
    return res.data;
  },

  async create(formData: FormData): Promise<PocketListing> {
    // Do NOT set Content-Type manually — the browser sets multipart/form-data
    // with the correct boundary automatically when FormData is the body.
    const res = await api.post<{ data: PocketListing }>("/pocket-listings", formData);
    return res.data.data;
  },

  async update(id: string, formData: FormData): Promise<PocketListing> {
    const res = await api.put<{ data: PocketListing }>(`/pocket-listings/${id}`, formData);
    return res.data.data;
  },

  removeImage(id: string, imageId: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/pocket-listings/${id}/images/${imageId}`);
  },

  remove(id: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/pocket-listings/${id}`);
  },

  // ── Owner Identity Documents (Passport / Emirates ID) ──────────────────────

  async uploadOwnerPassport(
    id: string,
    file: File,
    passportDates?: { ownerPassportStartDate?: string; ownerPassportEndDate?: string },
  ): Promise<Record<string, unknown>> {
    const form = new FormData();
    form.append("file", file);
    if (passportDates?.ownerPassportStartDate) form.append("ownerPassportStartDate", passportDates.ownerPassportStartDate);
    if (passportDates?.ownerPassportEndDate) form.append("ownerPassportEndDate", passportDates.ownerPassportEndDate);
    const res = await api.post<{ data: Record<string, unknown> }>(
      `/pocket-listings/${id}/owner-passport`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data;
  },

  removeOwnerPassport(id: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/pocket-listings/${id}/owner-passport`);
  },

  async uploadOwnerEmiratesId(id: string, file: File): Promise<Record<string, unknown>> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: Record<string, unknown> }>(
      `/pocket-listings/${id}/owner-emirates-id`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data;
  },

  removeOwnerEmiratesId(id: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/pocket-listings/${id}/owner-emirates-id`);
  },

  /** Authenticated URL for the owner's passport document. */
  ownerPassportUrl(id: string): string {
    return withAccessToken(`${PUBLIC_BASE_URL}/api/pocket-listings/${id}/owner-documents/passport`);
  },

  /** Authenticated URL for the owner's Emirates ID document. */
  ownerEmiratesIdUrl(id: string): string {
    return withAccessToken(`${PUBLIC_BASE_URL}/api/pocket-listings/${id}/owner-documents/emirates-id`);
  },

  // ── Additional Owner Documents (1:N) ────────────────────────────────────────

  listOwnerDocs(id: string): Promise<PocketListingDocument[]> {
    return getData<PocketListingDocument[]>(`/pocket-listings/${id}/owner-docs`);
  },

  async uploadOwnerDoc(
    id: string,
    file: File,
    body: { type: string; label?: string },
  ): Promise<PocketListingDocument> {
    const form = new FormData();
    form.append("file", file);
    form.append("type", body.type);
    if (body.label) form.append("label", body.label);
    const res = await api.post<{ data: PocketListingDocument }>(
      `/pocket-listings/${id}/owner-docs`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data;
  },

  removeOwnerDoc(id: string, docId: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/pocket-listings/${id}/owner-docs/${docId}`);
  },

  /** Authenticated URL to download/view an additional owner document. */
  ownerDocFileUrl(id: string, docId: string): string {
    return withAccessToken(`${PUBLIC_BASE_URL}/api/pocket-listings/${id}/owner-docs/${docId}/file`);
  },
};
