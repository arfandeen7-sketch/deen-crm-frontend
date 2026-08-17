import { getData, postData } from "@/services/api/client";
import type { CustomFieldDefinition } from "@/types";

export const customFieldsService = {
  list(entity: "lead" = "lead"): Promise<CustomFieldDefinition[]> {
    return getData<CustomFieldDefinition[]>(`/custom-fields?entity=${entity}`);
  },

  create(label: string): Promise<CustomFieldDefinition> {
    return postData<CustomFieldDefinition>("/custom-fields", { label, entity: "lead" });
  },
};
