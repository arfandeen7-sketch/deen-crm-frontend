import { api, getData, postData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type {
  AttendanceRecord,
  AttendanceCheckPayload,
  AttendanceSummary,
  Paginated,
} from "@/types";

export interface AttendanceQuery {
  page?: number;
  pageSize?: number;
  userId?: string;
  department?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const attendanceService = {
  async list(params: AttendanceQuery = {}): Promise<Paginated<AttendanceRecord>> {
    const res = await api.get<Paginated<AttendanceRecord>>(
      `/hrms/attendance${buildQuery(params)}`,
    );
    return res.data;
  },
  async myList(params: Omit<AttendanceQuery, "userId" | "department"> = {}): Promise<Paginated<AttendanceRecord>> {
    const res = await api.get<Paginated<AttendanceRecord>>(
      `/hrms/my/attendance${buildQuery(params)}`,
    );
    return res.data;
  },
  today(): Promise<AttendanceRecord | null> {
    return getData<AttendanceRecord | null>("/hrms/attendance/today");
  },
  checkIn(payload: AttendanceCheckPayload): Promise<AttendanceRecord> {
    return postData<AttendanceRecord>("/hrms/attendance/check-in", payload);
  },
  checkOut(payload: AttendanceCheckPayload): Promise<AttendanceRecord> {
    return postData<AttendanceRecord>("/hrms/attendance/check-out", payload);
  },
  summary(params: { userId?: string; month?: number; year?: number } = {}): Promise<AttendanceSummary> {
    return getData<AttendanceSummary>(`/hrms/attendance/summary${buildQuery(params)}`);
  },
  async export(params: AttendanceQuery = {}): Promise<Blob> {
    const res = await api.get(`/hrms/attendance/export${buildQuery(params)}`, {
      responseType: "blob",
    });
    return res.data as Blob;
  },
};
