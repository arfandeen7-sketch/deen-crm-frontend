import { getData, putData } from "@/services/api/client";
import type { User } from "@/types";

export interface MeProfileInput {
  phone?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankIban?: string | null;
}

export const meService = {
  getProfile(): Promise<User> {
    return getData<User>("/me/profile");
  },
  updateProfile(body: MeProfileInput): Promise<User> {
    return putData<User>("/me/profile", body);
  },
};
