import { z } from "zod";

export const employeeSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional().nullable(),
  profilePhoto: z.string().optional().nullable(),
  role: z.enum(["master", "hr_manager", "sales_manager", "sales_executive"]),
  employeeId: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  joiningDate: z.string().optional().nullable(),
  basicSalary: z.coerce.number().min(0).optional().nullable(),
  allowances: z.coerce.number().min(0).optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
  employmentStatus: z.enum(["active", "probation", "terminated", "resigned", "on_notice"]).optional().nullable(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
