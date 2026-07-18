"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useEstimator } from "../estimator-context";
import { StepShell } from "../step-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SERVICE_CATALOG, type ServiceId } from "@/lib/estimator/services";
import { trackEvent } from "@/lib/analytics";
import { publicEnv } from "@/lib/env";
import { AlertCircle, Loader2, Pencil } from "lucide-react";

export function StepReview() {
  const { state, updateState, goToStep, goBack } = useEstimator();
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const services = state.services.selectedServices ?? [];
  const canSubmit = state.review.privacyAccepted && state.review.contactConsent && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      const json = await response.json();

      if (!response.ok || !json.ok) {
        setError("We couldn't generate your estimate just now. Please try again.");
        setSubmitting(false);
        return;
      }

      trackEvent("estimate_generated", { reference: json.reference });
      // next.config's `basePath` already prefixes this automatically.
      router.push(`/result/${json.reference}`);
    } catch {
      setError("We couldn't reach our servers. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <StepShell heading="Review your project" description="Everything looks good? Generate your estimate below." onBack={goBack}>
      <SummarySection title="Client Details" onEdit={() => goToStep("client_details")}>
        <p>{state.clientDetails.fullName}</p>
        {state.clientDetails.businessName && <p>{state.clientDetails.businessName}</p>}
        <p className="text-brand-muted-foreground">
          {[state.clientDetails.whatsappNumber, state.clientDetails.email].filter(Boolean).join(" · ")}
        </p>
      </SummarySection>

      <SummarySection title="Project Summary" onEdit={() => goToStep("project_idea")}>
        <p className="whitespace-pre-wrap">{state.projectIdea.description}</p>
      </SummarySection>

      <SummarySection title="Selected Services" onEdit={() => goToStep("confirm_services")}>
        {state.services.servicesNotSure ? (
          <p>Not Sure — Dravonix will help determine the right services.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-4">
            {services.map((id: ServiceId) => {
              const service = SERVICE_CATALOG.find((s) => s.id === id);
              return <li key={id}>{service?.name ?? id}</li>;
            })}
          </ul>
        )}
      </SummarySection>

      <SummarySection title="Timeline" onEdit={() => goToStep("timeline_investment")}>
        <p>Launch timeframe: {formatTimeframe(state.timeline.launchTimeframe)}</p>
        <p>Expected investment: {formatInvestment(state.timeline.expectedInvestment)}</p>
      </SummarySection>

      <Card>
        <CardContent className="space-y-4 py-6">
          <label className="flex items-start gap-3">
            <Checkbox
              checked={state.review.privacyAccepted}
              onCheckedChange={(checked) =>
                updateState((prev) => ({ ...prev, review: { ...prev.review, privacyAccepted: checked === true } }))
              }
            />
            <span className="text-sm text-brand-text">
              I have read and accept the{" "}
              <a href={publicEnv.NEXT_PUBLIC_PRIVACY_URL} target="_blank" rel="noreferrer" className="text-brand-primary underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>
          <label className="flex items-start gap-3">
            <Checkbox
              checked={state.review.contactConsent}
              onCheckedChange={(checked) =>
                updateState((prev) => ({ ...prev, review: { ...prev.review, contactConsent: checked === true } }))
              }
            />
            <span className="text-sm text-brand-text">I give Dravonix Media permission to contact me about this project.</span>
          </label>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-brand-danger/30 bg-brand-danger/5 p-4 text-sm text-brand-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-2">
            <p>{error}</p>
            <Button type="button" size="sm" variant="destructive" onClick={handleSubmit}>
              Retry
            </Button>
          </div>
        </div>
      )}

      <Button type="button" size="lg" className="w-full" onClick={handleSubmit} disabled={!canSubmit}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Generating your estimate…
          </>
        ) : (
          "Generate My Estimate"
        )}
      </Button>
      <Label className="sr-only" htmlFor="noop">
        review
      </Label>
    </StepShell>
  );
}

function SummarySection({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-brand-text">{children}</CardContent>
    </Card>
  );
}

function formatTimeframe(value?: string) {
  const map: Record<string, string> = {
    asap: "As soon as possible",
    "2_4_weeks": "Within 2-4 weeks",
    "1_2_months": "Within 1-2 months",
    "3_months": "Within 3 months",
    flexible: "Flexible",
    not_decided: "Not decided",
  };
  return value ? map[value] ?? value : "Not specified";
}

function formatInvestment(value?: string) {
  const map: Record<string, string> = {
    under_25k: "Under ₹25,000",
    "25k_60k": "₹25,000 - ₹60,000",
    "60k_150k": "₹60,000 - ₹1,50,000",
    "150k_350k": "₹1,50,000 - ₹3,50,000",
    "350k_plus": "₹3,50,000+",
    not_sure: "Not sure",
  };
  return value ? map[value] ?? value : "Not specified";
}
