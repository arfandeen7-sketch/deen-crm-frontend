"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { UserAvatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useEmployeeTodos } from "@/hooks/useTodos";
import type { EmployeeTodoGroup, Todo, TodoPriority } from "@/types";

const PRIORITY_STYLES: Record<TodoPriority, string> = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-sky-100 text-sky-700",
  no_priority: "bg-zinc-100 text-zinc-500",
};

const PRIORITY_LABELS: Record<TodoPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  no_priority: "No priority",
};

export function EmployeeTodosWidget() {
  const { data: groups = [], isLoading } = useEmployeeTodos();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggle(userId: string) {
    setExpanded((prev) => ({ ...prev, [userId]: !prev[userId] }));
  }

  return (
    <div className="flex flex-col h-full min-h-[340px]">
      <div>
        <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary">
          Employee Todos
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Open tasks across the team
        </p>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto max-h-[520px] space-y-2">
        {isLoading ? (
          <LoadingState />
        ) : groups.length === 0 ? (
          <div className="h-full flex items-center justify-center py-8">
            <EmptyState
              title="No employees"
              message="Active employees will appear here once they are added."
            />
          </div>
        ) : (
          groups.map((group) => (
            <EmployeeTodoCard
              key={group.user.id}
              group={group}
              open={expanded[group.user.id] ?? false}
              onToggle={() => toggle(group.user.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function EmployeeTodoCard({
  group,
  open,
  onToggle,
}: {
  group: EmployeeTodoGroup;
  open: boolean;
  onToggle: () => void;
}) {
  const { user, todos, openCount, doneCount } = group;

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-zinc-50/70 transition-colors"
      >
        <span className="text-zinc-400 shrink-0">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        <UserAvatar name={user.fullName} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-zinc-800 font-secondary truncate">
            {user.fullName}
          </p>
          <p className="text-[11px] text-zinc-400 truncate">
            {[user.designation, user.department].filter(Boolean).join(" · ") || user.role.replace(/_/g, " ")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[11px] font-semibold">
          <span className="text-zinc-600">{openCount} open</span>
          <span className="text-zinc-300">·</span>
          <span className="text-emerald-600">{doneCount} done</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-3.5 pb-2">
          {todos.length === 0 ? (
            <p className="py-3 text-xs text-zinc-400">No tasks yet</p>
          ) : (
            <ul className="divide-y divide-zinc-50">
              {todos.map((todo) => (
                <EmployeeTodoRow key={todo.id} todo={todo} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function EmployeeTodoRow({ todo }: { todo: Todo }) {
  return (
    <li className="flex items-center gap-2.5 py-2.5">
      {todo.isDone ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-zinc-300 shrink-0" />
      )}
      <span
        className={cn(
          "min-w-0 flex-1 text-sm font-medium text-zinc-800 truncate",
          todo.isDone && "line-through text-zinc-400",
        )}
      >
        {todo.title}
      </span>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          PRIORITY_STYLES[todo.priority],
        )}
      >
        {PRIORITY_LABELS[todo.priority]}
      </span>
    </li>
  );
}
