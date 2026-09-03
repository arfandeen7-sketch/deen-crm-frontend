"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Pencil,
  Trash2,
  Upload,
  ImageIcon,
  X,
  Plus,
  Import,
  Hash,
  UserCircle2,
  Phone,
  Mail,
  ExternalLink,
  UserPlus,
  LogOut,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ManualPropertyForm } from "@/components/forms/ManualPropertyForm";
import { AddTenantForm } from "@/components/tenants/AddTenantForm";
import { EndContractModal } from "@/components/tenants/EndContractModal";
import { TenantRenewalModal, type RenewalPropertyInfo } from "@/components/tenants/TenantRenewalModal";
import {
  LISTING_STATUS_LABELS,
  LISTING_STATUS_COLORS,
  type ManualPropertyFormValues,
} from "@/schemas/owner.schema";
import {
  useOwnerManualPropertyMutations,
  useOwnerManualProperties,
} from "@/hooks/useOwners";
import { getErrorMessage } from "@/services/api/client";
import { formatCurrency } from "@/lib/utils";
import type { ManualProperty, ManualPropertyImage, PropertyTenantSummary } from "@/types";

// ── Tenant helpers ────────────────────────────────────────────────────────────

function tenantRemainingDays(endDate?: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return null;
  const now = new Date();
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((endDay.getTime() - todayDay.getTime()) / (24 * 60 * 60 * 1000));
}

function getActiveTenant(tenants?: PropertyTenantSummary[]): PropertyTenantSummary | null {
  if (!tenants || tenants.length === 0) return null;
  const now = new Date();
  const active = tenants.filter((t) => {
    if (!t.agreementEndDate) return true;
    return new Date(t.agreementEndDate) >= now;
  });
  if (active.length === 0) return null;
  return active.sort((a, b) => {
    const aStart = a.agreementStartDate ? new Date(a.agreementStartDate).getTime() : 0;
    const bStart = b.agreementStartDate ? new Date(b.agreementStartDate).getTime() : 0;
    return bStart - aStart;
  })[0];
}

interface Props {
  ownerId: string;
  /** When true the user can add, edit, and delete properties. */
  isMaster: boolean;
}

