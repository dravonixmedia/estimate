"use client";

import { useEstimator } from "../estimator-context";
import { StepShell, StepFooter } from "../step-shell";
import { ChoiceGroup } from "../choice-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Timeline } from "@/lib/estimator/schema";

export function StepTimeline() {
  const { state, updateState, goNext, goBack } = useEstimator();
  const timeline = state.timeline;

  function set<K extends keyof Timeline>(key: K, value: Timeline[K]) {
    updateState((prev) => ({ ...prev, timeline: { ...prev.timeline, [key]: value } }));
  }

  const isUrgent = timeline.launchTimeframe === "asap";

  return (
    <StepShell heading="Timeline and investment" description="This helps us recommend the right starting point." onBack={goBack}>
      <ChoiceGroup
        label="When would you like to start?"
        options={[
          { value: "immediately", label: "Immediately" },
          { value: "within_2_weeks", label: "Within 2 weeks" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "later", label: "Later" },
          { value: "not_decided", label: "Not decided" },
        ]}
        value={timeline.startWhen}
        onChange={(v) => set("startWhen", v as Timeline["startWhen"])}
      />

      <ChoiceGroup
        label="What is the preferred launch timeframe?"
        options={[
          { value: "asap", label: "As soon as possible" },
          { value: "2_4_weeks", label: "Within 2-4 weeks" },
          { value: "1_2_months", label: "Within 1-2 months" },
          { value: "3_months", label: "Within 3 months" },
          { value: "flexible", label: "Flexible" },
          { value: "not_decided", label: "Not decided" },
        ]}
        value={timeline.launchTimeframe}
        onChange={(v) => set("launchTimeframe", v as Timeline["launchTimeframe"])}
      />

      {isUrgent && (
        <div className="space-y-2">
          <Label htmlFor="exactDeadline">Exact date required</Label>
          <Input
            id="exactDeadline"
            type="date"
            value={timeline.exactDeadlineDate ?? ""}
            onChange={(e) => set("exactDeadlineDate", e.target.value)}
          />
        </div>
      )}

      <ChoiceGroup
        label="Is the deadline flexible?"
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "not_sure", label: "Not Sure" },
        ]}
        value={timeline.deadlineFlexible}
        onChange={(v) => set("deadlineFlexible", v as Timeline["deadlineFlexible"])}
      />

      <ChoiceGroup
        label="What is the expected investment range?"
        options={[
          { value: "under_25k", label: "Under ₹25,000" },
          { value: "25k_60k", label: "₹25,000 - ₹60,000" },
          { value: "60k_150k", label: "₹60,000 - ₹1,50,000" },
          { value: "150k_350k", label: "₹1,50,000 - ₹3,50,000" },
          { value: "350k_plus", label: "₹3,50,000+" },
          { value: "not_sure", label: "Not Sure" },
        ]}
        value={timeline.expectedInvestment}
        onChange={(v) => set("expectedInvestment", v as Timeline["expectedInvestment"])}
      />

      <ChoiceGroup
        label="Are you open to phased implementation?"
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "not_sure", label: "Not Sure" },
        ]}
        value={timeline.phasedDeliveryOk}
        onChange={(v) => set("phasedDeliveryOk", v as Timeline["phasedDeliveryOk"])}
      />

      <StepFooter onNext={goNext} />
    </StepShell>
  );
}
