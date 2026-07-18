"use client";

import * as React from "react";
import { useEstimator } from "../estimator-context";
import { StepShell, StepFooter } from "../step-shell";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isConceptAnswered } from "@/lib/estimator/validation";
import { trackEvent } from "@/lib/analytics";

export function StepProjectIdea() {
  const { state, updateState, goNext, goBack } = useEstimator();
  const idea = state.projectIdea;
  const [touched, setTouched] = React.useState(false);

  const descriptionOk = isConceptAnswered(state, "project_description");

  function set<K extends keyof typeof idea>(key: K, value: (typeof idea)[K]) {
    updateState((prev) => ({ ...prev, projectIdea: { ...prev.projectIdea, [key]: value } }));
  }

  return (
    <StepShell heading="Tell us about your project" onBack={goBack}>
      <div className="space-y-2">
        <Label htmlFor="description">What would you like Dravonix Media to help you create?</Label>
        <Textarea
          id="description"
          rows={6}
          value={idea.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={touched && !descriptionOk}
          placeholder="Tell us about your business, what you want to create, the services you may need, and the result you expect."
        />
        {touched && !descriptionOk && (
          <p className="text-sm text-brand-danger">Please share a little more about what you would like to create.</p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="referenceWebsite">Reference website (optional)</Label>
          <Input
            id="referenceWebsite"
            value={idea.referenceWebsite ?? ""}
            onChange={(e) => set("referenceWebsite", e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inspirationLink">Social media or inspiration link (optional)</Label>
          <Input
            id="inspirationLink"
            value={idea.inspirationLink ?? ""}
            onChange={(e) => set("inspirationLink", e.target.value)}
            placeholder="Instagram, Pinterest, or any link"
          />
        </div>
      </div>

      <StepFooter
        nextDisabled={!descriptionOk}
        onNext={() => {
          setTouched(true);
          if (!descriptionOk) return;
          trackEvent("project_description_completed");
          goNext();
        }}
      />
    </StepShell>
  );
}
