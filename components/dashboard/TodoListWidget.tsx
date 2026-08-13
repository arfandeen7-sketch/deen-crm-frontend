"use client";

import { useState, useRef, type DragEvent, type FormEvent, type KeyboardEvent } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  useMyTodos,
  useCreateTodo,
  useUpdateTodo,
  useDeleteTodo,
  useReorderTodos,
} from "@/hooks/useTodos";
import type { Todo, TodoPriority } from "@/types";

const PRIORITY_OPTIONS: { value: TodoPriority | ""; label: string }[] = [
  { value: "", label: "No priority" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

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

function PriorityBadge({ priority }: { priority: TodoPriority }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        PRIORITY_STYLES[priority],
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function TodoListWidget() {
  const { data: todos = [], isLoading } = useMyTodos();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const reorderTodos = useReorderTodos();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TodoPriority | "">("");
  const dragId = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function handleAdd(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || createTodo.isPending) return;

    createTodo.mutate(
      {
        title: trimmed,
        priority: priority || "no_priority",
      },
      {
        onSuccess: () => {
          setTitle("");
          setPriority("");
        },
      },
    );
  }

  function onDragStart(e: DragEvent, id: string) {
    dragId.current = id;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }

  function onDragOver(e: DragEvent, id: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overId !== id) setOverId(id);
  }

  function onDrop(e: DragEvent, targetId: string) {
    e.preventDefault();
    const sourceId = dragId.current ?? e.dataTransfer.getData("text/plain");
    setDraggingId(null);
    setOverId(null);
    dragId.current = null;
    if (!sourceId || sourceId === targetId) return;

    const ids = todos.map((t) => t.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;

    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, sourceId);
    reorderTodos.mutate(next);
  }

  function onDragEnd() {
    dragId.current = null;
    setDraggingId(null);
    setOverId(null);
  }

  function onTitleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="flex flex-col h-full min-h-[340px]">
      <div>
        <h3 className="text-2xl font-bold text-zinc-900 tracking-tight font-secondary">My Todos</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Add tasks, set priority, and drag to reorder
        </p>
      </div>

      <form onSubmit={handleAdd} className="mt-4 flex flex-col sm:flex-row gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={onTitleKeyDown}
          placeholder="Add a task…"
          className="flex-1"
          maxLength={500}
        />
        <Select
          value={priority}
          onChange={(e) => setPriority((e.target.value || "") as TodoPriority | "")}
          placeholder="No priority"
          className="sm:w-40"
        >
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value || "none"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Button
          type="submit"
          size="md"
          loading={createTodo.isPending}
          disabled={!title.trim()}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </form>

      <div className="mt-4 flex-1 divide-y divide-zinc-100 overflow-y-auto max-h-[420px]">
        {isLoading ? (
          <LoadingState />
        ) : todos.length === 0 ? (
          <div className="h-full flex items-center justify-center py-8">
            <EmptyState title="No tasks yet" message="Add your first todo to get started." />
          </div>
        ) : (
          todos.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              isDragging={draggingId === todo.id}
              isOver={overId === todo.id && draggingId !== todo.id}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              onToggleDone={() =>
                updateTodo.mutate({ id: todo.id, input: { isDone: !todo.isDone } })
              }
              onDelete={() => deleteTodo.mutate(todo.id)}
              deleting={deleteTodo.isPending && deleteTodo.variables === todo.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TodoRow({
  todo,
  isDragging,
  isOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onToggleDone,
  onDelete,
  deleting,
}: {
  todo: Todo;
  isDragging: boolean;
  isOver: boolean;
  onDragStart: (e: DragEvent, id: string) => void;
  onDragOver: (e: DragEvent, id: string) => void;
  onDrop: (e: DragEvent, id: string) => void;
  onDragEnd: () => void;
  onToggleDone: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [canDrag, setCanDrag] = useState(false);

  return (
    <div
      draggable={canDrag}
      onDragStart={(e) => onDragStart(e, todo.id)}
      onDragOver={(e) => onDragOver(e, todo.id)}
      onDrop={(e) => onDrop(e, todo.id)}
      onDragEnd={() => {
        setCanDrag(false);
        onDragEnd();
      }}
      className={cn(
        "flex items-center gap-2.5 py-3.5 first:pt-2 last:pb-0 group transition-colors",
        isDragging && "opacity-40",
        isOver && "bg-zinc-50/80",
      )}
    >
      <span
        role="button"
        className="cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 shrink-0 touch-none"
        aria-label="Drag to reorder"
        tabIndex={0}
        onMouseDown={() => setCanDrag(true)}
        onTouchStart={() => setCanDrag(true)}
      >
        <GripVertical className="h-4 w-4" />
      </span>

      <label className="flex items-center shrink-0 cursor-pointer">
        <input
          type="checkbox"
          checked={todo.isDone}
          onChange={onToggleDone}
          className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black cursor-pointer"
        />
      </label>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold text-zinc-900 truncate font-secondary",
            todo.isDone && "line-through text-zinc-400 font-medium",
          )}
        >
          {todo.title}
        </p>
      </div>

      <PriorityBadge priority={todo.priority} />

      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-zinc-300 hover:text-rose-600 transition-all shrink-0 p-1 rounded-md hover:bg-rose-50 disabled:opacity-50"
        aria-label="Delete task"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
