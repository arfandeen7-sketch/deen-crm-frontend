"use client";

import { useMemo } from "react";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { reportsService } from "@/services/leads/reports.service";
import { activityService } from "@/services/leads/activity.service";
import { usersService } from "@/services/users/users.service";
import { CONVERTED_LEAD_STATUSES } from "@/constants";
import type {
  LeadReportParams,
  LeadReportKpis,
  KpiComparisonValue,
  UserPerformanceItem,
  EmployeePerformance,
  LeadActivity,
} from "@/types";

const KEY = "lead-reports";

/** Endpoints that don't exist on the backend yet — fail fast, no retries. */
const NOT_YET_IMPLEMENTED = {
  retry: false,
  refetchOnWindowFocus: false,
} as const;

export function useSourceReport(params: LeadReportParams, options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: [KEY, "source", params],
    queryFn: () => reportsService.sourceReport(params),
    refetchInterval: options?.refetchInterval,
  });
}

export function useStatusReport(params: LeadReportParams, options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: [KEY, "status", params],
    queryFn: () => reportsService.statusReport(params),
    refetchInterval: options?.refetchInterval,
  });
}

export function useUserPerformance(params: LeadReportParams, options?: { refetchInterval?: number | false }) {
  return useQuery({
    queryKey: [KEY, "user-performance", params],
    queryFn: () => reportsService.userPerformance(params),
    refetchInterval: options?.refetchInterval,
  });
}

export function useLeadTimeSeries(params: LeadReportParams) {
  return useQuery({
    queryKey: [KEY, "time-series", params],
    queryFn: () => reportsService.timeSeries(params),
    ...NOT_YET_IMPLEMENTED,
  });
}

/** NEW BACKEND ENDPOINT REQUIRED: GET /leads/report/priority */
export function usePriorityReport(params: LeadReportParams) {
  return useQuery({
    queryKey: [KEY, "priority", params],
    queryFn: () => reportsService.priorityReport(params),
    ...NOT_YET_IMPLEMENTED,
  });
}

/** NEW BACKEND ENDPOINT REQUIRED: GET /leads/report/geo */
export function useGeoReport(params: LeadReportParams) {
  return useQuery({
    queryKey: [KEY, "geo", params],
    queryFn: () => reportsService.geoReport(params),
    ...NOT_YET_IMPLEMENTED,
  });
}

/** NEW BACKEND ENDPOINT REQUIRED: GET /leads/report/summary */
export function useReportSummary(params: LeadReportParams) {
  return useQuery({
    queryKey: [KEY, "summary", params],
    queryFn: () => reportsService.summary(params),
    ...NOT_YET_IMPLEMENTED,
  });
}

/** Global lead-activity feed for a specific actor (uses existing /leads/activity?actorId=). */
export function useEmployeeActivity(userId: string | undefined, params: { dateFrom?: string; dateTo?: string; pageSize?: number } = {}) {
  return useQuery({
    queryKey: [KEY, "employee-activity", userId, params],
    queryFn: () =>
      activityService.global({ actorId: userId, pageSize: params.pageSize ?? 100, dateFrom: params.dateFrom, dateTo: params.dateTo }),
    enabled: !!userId,
  });
}

/** Shift a `dateFrom`/`dateTo` range back by its own length to get the "previous period". */
export function previousPeriodRange(dateFrom?: string, dateTo?: string): { dateFrom?: string; dateTo?: string } {
  if (!dateFrom || !dateTo) return {};
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  const lengthMs = to.getTime() - from.getTime();
  if (Number.isNaN(lengthMs) || lengthMs < 0) return {};
  const prevTo = new Date(from.getTime() - 24 * 60 * 60 * 1000);
  const prevFrom = new Date(prevTo.getTime() - lengthMs);
  return {
    dateFrom: prevFrom.toISOString().slice(0, 10),
    dateTo: prevTo.toISOString().slice(0, 10),
  };
}

function aggregate(rows: UserPerformanceItem[] | undefined) {
  const list = rows ?? [];
  const assigned = list.reduce((s, r) => s + r.assigned, 0);
  const touched = list.reduce((s, r) => s + r.touched, 0);
  const followedUp = list.reduce((s, r) => s + r.followedUp, 0);
  const missedFollowUps = list.reduce((s, r) => s + r.missedFollowUps, 0);
  const converted = list.reduce(
    (s, r) => s + CONVERTED_LEAD_STATUSES.reduce((ss, st) => ss + (r.statusBreakdown?.[st] ?? 0), 0),
    0,
  );
  return { assigned, touched, followedUp, missedFollowUps, converted };
}

