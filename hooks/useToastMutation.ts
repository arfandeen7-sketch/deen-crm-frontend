"use client";

import { useMutation, type UseMutationOptions, type UseMutationResult } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/services/api/client";

/**
 * Options for `useToastMutation`.
 *
 * - `successMessage`: toast shown on success. Pass `false` to suppress (e.g. for
 *   downloads where the file appearing IS the feedback, or when the call site
 *   supplies a dynamic message via the returned `onSuccess` override).
 * - `errorMessage`: toast shown on error. Pass `false` to suppress. Defaults to
 *   the normalised API error message.
 * - `invalidateKeys`: query keys to invalidate on success. Replaces the common
 *   `onSuccess: () => qc.invalidateQueries(...)` boilerplate.
 *
 * Any `onSuccess` / `onError` passed via `options` run AFTER the toast + invalidation,
 * so call sites can still perform navigation, close modals, or override the toast
 * message by returning a custom handler.
 */
export interface ToastMutationOptions<TData, TError, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, "onSuccess" | "onError"> {
  successMessage?: string | false;
  errorMessage?: string | false;
  invalidateKeys?: unknown[][];
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;
}

/**
 * A `useMutation` wrapper that standardises success/error toast feedback and
 * query invalidation across the app.
 *
 * Every mutation gets:
 *   - `toast.success(successMessage)` on success (unless `successMessage: false`)
 *   - `toast.error(getErrorMessage(err))` on error (unless `errorMessage: false`)
 *   - automatic invalidation of any `invalidateKeys`
 *
 * Call-site `onSuccess` / `onError` handlers still run afterwards, so pages can
 * close modals, redirect, etc. without re-implementing toasts.
 */
export function useToastMutation<TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: ToastMutationOptions<TData, TError, TVariables, TContext> = {},
): UseMutationResult<TData, TError, TVariables, TContext> {
  const qc = useQueryClient();
  const {
    successMessage,
    errorMessage,
    invalidateKeys,
    onSuccess,
    onError,
    ...rest
  } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    ...rest,
    onSuccess: (data, variables, context) => {
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
      }
      if (successMessage !== false) {
        toast.success(successMessage ?? "Saved");
      }
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      if (errorMessage !== false) {
        toast.error(errorMessage ?? getErrorMessage(error));
      }
      onError?.(error, variables, context);
    },
  });
}
