"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Eye,
  Tag,
  MessageSquare,
  Calendar,
  UserCheck,
  Phone,
  MessageCircle,
  Mail,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea, Input } from "@/components/ui/Input";
import { useLeadMutations } from "@/hooks/useLeads";
import { useAssignableUsers } from "@/hooks/useUsers";
import { useFieldOptions } from "@/hooks/useDynamicFields";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/services/api/client";
import { toDatetimeLocal } from "@/lib/utils";
import type { Lead } from "@/types";

type ActiveModal = "status" | "comment" | "followup" | "assign" | null;

export function LeadQuickActions({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<ActiveModal>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { canAction } = useAuth();
  const { update, bulkAssign } = useLeadMutations();
  const { users } = useAssignableUsers();
  const statuses = useFieldOptions("lead_status");

  const [status, setStatus] = useState(lead.leadStatus);
  const [comment, setComment] = useState("");
  const [followUpDate, setFollowUpDate] = useState(toDatetimeLocal(lead.followUpDate));
  const [assignTo, setAssignTo] = useState(lead.assignedTo ?? "");

  useEffect(() => {
    if (open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function openModal(m: ActiveModal) {
    setOpen(false);
    setActive(m);
  }
  function closeModal() {
    setActive(null);
    setComment("");
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
      await update.mutateAsync({ id: lead.id, body: { followUpDate: followUpDate || undefined } });
      toast.success("Follow-up scheduled");
      closeModal();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  async function handleAssign() {
    if (!assignTo) return toast.error("Select a user");
    try {
      await bulkAssign.mutateAsync({ ids: [lead.id], assignedTo: assignTo });
      toast.success("Lead assigned");
      closeModal();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }

  const normalizedPhone = lead.mobileNumber.replace(/\D/g, "");

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        aria-label="Quick actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <Link
            href={`/leads/${lead.id}`}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Eye className="h-4 w-4 text-slate-400" /> View Details
          </Link>
          <button
            onClick={() => openModal("status")}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Tag className="h-4 w-4 text-slate-400" /> Update Status
          </button>
          <button
            onClick={() => openModal("comment")}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <MessageSquare className="h-4 w-4 text-slate-400" /> Add Comment
          </button>
          <button
            onClick={() => openModal("followup")}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Calendar className="h-4 w-4 text-slate-400" /> Schedule Follow-Up
          </button>
          {canAction("leads", "all_leads", "assign") && (
            <button
              onClick={() => openModal("assign")}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <UserCheck className="h-4 w-4 text-slate-400" /> Assign Lead
            </button>
          )}
          {(canAction("leads", "all_leads", "call") || canAction("leads", "all_leads", "whatsapp") || canAction("leads", "all_leads", "email")) && (
            <div className="my-1 border-t border-slate-100" />
          )}
          {canAction("leads", "all_leads", "call") && (
            <a
              href={`tel:${lead.mobileNumber}`}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Phone className="h-4 w-4 text-emerald-500" /> Call Lead
            </a>
          )}
          {canAction("leads", "all_leads", "whatsapp") && (
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
        </div>
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
      </Modal>

      {/* Assign Lead modal */}
      <Modal
        open={active === "assign"}
        onClose={closeModal}
        title="Assign Lead"
        description={`Assign ${lead.leadName} to a user`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleAssign} loading={bulkAssign.isPending}>Assign</Button>
          </>
        }
      >
        <Field label="Assign to">
          <Select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
            <option value="">Select user</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.fullName}</option>
            ))}
          </Select>
        </Field>
      </Modal>
    </div>
  );
}