export function ManualPropertySection({ ownerId, isMaster }: Props) {
  const { data, isLoading, isError, refetch } = useOwnerManualProperties(ownerId);
  const { create, update, remove, addImages, removeImage } =
    useOwnerManualPropertyMutations();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProp, setEditingProp] = useState<ManualProperty | null>(null);
  const [deletingPropId, setDeletingPropId] = useState<string | null>(null);
  const [managingImages, setManagingImages] = useState<ManualProperty | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── Tenant management state ────────────────────────────────────────────────
  const [addTenantProp, setAddTenantProp] = useState<ManualProperty | null>(null);
  const [endContractTenant, setEndContractTenant] = useState<PropertyTenantSummary | null>(null);
  const [renewalState, setRenewalState] = useState<{ tenant: PropertyTenantSummary; property: RenewalPropertyInfo } | null>(null);

  const properties: ManualProperty[] = data?.data ?? [];
  const importedCount = properties.filter((p) => p.isImported).length;
  const manualCount = properties.length - importedCount;

  async function handleCreate(values: ManualPropertyFormValues) {
    setSubmitting(true);
    try {
      await create.mutateAsync({ ownerId, body: values });
      toast.success("Property added");
      setShowAddModal(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(values: ManualPropertyFormValues) {
    if (!editingProp) return;
    setSubmitting(true);
    try {
      await update.mutateAsync({ ownerId, propId: editingProp.id, body: values });
      toast.success("Property updated");
      setEditingProp(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deletingPropId) return;
    try {
      await remove.mutateAsync({ ownerId, propId: deletingPropId });
      toast.success("Property removed");
      setDeletingPropId(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleAddImages(files: File[]) {
    if (!managingImages) return;
    try {
      const updated = await addImages.mutateAsync({
        ownerId,
        propId: managingImages.id,
        files,
      });
      toast.success(`${files.length} image(s) uploaded`);
      setManagingImages(updated);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleRemoveImage() {
    if (!managingImages || !deletingImageId) return;
    try {
      await removeImage.mutateAsync({
        ownerId,
        propId: managingImages.id,
        imageId: deletingImageId,
      });
      toast.success("Image removed");
      setDeletingImageId(null);
      const updated = properties.find((p) => p.id === managingImages.id);
      if (updated) setManagingImages(updated);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function handleImageInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) handleAddImages(files);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            Portfolio Properties
          </span>
        }
        subtitle={
          properties.length === 0
            ? "No properties added yet"
            : `${properties.length} ${properties.length === 1 ? "property" : "properties"}` +
              (importedCount > 0 ? ` · ${importedCount} imported from CSV` : "") +
              (manualCount > 0 ? ` · ${manualCount} added manually` : "")
        }
        action={
          isMaster ? (
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Property
            </Button>
          ) : null
        }
      />

      <CardBody className="!p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-slate-400">Loading properties…</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-sm text-rose-500">Failed to load properties</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-10 w-10 text-slate-200" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              No portfolio properties yet
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Properties imported via CSV or added manually will appear here.
            </p>
            {isMaster && (
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Property
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-left text-xs">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-50/90">
                  <th className="whitespace-nowrap px-4 py-3 border-b border-neutral-200">Building / Project</th>
                  <th className="whitespace-nowrap px-4 py-3 border-b border-neutral-200">Unit</th>
                  <th className="whitespace-nowrap px-4 py-3 border-b border-neutral-200">Community</th>
                  <th className="whitespace-nowrap px-4 py-3 border-b border-neutral-200">Emirate</th>
                  <th className="whitespace-nowrap px-4 py-3 border-b border-neutral-200">Type</th>
                  <th className="whitespace-nowrap px-4 py-3 border-b border-neutral-200">Beds</th>
                  <th className="whitespace-nowrap px-4 py-3 border-b border-neutral-200">Baths</th>
                  <th className="whitespace-nowrap px-4 py-3 border-b border-neutral-200">Size</th>
                  <th className="whitespace-nowrap px-4 py-3 border-b border-neutral-200">Floor</th>
                  <th className="whitespace-nowrap px-4 py-3 border-b border-neutral-200">Parking</th>
                  <th className="whitespace-nowrap px-4 py-3 border-b border-neutral-200">Price (AED)</th>
                  <th className="whitespace-nowrap px-4 py-3 border-b border-neutral-200">Tenant</th>
                  <th className="whitespace-nowrap px-4 py-3 border-b border-neutral-200">Status</th>
                  <th className="whitespace-nowrap px-4 py-3 border-b border-neutral-200">Source</th>
                  {isMaster && (
                    <th className="whitespace-nowrap px-4 py-3 border-b border-neutral-200">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {properties.map((p) => {
                  const activeTenant = getActiveTenant(p.tenants);
                  const isRented = !!activeTenant;
                  // Tenant link takes precedence: if rented by a linked tenant,
                  // override the listing status to "rented"
                  const effectiveStatus = isRented ? "rented" : p.listingStatus;
                  const statusClass =
                    LISTING_STATUS_COLORS[effectiveStatus] ?? "bg-slate-100 text-slate-600";
                  const daysLeft = activeTenant
                    ? tenantRemainingDays(activeTenant.agreementEndDate)
                    : null;
                  return (
                    <tr key={p.id} className="group bg-white hover:bg-neutral-50/80 transition-colors">
                      <td className="whitespace-nowrap px-4 py-3 border-b border-neutral-100">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">
                            {p.buildingName || p.villaName || p.projectName || "—"}
                          </p>
                          {p.reference && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-0.5">
                              <Hash className="h-2.5 w-2.5" /> {p.reference}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 border-b border-neutral-100 text-slate-700">
                        {p.unitNumber || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 border-b border-neutral-100 text-slate-600">
                        {p.community || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 border-b border-neutral-100 text-slate-600">
                        {p.emirate || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 border-b border-neutral-100">
                        <div className="text-xs text-slate-600">
                          {p.type && <p>{p.type}</p>}
                          {p.category && <p className="text-slate-400">{p.category}</p>}
                          {!p.type && !p.category && "—"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 border-b border-neutral-100 text-slate-700">
                        {p.bedrooms ? (p.bedrooms === "studio" ? "Studio" : p.bedrooms) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 border-b border-neutral-100 text-slate-700">
                        {p.bathrooms || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 border-b border-neutral-100 text-slate-700">
                        {p.unitSize ? `${p.unitSize} sqft` : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 border-b border-neutral-100 text-slate-700">
                        {p.floorNumber || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 border-b border-neutral-100 text-slate-700">
                        {p.parkingSlots || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 border-b border-neutral-100 font-semibold text-emerald-700">
                        {p.price ? Number(p.price).toLocaleString() : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 border-b border-neutral-100">
                        {activeTenant ? (
                          <div className="space-y-0.5">
                            <Link
                              href={`/tenants/${activeTenant.leadId}`}
                              className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <UserCircle2 className="h-3 w-3 text-emerald-500" />
                              {activeTenant.fullName ?? "Unknown"}
                            </Link>
                            {activeTenant.mobileNumber && (
                              <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
                                <Phone className="h-2.5 w-2.5 text-slate-400" /> {activeTenant.mobileNumber}
                              </span>
                            )}
                            {activeTenant.agreementEndDate && (
                              <span
                                className={`text-[10px] font-medium ${
                                  daysLeft == null
                                    ? "text-slate-500"
                                    : daysLeft < 0
                                      ? "text-red-600"
                                      : daysLeft <= 30
                                        ? "text-amber-600"
                                        : "text-emerald-600"
                                }`}
                              >
                                {daysLeft == null
                                  ? "—"
                                  : daysLeft < 0
                                    ? `Expired ${Math.abs(daysLeft)}d ago`
                                    : `${daysLeft}d left`}
                              </span>
                            )}
                            {activeTenant.annualRent != null && (
                              <span className="text-[10px] text-slate-500">
                                {formatCurrency(Number(activeTenant.annualRent))}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 border-b border-neutral-100">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass}`}>
                          {LISTING_STATUS_LABELS[effectiveStatus] ?? effectiveStatus}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 border-b border-neutral-100">
                        {p.isImported ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                            <Import className="h-2.5 w-2.5" /> CSV
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            Manual
                          </span>
                        )}
                      </td>
                      {isMaster && (
                        <td className="whitespace-nowrap px-4 py-3 border-b border-neutral-100">
                          <div className="flex items-center gap-1">
                            {/* Add Tenant — only for available (non-rented) properties */}
                            {!isRented && (
                              <button
                                onClick={() => setAddTenantProp(p)}
                                className="rounded p-1.5 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                title="Add tenant"
                              >
                                <UserPlus className="h-4 w-4" />
                              </button>
                            )}
                            {/* Renew — only for properties with an active tenant */}
                            {activeTenant && (
                              <button
                                onClick={() => setRenewalState({ tenant: activeTenant, property: p })}
                                className="rounded p-1.5 text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                title="Renew tenant contract"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                            )}
                            {/* End Contract — only for properties with an active tenant */}
                            {activeTenant && (
                              <button
                                onClick={() => setEndContractTenant(activeTenant)}
                                className="rounded p-1.5 text-amber-500 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                                title="End tenant contract"
                              >
                                <LogOut className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setEditingProp(p)}
                              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                              title="Edit property"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setManagingImages(p)}
                              className="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              title="Manage photos"
                            >
                              <Upload className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeletingPropId(p.id)}
                              className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Delete property"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>

      {/* ── Add Modal (master only) ──────────────────────────────────── */}
      {isMaster && (
        <>
          <Modal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Add Property"
            description="Enter property details to add to this owner's portfolio."
            size="xl"
          >
            <ManualPropertyForm
              submitting={submitting}
              onSubmit={handleCreate}
              onCancel={() => setShowAddModal(false)}
            />
          </Modal>

          {/* ── Edit Modal ────────────────────────────────────────────── */}
          <Modal
            open={!!editingProp}
            onClose={() => setEditingProp(null)}
            title="Edit Property"
            description="Update the property details for this owner."
            size="xl"
          >
            {editingProp && (
              <ManualPropertyForm
                key={editingProp.id}
                initial={editingProp}
                submitting={submitting}
                onSubmit={handleUpdate}
                onCancel={() => setEditingProp(null)}
              />
            )}
          </Modal>

          {/* ── Image Manager Modal ───────────────────────────────────── */}
          <Modal
            open={!!managingImages}
            onClose={() => { setManagingImages(null); setDeletingImageId(null); }}
            title="Manage Images"
            description={managingImages?.buildingName ?? managingImages?.unitNumber ?? "Property"}
            size="lg"
          >
            {managingImages && (
              <ImageManagerPanel
                property={managingImages}
                onAddImages={(files) => handleAddImages(files)}
                onDeleteImage={(imageId) => setDeletingImageId(imageId)}
                uploading={addImages.isPending}
                inputRef={imageInputRef}
                onInputChange={handleImageInput}
              />
            )}
          </Modal>

          {/* ── Delete Property Confirm ───────────────────────────────── */}
          <ConfirmModal
            open={!!deletingPropId}
            onClose={() => setDeletingPropId(null)}
            onConfirm={handleDelete}
            title="Remove property?"
            message="This will permanently delete this property and all its images. This cannot be undone."
            confirmLabel="Remove"
            loading={remove.isPending}
          />

          {/* ── Delete Image Confirm ──────────────────────────────────── */}
          <ConfirmModal
            open={!!deletingImageId}
            onClose={() => setDeletingImageId(null)}
            onConfirm={handleRemoveImage}
            title="Remove image?"
            message="This image will be permanently deleted."
            confirmLabel="Remove"
            loading={removeImage.isPending}
          />
        </>
      )}

      {/* ── Add Tenant Modal ─────────────────────────────────────────────── */}
      {addTenantProp && (
        <AddTenantForm
          ownerId={ownerId}
          property={addTenantProp}
          open={!!addTenantProp}
          onClose={() => setAddTenantProp(null)}
        />
      )}

      {/* ── End Contract Modal ───────────────────────────────────────────── */}
      {endContractTenant && (
        <EndContractModal
          tenant={endContractTenant}
          open={!!endContractTenant}
          onClose={() => setEndContractTenant(null)}
        />
      )}

      {/* ── Renewal Modal ────────────────────────────────────────────────── */}
      {renewalState && (
        <TenantRenewalModal
          tenant={renewalState.tenant}
          currentProperty={renewalState.property}
          ownerId={ownerId}
          open={!!renewalState}
          onClose={() => setRenewalState(null)}
        />
      )}
    </Card>
  );
}

// ── ImageManagerPanel ─────────────────────────────────────────────────────────

function ImageManagerPanel({
  property,
  onAddImages,
  onDeleteImage,
  uploading,
  inputRef,
  onInputChange,
}: {
  property: ManualProperty;
  onAddImages: (files: File[]) => void;
  onDeleteImage: (imageId: string) => void;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const images: ManualPropertyImage[] = property.images ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {images.length} {images.length === 1 ? "image" : "images"} uploaded
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          loading={uploading}
        >
          <Upload className="h-3.5 w-3.5" /> Upload Images
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {images.length === 0 ? (
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 py-10 text-center hover:border-neutral-400 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <ImageIcon className="h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-500">No images yet</p>
          <p className="mt-1 text-xs text-slate-400">Click to upload JPEG, PNG, or WebP</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative">
              <img
                src={img.url}
                alt={img.filename}
                className="h-28 w-full rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => onDeleteImage(img.id)}
                className="absolute right-1 top-1 hidden rounded-full bg-black/70 p-0.5 text-white hover:bg-rose-600 transition-colors group-hover:flex"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-28 items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
          >
            <Plus className="h-5 w-5 text-neutral-400" />
          </button>
        </div>
      )}
    </div>
  );
}