function comparisonValue(current: number, previous: number): KpiComparisonValue {
  const deltaPct = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : null;
  return { current, previous, deltaPct };
}

/**
 * Computes KPI cards with period-over-period comparison entirely from the
 * existing /leads/report (user-performance) endpoint by fetching the current
 * and immediately-preceding date range. `newLeads` and `avgResponseTimeMinutes`
 * fall back to `reportsService.summary()` (NEW backend endpoint) when available.
 */
export function useKpiComparison(params: LeadReportParams) {
  const prevRange = useMemo(() => previousPeriodRange(params.dateFrom, params.dateTo), [params.dateFrom, params.dateTo]);

  const current = useUserPerformance(params);
  const previous = useUserPerformance(prevRange, { refetchInterval: false });
  const summary = useReportSummary(params);

  const kpis: LeadReportKpis | undefined = useMemo(() => {
    if (!current.data) return undefined;
    const cur = aggregate(current.data);
    const prev = aggregate(previous.data);
    const touchRateCur = cur.assigned > 0 ? (cur.touched / cur.assigned) * 100 : 0;
    const touchRatePrev = prev.assigned > 0 ? (prev.touched / prev.assigned) * 100 : 0;
    const convRateCur = cur.assigned > 0 ? (cur.converted / cur.assigned) * 100 : 0;
    const convRatePrev = prev.assigned > 0 ? (prev.converted / prev.assigned) * 100 : 0;
    const fuTotalCur = cur.followedUp + cur.missedFollowUps;
    const fuTotalPrev = prev.followedUp + prev.missedFollowUps;
    const fuRateCur = fuTotalCur > 0 ? (cur.followedUp / fuTotalCur) * 100 : 0;
    const fuRatePrev = fuTotalPrev > 0 ? (prev.followedUp / fuTotalPrev) * 100 : 0;

    return {
      totalLeads: comparisonValue(cur.assigned, prev.assigned),
      newLeads: comparisonValue(summary.data?.newLeads ?? cur.assigned, prev.assigned),
      touchRate: comparisonValue(touchRateCur, touchRatePrev),
      conversionRate: comparisonValue(convRateCur, convRatePrev),
      followUpCompletionRate: comparisonValue(fuRateCur, fuRatePrev),
      avgResponseTimeMinutes: summary.data?.avgResponseTimeMinutes ?? null,
    };
  }, [current.data, previous.data, summary.data]);

  return {
    kpis,
    isLoading: current.isLoading || previous.isLoading,
    summaryUnavailable: summary.isError,
  };
}

/** NEW BACKEND ENDPOINT REQUIRED: POST /leads/report/employee/:userId/remind */
export function useSendReminder() {
  return useMutation({
    mutationFn: (userId: string) => reportsService.sendReminder(userId),
  });
}

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

function scoreOf(touchRate: number, conversionRate: number, followUpRate: number): number {
  return Math.round(touchRate * 0.35 + conversionRate * 0.35 + followUpRate * 0.3);
}

/**
 * Builds the composite `EmployeePerformance[]` list used by the employee
 * cards / leaderboards section. Combines the existing /leads/report
 * (user-performance) endpoint with the existing /users directory and the
 * existing /leads/activity (per-actor) endpoint — no new backend endpoints
 * required for this aggregation. `weeklyActivity` is bucketed client-side
 * from the last 7 days of that user's activity feed.
 */
export function useEmployeePerformanceList(params: LeadReportParams) {
  const performance = useUserPerformance(params);
  const enhanced = useEnhancedEmployeePerformance(performance.data);

  return {
    data: enhanced.list,
    isLoading: performance.isLoading || enhanced.isLoading,
  };
}

