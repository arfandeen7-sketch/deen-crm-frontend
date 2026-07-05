"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { smtpConfigSchema, type SmtpConfigFormValues } from "@/schemas/email.schema";
import { useSmtpConfig, useSaveSmtpConfig, useTestSmtp } from "@/hooks/useHrms";
import { PageHeader } from "@/components/ui/PageHeader";
import { toast } from "sonner";
import { Send, Save } from "lucide-react";
import { useState } from "react";
import { PermissionGuard } from "@/components/shared/Guards";

export default function EmailConfigPage() {
  const { data: config, isLoading } = useSmtpConfig();
  const save = useSaveSmtpConfig();
  const test = useTestSmtp();
  const [testEmail, setTestEmail] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<SmtpConfigFormValues>({
    resolver: zodResolver(smtpConfigSchema) as never,
    values: config ? {
      host: config.host,
      port: config.port,
      username: config.username,
      password: "",
      encryption: config.encryption,
      fromName: config.fromName,
      fromEmail: config.fromEmail,
      isActive: config.isActive,
    } : undefined,
  });

  const onSubmit = (values: SmtpConfigFormValues) => {
    save.mutate(values, {
      onSuccess: () => toast.success("SMTP configuration saved"),
      onError: () => toast.error("Failed to save configuration"),
    });
  };

  const handleTest = () => {
    if (!testEmail) return toast.error("Enter a test email address");
    test.mutate(testEmail, {
      onSuccess: (res) => res.success ? toast.success("Test email sent!") : toast.error(res.message),
      onError: () => toast.error("Test failed"),
    });
  };

  if (isLoading) return <div className="animate-pulse h-96 rounded-xl bg-slate-100" />;

  return (
    <PermissionGuard permission="hrms.email">
    <div className="space-y-6">
      <PageHeader title="Email Configuration" subtitle="Manage SMTP settings for sending payslips and notifications" />

      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">SMTP Settings</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">SMTP Host *</label>
              <input {...register("host")} placeholder="smtp.gmail.com" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              {errors.host && <p className="mt-1 text-xs text-rose-600">{errors.host.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Port *</label>
              <input type="number" {...register("port")} placeholder="587" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              {errors.port && <p className="mt-1 text-xs text-rose-600">{errors.port.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Username *</label>
              <input {...register("username")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              {errors.username && <p className="mt-1 text-xs text-rose-600">{errors.username.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password *</label>
              <input type="password" {...register("password")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Encryption</label>
              <select {...register("encryption")} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">From Name *</label>
              <input {...register("fromName")} placeholder="DEEN Properties HR" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              {errors.fromName && <p className="mt-1 text-xs text-rose-600">{errors.fromName.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">From Email *</label>
              <input type="email" {...register("fromEmail")} placeholder="hr@deenproperties.com" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              {errors.fromEmail && <p className="mt-1 text-xs text-rose-600">{errors.fromEmail.message}</p>}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={save.isPending} className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              <Save className="h-4 w-4" /> {save.isPending ? "Saving…" : "Save Configuration"}
            </button>
          </div>
        </div>
      </form>

      {/* Test Email */}
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-slate-900">Send Test Email</h3>
        <div className="flex gap-3">
          <input
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
            type="email"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button onClick={handleTest} disabled={test.isPending} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            <Send className="h-4 w-4" /> {test.isPending ? "Sending…" : "Send Test"}
          </button>
        </div>
      </div>
    </div>
    </PermissionGuard>
  );
}
