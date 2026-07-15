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
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Team Leader
          </p>
          <div className="flex items-center gap-3 rounded-[6px] border border-border bg-panel p-3">
            <UserAvatar name={team.fullName} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{team.fullName}</p>
              <p className="text-xs text-foreground-muted truncate">{team.email}</p>
            </div>
            <Badge className="shrink-0 bg-background text-foreground-secondary">
              <Crown className="mr-1 inline h-3 w-3" />Manager
            </Badge>
          </div>
        </div>

        {/* ── Current Members ───────────────────────────────── */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Team Members
            </p>
            <span className="rounded-full bg-panel px-2 py-0.5 text-xs font-medium text-foreground-secondary">
              {team.teamMembers.length}
            </span>
          </div>

          {team.teamMembers.length === 0 ? (
            <div className="rounded-[6px] border border-dashed border-border bg-panel px-4 py-6 text-center">
              <UserPlus className="mx-auto mb-2 h-7 w-7 text-foreground-disabled" />
              <p className="text-sm text-foreground-muted">
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
                    className={`flex items-center gap-3 rounded-[6px] border p-3 transition-all ${
                      marked
                        ? "border-foreground/30 bg-panel"
                        : "border-border bg-background"
                    }`}
                  >
                    <UserAvatar name={member.fullName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {member.fullName}
                      </p>
                      <p className="text-xs text-foreground-muted truncate">
                        {member.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRemove(member.id)}
                      disabled={loading}
                      className={`flex shrink-0 items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                        marked
                          ? "bg-foreground text-white hover:bg-foreground/90"
                          : "bg-panel text-foreground-secondary hover:bg-foreground hover:text-white"
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
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                Add Executives
              </p>
              <span className="rounded-full bg-panel px-2 py-0.5 text-xs font-medium text-foreground-secondary">
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
                    className={`flex w-full items-center gap-3 rounded-[6px] border p-3 text-left transition-all disabled:opacity-50 ${
                      selected
                        ? "border-foreground bg-panel"
                        : "border-border bg-background hover:bg-panel"
                    }`}
                  >
                    <UserAvatar name={exec.fullName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {exec.fullName}
                      </p>
                      <p className="text-xs text-foreground-muted truncate">{exec.email}</p>
                    </div>
                    {selected ? (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 shrink-0 rounded-full border-2 border-border" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {addableExecutives.length === 0 && (
          <p className="rounded-[6px] bg-panel px-4 py-3 text-xs text-foreground-muted">
            No unassigned executives available to add to this team.
          </p>
        )}

        {/* ── Pending-changes summary ───────────────────────── */}
        {hasChanges && (
          <div className="rounded-[6px] border border-border bg-panel p-3 text-xs text-foreground-secondary">
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
