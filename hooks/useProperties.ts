"use client";

import { useQuery } from "@tanstack/react-query";
import { propertiesService, type PropertyQueryParams } from "@/services/properties/properties.service";

const KEY = "properties";

export function usePropertiesList(params: PropertyQueryParams) {
  return useQuery({
    queryKey: [KEY, "list", params],
    queryFn: () => propertiesService.list(params),
    retry: 1,
  });
}

export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => propertiesService.get(id as string),
    enabled: !!id,
    retry: 1,
  });
}
