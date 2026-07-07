import { deleteData, getData, postData, putData } from "@/services/api/client";
import type {
  AllTeamsResponse,
  MyTeamResponse,
  TeamMembersResponse,
  AssignTeamPayload,
  ReassignExecutivePayload,
  UnassignExecutivePayload,
} from "@/types";

export const teamsService = {
  getAllTeams(): Promise<AllTeamsResponse> {
    return getData<AllTeamsResponse>("/teams/all");
  },

  getMyTeam(): Promise<MyTeamResponse> {
    return getData<MyTeamResponse>("/teams/my-team");
  },

  getTeamMembers(managerId: string): Promise<TeamMembersResponse> {
    return getData<TeamMembersResponse>(`/teams/${managerId}/members`);
  },

  assignExecutives(payload: AssignTeamPayload): Promise<{ message: string; executives: unknown[] }> {
    return postData<{ message: string; executives: unknown[] }>("/teams/assign", payload);
  },

  unassignExecutive(payload: UnassignExecutivePayload): Promise<{ message: string; executiveId: string }> {
    return deleteData<{ message: string; executiveId: string }>("/teams/unassign", {
      data: payload,
    });
  },

  reassignExecutive(payload: ReassignExecutivePayload): Promise<{ message: string; executive: unknown }> {
    return putData<{ message: string; executive: unknown }>("/teams/reassign", payload);
  },
};
