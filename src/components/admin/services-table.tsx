"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ServiceRow } from "@/types/database";
import { Check, Loader2 } from "lucide-react";

export function PricingTable({ services }: { services: ServiceRow[] }) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b border-brand-border text-left text-brand-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Min (₹)</th>
              <th className="px-4 py-3 font-medium">Max (₹)</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {services.map((service) => (
              <PricingRow key={service.id} service={service} />
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function PricingRow({ service }: { service: ServiceRow }) {
  const router = useRouter();
  const [min, setMin] = React.useState(String(service.price_min));
  const [max, setMax] = React.useState(String(service.price_max));
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const response = await fetch(`/api/admin/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price_min: Number(min), price_max: Number(max) }),
    });
    setSaving(false);
    if (response.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <tr>
      <td className="px-4 py-3 text-brand-text">{service.name}</td>
      <td className="px-4 py-3 text-brand-muted-foreground">{service.unit === "monthly" ? "Monthly" : "One-time"}</td>
      <td className="px-4 py-3">
        <Input type="number" min={0} value={min} onChange={(e) => setMin(e.target.value)} className="h-9 w-28" />
      </td>
      <td className="px-4 py-3">
        <Input type="number" min={0} value={max} onChange={(e) => setMax(e.target.value)} className="h-9 w-28" />
      </td>
      <td className="px-4 py-3">
        <Button type="button" size="sm" variant="secondary" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : "Save"}
        </Button>
      </td>
    </tr>
  );
}

export function ServicesActiveTable({ services }: { services: ServiceRow[] }) {
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b border-brand-border text-left text-brand-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {services.map((service) => (
              <ServiceActiveRow key={service.id} service={service} />
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function ServiceActiveRow({ service }: { service: ServiceRow }) {
  const router = useRouter();
  const [active, setActive] = React.useState(service.active);
  const [saving, setSaving] = React.useState(false);

  async function toggle() {
    setSaving(true);
    const next = !active;
    const response = await fetch(`/api/admin/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: next }),
    });
    setSaving(false);
    if (response.ok) {
      setActive(next);
      router.refresh();
    }
  }

  return (
    <tr>
      <td className="px-4 py-3 text-brand-text">{service.name}</td>
      <td className="px-4 py-3 capitalize text-brand-muted-foreground">{service.category}</td>
      <td className="px-4 py-3">
        <span className={active ? "text-brand-success" : "text-brand-muted-foreground"}>
          {active ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="px-4 py-3">
        <Button type="button" size="sm" variant="secondary" onClick={toggle} disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : active ? "Deactivate" : "Activate"}
        </Button>
      </td>
    </tr>
  );
}
