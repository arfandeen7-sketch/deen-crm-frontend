import { api, deleteData, getData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { PocketListing, PocketListingQueryParams, Paginated } from "@/types";

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
};
