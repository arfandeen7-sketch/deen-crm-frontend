import { api, getData, putData } from "@/services/api/client";
import type { AccessMap, RegistryModule, GrantEntry, PermissionGrants } from "@/types";

export const permissionsService = {
  async getMyAccess(): Promise<AccessMap> {
    const profile = await getData<{ access: AccessMap }>("/me/profile");
    return profile.access;
  },

  getRegistry(): Promise<RegistryModule[]> {
    return getData<{ registry: RegistryModule[] }>("/permissions/registry").then(
      (r) => r.registry,
    );
  },

  getUserGrants(userId: string): Promise<PermissionGrants> {
    return getData<PermissionGrants>(`/permissions/user/${userId}`);
  },

  async saveUserGrants(userId: string, grants: GrantEntry[]): Promise<void> {
    await putData<unknown>(`/permissions/user/${userId}`, { grants });
  },

  async revokeAllGrants(userId: string): Promise<void> {
    await api.delete(`/permissions/user/${userId}`);
  },
};
