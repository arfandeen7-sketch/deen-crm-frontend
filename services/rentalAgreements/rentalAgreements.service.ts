import { api, getData, putData } from "@/services/api/client";
import { buildQuery } from "@/lib/utils";
import type { RentalAgreement, Paginated } from "@/types";
import type { RentalAgreementFormValues } from "@/schemas/rentalAgreement.schema";

export interface RentalAgreementQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const rentalAgreementsService = {
  async list(params: RentalAgreementQueryParams = {}): Promise<Paginated<RentalAgreement>> {
    const res = await api.get<Paginated<RentalAgreement>>(`/rental-agreements${buildQuery(params)}`);
    return res.data;
  },

  getByLeadId(leadId: string): Promise<RentalAgreement | null> {
    return getData<RentalAgreement | null>(`/rental-agreements/${leadId}`);
  },

  upsert(leadId: string, body: Partial<RentalAgreementFormValues>): Promise<RentalAgreement> {
    return putData<RentalAgreement>(`/rental-agreements/${leadId}`, body);
  },
};
