"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useLeadDetailHref } from "@/hooks/useLeadReturn";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Eye,
  Tag,
  MessageSquare,
  Calendar,
  CheckCircle2,
  UserCheck,
  UserX,
  Phone,
  MessageCircle,
  Mail,
} from "lucide-react";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea, Input } from "@/components/ui/Input";
import { useLeadMutations } from "@/hooks/useLeads";
import { useAssignableUsers } from "@/hooks/useUsers";
import { useFieldOptions } from "@/hooks/useDynamicFields";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api/client";
import { alreadyAssignedMessage, alreadyAssignedMessageFromError } from "@/lib/alreadyAssigned";
import { toDatetimeLocal, isEmptyDisplayValue } from "@/lib/utils";
import type { Lead } from "@/types";

type ActiveModal = "status" | "comment" | "followup" | "assign" | "unassign" | null;

type MenuPosition = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
};

const MENU_WIDTH = 192;
const MENU_GAP = 4;
const VIEWPORT_PAD = 8;

/** Fixed position so the menu escapes the table's overflow clipping. */
function computeMenuPosition(trigger: DOMRect): MenuPosition {
  const width = Math.max(0, Math.min(MENU_WIDTH, window.innerWidth - VIEWPORT_PAD * 2));
  const left = Math.min(
    Math.max(VIEWPORT_PAD, trigger.right - width),
    Math.max(VIEWPORT_PAD, window.innerWidth - width - VIEWPORT_PAD),
  );
  const spaceBelow = window.innerHeight - trigger.bottom - MENU_GAP - VIEWPORT_PAD;
  const spaceAbove = trigger.top - MENU_GAP - VIEWPORT_PAD;
  const openUpward = spaceBelow < 240 && spaceAbove > spaceBelow;
  const maxHeight = Math.max(0, openUpward ? spaceAbove : spaceBelow);

  if (openUpward) {
    return {
      bottom: window.innerHeight - trigger.top + MENU_GAP,
      left,
      width,
      maxHeight,
    };
  }

  return {
    top: trigger.bottom + MENU_GAP,
    left,
    width,
    maxHeight,
  };
}

