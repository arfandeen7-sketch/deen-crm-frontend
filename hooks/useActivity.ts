"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { activityService } from "@/services/activity/activity.service";
import type { ActivityListParams } from "@/types";

const KEY = "activity";

export function useActivityFeed(params: Omit<ActivityListParams, "cursor">) {
  return useInfiniteQuery({
    queryKey: [KEY, "feed", params],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      activityService.list({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
    refetchInterval: 10_000,
  });
}

export function useActivityFiltersMeta() {
  return useQuery({
    queryKey: [KEY, "filters-meta"],
    queryFn: () => activityService.filterMeta(),
    staleTime: 5 * 60 * 1000,
  });
}
