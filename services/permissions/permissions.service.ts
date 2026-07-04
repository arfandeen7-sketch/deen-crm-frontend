import { getData, putData, postData } from "@/services/api/client";
import type { UserPermissions, PermissionMetadata, ModuleName, PermissionAction } from "@/types";

export const permissionsService = {
  getMyPermissions(): Promise<UserPermissions> {
    return getData<UserPermissions>("/permissions/me");
  },
  
  getMetadata(): Promise<PermissionMetadata> {
    return getData<PermissionMetadata>("/permissions/metadata");
  },
  
  getUserPermissions(userId: string): Promise<UserPermissions> {
    return getData<UserPermissions>(`/permissions/user/${userId}`);
  },
  
  updateUserPermissions(userId: string, permissions: Record<ModuleName, PermissionAction[]>): Promise<UserPermissions> {
    return putData<UserPermissions>(`/permissions/user/${userId}`, { permissions });
  },
  
  resetUserPermissions(userId: string): Promise<UserPermissions> {
    return postData<UserPermissions>(`/permissions/user/${userId}/reset`);
  },
};
