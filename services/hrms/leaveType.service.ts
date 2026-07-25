import { getData, postData, putData, patchData } from "@/services/api/client";
import type { LeaveTypeConfig, LeaveTypeConfigWithBalance, Paginated } from "@/types";

export const leaveTypeService = {
  list(): Promise<LeaveTypeConfig[]> {
    return getData<LeaveTypeConfig[]>("/leave-types");
  },
  getById(id: string): Promise<LeaveTypeConfig> {
    return getData<LeaveTypeConfig>(`/leave-types/${id}`);
  },
  create(body: Partial<LeaveTypeConfig>): Promise<LeaveTypeConfig> {
    return postData<LeaveTypeConfig>("/leave-types", body);
  },
  update(id: string, body: Partial<LeaveTypeConfig>): Promise<LeaveTypeConfig> {
    return putData<LeaveTypeConfig>(`/leave-types/${id}`, body);
  },
  deactivate(id: string): Promise<LeaveTypeConfig> {
    return patchData<LeaveTypeConfig>(`/leave-types/${id}/deactivate`);
  },
  activate(id: string): Promise<LeaveTypeConfig> {
    return patchData<LeaveTypeConfig>(`/leave-types/${id}/activate`);
  },
  listForEmployee(): Promise<LeaveTypeConfigWithBalance[]> {
    return getData<LeaveTypeConfigWithBalance[]>("/me/leave-types");
  },
};
