"use client";

import { useState } from "react";
import { LogIn, LogOut, Clock, CheckCircle2 } from "lucide-react";
import { CameraCaptureWithLocation } from "./CameraCaptureWithLocation";
import { useAttendanceCheckIn, useAttendanceCheckOut, useTodayAttendance } from "@/hooks/useHrms";
import { SHIFT_CONFIG } from "@/constants";
import { toast } from "sonner";

export function AttendanceCheckInOut() {
  const [showCamera, setShowCamera] = useState<"checkin" | "checkout" | null>(null);
  const { data: today, isLoading } = useTodayAttendance();
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
          onError: () => toast.error("Failed to record check-in"),
        },
      );
    } else if (showCamera === "checkout") {
      checkOut.mutate(
        { photo, latitude, longitude },
        {
          onSuccess: () => {
            toast.success("Check-out recorded successfully");
            setShowCamera(null);
          },
          onError: () => toast.error("Failed to record check-out"),
        },
      );
    }
  };

  const hasCheckedIn = !!today?.checkInTime;
  const hasCheckedOut = !!today?.checkOutTime;

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6">
        <div className="h-32 rounded-lg bg-slate-100" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Today&apos;s Attendance</h3>

        <div className="mb-4 flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
          <Clock className="h-4 w-4" />
          <span>Shift: {SHIFT_CONFIG.startTime} – {SHIFT_CONFIG.endTime} ({SHIFT_CONFIG.timezone})</span>
        </div>

        {today?.status && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700">
            <CheckCircle2 className="h-4 w-4" />
            <span>Status: {today.status.replace("_", " ").toUpperCase()}</span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Check In */}
          <div className="rounded-lg border border-slate-200 p-4 text-center">
            <LogIn className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
            {hasCheckedIn ? (
              <div>
                <p className="text-sm font-medium text-slate-700">Checked In</p>
                <p className="text-lg font-semibold text-emerald-600">
                  {new Date(today!.checkInTime!).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowCamera("checkin")}
                disabled={checkIn.isPending}
                className="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {checkIn.isPending ? "Processing…" : "Check In"}
              </button>
            )}
          </div>

          {/* Check Out */}
          <div className="rounded-lg border border-slate-200 p-4 text-center">
            <LogOut className="mx-auto mb-2 h-8 w-8 text-rose-600" />
            {hasCheckedOut ? (
              <div>
                <p className="text-sm font-medium text-slate-700">Checked Out</p>
                <p className="text-lg font-semibold text-rose-600">
                  {new Date(today!.checkOutTime!).toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ) : hasCheckedIn ? (
              <button
                onClick={() => setShowCamera("checkout")}
                disabled={checkOut.isPending}
                className="mt-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {checkOut.isPending ? "Processing…" : "Check Out"}
              </button>
            ) : (
              <p className="mt-2 text-sm text-slate-400">Check in first</p>
            )}
          </div>
        </div>

        {today?.totalWorkingHours != null && (
          <p className="mt-4 text-center text-sm text-slate-600">
            Working Hours: <span className="font-semibold">{Number(today.totalWorkingHours).toFixed(1)}h</span>
          </p>
        )}
      </div>

      {showCamera && (
        <CameraCaptureWithLocation
          title={showCamera === "checkin" ? "Check In — Capture Photo" : "Check Out — Capture Photo"}
          onCapture={handleCapture}
          onClose={() => setShowCamera(null)}
          officeLocation={undefined}
        />
      )}
    </>
  );
}
