"use client";

import * as React from "react";
import { useEstimator } from "../estimator-context";
import { StepShell, StepFooter } from "../step-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChoiceCard } from "@/components/ui/choice-card";
import { isConceptAnswered } from "@/lib/estimator/validation";
import type { EstimatorState } from "@/lib/estimator/schema";

const BUSINESS_STAGES: { value: NonNullable<EstimatorState["clientDetails"]["businessStage"]>; label: string }[] = [
  { value: "idea_stage", label: "Idea Stage" },
  { value: "new_startup", label: "New Startup" },
  { value: "existing_business", label: "Existing Business" },
  { value: "rebranding", label: "Rebranding" },
  { value: "expansion", label: "Expansion" },
];

export function StepClientDetails() {
  const { state, updateState, goNext } = useEstimator();
  const details = state.clientDetails;
  const [touched, setTouched] = React.useState(false);

  const nameOk = isConceptAnswered(state, "client_name");
  const contactOk = isConceptAnswered(state, "contact_method");
  const stageOk = isConceptAnswered(state, "business_stage");
  const canContinue = nameOk && contactOk && stageOk;

  function set<K extends keyof EstimatorState["clientDetails"]>(key: K, value: EstimatorState["clientDetails"][K]) {
    updateState((prev) => ({ ...prev, clientDetails: { ...prev.clientDetails, [key]: value } }));
  }

  return (
    <StepShell heading="Let's start with your details" description="So we know who to prepare this estimate for.">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={details.fullName ?? ""}
            onChange={(e) => set("fullName", e.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={touched && !nameOk}
            placeholder="Your name"
          />
          {touched && !nameOk && <p className="text-sm text-brand-danger">Please share your full name.</p>}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="businessName">Business name (optional)</Label>
          <Input
            id="businessName"
            value={details.businessName ?? ""}
            onChange={(e) => set("businessName", e.target.value)}
            placeholder="Your business or brand name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsappNumber">WhatsApp number</Label>
          <Input
            id="whatsappNumber"
            type="tel"
            value={details.whatsappNumber ?? ""}
            onChange={(e) => set("whatsappNumber", e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="+91 90000 00000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={details.email ?? ""}
            onChange={(e) => set("email", e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="you@email.com"
          />
        </div>
        {touched && !contactOk && (
          <p className="text-sm text-brand-danger sm:col-span-2">
            Please provide a WhatsApp number or an email address so we can reach you.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Label>Business stage</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {BUSINESS_STAGES.map((stage) => (
            <ChoiceCard
              key={stage.value}
              title={stage.label}
              selected={details.businessStage === stage.value}
              onSelect={() => set("businessStage", stage.value)}
            />
          ))}
        </div>
      </div>

      <StepFooter
        nextLabel="Continue"
        nextDisabled={!canContinue}
        onNext={() => {
          setTouched(true);
          if (canContinue) goNext();
        }}
      />
    </StepShell>
  );
}
