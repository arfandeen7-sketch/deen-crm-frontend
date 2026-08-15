import {
  api,
  deleteData,
  getData,
  postData,
  putData,
} from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  Owner,
  OwnerWithProperties,
  OwnerProperty,
  OwnerQueryParams,
  OwnerInput,
  OwnerPropertyInput,
  Paginated,
} from "@/types";
import type { PropertySummary } from "@/services/properties/properties.service";

export interface OwnerCreateResult {
  owner: Owner;
  duplicate: boolean;
}

export const ownersService = {
  async list(params: OwnerQueryParams = {}): Promise<Paginated<Owner>> {
    const res = await api.get<Paginated<Owner>>(`/owners${buildQuery(params)}`);
    return res.data;
  },

  /** Fetch PF listings not linked to any owner — for the property picker. */
  async availableProperties(
    params: { page?: number; perPage?: number; search?: string } = {},
  ): Promise<{ data: PropertySummary[]; meta: { total: number; page: number; perPage: number; totalPages: number } }> {
    const res = await api.get<{
      data: PropertySummary[];
      meta: { total: number; page: number; perPage: number; totalPages: number };
    }>(`/owners/available-properties${buildQuery(params)}`);
    return res.data;
  },

  get(id: string): Promise<OwnerWithProperties> {
    return getData<OwnerWithProperties>(`/owners/${id}`);
  },

  /** Dedup lookup by mobile number. Returns null if no owner found. */
  lookup(mobile: string): Promise<Owner | null> {
    return getData<Owner | null>(`/owners/lookup?mobile=${encodeURIComponent(mobile)}`);
  },

  create(body: OwnerInput): Promise<OwnerCreateResult> {
    // The backend may return 200 with { data, duplicate: true } if a dup exists.
    return api
      .post<{ data: Owner; duplicate?: boolean }>("/owners", body)
      .then((res) => ({
        owner: res.data.data,
        duplicate: res.data.duplicate ?? false,
      }));
  },

  update(id: string, body: OwnerInput): Promise<Owner> {
    return putData<Owner>(`/owners/${id}`, body);
  },

  remove(id: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/owners/${id}`);
  },

  // ── Owner Properties ──────────────────────────────────────────────────────

  listProperties(ownerId: string): Promise<OwnerProperty[]> {
    return getData<OwnerProperty[]>(`/owners/${ownerId}/properties`);
  },

  createProperty(ownerId: string, body: OwnerPropertyInput): Promise<OwnerProperty> {
    return postData<OwnerProperty>(`/owners/${ownerId}/properties`, body);
  },

  updateProperty(
    ownerId: string,
    propertyId: string,
    body: OwnerPropertyInput,
  ): Promise<OwnerProperty> {
    return putData<OwnerProperty>(
      `/owners/${ownerId}/properties/${propertyId}`,
      body,
    );
  },

  removeProperty(ownerId: string, propertyId: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/owners/${ownerId}/properties/${propertyId}`);
  },
};
