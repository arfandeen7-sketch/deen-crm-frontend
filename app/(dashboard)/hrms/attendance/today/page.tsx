"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Clock, Camera, CheckCircle, AlertCircle, LogIn, LogOut } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CameraCaptureWithLocation } from "@/components/hrms/CameraCaptureWithLocation";
import { useTodayAttendance, useAttendanceCheckIn, useAttendanceCheckOut, useAttendanceConfig } from "@/hooks/useHrms";
import { ATTENDANCE_STATUS_COLORS, SHIFT_CONFIG } from "@/constants";
import { getErrorMessage } from "@/lib/utils";

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-AE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Dubai",
  });
}

export default function TodayAttendancePage() {
  const { data: today, isLoading } = useTodayAttendance();
  const { data: config } = useAttendanceConfig();
  const checkIn = useAttendanceCheckIn();
  const checkOut = useAttendanceCheckOut();

  const [showCamera, setShowCamera] = useState<"check-in" | "check-out" | null>(null);

  const canCheckIn = !today || (!today.checkInTime && today.status !== "leave" && today.status !== "holiday" && today.status !== "weekend");
  const canCheckOut = today?.checkInTime && !today?.checkOutTime;

  async function handleCapture(photo: Blob, latitude: number, longitude: number) {
    const type = showCamera!;
    setShowCamera(null);
    try {
      const payload = { photo, latitude, longitude };
      if (type === "check-in") {
        await checkIn.mutateAsync(payload);
        toast.success(`Checked in at ${new Date().toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" })}`);
      } else {
        await checkOut.mutateAsync(payload);
        toast.success(`Checked out at ${new Date().toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" })}`);
      }
    } catch (e) {
      const msg = getErrorMessage(e);
      if (msg.toLowerCase().includes("geofence") || msg.includes("location") || (e as { response?: { status?: number } })?.response?.status === 403) {
        toast.error("You must be at the office to check in.", { description: "Please ensure you are within the office premises." });
      } else {
        toast.error(msg);
      }
    }
  }

  const todayDate = new Date().toLocaleDateString("en-AE", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Dubai",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today's Attendance"
        subtitle={todayDate}
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : (
        <>
          {/* Status Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
                {today?.status === "present" || today?.status === "late" ? (
                  <CheckCircle className="h-10 w-10 text-emerald-500" />
                ) : today?.status === "absent" ? (
                  <AlertCircle className="h-10 w-10 text-rose-500" />
                ) : (
                  <Clock className="h-10 w-10 text-indigo-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Today's Status</p>
                {today?.status ? (
                  <Badge className={`text-base px-4 py-1.5 ${ATTENDANCE_STATUS_COLORS[today.status]}`}>
                    {today.status.replace("_", " ")}
                  </Badge>
                ) : (
                  <Badge className="text-base px-4 py-1.5 bg-slate-100 text-slate-500">Not Checked In</Badge>
                )}
              </div>
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <p className="text-slate-500 text-xs">Check-in</p>
                  <p className="font-semibold text-slate-900">{formatTime(today?.checkInTime)}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs">Check-out</p>
                  <p className="font-semibold text-slate-900">{formatTime(today?.checkOutTime)}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 text-xs">Hours</p>
                  <p className="font-semibold text-slate-900">
                    {today?.totalWorkingHours != null ? `${Number(today.totalWorkingHours).toFixed(1)}h` : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Shift Info */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-slate-400" /> Shift: {SHIFT_CONFIG.startTime} – {SHIFT_CONFIG.endTime}</span>
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" /> {config?.officeName ?? "Office"}</span>
            {today?.isManualOverride && <span className="text-amber-600 font-medium">⚙ Manual Override</span>}
          </div>

          {/* Action Buttons */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <LogIn className="h-7 w-7 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900">Check In</p>
                {today?.checkInTime ? (
                  <p className="text-sm text-emerald-600 mt-1">Checked in at {formatTime(today.checkInTime)}</p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">Requires selfie + GPS verification</p>
                )}
              </div>
              <Button
                onClick={() => setShowCamera("check-in")}
                disabled={!canCheckIn || checkIn.isPending}
                loading={checkIn.isPending}
                className="w-full"
              >
                <Camera className="h-4 w-4" />
                {today?.checkInTime ? "Already Checked In" : "Check In"}
              </Button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100">
                <LogOut className="h-7 w-7 text-sky-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900">Check Out</p>
                {today?.checkOutTime ? (
                  <p className="text-sm text-sky-600 mt-1">Checked out at {formatTime(today.checkOutTime)}</p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">Requires selfie + GPS verification</p>
                )}
              </div>
              <Button
                onClick={() => setShowCamera("check-out")}
                disabled={!canCheckOut || checkOut.isPending}
                loading={checkOut.isPending}
                variant="secondary"
                className="w-full"
              >
                <Camera className="h-4 w-4" />
                {today?.checkOutTime ? "Already Checked Out" : "Check Out"}
              </Button>
            </div>
          </div>

          {/* Check-in photo */}
          {today?.checkInPhotoUrl && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500 mb-2">Check-in Photo</p>
              <img src={today.checkInPhotoUrl} alt="Check-in selfie" className="h-32 w-32 rounded-lg object-cover border border-slate-200" />
            </div>
          )}
        </>
      )}

      {/* Camera Capture */}
      {showCamera && (
        <CameraCaptureWithLocation
          title={showCamera === "check-in" ? "Check-in — Selfie Verification" : "Check-out — Selfie Verification"}
          onCapture={handleCapture}
          onClose={() => setShowCamera(null)}
          officeLocation={
            config
              ? {
                  latitude: config.officeLatitude,
                  longitude: config.officeLongitude,
                  name: config.officeName,
                  radius: config.geofenceRadius,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
