import { deleteData, getData, postData, putData } from "@/services/api/client";
import type { DynamicField } from "@/types";

export interface DynamicFieldInput {
  category: string;
  value: string;
  meta?: Record<string, unknown> | null;
  sortOrder?: number;
}

export const dynamicFieldsService = {
  list(category?: string): Promise<DynamicField[]> {
    const suffix = category ? `?category=${encodeURIComponent(category)}` : "";
    return getData<DynamicField[]>(`/dynamic-fields${suffix}`);
  },
  byCategory(category: string): Promise<DynamicField[]> {
    return getData<DynamicField[]>(`/dynamic-fields/${category}`);
  },
  create(body: DynamicFieldInput): Promise<DynamicField> {
    return postData<DynamicField>("/dynamic-fields", body);
  },
  update(id: string, body: Partial<DynamicFieldInput>): Promise<DynamicField> {
    return putData<DynamicField>(`/dynamic-fields/${id}`, body);
  },
  remove(id: string): Promise<{ id: string }> {
    return deleteData<{ id: string }>(`/dynamic-fields/${id}`);
  },
};
