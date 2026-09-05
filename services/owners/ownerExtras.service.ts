import { api, getData, deleteData } from "@/services/api/client";
import type { OwnerUtilityAccount, GenericDocument } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ── Owner Utility / Account Details ──────────────────────────────────────────

export const ownerUtilitiesService = {
  list(ownerId: string): Promise<OwnerUtilityAccount[]> {
    return getData<OwnerUtilityAccount[]>(`/owners/${ownerId}/utilities`);
  },

  create(
    ownerId: string,
    body: { type: string; value: string; label?: string | null; notes?: string | null },
  ): Promise<OwnerUtilityAccount> {
    return api
      .post<{ data: OwnerUtilityAccount }>(`/owners/${ownerId}/utilities`, body)
      .then((r) => r.data.data);
  },

  update(
    ownerId: string,
    utilityId: string,
    body: Partial<{ type: string; value: string; label?: string | null; notes?: string | null }>,
  ): Promise<OwnerUtilityAccount> {
    return api
      .put<{ data: OwnerUtilityAccount }>(`/owners/${ownerId}/utilities/${utilityId}`, body)
      .then((r) => r.data.data);
  },

  remove(ownerId: string, utilityId: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/owners/${ownerId}/utilities/${utilityId}`);
  },
};

// ── Owner Generic Documents ──────────────────────────────────────────────────

export const ownerDocumentsService = {
  list(ownerId: string): Promise<GenericDocument[]> {
    return getData<GenericDocument[]>(`/owners/${ownerId}/docs`);
  },

  async upload(
    ownerId: string,
    file: File,
    body: { type: string; label?: string },
  ): Promise<GenericDocument> {
    const form = new FormData();
    form.append("file", file);
    form.append("type", body.type);
    if (body.label) form.append("label", body.label);
    const res = await api.post<{ data: GenericDocument }>(
      `/owners/${ownerId}/docs`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data;
  },

  remove(ownerId: string, docId: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/owners/${ownerId}/docs/${docId}`);
  },

  /** Authenticated URL to download/view a generic owner document. */
  fileUrl(ownerId: string, docId: string): string {
    return `${BASE_URL}/api/owners/${ownerId}/docs/${docId}/file`;
  },
};
