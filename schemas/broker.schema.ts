import { z } from "zod";

export const brokerSchema = z.object({
  brokerName: z.string().min(1, "Broker name is required"),
  companyName: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  mobileNumber: z.string().min(5, "Enter a valid mobile number"),
  status: z.enum(["active", "inactive", "suspended"]).default("active"),
});

export type BrokerFormValues = z.input<typeof brokerSchema>;