export function LeadQuickActions({ lead, locked = false }: { lead: Lead; locked?: boolean }) {
  const detailHref = useLeadDetailHref();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const [active, setActive] = useState<ActiveModal>(null);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { canAction } = useAuth();
  const { update, bulkAssign } = useLeadMutations();
  const { users } = useAssignableUsers();
  const statuses = useFieldOptions("lead_status");

  const [status, setStatus] = useState(lead.leadStatus);
  const [comment, setComment] = useState("");
  const [followUpDate, setFollowUpDate] = useState(toDatetimeLocal(lead.followUpDate));
  const [followUpNote, setFollowUpNote] = useState(lead.followUpNote ?? "");
  const [assignTo, setAssignTo] = useState(lead.assignedTo ?? "");
  const [reassignAlert, setReassignAlert] = useState<string | null>(null);

  // Close other dropdowns when this one opens (one-at-a-time)
  useEffect(() => {
    if (!open) return;
    window.dispatchEvent(new CustomEvent("lead-dropdown-open", { detail: { id: lead.id } }));
  }, [open, lead.id]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.id !== lead.id) setOpen(false);
    };
    window.addEventListener("lead-dropdown-open", handler);
    return () => window.removeEventListener("lead-dropdown-open", handler);
  }, [lead.id]);

  // Click outside to close. The menu is portaled, so it is not inside the trigger ref.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const updateMenuPosition = () => {
    const trigger = buttonRef.current;
    if (!trigger) return;
    setMenuPos(computeMenuPosition(trigger.getBoundingClientRect()));
  };

  // Position against the viewport so the table's overflow cannot clip the menu.
  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = (event: Event) => {
      // Scrolling inside the menu must not reposition it or reset its scroll offset.
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return;
      updateMenuPosition();
    };
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  function openModal(m: ActiveModal) {
    setOpen(false);
    if (m === "followup") {
      setFollowUpDate(toDatetimeLocal(lead.followUpDate));
      setFollowUpNote(lead.followUpNote ?? "");
    }
    setActive(m);
  }
  function closeModal() {
    setActive(null);
    setComment("");
    setFollowUpNote(lead.followUpNote ?? "");
    setReassignAlert(null);
  }

  async function handleStatus() {
    try {
      await update.mutateAsync({ id: lead.id, body: { leadStatus: status } });
      toast.success("Status updated");
      closeModal();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  async function handleComment() {
    if (!comment.trim()) return toast.error("Comment cannot be empty");
    try {
      await update.mutateAsync({ id: lead.id, body: { comments: comment.trim() } });
      toast.success("Comment saved");
      closeModal();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  async function handleFollowUp() {
    try {
      await update.mutateAsync({
        id: lead.id,
        body: {
          followUpDate: followUpDate || undefined,
          followUpNote: followUpNote.trim() || null,
        },
      });
      toast.success("Follow-up scheduled");
      closeModal();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  async function handleMarkFollowUpDone() {
    try {
      await update.mutateAsync({
        id: lead.id,
        body: { followUpDate: null, followUpNote: null },
      });
      toast.success("Follow-up marked as done");
      setOpen(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  async function handleAssign(confirmReassign = false) {
    if (!assignTo) return toast.error("Select a user");
    const alreadyAssigned = Boolean(lead.assignedTo && lead.assignedTo !== assignTo);
    if (!confirmReassign && alreadyAssigned) {
      const message = alreadyAssignedMessage([{
        assignedToName: lead.assignedUser?.fullName || "another user",
      }]);
      if (!canAction("leads", "all_leads", "assign") && !canAction("leads", "all_leads", "bulk_assign")) {
        toast.error(message);
        return;
      }
      setReassignAlert(message);
      return;
    }
    try {
      await bulkAssign.mutateAsync({
        ids: [lead.id],
        assignedTo: assignTo,
        confirmReassign,
      });
      toast.success("Lead assigned");
      closeModal();
    } catch (e) {
      const alert = alreadyAssignedMessageFromError(e);
      if (alert && (canAction("leads", "all_leads", "assign") || canAction("leads", "all_leads", "bulk_assign"))) {
        setReassignAlert(alert);
        return;
      }
      toast.error(alert ?? getErrorMessage(e));
    }
  }

  async function handleUnassign() {
    try {
      await update.mutateAsync({ id: lead.id, body: { assignedTo: null } });
      toast.success("Lead unassigned");
      closeModal();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  const hasPhone = !isEmptyDisplayValue(lead.mobileNumber);
  const normalizedPhone = hasPhone ? lead.mobileNumber.replace(/\D/g, "") : "";

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="rounded p-1.5 text-slate-400 hover:text-slate-700"
        aria-label="Quick actions"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && menuPos && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: "fixed",
            top: menuPos.top,
            bottom: menuPos.bottom,
            left: menuPos.left,
            width: menuPos.width,
            maxHeight: menuPos.maxHeight,
            zIndex: 50,
          }}
          className="overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Link
            href={detailHref(lead.id)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Eye className="h-4 w-4 text-slate-400" /> View Details
          </Link>
          {!locked && (
          <button
            onClick={() => openModal("status")}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Tag className="h-4 w-4 text-slate-400" /> Update Status
          </button>
          )}
          {!locked && (
          <button
            onClick={() => openModal("comment")}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <MessageSquare className="h-4 w-4 text-slate-400" /> Add Comment
          </button>
          )}
          {!locked && (
          <button
            onClick={() => openModal("followup")}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Calendar className="h-4 w-4 text-slate-400" /> Schedule Follow-Up
          </button>
          )}
          {!locked && lead.followUpDate && (
            <button
              onClick={handleMarkFollowUpDone}
              disabled={update.isPending}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Mark Follow-Up Done
            </button>
          )}
          {canAction("leads", "all_leads", "assign") && !locked && (
            <button
              onClick={() => openModal("assign")}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <UserCheck className="h-4 w-4 text-slate-400" /> Assign Lead
            </button>
          )}
          {canAction("leads", "all_leads", "assign") && lead.assignedTo && !locked && (
            <button
              onClick={() => openModal("unassign")}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <UserX className="h-4 w-4 text-amber-500" /> Unassign Lead
            </button>
          )}
          {((canAction("leads", "all_leads", "call") && hasPhone) ||
            (canAction("leads", "all_leads", "whatsapp") && hasPhone) ||
            (canAction("leads", "all_leads", "email") && lead.email)) && (
            <div className="my-1 border-t border-slate-100" />
          )}
          {canAction("leads", "all_leads", "call") && hasPhone && (
            <a
              href={`tel:${lead.mobileNumber}`}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Phone className="h-4 w-4 text-emerald-500" /> Call Lead
            </a>
          )}
          {canAction("leads", "all_leads", "whatsapp") && hasPhone && normalizedPhone && (
            <a
              href={`https://wa.me/${normalizedPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <MessageCircle className="h-4 w-4 text-emerald-500" /> WhatsApp
            </a>
          )}
          {canAction("leads", "all_leads", "email") && lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Mail className="h-4 w-4 text-sky-500" /> Email Lead
            </a>
          )}
        </div>,
        document.body,
      )}

      {/* Update Status modal */}
      <Modal
        open={active === "status"}
        onClose={closeModal}
        title="Update Status"
        description={`Change status for ${lead.leadName}`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleStatus} loading={update.isPending}>Save</Button>
          </>
        }
      >
        <Field label="New Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
      </Modal>

      {/* Add Comment modal */}
      <Modal
        open={active === "comment"}
        onClose={closeModal}
        title="Add Comment"
        description={`Add a note for ${lead.leadName}`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleComment} loading={update.isPending}>Save</Button>
          </>
        }
      >
        <Field label="Comment">
          <Textarea
            placeholder="Enter comment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
        </Field>
      </Modal>

      {/* Schedule Follow-Up modal */}
      <Modal
        open={active === "followup"}
        onClose={closeModal}
        title="Schedule Follow-Up"
        description={`Set follow-up date for ${lead.leadName}`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleFollowUp} loading={update.isPending}>Save</Button>
          </>
        }
      >
        <Field label="Follow-Up Date &amp; Time">
          <Input
            type="datetime-local"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
        </Field>
        <Field label="Note" className="mt-3">
          <Textarea
            placeholder="Optional note for this follow-up…"
            value={followUpNote}
            onChange={(e) => setFollowUpNote(e.target.value)}
            rows={3}
          />
        </Field>
      </Modal>

      {/* Assign Lead modal */}
      <Modal
        open={active === "assign"}
        onClose={closeModal}
        title="Assign Lead"
        description={`Assign ${lead.leadName} to a user`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={() => handleAssign(Boolean(reassignAlert))} loading={bulkAssign.isPending}>
              {reassignAlert ? "Reassign" : "Assign"}
            </Button>
          </>
        }
      >
        {reassignAlert && (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {reassignAlert}
          </p>
        )}
        <Field label="Assign to">
          <Select
            value={assignTo}
            onChange={(e) => {
              setAssignTo(e.target.value);
              setReassignAlert(null);
            }}
          >
            <option value="">Select user</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.fullName}</option>
            ))}
          </Select>
        </Field>
      </Modal>

      {/* Unassign Lead confirm modal */}
      <ConfirmModal
        open={active === "unassign"}
        onClose={closeModal}
        onConfirm={handleUnassign}
        title="Unassign Lead?"
        message={`This will remove the current assignment from "${lead.leadName}" and move it back to Unassigned Leads. All lead details and activity history will be kept.`}
        confirmLabel="Unassign"
        loading={update.isPending}
      />
    </div>
  );
}
