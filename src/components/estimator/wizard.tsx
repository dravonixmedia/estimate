"use client";

import { useEstimator } from "./estimator-context";
import { WizardProgress } from "./wizard-progress";
import { Logo } from "@/components/brand/logo";
import { StepClientDetails } from "./steps/step-client-details";
import { StepProjectIdea } from "./steps/step-project-idea";
import { StepConfirmServices } from "./steps/step-confirm-services";
import { StepProjectScope } from "./steps/step-project-scope";
import { StepAssetsSupport } from "./steps/step-assets-support";
import { StepTimeline } from "./steps/step-timeline";
import { StepReview } from "./steps/step-review";
import type { StepId } from "@/lib/estimator/steps";

const STEP_COMPONENTS: Record<StepId, React.ComponentType> = {
  client_details: StepClientDetails,
  project_idea: StepProjectIdea,
  confirm_services: StepConfirmServices,
  project_scope: StepProjectScope,
  assets_support: StepAssetsSupport,
  timeline_investment: StepTimeline,
  review_generate: StepReview,
};

export function Wizard() {
  const { currentStepId } = useEstimator();
  const StepComponent = STEP_COMPONENTS[currentStepId];

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col px-4 py-6 sm:py-10">
      <div className="mb-6">
        <Logo variant="full" href={null} className="h-8" />
      </div>
      <WizardProgress />
      <StepComponent />
    </div>
  );
}
