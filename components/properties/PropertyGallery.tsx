"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Expand,
  Video,
  Compass,
  FileText,
} from "lucide-react";

interface GalleryImage {
  original: string;
  watermarked: string;
  width: number;
  height: number;
}

interface PropertyGalleryProps {
  images: GalleryImage[];
  video?: { url: string; thumbnailUrl: string } | null;
  virtualTour?: { url: string } | null;
  floorPlan?: { url: string; watermarkedUrl: string } | null;
  title: string;
}

type MediaItem =
  | { type: "image"; url: string; thumbnail: string }
  | { type: "video"; url: string; thumbnail: string }
  | { type: "virtualTour"; url: string; thumbnail: string }
  | { type: "floorPlan"; url: string; thumbnail: string };

export function PropertyGallery({
  images,
  video,
  virtualTour,
  floorPlan,
  title,
}: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Build a unified media list: images first, then video, virtual tour, floor plan
  const mediaItems: MediaItem[] = [
    ...images.map((img) => ({
      type: "image" as const,
      url: img.original,
      thumbnail: img.original,
    })),
    ...(video
      ? [{ type: "video" as const, url: video.url, thumbnail: video.thumbnailUrl }]
      : []),
    ...(virtualTour
      ? [{ type: "virtualTour" as const, url: virtualTour.url, thumbnail: images[0]?.original ?? "" }]
      : []),
    ...(floorPlan
      ? [{ type: "floorPlan" as const, url: floorPlan.url, thumbnail: floorPlan.url }]
      : []),
  ];

  const hasMedia = mediaItems.length > 0;
  const current = mediaItems[activeIndex];

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % mediaItems.length);
  }, [mediaItems.length]);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + mediaItems.length) % mediaItems.length);
  }, [mediaItems.length]);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, next, prev]);

  if (!hasMedia) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-xl border border-neutral-200/80 bg-neutral-50 text-neutral-300">
        <div className="text-center">
          <Expand className="mx-auto h-12 w-12" />
          <p className="mt-2 text-xs">No media available</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main display */}
      <div className="relative overflow-hidden rounded-xl border border-neutral-200/80 bg-neutral-900">
        <div className="aspect-[16/10] w-full">
          {current?.type === "image" && (
            <img
              src={current.url}
              alt={`${title} - Image ${activeIndex + 1}`}
              className="h-full w-full object-cover"
            />
          )}
          {current?.type === "video" && (
            <div className="relative h-full w-full">
              <img
                src={current.thumbnail}
                alt={`${title} - Video thumbnail`}
                className="h-full w-full object-cover opacity-60"
              />
              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-110">
                  <Video className="h-7 w-7 text-neutral-900" />
                </span>
              </a>
            </div>
          )}
          {current?.type === "virtualTour" && (
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex h-full w-full items-center justify-center"
            >
              <img
                src={current.thumbnail || ""}
                alt={`${title} - Virtual tour`}
                className="h-full w-full object-cover opacity-60"
              />
              <span className="absolute flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-110">
                <Compass className="h-7 w-7 text-neutral-900" />
              </span>
            </a>
          )}
          {current?.type === "floorPlan" && (
            <a
              href={current.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex h-full w-full items-center justify-center bg-neutral-100"
            >
              <img
                src={current.url}
                alt={`${title} - Floor plan`}
                className="h-full w-full object-contain"
              />
            </a>
          )}
        </div>

        {/* Nav arrows */}
        {mediaItems.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/80 cursor-pointer"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/80 cursor-pointer"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Expand button (images only) */}
        {current?.type === "image" && (
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute right-3 top-3 rounded-lg bg-black/60 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/80 cursor-pointer"
            aria-label="View full size"
          >
            <Expand className="h-4 w-4" />
          </button>
        )}

        {/* Counter */}
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
          {activeIndex + 1} / {mediaItems.length}
        </span>
      </div>

      {/* Thumbnails */}
      {mediaItems.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {mediaItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                idx === activeIndex
                  ? "border-neutral-900 opacity-100"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {item.type === "image" && (
                <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
              )}
              {item.type === "video" && (
                <div className="relative h-full w-full">
                  <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Video className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
              {item.type === "virtualTour" && (
                <div className="flex h-full w-full items-center justify-center bg-neutral-800">
                  <Compass className="h-5 w-5 text-white" />
                </div>
              )}
              {item.type === "floorPlan" && (
                <div className="flex h-full w-full items-center justify-center bg-neutral-200">
                  <FileText className="h-5 w-5 text-neutral-600" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && current?.type === "image" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 cursor-pointer"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img
            src={current.url}
            alt={`${title} - Full size`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white">
            {activeIndex + 1} / {mediaItems.length}
          </span>
        </div>
      )}
    </>
  );
}