export function useDailyEmployeePerformanceList(date?: string) {
  const today = useMemo(() => new Date(), []);
  const targetDate = date ?? today.toISOString().slice(0, 10);
  const range = useMemo(() => ({ dateFrom: targetDate, dateTo: targetDate }), [targetDate]);
  const performance = useQuery({
    queryKey: [KEY, "daily-user-performance", range],
    queryFn: () => reportsService.dailyUserPerformance(range),
    enabled: Boolean(range.dateFrom && range.dateTo),
    staleTime: 60_000,
  });
  const enhanced = useEnhancedEmployeePerformance(performance.data, { includeAllUsers: true });

  return {
    data: enhanced.list,
    isLoading: performance.isLoading || enhanced.isLoading,
  };
}

export function useEmployeeReport(userId: string | undefined, params: LeadReportParams) {
  return useQuery({
    queryKey: [KEY, "employee-report", userId, params],
    queryFn: () => reportsService.employeeReport({ ...params, userId: userId! }),
    enabled: !!userId,
  });
}

function useEnhancedEmployeePerformance(
  rows: UserPerformanceItem[] | undefined,
  options?: { includeAllUsers?: boolean },
) {
  const users = useQuery({ queryKey: ["users"], queryFn: () => usersService.list() });
  const days = useMemo(() => last7Days(), []);
  const includeAllUsers = options?.includeAllUsers ?? false;
  const userIds = useMemo(() => (rows ?? []).map((r) => r.userId), [rows]);
  const activityQueries = useQueries({
    queries: userIds.map((userId) => ({
      queryKey: [KEY, "employee-activity", userId, days[0]],
      queryFn: () => activityService.global({ actorId: userId, pageSize: 100, dateFrom: days[0] }),
      enabled: !!userId,
      staleTime: 60_000,
    })),
  });

  const list: EmployeePerformance[] = useMemo(() => {
    const userMap = new Map((users.data?.users ?? []).map((u) => [u.id, u]));
    const base = (rows ?? []).map((row, idx) => {
      const converted = row.converted ?? CONVERTED_LEAD_STATUSES.reduce((s, st) => s + (row.statusBreakdown?.[st] ?? 0), 0);
      const touchRate = row.assigned > 0 ? (row.touched / row.assigned) * 100 : 0;
      const conversionRate = row.assigned > 0 ? (converted / row.assigned) * 100 : 0;
      const fuTotal = row.followedUp + row.missedFollowUps;
      const followUpCompletionRate = fuTotal > 0 ? (row.followedUp / fuTotal) * 100 : 0;

      const activities = (activityQueries[idx]?.data?.data ?? []) as LeadActivity[];
      const countByDay = new Map(days.map((d) => [d, 0]));
      for (const a of activities) {
        const d = a.createdAt?.slice(0, 10);
        if (d && countByDay.has(d)) countByDay.set(d, (countByDay.get(d) ?? 0) + 1);
      }
      const weeklyActivity = days.map((d) => ({ date: d, count: countByDay.get(d) ?? 0 }));
      const recentActivity = [...activities].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 10);

      const user = userMap.get(row.userId);

      return {
        ...row,
        role: user?.role,
        department: user?.department,
        designation: user?.designation,
        profilePhoto: user?.profilePhoto,
        touchRate,
        conversionRate,
        followUpCompletionRate,
        performanceScore: scoreOf(touchRate, conversionRate, followUpCompletionRate),
        weeklyActivity,
        recentActivity,
      };
    });

    if (!includeAllUsers) return base;

    const byId = new Map(base.map((item) => [item.userId, item]));
    const fallback = [...(users.data?.users ?? [])]
      .filter((user) => !byId.has(user.id))
      .map((user) => ({
        userId: user.id,
        fullName: user.fullName,
        assigned: 0,
        touched: 0,
        untouched: 0,
        followedUp: 0,
        missedFollowUps: 0,
        statusBreakdown: {},
        lastActivityAt: undefined,
        converted: 0,
        role: user.role,
        department: user.department,
        designation: user.designation,
        profilePhoto: user.profilePhoto,
        touchRate: 0,
        conversionRate: 0,
        followUpCompletionRate: 0,
        performanceScore: 0,
        weeklyActivity: days.map((d) => ({ date: d, count: 0 })),
        recentActivity: [],
      }));

    return [...base, ...fallback];
  }, [rows, users.data, activityQueries, days, includeAllUsers]);

  const activitiesLoading = activityQueries.some((q) => q.isLoading);
  return {
    list,
    isLoading: users.isLoading || activitiesLoading,
  };
}

export type { LeadActivity };
