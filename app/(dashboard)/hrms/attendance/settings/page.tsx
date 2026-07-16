"use client";

import { useState, useEffect } from "react";
import { Save, MapPin, Clock, Calendar } from "lucide-react";
import { useAttendanceConfig, useUpdateAttendanceConfig } from "@/hooks/useHrms";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/lib/utils";
import type { AttendanceConfig } from "@/types";

const DAYS_OF_WEEK = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

export default function AttendanceSettingsPage() {
  const { isMaster } = useAuth();
  const { data: config, isLoading } = useAttendanceConfig();
  const updateConfig = useUpdateAttendanceConfig();

  const [formData, setFormData] = useState<Partial<AttendanceConfig>>({});
  const [weekendDays, setWeekendDays] = useState<string[]>([]);

  useEffect(() => {
    if (config) {
      setFormData(config);
      setWeekendDays(config.weekendDays ? config.weekendDays.split(",") : []);
    }
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isMaster) {
      toast.error("Only master admin can update attendance settings");
      return;
    }

    const payload = {
      ...formData,
      weekendDays: weekendDays.join(","),
    };

    updateConfig.mutate(payload, {
      onSuccess: () => {
        toast.success("Attendance settings updated successfully");
      },
      onError: (err) => {
        toast.error(getErrorMessage(err));
      },
    });
  };

  const handleWeekendToggle = (day: string) => {
    setWeekendDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Attendance Settings" subtitle="Configure attendance rules and office location" />
        <div className="animate-pulse rounded-xl border border-border bg-background p-6">
          <div className="h-96 rounded-lg bg-panel" />
        </div>
      </div>
    );
  }

  if (!isMaster) {
    return (
      <div className="space-y-6">
        <PageHeader title="Attendance Settings" subtitle="Configure attendance rules and office location" />
        <div className="rounded-xl border border-border bg-background p-6">
          <div className="text-center py-12">
            <p className="text-foreground-secondary">Only master admin can access this page</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Settings"
        subtitle="Configure attendance rules and office location"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Office Location */}
        <div className="rounded-xl border border-border bg-background p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-foreground-secondary" />
            <h3 className="text-lg font-semibold text-foreground">Office Location</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
                Office Name
              </label>
              <input
                type="text"
                value={formData.officeName || ""}
                onChange={(e) => setFormData({ ...formData, officeName: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
                Geofence Radius (meters)
              </label>
              <input
                type="number"
                min="10"
                value={formData.geofenceRadius || ""}
                onChange={(e) =>
                  setFormData({ ...formData, geofenceRadius: parseInt(e.target.value) })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                min="-90"
                max="90"
                value={formData.officeLatitude || ""}
                onChange={(e) =>
                  setFormData({ ...formData, officeLatitude: parseFloat(e.target.value) })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                min="-180"
                max="180"
                value={formData.officeLongitude || ""}
                onChange={(e) =>
                  setFormData({ ...formData, officeLongitude: parseFloat(e.target.value) })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>
        </div>

        {/* Time Thresholds */}
        <div className="rounded-xl border border-border bg-background p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-foreground-secondary" />
            <h3 className="text-lg font-semibold text-foreground">Time Thresholds</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
                Work Start Time
              </label>
              <input
                type="time"
                value={formData.workStartTime || ""}
                onChange={(e) => setFormData({ ...formData, workStartTime: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
                Late Start Time
              </label>
              <input
                type="time"
                value={formData.lateStartTime || ""}
                onChange={(e) => setFormData({ ...formData, lateStartTime: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
                Half-Day Start Time
              </label>
              <input
                type="time"
                value={formData.halfDayStartTime || ""}
                onChange={(e) => setFormData({ ...formData, halfDayStartTime: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
                Minimum Full Day Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.minFullDayHours || ""}
                onChange={(e) =>
                  setFormData({ ...formData, minFullDayHours: parseFloat(e.target.value) })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
                Minimum Half Day Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.minHalfDayHours || ""}
                onChange={(e) =>
                  setFormData({ ...formData, minHalfDayHours: parseFloat(e.target.value) })
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>
        </div>

        {/* Weekend Days */}
        <div className="rounded-xl border border-border bg-background p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-foreground-secondary" />
            <h3 className="text-lg font-semibold text-foreground">Weekend Days</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DAYS_OF_WEEK.map((day) => (
              <label
                key={day.value}
                className="flex items-center gap-2 cursor-pointer rounded-lg border border-border bg-panel px-3 py-2 hover:bg-section"
              >
                <input
                  type="checkbox"
                  checked={weekendDays.includes(day.value)}
                  onChange={() => handleWeekendToggle(day.value)}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-2 focus:ring-accent"
                />
                <span className="text-sm text-foreground">{day.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Active Toggle */}
        <div className="rounded-xl border border-border bg-background p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive ?? true}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-5 w-5 rounded border-border text-accent focus:ring-2 focus:ring-accent"
            />
            <div>
              <span className="text-sm font-medium text-foreground">Active</span>
              <p className="text-xs text-foreground-secondary">
                Enable or disable attendance tracking system-wide
              </p>
            </div>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" loading={updateConfig.isPending} size="lg">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
