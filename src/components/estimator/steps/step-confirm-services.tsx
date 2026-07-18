"use client";

import * as React from "react";
import { useEstimator } from "../estimator-context";
import { StepShell, StepFooter } from "../step-shell";
import { ChoiceCard } from "@/components/ui/choice-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SERVICE_CATALOG, type ServiceId } from "@/lib/estimator/services";
import { useAnalyzeProject } from "@/lib/ai/use-analyze";
import { mergeScope } from "@/lib/estimator/merge";
import { isConceptAnswered } from "@/lib/estimator/validation";
import { trackEvent } from "@/lib/analytics";
import { Loader2, Sparkles } from "lucide-react";

export function StepConfirmServices() {
  const { state, updateState, goNext, goBack } = useEstimator();
  const { status, data, run } = useAnalyzeProject();
  const attempted = React.useRef(false);
  const [summaryDismissed, setSummaryDismissed] = React.useState(false);

  React.useEffect(() => {
    if (attempted.current) return;
    if (state.aiInterpretation) return; // already analyzed / confirmed earlier in this session
    const description = state.projectIdea.description;
    if (!description || description.trim().length < 10) return;
    attempted.current = true;
    void run(description, state.projectIdea.referenceWebsite, state.projectIdea.inspirationLink);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (status === "success" && data && !state.aiInterpretation) {
      updateState((prev) => ({ ...prev, aiInterpretation: data }));
    }
  }, [status, data, state.aiInterpretation, updateState]);

  const interpretation = state.aiInterpretation;
  const selected = state.services.selectedServices ?? [];
  const notSure = state.services.servicesNotSure;

  function toggleService(id: ServiceId) {
    updateState((prev) => {
      const current = prev.services.selectedServices ?? [];
      const isSelected = current.includes(id);
      const nextSelected = isSelected ? current.filter((s: ServiceId) => s !== id) : [...current, id];
      return {
        ...prev,
        services: { ...prev.services, selectedServices: nextSelected, servicesNotSure: false },
      };
    });
  }

  function selectNotSure() {
    updateState((prev) => ({
      ...prev,
      services: { ...prev.services, selectedServices: [], servicesNotSure: true },
    }));
  }

  function confirmAiSummary() {
    if (!interpretation) return;
    updateState((prev) => {
      const merged = new Set([...(prev.services.selectedServices ?? []), ...interpretation.recommendedServiceIds]);
      return {
        ...prev,
        services: { ...prev.services, selectedServices: Array.from(merged), servicesNotSure: false, aiSummaryConfirmed: true },
        scope: mergeScope(prev.scope, interpretation.inferredAnswers),
      };
    });
  }

  const canContinue = isConceptAnswered(state, "selected_services");
  const isLoading = status === "loading";
  const showAiSummary = status === "success" && interpretation && !summaryDismissed;

  return (
    <StepShell
      heading={showAiSummary ? "We understood that you need:" : "Confirm your requirements"}
      description={
        showAiSummary
          ? undefined
          : "Select the services you need. You can choose “Not Sure” where needed."
      }
      onBack={goBack}
    >
      {isLoading && (
        <Card>
          <CardContent className="flex items-center gap-3 py-8 text-brand-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
            Understanding your requirements…
          </CardContent>
        </Card>
      )}

      {!isLoading && showAiSummary && interpretation && (
        <Card className="border-brand-primary/30 bg-brand-primary/5">
          <CardContent className="space-y-4 py-6">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
              <ul className="list-disc space-y-1 pl-4 text-sm text-brand-text">
                {interpretation.inferredRequirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => {
                  confirmAiSummary();
                  setSummaryDismissed(true);
                  trackEvent("services_confirmed", { serviceCount: interpretation.recommendedServiceIds.length });
                }}
              >
                Looks Correct
              </Button>
              <Button type="button" variant="secondary" onClick={() => setSummaryDismissed(true)}>
                Make Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-brand-muted">
              {interpretation ? "Recommended services" : "All services"}
            </h2>
            <ServiceCatalogDialog selected={selected} onToggle={toggleService} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(interpretation
              ? SERVICE_CATALOG.filter((s) => interpretation.recommendedServiceIds.includes(s.id))
              : SERVICE_CATALOG
            ).map((service) => (
              <ChoiceCard
                key={service.id}
                title={service.name}
                description={service.description}
                selected={selected.includes(service.id)}
                onSelect={() => toggleService(service.id)}
              />
            ))}
            <ChoiceCard title="Not Sure" description="We'll help you figure this out." selected={notSure} onSelect={selectNotSure} />
          </div>
        </div>
      )}

      <StepFooter
        nextDisabled={!canContinue || isLoading}
        onNext={() => {
          if (!canContinue) return;
          trackEvent("services_confirmed", { serviceCount: selected.length });
          goNext();
        }}
      />
    </StepShell>
  );
}

function ServiceCatalogDialog({ selected, onToggle }: { selected: ServiceId[]; onToggle: (id: ServiceId) => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="link" size="sm" className="h-auto p-0">
          View All Services
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>All services</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {SERVICE_CATALOG.map((service) => (
            <ChoiceCard
              key={service.id}
              title={service.name}
              description={service.description}
              selected={selected.includes(service.id)}
              onSelect={() => onToggle(service.id)}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
