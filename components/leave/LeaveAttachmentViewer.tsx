"use client";

import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LeaveAttachmentViewer({
  attachmentSignedUrl,
  attachmentUrl,
  fileName = "Attachment",
}: {
  attachmentSignedUrl?: string | null;
  attachmentUrl?: string | null;
  fileName?: string;
}) {
  const url = attachmentSignedUrl || attachmentUrl;
  if (!url) return null;

  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-panel p-4">
      {isImage ? (
        <img
          src={url}
          alt={fileName}
          className="h-16 w-16 rounded-lg object-cover"
        />
      ) : (
        <FileText className="h-10 w-10 text-accent" />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{fileName}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(url, "_blank")}
      >
        <ExternalLink className="h-4 w-4" /> Open
      </Button>
    </div>
  );
}
