import { getData, patchData, postData, putData } from "@/services/api/client";
import type { User, UserRole, UsersListResponse } from "@/types";

export interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string | null;
  role: UserRole;
}

export interface UpdateUserInput {
  fullName?: string;
  phone?: string | null;
  role?: UserRole;
  moduleAccess?: string[];
  moduleAccessOverridden?: boolean;
}

export interface AssignableUser {
  id: string;
  fullName: string;
  role: UserRole;
}

export const usersService = {
  list(): Promise<UsersListResponse> {
    return getData<UsersListResponse>("/users");
  },
  assignable(): Promise<AssignableUser[]> {
    return getData<{ users: AssignableUser[] }>("/users/assignable").then((r) => r.users);
  },
  get(id: string): Promise<User> {
    return getData<User>(`/users/${id}`);
  },
  create(body: CreateUserInput): Promise<User> {
    return postData<User>("/users", body);
  },
  update(id: string, body: UpdateUserInput): Promise<User> {
    return putData<User>(`/users/${id}`, body);
  },
  toggleActive(id: string): Promise<User> {
    return patchData<User>(`/users/${id}/toggle-active`);
  },
};
