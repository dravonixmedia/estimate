"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LeadStatus } from "@/types/database";

const STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "consultation_scheduled",
  "proposal_sent",
  "won",
  "lost",
  "spam",
];

export function LeadStatusPanel({ leadId, currentStatus }: { leadId: string; currentStatus: LeadStatus }) {
  const router = useRouter();
  const [status, setStatus] = React.useState(currentStatus);
  const [note, setNote] = React.useState("");
  const [savingStatus, setSavingStatus] = React.useState(false);
  const [savingNote, setSavingNote] = React.useState(false);

  async function updateStatus(next: LeadStatus) {
    setStatus(next);
    setSavingStatus(true);
    await fetch(`/api/admin/leads/${leadId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSavingStatus(false);
    router.refresh();
  }

  async function submitNote() {
    if (!note.trim()) return;
    setSavingNote(true);
    await fetch(`/api/admin/leads/${leadId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setNote("");
    setSavingNote(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-brand-text">Status</p>
        <Select value={status} onValueChange={(v) => updateStatus(v as LeadStatus)} disabled={savingStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-brand-text">Add internal note</p>
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        <Button type="button" size="sm" onClick={submitNote} disabled={savingNote || !note.trim()}>
          Add Note
        </Button>
      </div>
    </div>
  );
}
