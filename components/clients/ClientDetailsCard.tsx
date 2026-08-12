"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, X, Check, CreditCard, UserCircle2, Mail, Phone, Calendar, FileText, Link as LinkIcon } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { CanAccess } from "@/components/shared/Guards";
import { ClientDocumentCard } from "@/components/clients/ClientDocumentCard";
import { useClientByLeadId, useClientMutations } from "@/hooks/useClients";
import { getErrorMessage } from "@/services/api/client";
import { clientSchema, type ClientFormValues } from "@/schemas/client.schema";
import { formatDate, displayValue } from "@/lib/utils";
import Link from "next/link";

interface ClientDetailsCardProps {
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

export function ClientDetailsCard({ leadId, leadName }: ClientDetailsCardProps) {
  const { data: client, isLoading } = useClientByLeadId(leadId);
  const { upsert, uploadPassport, deletePassport, uploadEmiratesId, deleteEmiratesId } =
    useClientMutations(leadId);
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      fullName:         client?.fullName ?? "",
      mobileNumber:     client?.mobileNumber ?? "",
      email:            client?.email ?? "",
      dateOfBirth:      client?.dateOfBirth ? client.dateOfBirth.slice(0, 10) : "",
      passportNumber:   client?.passportNumber ?? "",
      emiratesIdNumber: client?.emiratesIdNumber ?? "",
    },
  });

  // Reset form values whenever the client data refreshes (after saves/uploads)
  const startEdit = () => {
    reset({
      fullName:         client?.fullName ?? "",
      mobileNumber:     client?.mobileNumber ?? "",
      email:            client?.email ?? "",
      dateOfBirth:      client?.dateOfBirth ? client.dateOfBirth.slice(0, 10) : "",
      passportNumber:   client?.passportNumber ?? "",
      emiratesIdNumber: client?.emiratesIdNumber ?? "",
    });
    setEditing(true);
  };

  async function onSave(values: ClientFormValues) {
    try {
      await upsert.mutateAsync(values);
      toast.success("Client details saved.");
      setEditing(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader
        title="Client Details"
        subtitle={client ? undefined : "No client record yet"}
        action={
          <div className="flex items-center gap-2">
            {client && (
              <Link
                href={`/clients/${leadId}`}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                <LinkIcon className="h-3.5 w-3.5" /> Full profile
              </Link>
            )}
            <CanAccess module="client_details" page="all_clients" action="edit">
              {editing ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={startEdit}>
                  <Pencil className="h-3.5 w-3.5" /> {client ? "Edit" : "Add"}
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
              <Field label="Full Name" error={errors.fullName?.message}>
                <Input placeholder="As per ID" {...register("fullName")} />
              </Field>
              <Field label="Mobile Number" error={errors.mobileNumber?.message}>
                <Input placeholder="+9715XXXXXXXX" {...register("mobileNumber")} />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <Input type="email" placeholder="client@example.com" {...register("email")} />
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
        ) : client ? (
          <div className="space-y-4">
            {/* Personal info */}
            <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <InfoRow icon={UserCircle2}  label="Full Name"        value={client.fullName} />
              <InfoRow icon={Phone}        label="Mobile Number"    value={client.mobileNumber} />
              <InfoRow icon={Mail}         label="Email"            value={client.email} />
              <InfoRow icon={Calendar}     label="Date of Birth"    value={formatDate(client.dateOfBirth)} />
              <InfoRow icon={FileText}     label="Passport Number"  value={client.passportNumber} />
              <InfoRow icon={CreditCard}   label="Emirates ID"      value={client.emiratesIdNumber} />
            </div>

            {/* Document uploads */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-neutral-100">
              <ClientDocumentCard
                label="Passport PDF"
                fileName={client.passportFileName}
                uploadedAt={client.passportUploadedAt}
                uploaderName={client.passportUploader?.fullName}
                signedUrl={client.passportUrl}
                onUpload={async (file) => { await uploadPassport.mutateAsync(file); }}
                onDelete={async () => { await deletePassport.mutateAsync(); }}
              />
              <ClientDocumentCard
                label="Emirates ID PDF"
                fileName={client.emiratesIdFileName}
                uploadedAt={client.emiratesIdUploadedAt}
                uploaderName={client.emiratesUploader?.fullName}
                signedUrl={client.emiratesIdUrl}
                onUpload={async (file) => { await uploadEmiratesId.mutateAsync(file); }}
                onDelete={async () => { await deleteEmiratesId.mutateAsync(); }}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No client details recorded yet.{" "}
            <CanAccess module="client_details" page="all_clients" action="edit">
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
