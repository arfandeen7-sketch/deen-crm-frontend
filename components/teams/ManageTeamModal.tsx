"use client";

import { useState, useEffect } from "react";
import { UserMinus, UserPlus, Check, Crown } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { TeamOverview, User } from "@/types";

interface ManageTeamModalProps {
  open: boolean;
  onClose: () => void;
  team: TeamOverview | null;
  unassignedExecutives: Pick<User, "id" | "fullName" | "email">[];
  onSave: (removeIds: string[], addIds: string[]) => Promise<void>;
  loading?: boolean;
}

export function ManageTeamModal({
  open,
  onClose,
  team,
  unassignedExecutives,
  onSave,
  loading,
}: ManageTeamModalProps) {
  const [toRemove, setToRemove] = useState<string[]>([]);
  const [toAdd, setToAdd] = useState<string[]>([]);

  // Reset selection state whenever the modal is opened or the team changes so
  // stale remove/add lists from a previous session are never carried over.
  useEffect(() => {
    if (open) {
      setToRemove([]);
      setToAdd([]);
    }
  }, [open, team?.id]);

  function handleClose() {
    setToRemove([]);
    setToAdd([]);
    onClose();
  }

  async function handleConfirm() {
    if (!team) return;
    await onSave(toRemove, toAdd);
    setToRemove([]);
    setToAdd([]);
  }

  function toggleRemove(id: string) {
    setToRemove((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAdd(id: string) {
    setToAdd((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const hasChanges = toRemove.length > 0 || toAdd.length > 0;

  // Executives eligible to add: exclude the manager and anyone already on the team.
  const currentMemberIds = new Set(team?.teamMembers.map((m) => m.id) ?? []);
  const addableExecutives = unassignedExecutives.filter(
    (e) => e.id !== team?.id && !currentMemberIds.has(e.id)
  );

  if (!team) return null;

  const saveLabel = (() => {
    const parts: string[] = [];
    if (toRemove.length > 0) parts.push(`-${toRemove.length}`);
    if (toAdd.length > 0) parts.push(`+${toAdd.length}`);
    return parts.length > 0 ? `Save Changes (${parts.join(" ")})` : "Save Changes";
  })();

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Manage Team — ${team.fullName}`}
      description={`${team.teamMembers.length} member${team.teamMembers.length !== 1 ? "s" : ""} · ${team.stats.totalLeads} total leads`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} loading={loading} disabled={!hasChanges || loading}>
            {saveLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-5">

        {/* ── Team Leader ───────────────────────────────────── */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Team Leader
          </p>
          <div className="flex items-center gap-3 rounded-lg border border-violet-200 bg-violet-50 p-3">
            <UserAvatar name={team.fullName} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900">{team.fullName}</p>
              <p className="text-xs text-slate-500 truncate">{team.email}</p>
            </div>
            <Badge className="shrink-0 bg-violet-100 text-violet-700 ring-violet-600/20">
              <Crown className="mr-1 inline h-3 w-3" />Manager
            </Badge>
          </div>
        </div>

        {/* ── Current Members ───────────────────────────────── */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Team Members
            </p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {team.teamMembers.length}
            </span>
          </div>

          {team.teamMembers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
              <UserPlus className="mx-auto mb-2 h-7 w-7 text-slate-300" />
              <p className="text-sm text-slate-400">
                No members assigned yet — add executives below.
              </p>
            </div>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {team.teamMembers.map((member) => {
                const marked = toRemove.includes(member.id);
                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                      marked
                        ? "border-rose-300 bg-rose-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <UserAvatar name={member.fullName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {member.fullName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {member.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRemove(member.id)}
                      disabled={loading}
                      className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                        marked
                          ? "bg-rose-200 text-rose-700 hover:bg-rose-300"
                          : "bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600"
                      }`}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                      {marked ? "Undo" : "Remove"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Add Executives ────────────────────────────────── */}
        {addableExecutives.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Add Executives
              </p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {addableExecutives.length} unassigned
              </span>
            </div>
            <div className="max-h-52 space-y-2 overflow-y-auto">
              {addableExecutives.map((exec) => {
                const selected = toAdd.includes(exec.id);
                return (
                  <button
                    key={exec.id}
                    type="button"
                    disabled={loading}
                    onClick={() => toggleAdd(exec.id)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all disabled:opacity-50 ${
                      selected
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <UserAvatar name={exec.fullName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {exec.fullName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{exec.email}</p>
                    </div>
                    {selected ? (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-200" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {addableExecutives.length === 0 && (
          <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-400">
            No unassigned executives available to add to this team.
          </p>
        )}

        {/* ── Pending-changes summary ───────────────────────── */}
        {hasChanges && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            {toRemove.length > 0 && (
              <span>
                {toRemove.length} member{toRemove.length > 1 ? "s" : ""} will be removed.{" "}
              </span>
            )}
            {toAdd.length > 0 && (
              <span>
                {toAdd.length} executive{toAdd.length > 1 ? "s" : ""} will be added.
              </span>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
