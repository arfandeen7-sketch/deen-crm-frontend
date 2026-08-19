"use client";

import { useState } from "react";
import { Download, Share2, Copy, Check, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { propertiesService } from "@/services/properties/properties.service";
import { downloadBlob, displayValue } from "@/lib/utils";
import { toast } from "sonner";

interface PropertyActionsProps {
  propertyId: string;
  propertyTitle: string;
  /** Optional deal badge — disables PDF download when the deal is closed. */
  dealClosed?: boolean;
}

export function PropertyActions({
  propertyId,
  propertyTitle,
  dealClosed = false,
}: PropertyActionsProps) {
  const [downloading, setDownloading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${propertyId}`
      : `/share/${propertyId}`;

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const blob = await propertiesService.downloadPdf(propertyId);
      const safeTitle = (propertyTitle || "Property")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "Property";
      downloadBlob(blob, `DEEN-Properties-${safeTitle}.pdf`);
      toast.success("Property brochure downloaded");
    } catch {
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link. Please copy it manually.");
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="md"
          onClick={handleDownloadPdf}
          loading={downloading}
          disabled={dealClosed}
          title={dealClosed ? "PDF download unavailable for closed deals" : "Download property brochure PDF"}
        >
          <Download className="h-3.5 w-3.5" />
          PDF
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={() => setShareOpen(true)}
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
      </div>

      {/* Share modal */}
      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Share Property"
        description="Anyone with this link can view the property microsite."
        size="md"
      >
        <div className="space-y-4">
          {/* Link preview */}
          <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5">
            <LinkIcon className="h-4 w-4 shrink-0 text-neutral-400" />
            <input
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent text-xs text-neutral-700 outline-none"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-md bg-black px-2.5 py-1.5 text-[10px] font-semibold text-white transition-colors hover:bg-neutral-800 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy
                </>
              )}
            </button>
          </div>

          {/* Native share button (mobile-friendly) */}
          {typeof navigator !== "undefined" && "share" in navigator && (
            <Button
              variant="outline"
              size="md"
              className="w-full"
              onClick={async () => {
                try {
                  await navigator.share({
                    title: propertyTitle || "DEEN Properties Listing",
                    url: shareUrl,
                  });
                } catch {
                  // user cancelled — no action needed
                }
              }}
            >
              <Share2 className="h-3.5 w-3.5" />
              Share via device
            </Button>
          )}

          <p className="text-[10px] text-neutral-400">
            The shared page displays all property details with DEEN Properties
            branding. No enquiry form is included.
          </p>
        </div>
      </Modal>
    </>
  );
}
