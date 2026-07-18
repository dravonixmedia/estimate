"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";

type Settings = { whatsapp_number: string; contact_email: string; disclaimer_text: string };

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [values, setValues] = React.useState(initial);
  const [saving, setSaving] = React.useState<keyof Settings | null>(null);
  const [saved, setSaved] = React.useState<keyof Settings | null>(null);

  async function save(key: keyof Settings) {
    setSaving(key);
    setSaved(null);
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: values[key] }),
    });
    setSaving(null);
    if (response.ok) {
      setSaved(key);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Number</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="whatsapp">Used for the estimator&apos;s WhatsApp contact link (E.164 format, e.g. 919000000000).</Label>
          <Input
            id="whatsapp"
            value={values.whatsapp_number}
            onChange={(e) => setValues((v) => ({ ...v, whatsapp_number: e.target.value }))}
          />
          <SaveButton onClick={() => save("whatsapp_number")} saving={saving === "whatsapp_number"} saved={saved === "whatsapp_number"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            id="email"
            type="email"
            value={values.contact_email}
            onChange={(e) => setValues((v) => ({ ...v, contact_email: e.target.value }))}
          />
          <SaveButton onClick={() => save("contact_email")} saving={saving === "contact_email"} saved={saved === "contact_email"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disclaimer Text</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={5}
            value={values.disclaimer_text}
            onChange={(e) => setValues((v) => ({ ...v, disclaimer_text: e.target.value }))}
          />
          <SaveButton onClick={() => save("disclaimer_text")} saving={saving === "disclaimer_text"} saved={saved === "disclaimer_text"} />
        </CardContent>
      </Card>
    </div>
  );
}

function SaveButton({ onClick, saving, saved }: { onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <Button type="button" size="sm" onClick={onClick} disabled={saving}>
      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : "Save"}
    </Button>
  );
}
