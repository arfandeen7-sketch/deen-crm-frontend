"use client";

import { Select } from "@/components/ui/Input";
import type { LeaveTypeConfig } from "@/types";

interface LeaveTypeSelectProps {
  types: LeaveTypeConfig[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function LeaveTypeSelect({ types, value, onChange, placeholder = "Select leave type" }: LeaveTypeSelectProps) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {types.map((t) => (
        <option key={t.code} value={t.code}>
          {t.name}
        </option>
      ))}
    </Select>
  );
}
