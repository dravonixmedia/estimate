"use client";

import { Progress } from "@/components/ui/progress";
import { useEstimator } from "./estimator-context";

export function WizardProgress() {
  const { visibleSteps, currentStepId } = useEstimator();
  const index = visibleSteps.findIndex((s) => s.id === currentStepId);
  const current = visibleSteps[index];
  const percent = visibleSteps.length > 0 ? ((index + 1) / visibleSteps.length) * 100 : 0;

  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center justify-between text-sm text-brand-muted-foreground">
        <span>
          Step {index + 1} of {visibleSteps.length}
        </span>
        <span className="font-medium text-brand-text">{current?.title}</span>
      </div>
      <Progress value={percent} aria-label="Estimator progress" />
    </div>
  );
}
