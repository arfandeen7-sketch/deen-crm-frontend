import { api, getData, postData, putData, deleteData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { User, Paginated, HrDashboardSummary, EmployeeDashboard } from "@/types";

export interface EmployeeInput {
  fullName: string;
  email: string;
  phone?: string | null;
  profilePhoto?: string | null;
  role: string;
  employeeId?: string | null;
  department?: string | null;
  designation?: string | null;
  joiningDate?: string | null;
  basicSalary?: number | null;
  allowances?: number | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  employmentStatus?: string | null;
}

export interface EmployeeQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  department?: string;
  designation?: string;
  employmentStatus?: string;
  role?: string;
}

export const employeeService = {
  async list(params: EmployeeQuery = {}): Promise<Paginated<User>> {
    const res = await api.get<Paginated<User>>(
      `/hrms/employees${buildQuery(params)}`,
    );
    return res.data;
  },
  get(id: string): Promise<User> {
    return getData<User>(`/hrms/employees/${id}`);
  },
  create(body: EmployeeInput): Promise<User> {
    return postData<User>("/hrms/employees", body);
  },
  update(id: string, body: Partial<EmployeeInput>): Promise<User> {
    return putData<User>(`/hrms/employees/${id}`, body);
  },
  remove(id: string): Promise<{ id: string }> {
    return deleteData<{ id: string }>(`/hrms/employees/${id}`);
  },
  async export(params: EmployeeQuery = {}): Promise<Blob> {
    const res = await api.get(`/hrms/employees/export${buildQuery(params)}`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
  dashboard(): Promise<HrDashboardSummary> {
    return getData<HrDashboardSummary>("/hrms/dashboard");
  },
  myDashboard(): Promise<EmployeeDashboard> {
    return getData<EmployeeDashboard>("/hrms/my/dashboard");
  },
};
