import { getData, postData, deleteData } from "@/services/api/client";
import type { Holiday } from "@/types";

export const holidayService = {
  list(year?: number): Promise<Holiday[]> {
    const query = year ? `?year=${year}` : "";
    return getData<Holiday[]>(`/me/holidays${query}`);
  },
  listAll(year?: number): Promise<Holiday[]> {
    const query = year ? `?year=${year}` : "";
    return getData<Holiday[]>(`/holidays${query}`);
  },
  getByYear(year: number): Promise<Holiday[]> {
    return getData<Holiday[]>(`/holidays/${year}`);
  },
  create(body: { name: string; date: string; isRecurring?: boolean }): Promise<Holiday> {
    return postData<Holiday>("/holidays", body);
  },
  bulkCreate(holidays: Array<{ name: string; date: string; isRecurring?: boolean }>): Promise<{ data: Holiday[]; count: number }> {
    return postData<{ data: Holiday[]; count: number }>("/holidays/bulk", { holidays });
  },
  remove(id: string): Promise<{ success: true }> {
    return deleteData<{ success: true }>(`/holidays/${id}`);
  },
};
