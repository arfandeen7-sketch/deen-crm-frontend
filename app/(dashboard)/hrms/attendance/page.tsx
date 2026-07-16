"use client";

import { useState } from "react";
import { LogIn, LogOut, Clock, CheckCircle2, MapPin, Calendar } from "lucide-react";
import { CameraCaptureWithLocation } from "@/components/hrms/CameraCaptureWithLocation";
import { useAttendanceCheckIn, useAttendanceCheckOut, useTodayAttendance, useAttendanceConfig } from "@/hooks/useHrms";
import { toast } from "sonner";
import { AccessGuard } from "@/components/shared/Guards";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ATTENDANCE_STATUS_COLORS } from "@/constants";
import { getErrorMessage } from "@/lib/utils";

export default function AttendanceCheckInOutPage() {
  const [showCamera, setShowCamera] = useState<"checkin" | "checkout" | null>(null);
  const { data: today, isLoading: todayLoading } = useTodayAttendance();
  const { data: config, isLoading: configLoading } = useAttendanceConfig();
  const checkIn = useAttendanceCheckIn();
  const checkOut = useAttendanceCheckOut();

  const handleCapture = (photo: Blob, latitude: number, longitude: number) => {
    if (showCamera === "checkin") {
      checkIn.mutate(
        { photo, latitude, longitude },
        {
          onSuccess: () => {
            toast.success("Check-in recorded successfully");
            setShowCamera(null);
          },
          onError: (err) => {
            const message = getErrorMessage(err);
            toast.error(message);
          },
        }
      );
    } else if (showCamera === "checkout") {
      checkOut.mutate(
        { photo, latitude, longitude },
        {
          onSuccess: () => {
            toast.success("Check-out recorded successfully");
            setShowCamera(null);
          },
          onError: (err) => {
            const message = getErrorMessage(err);
            toast.error(message);
          },
        }
      );
    }
  };

  const hasCheckedIn = !!today?.checkInTime;
  const hasCheckedOut = !!today?.checkOutTime;
  const isLoading = todayLoading || configLoading;

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-AE", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Dubai",
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-AE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Dubai",
    });
  };

  if (isLoading) {
    return (
      <AccessGuard module="hrms" page="attendance">
        <div className="space-y-6">
          <PageHeader title="Attendance" subtitle="Check in and check out" />
          <div className="animate-pulse rounded-xl border border-border bg-background p-6">
            <div className="h-32 rounded-lg bg-panel" />
          </div>
        </div>
      </AccessGuard>
    );
  }

  return (
    <AccessGuard module="hrms" page="attendance">
      <div className="space-y-6">
        <PageHeader title="Attendance" subtitle="Check in and check out for today" />

        <div className="rounded-xl border border-border bg-background p-6">
          {/* Date & Office Info */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2 text-sm text-foreground-secondary">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(new Date().toISOString())}</span>
            </div>
            {config && (
              <>
                <div className="flex items-center gap-2 rounded-lg bg-panel px-4 py-2.5 text-sm text-foreground-secondary">
                  <Clock className="h-4 w-4" />
                  <span>
                    Work Hours: {config.workStartTime} – Late: {config.lateStartTime} – Half-Day: {config.halfDayStartTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-panel px-4 py-2.5 text-sm text-foreground-secondary">
                  <MapPin className="h-4 w-4" />
                  <span>
                    Office: {config.officeName} (within {config.geofenceRadius}m)
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Status Badge */}
          {today?.status && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-section px-4 py-2.5">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium text-foreground-secondary">Status:</span>
              <Badge className={ATTENDANCE_STATUS_COLORS[today.status]}>
                {today.status.replace("_", " ")}
              </Badge>
            </div>
          )}

          {/* Check In / Check Out Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Check In */}
            <div className="rounded-lg border border-border p-6 text-center">
              <LogIn className="mx-auto mb-3 h-8 w-8 text-emerald-600" />
              {hasCheckedIn ? (
                <div>
                  <p className="text-sm font-medium text-foreground-secondary mb-1">Checked In</p>
                  <p className="text-2xl font-semibold text-emerald-600">
                    {formatTime(today!.checkInTime!)}
                  </p>
                  {today?.checkInPhotoUrl && (
                    <div className="mt-4">
                      <img
                        src={today.checkInPhotoUrl}
                        alt="Check-in photo"
                        className="mx-auto h-24 w-24 rounded-lg object-cover border border-border"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowCamera("checkin")}
                  disabled={checkIn.isPending}
                  className="mt-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkIn.isPending ? "Processing…" : "Check In"}
                </button>
              )}
            </div>

            {/* Check Out */}
            <div className="rounded-lg border border-border p-6 text-center">
              <LogOut className="mx-auto mb-3 h-8 w-8 text-rose-600" />
              {hasCheckedOut ? (
                <div>
                  <p className="text-sm font-medium text-foreground-secondary mb-1">Checked Out</p>
                  <p className="text-2xl font-semibold text-rose-600">
                    {formatTime(today!.checkOutTime!)}
                  </p>
                  {today?.checkOutPhotoUrl && (
                    <div className="mt-4">
                      <img
                        src={today.checkOutPhotoUrl}
                        alt="Check-out photo"
                        className="mx-auto h-24 w-24 rounded-lg object-cover border border-border"
                      />
                    </div>
                  )}
                </div>
              ) : hasCheckedIn ? (
                <button
                  onClick={() => setShowCamera("checkout")}
                  disabled={checkOut.isPending}
                  className="mt-2 rounded-lg bg-rose-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkOut.isPending ? "Processing…" : "Check Out"}
                </button>
              ) : (
                <p className="mt-2 text-sm text-foreground-muted">Check in first</p>
              )}
            </div>
          </div>

          {/* Working Hours */}
          {today?.totalWorkingHours != null && (
            <div className="mt-6 text-center">
              <p className="text-sm text-foreground-secondary">
                Total Working Hours:{" "}
                <span className="font-semibold text-foreground">
                  {Number(today.totalWorkingHours).toFixed(1)}h
                </span>
              </p>
            </div>
          )}
        </div>
      </div>

      {showCamera && (
        <CameraCaptureWithLocation
          title={showCamera === "checkin" ? "Check In — Capture Photo" : "Check Out — Capture Photo"}
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
    </AccessGuard>
  );
}
