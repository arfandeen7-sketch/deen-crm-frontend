import { api, getData, patchData, postData, putData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { User, Paginated, EmploymentStatus } from "@/types";

export interface EmployeeInput {
  fullName: string;
  email: string;
  phone?: string | null;
  role: string;
  employeeId?: string | null;
  department?: string | null;
  designation?: string | null;
  joiningDate?: string | null;
  basicSalary?: string | null;
  allowances?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankIban?: string | null;
  leaveBalance?: { annual: number; sick: number; emergency: number } | null;
}

export interface EmployeeQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  department?: string;
  designation?: string;
  status?: string;
  role?: string;
}

export const employeeService = {
  async list(params: EmployeeQuery = {}): Promise<Paginated<User>> {
    const res = await api.get<Paginated<User>>(
      `/employees${buildQuery(params)}`,
    );
    return res.data;
  },
  get(id: string): Promise<User> {
    return getData<User>(`/employees/${id}`);
  },
  create(body: EmployeeInput): Promise<User> {
    return postData<User>("/employees", body);
  },
  update(id: string, body: Partial<EmployeeInput>): Promise<User> {
    return putData<User>(`/employees/${id}`, body);
  },
  patchStatus(id: string, status: EmploymentStatus): Promise<User> {
    return patchData<User>(`/employees/${id}/status`, { status });
  },
  async export(params: EmployeeQuery = {}): Promise<Blob> {
    const res = await api.get(`/employees/export${buildQuery(params)}`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
};
