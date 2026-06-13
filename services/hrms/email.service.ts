import { getData, postData, putData, deleteData } from "@/services/api/client";
import type { SmtpConfig, EmailTemplate } from "@/types";

export interface SmtpConfigInput {
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: "tls" | "ssl" | "none";
  fromName: string;
  fromEmail: string;
  isActive?: boolean;
}

export interface EmailTemplateInput {
  name: string;
  subject: string;
  body: string;
  type: EmailTemplate["type"];
}

export const emailService = {
  getSmtpConfig(): Promise<SmtpConfig | null> {
    return getData<SmtpConfig | null>("/hrms/email/smtp");
  },
  saveSmtpConfig(body: SmtpConfigInput): Promise<SmtpConfig> {
    return postData<SmtpConfig>("/hrms/email/smtp", body);
  },
  updateSmtpConfig(id: string, body: Partial<SmtpConfigInput>): Promise<SmtpConfig> {
    return putData<SmtpConfig>(`/hrms/email/smtp/${id}`, body);
  },
  testSmtp(email: string): Promise<{ success: boolean; message: string }> {
    return postData<{ success: boolean; message: string }>("/hrms/email/smtp/test", { email });
  },
  listTemplates(): Promise<EmailTemplate[]> {
    return getData<EmailTemplate[]>("/hrms/email/templates");
  },
  getTemplate(id: string): Promise<EmailTemplate> {
    return getData<EmailTemplate>(`/hrms/email/templates/${id}`);
  },
  createTemplate(body: EmailTemplateInput): Promise<EmailTemplate> {
    return postData<EmailTemplate>("/hrms/email/templates", body);
  },
  updateTemplate(id: string, body: Partial<EmailTemplateInput>): Promise<EmailTemplate> {
    return putData<EmailTemplate>(`/hrms/email/templates/${id}`, body);
  },
  deleteTemplate(id: string): Promise<{ id: string }> {
    return deleteData<{ id: string }>(`/hrms/email/templates/${id}`);
  },
};
