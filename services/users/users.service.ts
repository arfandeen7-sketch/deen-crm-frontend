import { api, getData, patchData, postData, putData } from "@/services/api/client";
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
}

export const usersService = {
  async list(): Promise<UsersListResponse> {
    const res = await api.get<UsersListResponse>("/users");
    return res.data;
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
