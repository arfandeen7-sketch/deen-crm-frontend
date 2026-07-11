import { z } from "zod";

export const employeeSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional().nullable(),
  role: z.enum(["master", "hr_manager", "sales_manager", "sales_executive"]),
  employeeId: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  joiningDate: z.string().optional().nullable(),
  basicSalary: z.string().optional().nullable(),
  allowances: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
  bankIban: z.string().optional().nullable(),
  employmentStatus: z.enum(["active", "probation", "on_notice", "resigned", "terminated"]).optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
