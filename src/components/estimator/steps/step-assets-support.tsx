"use client";

import { useEstimator } from "../estimator-context";
import { StepShell, StepFooter } from "../step-shell";
import { ChoiceGroup } from "../choice-group";

const ASSET_OPTIONS = [
  { value: "brand_name", label: "Brand name" },
  { value: "logo", label: "Logo" },
  { value: "brand_colours", label: "Brand colours" },
  { value: "written_content", label: "Written content" },
  { value: "photographs", label: "Professional photographs" },
  { value: "videos", label: "Videos" },
  { value: "product_details", label: "Product details" },
  { value: "domain", label: "Domain" },
  { value: "hosting", label: "Hosting" },
  { value: "social_accounts", label: "Social media accounts" },
  { value: "nothing_ready", label: "Nothing is ready" },
  { value: "not_sure", label: "Not Sure" },
];

const SUPPORT_OPTIONS = [
  { value: "content_writing", label: "Content writing" },
  { value: "image_sourcing", label: "Image sourcing" },
  { value: "photography", label: "Photography" },
  { value: "video_production", label: "Video production" },
  { value: "product_uploading", label: "Product uploading" },
  { value: "business_email_setup", label: "Business email setup" },
  { value: "domain_hosting_setup", label: "Domain and hosting setup" },
  { value: "ongoing_maintenance", label: "Ongoing maintenance" },
  { value: "none", label: "None" },
  { value: "not_sure", label: "Not Sure" },
];

export function StepAssetsSupport() {
  const { state, updateState, goNext, goBack } = useEstimator();
  const assets = state.assetsAndSupport ?? { available: [], support: [] };

  return (
    <StepShell heading="Assets and support" description="This helps us scope your project accurately." onBack={goBack}>
      <ChoiceGroup
        label="What is already available?"
        multi
        options={ASSET_OPTIONS}
        value={assets.available}
        onChange={(v) =>
          updateState((prev) => ({
            ...prev,
            assetsAndSupport: { available: v as never, support: prev.assetsAndSupport?.support ?? [] },
          }))
        }
      />
      <ChoiceGroup
        label="What support do you need from Dravonix?"
        multi
        options={SUPPORT_OPTIONS}
        value={assets.support}
        onChange={(v) =>
          updateState((prev) => ({
            ...prev,
            assetsAndSupport: { available: prev.assetsAndSupport?.available ?? [], support: v as never },
          }))
        }
      />

      <StepFooter
        onNext={() => {
          // An empty selection is still a valid, explicit answer — this
          // screen only appears when it's relevant, so any Continue press
          // finalizes it (never blocks).
          if (!state.assetsAndSupport) {
            updateState((prev) => ({ ...prev, assetsAndSupport: { available: [], support: [] } }));
          }
          goNext();
        }}
      />
    </StepShell>
  );
}
