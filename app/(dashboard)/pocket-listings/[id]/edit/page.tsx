"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { AccessGuard } from "@/components/shared/Guards";
import { PocketListingForm } from "@/components/pocketListings/PocketListingForm";
import { usePocketListing, usePocketListingMutations } from "@/hooks/usePocketListings";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";
import type { PocketListingFormValues } from "@/schemas/pocketListing.schema";

// ── Page wrapper (permission gate) ───────────────────────────────────────────

export default function PocketListingEditPage() {
  return (
    <AccessGuard
      module="pocket_listings"
      page="all_pocket_listings"
      action="edit"
    >
      <PocketListingEditContent />
    </AccessGuard>
  );
}

// ── Page content ─────────────────────────────────────────────────────────────

function PocketListingEditContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: listing, isLoading, isError, refetch } = usePocketListing(params.id);
  const { update, removeImage } = usePocketListingMutations();
  const { user, isMaster } = useAuth();

  // ── Loading / error states ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div>
        <BackLink id={params.id} />
        <LoadingState label="Loading pocket listing…" />
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div>
        <BackLink id={params.id} />
        <ErrorState
          message="Failed to load pocket listing. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Only the creator or a master can edit. Non-creators are redirected
  // back to the detail page.
  if (!isMaster && listing.createdById !== user?.id) {
    return (
      <div>
        <BackLink id={params.id} />
        <ErrorState message="You can only edit pocket listings that you created." />
      </div>
    );
  }

  // Capture id in a stable local const so TypeScript closure narrowing works
  const listingId = listing.id;

  // ── Derived default values ────────────────────────────────────────────────

  // Use `as Partial<PocketListingFormValues>` on the whole object to avoid
  // verbose per-field casts for fields whose backend type is `string` but the
  // form schema uses a narrow literal union.
  const defaultValues = {
    title: listing.title,
    description: listing.description ?? "",
    category: listing.category,
    type: listing.type,
    offeringType: listing.offeringType,
    furnishingType: listing.furnishingType ?? undefined,
    completionStatus: listing.completionStatus ?? undefined,
    developer: listing.developer ?? undefined,
    emirate: listing.emirate,
    city: listing.city ?? undefined,
    community: listing.community ?? undefined,
    building: listing.building ?? undefined,
    unitNumber: listing.unitNumber ?? undefined,
    floorNumber: listing.floorNumber ?? undefined,
    parkingSlots: listing.parkingSlots ?? undefined,
    bedrooms: listing.bedrooms ?? undefined,
    bathrooms: listing.bathrooms ?? undefined,
    size: listing.size ?? undefined,
    builtUpArea: listing.builtUpArea ?? undefined,
    price: listing.price ?? undefined,
    currency: listing.currency ?? "AED",
    priceType: listing.priceType ?? undefined,
    priceOnRequest: listing.priceOnRequest,
    numberOfCheques: listing.numberOfCheques ?? undefined,
    amenities: listing.amenities ?? [],
    listingStatus: listing.listingStatus,
    availableFrom: listing.availableFrom?.slice(0, 10) ?? undefined,
    rentalStartDate: listing.rentalStartDate?.slice(0, 10) ?? undefined,
    rentalEndDate: listing.rentalEndDate?.slice(0, 10) ?? undefined,
    videoUrl: listing.videoUrl ?? undefined,
    virtualTourUrl: listing.virtualTourUrl ?? undefined,
    floorPlanUrl: listing.floorPlanUrl ?? undefined,
    notes: listing.notes ?? undefined,
    reference: listing.reference,
  } as Partial<PocketListingFormValues>;

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleSubmit(formData: FormData) {
    try {
      await update.mutateAsync({ id: listingId, formData });
      toast.success("Pocket listing updated successfully.");
      router.push(`/pocket-listings/${listingId}`);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to update listing.");
      // Do NOT re-throw — TanStack Query resets isPending automatically;
      // re-throwing here creates an unhandled browser rejection.
    }
  }

  async function handleRemoveImage(imageId: string) {
    try {
      await removeImage.mutateAsync({ id: listingId, imageId });
      toast.success("Image removed.");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to remove image.");
      throw err;
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Back link */}
      <BackLink id={listingId} />

      <PageHeader
        title="Edit Pocket Listing"
        subtitle={listing.title}
      />

      <Card>
        <CardBody>
          <PocketListingForm
            mode="edit"
            defaultValues={defaultValues}
            existingImages={listing.images}
            submitting={update.isPending}
            onSubmit={handleSubmit}
            onRemoveImage={handleRemoveImage}
            onCancel={() => router.push(`/pocket-listings/${listingId}`)}
          />
        </CardBody>
      </Card>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BackLink({ id }: { id: string }) {
  return (
    <Link
      href={`/pocket-listings/${id}`}
      className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back to Listing
    </Link>
  );
}
