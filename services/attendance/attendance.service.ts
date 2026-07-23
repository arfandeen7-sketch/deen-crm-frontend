import { api, deleteData, getData, postData, putData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  AttendanceRecord,
  AttendanceCheckPayload,
  AttendanceReport,
  AttendanceSummary,
  AttendanceConfig,
  Paginated,
} from "@/types";

export interface AttendanceQuery {
  page?: number;
  pageSize?: number;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ManualAttendanceInput {
  userId: string;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status?: string;
  overrideReason?: string;
}

export const attendanceService = {
  async list(params: AttendanceQuery = {}): Promise<Paginated<AttendanceRecord>> {
    const res = await api.get<Paginated<AttendanceRecord>>(
      `/attendance${buildQuery(params)}`,
    );
    return res.data;
  },
  async myList(params: Omit<AttendanceQuery, "userId"> = {}): Promise<Paginated<AttendanceRecord>> {
    const res = await api.get<Paginated<AttendanceRecord>>(
      `/me/attendance${buildQuery(params)}`,
    );
    return res.data;
  },
  today(): Promise<AttendanceRecord | null> {
    return getData<AttendanceRecord | null>("/me/attendance/today");
  },
  get(id: string): Promise<AttendanceRecord> {
    return getData<AttendanceRecord>(`/attendance/${id}`);
  },
  async checkIn(payload: AttendanceCheckPayload): Promise<AttendanceRecord> {
    const formData = new FormData();
    formData.append("photo", payload.photo);
    formData.append("latitude", String(payload.latitude));
    formData.append("longitude", String(payload.longitude));
    const res = await api.post<{ data: AttendanceRecord }>("/me/attendance/check-in", formData);
    return res.data.data;
  },
  async checkOut(payload: AttendanceCheckPayload): Promise<AttendanceRecord> {
    const formData = new FormData();
    formData.append("photo", payload.photo);
    formData.append("latitude", String(payload.latitude));
    formData.append("longitude", String(payload.longitude));
    const res = await api.post<{ data: AttendanceRecord }>("/me/attendance/check-out", formData);
    return res.data.data;
  },
  manualCreate(body: ManualAttendanceInput): Promise<AttendanceRecord> {
    return postData<AttendanceRecord>("/attendance", body);
  },
  override(id: string, body: Partial<ManualAttendanceInput> & { overrideReason: string }): Promise<AttendanceRecord> {
    return putData<AttendanceRecord>(`/attendance/${id}`, body);
  },
  remove(id: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/attendance/${id}`);
  },
  report(params: { month: number; year: number }): Promise<AttendanceReport> {
    return getData<AttendanceReport>(`/attendance/report${buildQuery(params)}`);
  },
  userSummary(userId: string, params: { month: number; year: number }): Promise<AttendanceSummary> {
    return getData<AttendanceSummary>(`/attendance/user/${userId}/summary${buildQuery(params)}`);
  },
  async export(params: AttendanceQuery = {}): Promise<Blob> {
    const res = await api.get(`/attendance/export${buildQuery(params)}`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
  getConfig(): Promise<AttendanceConfig> {
    return getData<AttendanceConfig>("/attendance/config");
  },
  updateConfig(body: Partial<AttendanceConfig>): Promise<AttendanceConfig> {
    return putData<AttendanceConfig>("/attendance/config", body);
  },
};
