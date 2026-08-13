"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { todosService } from "@/services/todos/todos.service";
import type { CreateTodoInput, UpdateTodoInput, Todo } from "@/types";
import { useQueryEnabled, retrySkipAuth } from "@/lib/query-gate";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api/client";
import { toast } from "sonner";

const MINE_KEY = ["todos", "mine"] as const;
const EMPLOYEES_KEY = ["todos", "employees"] as const;

export function useMyTodos() {
  const enabled = useQueryEnabled("todos:mine");
  return useQuery({
    queryKey: MINE_KEY,
    queryFn: () => todosService.listMine(),
    enabled,
    retry: retrySkipAuth,
  });
}

export function useEmployeeTodos() {
  const { isMaster } = useAuth();
  const enabled = useQueryEnabled("todos:employees") && isMaster;
  return useQuery({
    queryKey: EMPLOYEES_KEY,
    queryFn: () => todosService.listEmployees(),
    enabled,
    retry: retrySkipAuth,
  });
}

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTodoInput) => todosService.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: MINE_KEY });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTodoInput }) =>
      todosService.update(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: MINE_KEY });
      const previous = qc.getQueryData<Todo[]>(MINE_KEY);
      if (previous) {
        qc.setQueryData<Todo[]>(
          MINE_KEY,
          previous.map((t) => (t.id === id ? { ...t, ...input } : t)),
        );
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(MINE_KEY, ctx.previous);
      toast.error(getErrorMessage(err));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: MINE_KEY });
    },
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => todosService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: MINE_KEY });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useReorderTodos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => todosService.reorder(orderedIds),
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: MINE_KEY });
      const previous = qc.getQueryData<Todo[]>(MINE_KEY);
      if (previous) {
        const byId = new Map(previous.map((t) => [t.id, t]));
        const next = orderedIds
          .map((id, index) => {
            const todo = byId.get(id);
            return todo ? { ...todo, sortOrder: index } : null;
          })
          .filter((t): t is Todo => t !== null);
        qc.setQueryData<Todo[]>(MINE_KEY, next);
      }
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(MINE_KEY, ctx.previous);
      toast.error(getErrorMessage(err));
    },
    onSuccess: (data) => {
      qc.setQueryData(MINE_KEY, data);
    },
  });
}
