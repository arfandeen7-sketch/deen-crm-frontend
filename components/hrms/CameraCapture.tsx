"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
  title: string;
}

export function CameraCapture({ onCapture, onClose, title }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera API not available. Ensure you are on HTTPS or localhost.");
        return;
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      setStream(mediaStream);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to access camera. Please grant permission.";
      setError(msg);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.8);
    setCaptured(base64);
    stopCamera();
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCaptured(null);
    startCamera();
  }, [startCamera]);

  const submit = useCallback(() => {
    if (captured) {
      onCapture(captured);
    }
  }, [captured, onCapture]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  // Assign stream to video element after it renders
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {!stream && !captured && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
                <Camera className="h-10 w-10 text-gray-900" />
              </div>
              <p className="text-sm text-slate-600">
                Camera access is required to record attendance
              </p>
              <button
                onClick={startCamera}
                className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Open Camera
              </button>
            </div>
          )}

          {stream && !captured && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative overflow-hidden rounded-xl border-2 border-slate-200">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-[360px] w-full object-cover"
                />
              </div>
              <button
                onClick={capturePhoto}
                className="flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Camera className="h-4 w-4" />
                Capture Photo
              </button>
            </div>
          )}

          {captured && (
            <div className="flex flex-col items-center gap-4">
              <div className="overflow-hidden rounded-xl border-2 border-emerald-200">
                <img
                  src={captured}
                  alt="Captured"
                  className="h-[360px] w-full object-cover"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={retake}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <RotateCcw className="h-4 w-4" />
                  Retake
                </button>
                <button
                  onClick={submit}
                  className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
