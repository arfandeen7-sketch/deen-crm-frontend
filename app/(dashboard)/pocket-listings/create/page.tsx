"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { AccessGuard } from "@/components/shared/Guards";
import { PocketListingForm } from "@/components/pocketListings/PocketListingForm";
import { usePocketListingMutations } from "@/hooks/usePocketListings";
import { getErrorMessage } from "@/lib/utils";

// ── Page wrapper (permission gate) ───────────────────────────────────────────

export default function PocketListingCreatePage() {
  return (
    <AccessGuard
      module="pocket_listings"
      page="all_pocket_listings"
      action="create"
    >
      <PocketListingCreateContent />
    </AccessGuard>
  );
}

// ── Page content ─────────────────────────────────────────────────────────────

function PocketListingCreateContent() {
  const router = useRouter();
  const { create } = usePocketListingMutations();

  async function handleSubmit(formData: FormData) {
    try {
      const listing = await create.mutateAsync(formData);
      toast.success("Pocket listing created successfully.");
      router.push(`/pocket-listings/${listing.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to create listing.");
      // Do NOT re-throw — TanStack Query resets isPending automatically on
      // failure, and re-throwing here creates an unhandled browser rejection.
    }
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href="/pocket-listings"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Pocket Listings
      </Link>

      <PageHeader
        title="Add Pocket Listing"
        subtitle="Create a new off-market property listing"
      />

      <Card>
        <CardBody>
          <PocketListingForm
            mode="create"
            submitting={create.isPending}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/pocket-listings")}
          />
        </CardBody>
      </Card>
    </div>
  );
}
