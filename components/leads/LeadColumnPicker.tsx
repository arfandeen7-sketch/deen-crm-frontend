"use client";

import { useRef, useState, type DragEvent } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnPickerItem {
  key: string;
  label: string;
  visible: boolean;
}

export function LeadColumnPicker({
  items,
  onToggle,
  onReorder,
}: {
  items: ColumnPickerItem[];
  onToggle: (key: string) => void;
  onReorder: (keys: string[]) => void;
}) {
  const dragKey = useRef<string | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const visibleCount = items.filter((i) => i.visible).length;

  function onDragStart(e: DragEvent, key: string) {
    dragKey.current = key;
    setDraggingKey(key);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", key);
  }

  function onDragOver(e: DragEvent, key: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overKey !== key) setOverKey(key);
  }

  function onDrop(e: DragEvent, targetKey: string) {
    e.preventDefault();
    const sourceKey = dragKey.current ?? e.dataTransfer.getData("text/plain");
    setDraggingKey(null);
    setOverKey(null);
    dragKey.current = null;
    if (!sourceKey || sourceKey === targetKey) return;

    const keys = items.map((i) => i.key);
    const from = keys.indexOf(sourceKey);
    const to = keys.indexOf(targetKey);
    if (from < 0 || to < 0) return;

    const next = [...keys];
    next.splice(from, 1);
    next.splice(to, 0, sourceKey);
    onReorder(next);
  }

  function onDragEnd() {
    dragKey.current = null;
    setDraggingKey(null);
    setOverKey(null);
  }

  return (
    <ul className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <ColumnPickerRow
          key={item.key}
          item={item}
          lastVisible={item.visible && visibleCount <= 1}
          isDragging={draggingKey === item.key}
          isOver={overKey === item.key && draggingKey !== item.key}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
          onToggle={() => onToggle(item.key)}
        />
      ))}
    </ul>
  );
}

function ColumnPickerRow({
  item,
  lastVisible,
  isDragging,
  isOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onToggle,
}: {
  item: ColumnPickerItem;
  lastVisible: boolean;
  isDragging: boolean;
  isOver: boolean;
  onDragStart: (e: DragEvent, key: string) => void;
  onDragOver: (e: DragEvent, key: string) => void;
  onDrop: (e: DragEvent, targetKey: string) => void;
  onDragEnd: () => void;
  onToggle: () => void;
}) {
  const [canDrag, setCanDrag] = useState(false);

  return (
    <li
      draggable={canDrag}
      onDragStart={(e) => onDragStart(e, item.key)}
      onDragOver={(e) => onDragOver(e, item.key)}
      onDrop={(e) => onDrop(e, item.key)}
      onDragEnd={() => {
        setCanDrag(false);
        onDragEnd();
      }}
      className={cn(
        "flex h-10 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-sm shadow-2xs transition-colors",
        isDragging && "opacity-40",
        isOver && "border-indigo-300 bg-indigo-50",
        !item.visible && "bg-neutral-50 text-neutral-500",
      )}
    >
      <span
        role="button"
        className="cursor-grab touch-none text-neutral-300 hover:text-neutral-500 active:cursor-grabbing"
        aria-label={`Reorder ${item.label}`}
        tabIndex={0}
        onMouseDown={() => setCanDrag(true)}
        onTouchStart={() => setCanDrag(true)}
      >
        <GripVertical className="h-4 w-4" />
      </span>
      <label className="flex cursor-pointer items-center gap-1.5">
        <input
          type="checkbox"
          checked={item.visible}
          disabled={lastVisible}
          onChange={onToggle}
          className="h-4 w-4 rounded border-neutral-300 bg-white text-black accent-black focus:ring-black"
        />
        <span className={cn("whitespace-nowrap font-medium", item.visible ? "text-neutral-800" : "text-neutral-500")}>{item.label}</span>
      </label>
    </li>
  );
}
