"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Pencil, X, Check, CreditCard, UserCircle2, Mail, Phone, Calendar,
  FileText, Link as LinkIcon, CalendarClock,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { CanAccess } from "@/components/shared/Guards";
import { ClientDocumentCard } from "@/components/clients/ClientDocumentCard";
import { useTenantByLeadId, useTenantMutations } from "@/hooks/useTenants";
import { getErrorMessage } from "@/services/api/client";
import { tenantSchema, type TenantFormValues } from "@/schemas/tenant.schema";
import { formatDate, displayValue } from "@/lib/utils";
import Link from "next/link";

interface TenantDetailsCardProps {
  leadId: string;
  leadName?: string;
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-slate-800">{displayValue(value)}</p>
      </div>
    </div>
  );
}

export function TenantDetailsCard({ leadId, leadName }: TenantDetailsCardProps) {
  const { data: tenant, isLoading } = useTenantByLeadId(leadId);
  const {
    upsert,
    uploadPassport, deletePassport,
    uploadEmiratesId, deleteEmiratesId,
    uploadAgreement, deleteAgreement,
  } = useTenantMutations(leadId);
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      fullName:             tenant?.fullName ?? "",
      mobileNumber:         tenant?.mobileNumber ?? "",
      email:                tenant?.email ?? "",
      dateOfBirth:          tenant?.dateOfBirth ? tenant.dateOfBirth.slice(0, 10) : "",
      passportNumber:       tenant?.passportNumber ?? "",
      emiratesIdNumber:     tenant?.emiratesIdNumber ?? "",
      agreementStartDate:   tenant?.agreementStartDate ? tenant.agreementStartDate.slice(0, 10) : "",
      agreementEndDate:     tenant?.agreementEndDate ? tenant.agreementEndDate.slice(0, 10) : "",
    },
  });

  // Reset form values whenever the tenant data refreshes (after saves/uploads)
  const startEdit = () => {
    reset({
      fullName:             tenant?.fullName ?? "",
      mobileNumber:         tenant?.mobileNumber ?? "",
      email:                tenant?.email ?? "",
      dateOfBirth:          tenant?.dateOfBirth ? tenant.dateOfBirth.slice(0, 10) : "",
      passportNumber:       tenant?.passportNumber ?? "",
      emiratesIdNumber:     tenant?.emiratesIdNumber ?? "",
      agreementStartDate:   tenant?.agreementStartDate ? tenant.agreementStartDate.slice(0, 10) : "",
      agreementEndDate:     tenant?.agreementEndDate ? tenant.agreementEndDate.slice(0, 10) : "",
    });
    setEditing(true);
  };

  async function onSave(values: TenantFormValues) {
    try {
      await upsert.mutateAsync(values);
      toast.success("Tenant details saved.");
      setEditing(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader
        title="Tenant Details"
        subtitle={tenant ? undefined : "No tenant record yet"}
        action={
          <div className="flex items-center gap-2">
            {tenant && (
              <Link
                href={`/tenants/${leadId}`}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                <LinkIcon className="h-3.5 w-3.5" /> Full profile
              </Link>
            )}
            <CanAccess module="tenant_details" page="all_tenants" action="edit">
              {editing ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={startEdit}>
                  <Pencil className="h-3.5 w-3.5" /> {tenant ? "Edit" : "Add"}
                </Button>
              )}
            </CanAccess>
          </div>
        }
      />
      <CardBody>
        {editing ? (
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Tenant Name" error={errors.fullName?.message}>
                <Input placeholder="As per ID" {...register("fullName")} />
              </Field>
              <Field label="Phone Number" error={errors.mobileNumber?.message}>
                <Input placeholder="+9715XXXXXXXX" {...register("mobileNumber")} />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <Input type="email" placeholder="tenant@example.com" {...register("email")} />
              </Field>
              <Field label="Date of Birth" error={errors.dateOfBirth?.message}>
                <Input type="date" {...register("dateOfBirth")} />
              </Field>
              <Field label="Passport Number" error={errors.passportNumber?.message}>
                <Input placeholder="e.g. A12345678" {...register("passportNumber")} />
              </Field>
              <Field label="Emirates ID Number" error={errors.emiratesIdNumber?.message}>
                <Input placeholder="784-XXXX-XXXXXXX-X" {...register("emiratesIdNumber")} />
              </Field>
              <Field label="Agreement Start Date" error={errors.agreementStartDate?.message}>
                <Input type="date" {...register("agreementStartDate")} />
              </Field>
              <Field label="Agreement End Date" error={errors.agreementEndDate?.message}>
                <Input type="date" {...register("agreementEndDate")} />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={upsert.isPending}>
                <Check className="h-3.5 w-3.5" /> Save
              </Button>
            </div>
          </form>
        ) : tenant ? (
          <div className="space-y-4">
            {/* Personal info */}
            <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <InfoRow icon={UserCircle2}  label="Tenant Name"        value={tenant.fullName} />
              <InfoRow icon={Phone}        label="Phone Number"       value={tenant.mobileNumber} />
              <InfoRow icon={Mail}         label="Email"              value={tenant.email} />
              <InfoRow icon={Calendar}     label="Date of Birth"      value={formatDate(tenant.dateOfBirth)} />
              <InfoRow icon={FileText}     label="Passport Number"    value={tenant.passportNumber} />
              <InfoRow icon={CreditCard}   label="Emirates ID"        value={tenant.emiratesIdNumber} />
            </div>

            {/* Agreement info */}
            <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 pt-2 border-t border-neutral-100">
              <InfoRow icon={CalendarClock} label="Agreement Start Date" value={formatDate(tenant.agreementStartDate)} />
              <InfoRow icon={CalendarClock} label="Agreement End Date"   value={formatDate(tenant.agreementEndDate)} />
            </div>

            {/* Document uploads */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-neutral-100">
              <ClientDocumentCard
                label="Passport PDF"
                fileName={tenant.passportFileName}
                uploadedAt={tenant.passportUploadedAt}
                uploaderName={tenant.passportUploader?.fullName}
                signedUrl={tenant.passportUrl}
                onUpload={async (file) => { await uploadPassport.mutateAsync(file); }}
                onDelete={async () => { await deletePassport.mutateAsync(); }}
              />
              <ClientDocumentCard
                label="Emirates ID PDF"
                fileName={tenant.emiratesIdFileName}
                uploadedAt={tenant.emiratesIdUploadedAt}
                uploaderName={tenant.emiratesUploader?.fullName}
                signedUrl={tenant.emiratesIdUrl}
                onUpload={async (file) => { await uploadEmiratesId.mutateAsync(file); }}
                onDelete={async () => { await deleteEmiratesId.mutateAsync(); }}
              />
              <ClientDocumentCard
                label="Tenant Agreement PDF"
                fileName={tenant.agreementFileName}
                uploadedAt={tenant.agreementUploadedAt}
                uploaderName={tenant.agreementUploader?.fullName}
                signedUrl={tenant.agreementUrl}
                onUpload={async (file) => { await uploadAgreement.mutateAsync(file); }}
                onDelete={async () => { await deleteAgreement.mutateAsync(); }}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No tenant details recorded yet.{" "}
            <CanAccess module="tenant_details" page="all_tenants" action="edit">
              <button
                type="button"
                onClick={startEdit}
                className="text-slate-800 underline hover:no-underline"
              >
                Add now
              </button>
            </CanAccess>
          </p>
        )}
      </CardBody>
    </Card>
  );
}
