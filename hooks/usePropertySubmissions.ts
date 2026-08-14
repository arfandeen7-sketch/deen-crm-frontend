import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import {
  propertySubmissionsService,
  type PropertySubmissionListParams,
  type PropertySubmissionStatus,
} from "@/services/properties/propertySubmissions.service";

const SUBMISSIONS_KEY = "property-submissions";

export function usePropertySubmissionsList(params: PropertySubmissionListParams = {}) {
  const enabled = useQueryEnabled("property-submissions-list");
  return useQuery({
    queryKey: [SUBMISSIONS_KEY, "list", params],
    queryFn: () => propertySubmissionsService.list(params),
    enabled,
    retry: retrySkipAuth,
  });
}

export function usePropertySubmission(id: string) {
  const enabled = useQueryEnabled("property-submission-detail");
  return useQuery({
    queryKey: [SUBMISSIONS_KEY, "detail", id],
    queryFn: () => propertySubmissionsService.get(id),
    enabled: enabled && !!id,
    retry: retrySkipAuth,
  });
}

export function usePropertySubmissionMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (payload: Record<string, unknown>) => propertySubmissionsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBMISSIONS_KEY] });
    },
  });

  const review = useMutation({
    mutationFn: ({
      id,
      status,
      reviewNote,
    }: {
      id: string;
      status: "approved" | "rejected";
      reviewNote?: string;
    }) => propertySubmissionsService.review(id, status, reviewNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBMISSIONS_KEY] });
    },
  });

  const withdraw = useMutation({
    mutationFn: (id: string) => propertySubmissionsService.withdraw(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBMISSIONS_KEY] });
    },
  });

  return { create, review, withdraw };
}
