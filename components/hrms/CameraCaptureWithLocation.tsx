"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, X, RotateCcw, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraCaptureWithLocationProps {
  onCapture: (photo: Blob, latitude: number, longitude: number) => void;
  onClose: () => void;
  title: string;
  officeLocation?: { latitude: number; longitude: number; name: string; radius: number };
}

export function CameraCaptureWithLocation({
  onCapture,
  onClose,
  title,
  officeLocation,
}: CameraCaptureWithLocationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<Blob | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371e3;
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c;
    },
    []
  );

  const getLocation = useCallback(() => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        setLocationLoading(false);

        if (officeLocation) {
          const dist = calculateDistance(
            latitude,
            longitude,
            officeLocation.latitude,
            officeLocation.longitude
          );
          setDistance(dist);
        }
      },
      (error) => {
        let message = "Unable to retrieve location";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission denied. Please enable location access.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information unavailable";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out";
        }
        setLocationError(message);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [officeLocation, calculateDistance]);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera API not available. Ensure you are on HTTPS or localhost.");
        return;
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      setStream(mediaStream);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to access camera. Please grant permission.";
      setCameraError(msg);
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
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCaptured(blob);
          setCapturedPreview(URL.createObjectURL(blob));
        }
      },
      "image/jpeg",
      0.8
    );
    stopCamera();
  }, [stopCamera]);

  const retake = useCallback(() => {
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
    }
    setCaptured(null);
    setCapturedPreview(null);
    startCamera();
  }, [capturedPreview, startCamera]);

  const submit = useCallback(() => {
    if (captured && location) {
      onCapture(captured, location.latitude, location.longitude);
    }
  }, [captured, location, onCapture]);

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

  const handleClose = useCallback(() => {
    stopCamera();
    if (capturedPreview) {
      URL.revokeObjectURL(capturedPreview);
    }
    onClose();
  }, [stopCamera, capturedPreview, onClose]);

  const isWithinGeofence =
    distance !== null && officeLocation ? distance <= officeLocation.radius : true;
  const canSubmit = captured && location && isWithinGeofence;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Location Status */}
          <div
            className={cn(
              "rounded-lg p-3 text-sm flex items-start gap-2",
              locationError
                ? "bg-rose-50 text-rose-700"
                : location
                ? isWithinGeofence
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
                : "bg-amber-50 text-amber-700"
            )}
          >
            {locationLoading ? (
              <>
                <MapPin className="h-4 w-4 mt-0.5 animate-pulse" />
                <span>Getting your location...</span>
              </>
            ) : locationError ? (
              <>
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <span>{locationError}</span>
              </>
            ) : location ? (
              <>
                {isWithinGeofence ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                )}
                <div className="flex-1">
                  {officeLocation && distance !== null ? (
                    <>
                      <div className="font-medium">
                        {isWithinGeofence
                          ? "Location verified"
                          : `You are ${Math.round(distance)}m away from ${officeLocation.name}`}
                      </div>
                      {!isWithinGeofence && (
                        <div className="text-xs mt-1">
                          You must be within {officeLocation.radius}m to check in/out
                        </div>
                      )}
                    </>
                  ) : (
                    <span>Location verified</span>
                  )}
                </div>
              </>
            ) : null}
          </div>

          {/* Camera Error */}
          {cameraError && (
            <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
              {cameraError}
            </div>
          )}

          {/* Camera UI */}
          {!stream && !captured && (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                <Camera className="h-10 w-10 text-gray-900" />
              </div>
              <p className="text-sm text-slate-600">
                Camera access is required to record attendance
              </p>
              <button
                onClick={startCamera}
                className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
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
                className="flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                <Camera className="h-4 w-4" />
                Capture Photo
              </button>
            </div>
          )}

          {captured && capturedPreview && (
            <div className="flex flex-col items-center gap-4">
              <div className="overflow-hidden rounded-xl border-2 border-emerald-200">
                <img
                  src={capturedPreview}
                  alt="Captured"
                  className="h-[360px] w-full object-cover"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={retake}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Retake
                </button>
                <button
                  onClick={submit}
                  disabled={!canSubmit}
                  className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
              </div>
              {!isWithinGeofence && (
                <p className="text-xs text-rose-600 text-center">
                  You must be at the office location to submit
                </p>
              )}
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
