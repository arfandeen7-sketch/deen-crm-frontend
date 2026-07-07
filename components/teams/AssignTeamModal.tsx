"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/Avatar";
import type { User } from "@/types";

interface AssignTeamModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (managerId: string, executiveIds: string[]) => void;
  managers: Pick<User, "id" | "fullName" | "email">[];
  executives: Pick<User, "id" | "fullName" | "email">[];
  loading?: boolean;
  preselectedExecutive?: Pick<User, "id" | "fullName" | "email">;
}

export function AssignTeamModal({
  open,
  onClose,
  onConfirm,
  managers,
  executives,
  loading,
  preselectedExecutive,
}: AssignTeamModalProps) {
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [selectedExecutives, setSelectedExecutives] = useState<string[]>(
    preselectedExecutive ? [preselectedExecutive.id] : []
  );

  const handleConfirm = () => {
    if (selectedManager && selectedExecutives.length > 0) {
      onConfirm(selectedManager, selectedExecutives);
    }
  };

  const toggleExecutive = (id: string) => {
    setSelectedExecutives((prev) =>
      prev.includes(id) ? prev.filter((eid) => eid !== id) : [...prev, id]
    );
  };

  const handleClose = () => {
    setSelectedManager("");
    setSelectedExecutives(preselectedExecutive ? [preselectedExecutive.id] : []);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Assign Executives to Manager"
      description="Select a manager and executives to assign"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            loading={loading}
            disabled={!selectedManager || selectedExecutives.length === 0}
          >
            Assign {selectedExecutives.length > 0 && `(${selectedExecutives.length})`}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Select Manager
          </label>
          <div className="space-y-2">
            {managers.map((manager) => (
              <button
                key={manager.id}
                onClick={() => setSelectedManager(manager.id)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  selectedManager === manager.id
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <UserAvatar name={manager.fullName} size="sm" />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{manager.fullName}</p>
                  <p className="text-xs text-slate-500">{manager.email}</p>
                </div>
                {selectedManager === manager.id && (
                  <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Select Executives ({selectedExecutives.length} selected)
          </label>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {executives.map((exec) => (
              <button
                key={exec.id}
                onClick={() => toggleExecutive(exec.id)}
                disabled={preselectedExecutive?.id === exec.id}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  selectedExecutives.includes(exec.id)
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                } ${preselectedExecutive?.id === exec.id ? "opacity-50" : ""}`}
              >
                <UserAvatar name={exec.fullName} size="sm" />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{exec.fullName}</p>
                  <p className="text-xs text-slate-500">{exec.email}</p>
                </div>
                {selectedExecutives.includes(exec.id) && (
                  <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
