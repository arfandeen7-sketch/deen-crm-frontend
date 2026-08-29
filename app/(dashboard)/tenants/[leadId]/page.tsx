"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserCircle2,
  Phone,
  Mail,
  Calendar,
  FileText,
  CreditCard,
  ExternalLink,
  CalendarClock,
  Home,
  Building2,
  User,
  DollarSign,
  Receipt,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { AccessGuard, CanAccess } from "@/components/shared/Guards";
import { ClientDocumentCard } from "@/components/clients/ClientDocumentCard";
import { TenantEditForm } from "@/components/tenants/TenantEditForm";
import { useTenantByLeadId, useTenantMutations } from "@/hooks/useTenants";
import { displayValue, formatDate, formatDateTime, formatCurrency } from "@/lib/utils";

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
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-slate-800">{displayValue(value)}</p>
      </div>
    </div>
  );
}

function remainingDays(endDate?: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return null;
  const now = new Date();
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((endDay.getTime() - todayDay.getTime()) / (24 * 60 * 60 * 1000));
}

export default function TenantDetailPage() {
  return (
    <AccessGuard module="tenant_details" page="all_tenants" action="view">
      <TenantDetailPageContent />
    </AccessGuard>
  );
}

function TenantDetailPageContent() {
  const params = useParams<{ leadId: string }>();
  const { data: tenant, isLoading, isError, refetch } = useTenantByLeadId(params.leadId);
  const {
    uploadPassport, deletePassport,
    uploadEmiratesId, deleteEmiratesId,
    uploadAgreement, deleteAgreement,
  } = useTenantMutations(params.leadId);
  const [showEditModal, setShowEditModal] = useState(false);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!tenant) {
    return (
      <div className="space-y-5">
        <Link
          href="/tenants"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to tenants
        </Link>
        <PageHeader
          title="Tenant Not Found"
          subtitle="No tenant record exists for this lead yet."
        />
        <p className="text-sm text-slate-500">
          Go to the{" "}
          <Link href={`/leads/${params.leadId}`} className="text-slate-800 underline">
            lead detail page
          </Link>{" "}
          to add tenant information.
        </p>
      </div>
    );
  }

  const lead = tenant.lead;
  const daysLeft = remainingDays(tenant.agreementEndDate);

  return (
    <div className="space-y-5">
      <Link
        href="/tenants"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to tenants
      </Link>

      <PageHeader
        title={displayValue(tenant.fullName) ?? "Tenant Profile"}
        subtitle={lead?.leadName ? `Lead: ${lead.leadName}` : ""}
        actions={
          <div className="flex items-center gap-2">
            <CanAccess module="tenant_details" page="all_tenants" action="edit">
              <Button
                size="sm"
                onClick={() => setShowEditModal(true)}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            </CanAccess>
            {lead && (
              <Link
                href={`/leads/${params.leadId}`}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View Lead
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          {/* Personal Information */}
          <Card>
            <CardHeader title="Personal Information" />
            <CardBody className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <InfoRow icon={UserCircle2} label="Tenant Name"   value={tenant.fullName} />
              <InfoRow icon={Phone}       label="Phone Number"  value={tenant.mobileNumber} />
              <InfoRow icon={Mail}        label="Email"         value={tenant.email} />
              <InfoRow icon={Calendar}    label="Date of Birth" value={formatDate(tenant.dateOfBirth)} />
              <InfoRow icon={UserCircle2} label="Nationality"   value={tenant.tenantNationality} />
            </CardBody>
          </Card>

          {/* Identity Documents (Numbers) */}
          <Card>
            <CardHeader title="Identity Information" />
            <CardBody className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <InfoRow icon={FileText}   label="Passport Number"   value={tenant.passportNumber} />
              <InfoRow icon={CreditCard} label="Emirates ID Number" value={tenant.emiratesIdNumber} />
            </CardBody>
          </Card>

          {/* Owner & Property */}
          <Card>
            <CardHeader title="Owner & Property" subtitle="Linked owner and rented property" />
            <CardBody className="space-y-4">
              {/* Owner */}
              {tenant.owner ? (
                <Link
                  href={`/owners/${tenant.owner.id}`}
                  className="block rounded-lg border border-blue-200 bg-blue-50/50 p-3 transition-colors hover:bg-blue-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Owner</p>
                        <p className="text-sm font-medium text-slate-900">{tenant.owner.fullName}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 pl-10 text-xs text-slate-600">
                    {tenant.owner.mobileNumber && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" /> {tenant.owner.mobileNumber}
                      </span>
                    )}
                    {tenant.owner.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" /> {tenant.owner.email}
                      </span>
                    )}
                    {tenant.owner.nationality && (
                      <span className="flex items-center gap-1">
                        <UserCircle2 className="h-3 w-3 text-slate-400" /> {tenant.owner.nationality}
                      </span>
                    )}
                  </div>
                </Link>
              ) : (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-center">
                  <User className="mx-auto h-6 w-6 text-neutral-300" />
                  <p className="mt-1 text-xs text-neutral-500">No owner linked to this tenant</p>
                </div>
              )}

              {/* Property */}
              {tenant.ownerManualProperty ? (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Property (Manual)</p>
                      <p className="text-sm font-medium text-slate-900">
                        {displayValue(tenant.ownerManualProperty.buildingName)}
                        {tenant.ownerManualProperty.unitNumber && ` — Unit ${tenant.ownerManualProperty.unitNumber}`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 pl-10 text-xs text-slate-600">
                    {tenant.ownerManualProperty.community && (
                      <span>{tenant.ownerManualProperty.community}</span>
                    )}
                    {tenant.ownerManualProperty.emirate && (
                      <span>· {tenant.ownerManualProperty.emirate}</span>
                    )}
                    {tenant.ownerManualProperty.type && (
                      <span>· {tenant.ownerManualProperty.type}</span>
                    )}
                    {tenant.ownerManualProperty.bedrooms && (
                      <span>· {tenant.ownerManualProperty.bedrooms} BR</span>
                    )}
                    {tenant.ownerManualProperty.floorNumber && (
                      <span>· Floor {tenant.ownerManualProperty.floorNumber}</span>
                    )}
                    {tenant.ownerManualProperty.unitSize && (
                      <span>· {tenant.ownerManualProperty.unitSize} sqm</span>
                    )}
                  </div>
                </div>
              ) : tenant.ownerProperty ? (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Property (PF/Pocket)</p>
                      <p className="text-sm font-medium text-slate-900">
                        {displayValue(tenant.ownerProperty.building ?? tenant.ownerProperty.projectName)}
                        {tenant.ownerProperty.unitNumber && ` — Unit ${tenant.ownerProperty.unitNumber}`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 pl-10 text-xs text-slate-600">
                    {tenant.ownerProperty.community && <span>{tenant.ownerProperty.community}</span>}
                    {tenant.ownerProperty.emirate && <span>· {tenant.ownerProperty.emirate}</span>}
                    {tenant.ownerProperty.type && <span>· {tenant.ownerProperty.type}</span>}
                    {tenant.ownerProperty.bedrooms && <span>· {tenant.ownerProperty.bedrooms} BR</span>}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-center">
                  <Building2 className="mx-auto h-6 w-6 text-neutral-300" />
                  <p className="mt-1 text-xs text-neutral-500">No property linked to this tenant</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Tenancy Agreement */}
          <Card>
            <CardHeader
              title="Tenancy Agreement"
              subtitle={
                daysLeft != null
                  ? daysLeft < 0
                    ? "Agreement expired"
                    : `${daysLeft} days remaining`
                  : undefined
              }
            />
            <CardBody className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <InfoRow icon={CalendarClock} label="Agreement Start Date" value={formatDate(tenant.agreementStartDate)} />
              <InfoRow icon={CalendarClock} label="Agreement End Date"   value={formatDate(tenant.agreementEndDate)} />
              <InfoRow icon={CalendarClock} label="Date of Notice"       value={formatDate(tenant.dateOfNotice)} />
            </CardBody>
          </Card>

          {/* Rental Financials */}
          <Card>
            <CardHeader title="Rental Financials" subtitle="Rent, deposit, commission, and payment terms" />
            <CardBody className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <InfoRow icon={DollarSign} label="Annual Rent"        value={tenant.annualRent != null ? formatCurrency(Number(tenant.annualRent)) : null} />
              <InfoRow icon={DollarSign} label="Security Deposit"   value={tenant.securityDeposit != null ? formatCurrency(Number(tenant.securityDeposit)) : null} />
              <InfoRow icon={DollarSign} label="Admin Fee"          value={tenant.adminFee != null ? formatCurrency(Number(tenant.adminFee)) : null} />
              <InfoRow icon={DollarSign} label="Commission"         value={tenant.commission != null ? formatCurrency(Number(tenant.commission)) : null} />
              <InfoRow icon={Receipt}    label="Mode of Payment"    value={tenant.modeOfPayment} />
              <InfoRow icon={Receipt}    label="Number of Cheques"  value={tenant.numberOfCheques != null ? String(tenant.numberOfCheques) : null} />
              <InfoRow icon={DollarSign} label="Currency"           value={tenant.currency} />
            </CardBody>
          </Card>

          {/* Cheque Schedule */}
          {tenant.cheques && tenant.cheques.length > 0 && (
            <Card>
              <CardHeader
                title="Cheque Schedule"
                subtitle={`${tenant.cheques.length} cheque${tenant.cheques.length > 1 ? "s" : ""}`}
              />
              <CardBody className="!p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-100 bg-neutral-50">
                        <th className="px-4 py-2.5 text-left font-semibold text-neutral-500">#</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-neutral-500">Cheque Date</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-neutral-500">Amount</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-neutral-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenant.cheques.map((cheque) => (
                        <tr key={cheque.id} className="border-b border-neutral-50 last:border-0">
                          <td className="px-4 py-2.5 text-slate-700">{cheque.chequeNumber}</td>
                          <td className="px-4 py-2.5 text-slate-700">{formatDate(cheque.chequeDate)}</td>
                          <td className="px-4 py-2.5 text-slate-700">
                            {cheque.amount != null ? formatCurrency(Number(cheque.amount)) : "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            {cheque.status ? (
                              <StatusBadge status={cheque.status} />
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Identity & Agreement Documents (PDFs) */}
          <Card>
            <CardHeader title="KYC & Agreement Documents" subtitle="PDF uploads — Passport, Emirates ID, Tenant Agreement" />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            </CardBody>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          {/* Related Lead */}
          {lead && (
            <Card>
              <CardHeader title="Related Lead" />
              <CardBody className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500">Lead Name</p>
                  <p className="text-sm font-medium text-slate-800">{lead.leadName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={lead.leadStatus} />
                </div>
                {lead.projectName && (
                  <div className="flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-slate-400" />
                    <p className="text-sm text-slate-800">{lead.projectName}</p>
                  </div>
                )}
                {lead.assignedUser && (
                  <div>
                    <p className="text-xs text-slate-500">Assigned To</p>
                    <p className="text-sm text-slate-800">{lead.assignedUser.fullName}</p>
                  </div>
                )}
                <Link
                  href={`/leads/${params.leadId}`}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open lead
                </Link>
              </CardBody>
            </Card>
          )}

          {/* Audit */}
          <Card>
            <CardHeader title="Record Info" />
            <CardBody className="space-y-2">
              <div>
                <p className="text-xs text-slate-500">Created By</p>
                <p className="text-sm text-slate-800">{tenant.creator?.fullName ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Created At</p>
                <p className="text-sm text-slate-800">{formatDateTime(tenant.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Last Updated</p>
                <p className="text-sm text-slate-800">{formatDateTime(tenant.updatedAt)}</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ── Edit Modal ─────────────────────────────────────────────────── */}
      <TenantEditForm
        leadId={params.leadId}
        tenant={tenant}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </div>
  );
}
