import type { ServiceId } from "@/lib/estimator/services";

/**
 * Central, editable configuration for the combined-project estimate
 * adjustment. Nothing here changes any service's standalone price — it
 * only controls how multiple one-time services combine into one final
 * "Estimated Project Investment" figure. Edit this file (not the pricing
 * engine) to change which services participate.
 */
export type ServicePricingRule = {
  /**
   * When true, this one-time service's price counts toward the eligible
   * subtotal that the combined-project percentage is applied to. When
   * false, the service is still added to the final investment at its full
   * standalone price, but it neither earns nor is discounted by the
   * combined-project adjustment (e.g. small setup items or bespoke
   * services that are typically quoted independently).
   */
  eligibleForCombinedAdjustment: boolean;
  /**
   * Service ids that this service is known to already include, so
   * selecting both would double-charge. Left empty unless the existing
   * questionnaire/service catalog clearly establishes the relationship —
   * never guessed. Populate this later once a real overlap is confirmed;
   * the pricing engine already knows how to act on it.
   */
  overlapsWith: ServiceId[];
};

function eligibleRule(): ServicePricingRule {
  return { eligibleForCombinedAdjustment: true, overlapsWith: [] };
}

function excludedRule(): ServicePricingRule {
  return { eligibleForCombinedAdjustment: false, overlapsWith: [] };
}

export const SERVICE_PRICING_RULES: Record<ServiceId, ServicePricingRule> = {
  logo_design: eligibleRule(),
  brand_foundation: eligibleRule(),
  landing_page: eligibleRule(),
  business_website: eligibleRule(),
  ecommerce_website: eligibleRule(),
  social_profile_setup: eligibleRule(),
  social_media_launch: eligibleRule(),
  // Recurring — never part of the one-time combined-project adjustment at
  // all (the engine keeps monthly lines in a fully separate total).
  monthly_marketing: excludedRule(),
  seo: eligibleRule(),
  // Bespoke/manual-quote work — kept at its calculated standalone amount
  // rather than folded into a bundle percentage.
  custom_web_app: excludedRule(),
  content_creation: eligibleRule(),
  video_production: eligibleRule(),
  // Small technical setup item — doesn't affect (or benefit from) the
  // combined-project bundle threshold.
  domain_email_setup: excludedRule(),
};

/**
 * eligible one-time service count -> adjustment percentage.
 * 1 service: 0%, 2: 5%, 3: 8%, 4+: 10%.
 */
const COMBINED_PROJECT_ADJUSTMENT_TIERS: { minServices: number; percentage: number }[] = [
  { minServices: 4, percentage: 0.1 },
  { minServices: 3, percentage: 0.08 },
  { minServices: 2, percentage: 0.05 },
  { minServices: 1, percentage: 0 },
];

export function getCombinedProjectAdjustmentPercentage(eligibleOneTimeServiceCount: number): number {
  if (eligibleOneTimeServiceCount <= 0) return 0;
  const tier = COMBINED_PROJECT_ADJUSTMENT_TIERS.find((t) => eligibleOneTimeServiceCount >= t.minServices);
  return tier ? tier.percentage : 0;
}

/**
 * Resolves which selected services should be dropped as overlaps, based
 * purely on `rules`. Pure and independently testable so the mechanism can
 * be verified even while the shipped `SERVICE_PRICING_RULES` config above
 * intentionally declares no overlaps yet.
 */
export function resolveOverlapExclusions(
  selected: readonly ServiceId[],
  rules: Record<ServiceId, ServicePricingRule> = SERVICE_PRICING_RULES
): Set<ServiceId> {
  const excluded = new Set<ServiceId>();
  for (const id of selected) {
    for (const overlapId of rules[id]?.overlapsWith ?? []) {
      if (selected.includes(overlapId)) excluded.add(overlapId);
    }
  }
  return excluded;
}
