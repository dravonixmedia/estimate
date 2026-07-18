import type { EstimatorState } from "@/lib/estimator/schema";
import { LOGO_LEVEL_PRICING, SEO_TIER_PRICING, SERVICE_CATALOG, type ServiceDefinition, type ServiceId } from "@/lib/estimator/services";
import { getMissingRequiredConcepts } from "@/lib/estimator/validation";

/**
 * The one deterministic, server-side pricing module. Claude never touches
 * these numbers — it may only help interpret the project description.
 * Admin-edited service prices (from Supabase) are passed in as
 * `activeServices`; this module falls back to the built-in catalog when
 * no override is supplied, so it works even if Supabase is unreachable.
 */

export type ServiceLine = {
  serviceId: ServiceId;
  name: string;
  unit: "one_time" | "monthly";
  min: number;
  max: number;
  notes?: string;
};

export type PricingBundle = {
  title: string;
  description: string;
  min: number;
  max: number;
  includedServiceIds: ServiceId[];
};

export type UpgradeSuggestion = {
  serviceId: ServiceId;
  name: string;
  min: number;
  max: number;
  reason: string;
};

export type EstimateConfidence = "high" | "medium" | "low";

export type PricingResult = {
  oneTimeMin: number;
  oneTimeMax: number;
  monthlyMin: number;
  monthlyMax: number;
  serviceBreakdown: ServiceLine[];
  essentialLaunch: PricingBundle;
  recommendedSolution: PricingBundle;
  optionalUpgrades: UpgradeSuggestion[];
  futureExpansion: string[];
  assumptions: string[];
  exclusions: string[];
  estimatedTimelineLabel: string;
  estimatedTimelineWeeksMin: number;
  estimatedTimelineWeeksMax: number;
  confidence: EstimateConfidence;
  customQuotationRequired: boolean;
};

const STANDARD_EXCLUSIONS = [
  "Domain registration fees",
  "Hosting fees",
  "Paid advertising spend",
  "Premium plugins or software subscriptions",
  "Payment-gateway processing fees",
  "Taxes",
  "Other third-party service costs",
];

function round(value: number, nearest = 500) {
  return Math.round(value / nearest) * nearest;
}

function scaleWithinRange(min: number, max: number, position: number) {
  const clamped = Math.min(1, Math.max(0, position));
  return round(min + (max - min) * clamped);
}

function serviceMap(activeServices?: readonly ServiceDefinition[]): Map<ServiceId, ServiceDefinition> {
  const source = activeServices && activeServices.length > 0 ? activeServices : SERVICE_CATALOG;
  return new Map(source.map((s) => [s.id, s]));
}

function priceLogo(state: EstimatorState, catalog: ServiceDefinition): ServiceLine {
  const scope = state.scope.logo;
  const level = scope?.logoLevel && scope.logoLevel !== "not_sure" ? scope.logoLevel : undefined;
  const tier = level ? LOGO_LEVEL_PRICING[level] : undefined;
  let min = tier?.min ?? catalog.priceMin;
  let max = tier?.max ?? catalog.priceMax;

  if (scope?.conceptCount === "4+") {
    min = round(min + (max - min) * 0.3);
  }
  if (scope?.urgent === "yes") {
    max = round(max * 1.1);
  }

  return {
    serviceId: "logo_design",
    name: catalog.name,
    unit: "one_time",
    min,
    max,
    notes: tier ? tier.label : "Logo level not yet confirmed — showing full range.",
  };
}

function priceWebsite(state: EstimatorState, catalog: ServiceDefinition, serviceId: ServiceId): ServiceLine {
  const scope = state.scope.website;
  const pageBuckets: Record<string, number> = { "1": 0, "2-5": 0.25, "6-10": 0.55, "10+": 0.85 };
  const position = scope?.pageCount ? pageBuckets[scope.pageCount] ?? 0.4 : 0.4;
  const featureBoost = Math.min((scope?.features?.filter((f) => f !== "not_sure").length ?? 0) * 0.03, 0.2);

  const min = catalog.priceMin;
  const max = catalog.priceMax;
  const target = scaleWithinRange(min, max, position + featureBoost);
  const spread = round((max - min) * 0.15);

  return {
    serviceId,
    name: catalog.name,
    unit: "one_time",
    min: Math.max(min, target - spread),
    max: Math.min(max, target + spread),
    notes: scope?.pageCount ? `Based on ${scope.pageCount} pages` : "Page count not yet confirmed — showing a wider range.",
  };
}

function priceEcommerce(state: EstimatorState, catalog: ServiceDefinition): ServiceLine {
  const scope = state.scope.ecommerce;
  const productBuckets: Record<string, number> = { "1-20": 0, "21-100": 0.25, "101-500": 0.55, "500+": 0.9 };
  const position = scope?.productCount ? productBuckets[scope.productCount] ?? 0.4 : 0.4;
  const featureBoost = Math.min((scope?.advancedFeatures?.filter((f) => f !== "not_sure").length ?? 0) * 0.04, 0.25);

  const min = catalog.priceMin;
  const max = catalog.priceMax;
  const target = scaleWithinRange(min, max, position + featureBoost);
  const spread = round((max - min) * 0.15);

  return {
    serviceId: "ecommerce_website",
    name: catalog.name,
    unit: "one_time",
    min: Math.max(min, target - spread),
    max: Math.min(max, target + spread),
    notes: scope?.productCount ? `Based on ${scope.productCount} products` : "Product count not yet confirmed — showing a wider range.",
  };
}

function priceSeo(state: EstimatorState, catalog: ServiceDefinition): ServiceLine {
  const scope = state.scope.seo;
  let points = 0;
  if (scope?.pageCount === "11-20" || scope?.pageCount === "20+") points += 1;
  if (scope?.keywordResearchRequired === "yes") points += 1;
  if (scope?.technicalIssuesKnown === "yes") points += 1;
  if (scope?.searchConsoleConnected === "no") points += 1;

  const tier = points >= 3 ? SEO_TIER_PRICING.advanced : points >= 1 ? SEO_TIER_PRICING.standard : SEO_TIER_PRICING.basic;

  return {
    serviceId: "seo",
    name: catalog.name,
    unit: "one_time",
    min: tier.min,
    max: tier.max,
    notes: `${tier.label}. Monthly SEO support is quoted separately.`,
  };
}

function priceSocialLaunch(state: EstimatorState, catalog: ServiceDefinition): ServiceLine {
  const scope = state.scope.socialLaunch;
  const postBuckets: Record<string, number> = { "1-10": 0, "11-20": 0.3, "21-40": 0.65, "40+": 1 };
  const position = scope?.postQuantity ? postBuckets[scope.postQuantity] ?? 0.3 : 0.3;
  const target = scaleWithinRange(catalog.priceMin, catalog.priceMax, position);
  return {
    serviceId: "social_media_launch",
    name: catalog.name,
    unit: "one_time",
    min: catalog.priceMin,
    max: Math.max(target, catalog.priceMin),
    notes: scope?.postQuantity ? `Based on ${scope.postQuantity} posts` : undefined,
  };
}

function priceMarketing(state: EstimatorState, catalog: ServiceDefinition): ServiceLine {
  const scope = state.scope.marketing;
  const quantityBuckets: Record<string, number> = { low: 0, medium: 0.45, high: 0.85 };
  const position = scope?.contentQuantity ? quantityBuckets[scope.contentQuantity] ?? 0.4 : 0.4;
  const target = scaleWithinRange(catalog.priceMin, catalog.priceMax, position);
  const spread = round((catalog.priceMax - catalog.priceMin) * 0.2);
  return {
    serviceId: "monthly_marketing",
    name: catalog.name,
    unit: "monthly",
    min: Math.max(catalog.priceMin, target - spread),
    max: Math.min(catalog.priceMax, target + spread),
    notes: "Paid advertising spend is billed separately from this management fee.",
  };
}

function priceCustomWebApp(state: EstimatorState, catalog: ServiceDefinition): { line: ServiceLine; customQuote: boolean } {
  const scope = state.scope.webApp;
  const hasProblem = !!scope?.problemToSolve && scope.problemToSolve.trim().length >= 15;
  const hasUsers = !!scope?.primaryUsers && scope.primaryUsers.trim().length > 0;
  const complexityCount = scope?.extraRequirements?.filter((r) => r !== "none" && r !== "not_sure").length ?? 0;

  const wellScoped = hasProblem && hasUsers;
  const customQuote = !wellScoped || complexityCount >= 2;

  return {
    line: {
      serviceId: "custom_web_app",
      name: catalog.name,
      unit: "one_time",
      min: catalog.priceMin,
      max: catalog.priceMax,
      notes: customQuote ? "Custom quotation required — scope is complex or not yet fully described." : undefined,
    },
    customQuote,
  };
}

function priceFlat(catalog: ServiceDefinition): ServiceLine {
  return {
    serviceId: catalog.id,
    name: catalog.name,
    unit: catalog.unit,
    min: catalog.priceMin,
    max: catalog.priceMax,
  };
}

const SERVICE_TIMELINE_WEEKS: Record<ServiceId, [number, number]> = {
  logo_design: [1, 2],
  brand_foundation: [2, 4],
  landing_page: [1, 3],
  business_website: [3, 6],
  ecommerce_website: [5, 10],
  social_profile_setup: [1, 1],
  social_media_launch: [2, 4],
  monthly_marketing: [1, 1],
  seo: [1, 3],
  custom_web_app: [8, 16],
  content_creation: [1, 3],
  video_production: [2, 4],
  domain_email_setup: [1, 1],
};

const UPGRADE_SUGGESTIONS: Partial<Record<ServiceId, ServiceId[]>> = {
  logo_design: ["brand_foundation"],
  business_website: ["seo", "domain_email_setup"],
  landing_page: ["seo", "domain_email_setup"],
  ecommerce_website: ["seo", "monthly_marketing"],
  social_media_launch: ["monthly_marketing", "content_creation"],
  brand_foundation: ["logo_design"],
};

const FUTURE_EXPANSION_COPY: Partial<Record<ServiceId, string>> = {
  monthly_marketing: "Ongoing monthly marketing and growth once the core build launches.",
  custom_web_app: "A custom web application to automate workflows as the business scales.",
  ecommerce_website: "An online store to sell products once the brand is established.",
  video_production: "Video content to support future campaigns.",
};

export function calculateEstimate(state: EstimatorState, activeServices?: readonly ServiceDefinition[]): PricingResult {
  const catalog = serviceMap(activeServices);
  const selected = (state.services.selectedServices ?? []).filter((id: ServiceId) => catalog.has(id));

  const breakdown: ServiceLine[] = [];
  let customQuotationRequired = false;

  for (const id of selected) {
    const definition = catalog.get(id)!;
    switch (id) {
      case "logo_design":
        breakdown.push(priceLogo(state, definition));
        break;
      case "landing_page":
      case "business_website":
        breakdown.push(priceWebsite(state, definition, id));
        break;
      case "ecommerce_website":
        breakdown.push(priceEcommerce(state, definition));
        break;
      case "seo":
        breakdown.push(priceSeo(state, definition));
        break;
      case "social_media_launch":
        breakdown.push(priceSocialLaunch(state, definition));
        break;
      case "monthly_marketing":
        breakdown.push(priceMarketing(state, definition));
        break;
      case "custom_web_app": {
        const { line, customQuote } = priceCustomWebApp(state, definition);
        breakdown.push(line);
        if (customQuote) customQuotationRequired = true;
        break;
      }
      default:
        breakdown.push(priceFlat(definition));
    }
  }

  const oneTimeLines = breakdown.filter((l) => l.unit === "one_time");
  const monthlyLines = breakdown.filter((l) => l.unit === "monthly");

  const oneTimeMin = oneTimeLines.reduce((sum, l) => sum + l.min, 0);
  const oneTimeMax = oneTimeLines.reduce((sum, l) => sum + l.max, 0);
  const monthlyMin = monthlyLines.reduce((sum, l) => sum + l.min, 0);
  const monthlyMax = monthlyLines.reduce((sum, l) => sum + l.max, 0);

  const essentialLaunch: PricingBundle = {
    title: "Essential Launch",
    description: "The core deliverables needed to launch, priced at the lean end of your selected scope.",
    min: oneTimeLines.reduce((sum, l) => sum + l.min, 0),
    max: round(oneTimeLines.reduce((sum, l) => sum + l.min, 0) * 1.15),
    includedServiceIds: oneTimeLines.map((l) => l.serviceId),
  };

  const recommendedSolution: PricingBundle = {
    title: "Recommended Solution",
    description: "The full recommended scope based on everything you've told us so far.",
    min: oneTimeMin,
    max: oneTimeMax,
    includedServiceIds: oneTimeLines.map((l) => l.serviceId),
  };

  const optionalUpgrades: UpgradeSuggestion[] = [];
  const seen = new Set<ServiceId>(selected);
  for (const id of selected) {
    for (const upgradeId of UPGRADE_SUGGESTIONS[id as ServiceId] ?? []) {
      if (seen.has(upgradeId)) continue;
      seen.add(upgradeId);
      const def = catalog.get(upgradeId);
      if (!def) continue;
      optionalUpgrades.push({
        serviceId: upgradeId,
        name: def.name,
        min: def.priceMin,
        max: def.priceMax,
        reason: `Pairs well with ${catalog.get(id)?.name}.`,
      });
    }
  }

  const futureExpansion = Object.entries(FUTURE_EXPANSION_COPY)
    .filter(([id]) => !seen.has(id as ServiceId))
    .map(([, copy]) => copy as string)
    .slice(0, 3);

  const weeksMin = selected.reduce((sum: number, id: ServiceId) => sum + (SERVICE_TIMELINE_WEEKS[id]?.[0] ?? 2), 0);
  const weeksMaxRaw = selected.reduce((sum: number, id: ServiceId) => sum + (SERVICE_TIMELINE_WEEKS[id]?.[1] ?? 4), 0);
  // Services can run partly in parallel once more than one is selected.
  const parallelDiscount = selected.length > 1 ? 0.65 : 1;
  const weeksMax = Math.max(weeksMin, Math.round(weeksMaxRaw * parallelDiscount));

  const missing = getMissingRequiredConcepts(state);
  const missingScopeAnswers = countUnansweredScopeSignals(state, selected);

  let confidence: EstimateConfidence = "high";
  if (missing.length > 0 || customQuotationRequired) confidence = "low";
  else if (missingScopeAnswers > 0) confidence = "medium";

  const assumptions = buildAssumptions(state, selected);
  if (missingScopeAnswers > 0) {
    assumptions.push("Some details were left as \"Not Sure\" — the range above has been widened to stay realistic.");
  }

  return {
    oneTimeMin,
    oneTimeMax,
    monthlyMin,
    monthlyMax,
    serviceBreakdown: breakdown,
    essentialLaunch,
    recommendedSolution,
    optionalUpgrades: optionalUpgrades.slice(0, 4),
    futureExpansion,
    assumptions,
    exclusions: STANDARD_EXCLUSIONS,
    estimatedTimelineLabel: selected.length === 0 ? "To be discussed" : `${weeksMin}-${weeksMax} weeks`,
    estimatedTimelineWeeksMin: weeksMin,
    estimatedTimelineWeeksMax: weeksMax,
    confidence,
    customQuotationRequired,
  };
}

function countUnansweredScopeSignals(state: EstimatorState, selected: ServiceId[]): number {
  let count = 0;
  if (selected.includes("logo_design") && !state.scope.logo?.logoLevel) count++;
  if (selected.includes("ecommerce_website") && !state.scope.ecommerce?.advancedFeatures?.length) count++;
  if (selected.includes("social_media_launch") && !state.scope.socialLaunch?.postQuantity) count++;
  if (selected.includes("monthly_marketing") && !state.scope.marketing?.contentQuantity) count++;
  if (selected.includes("seo") && !state.scope.seo?.pageCount) count++;
  if (selected.includes("custom_web_app") && !state.scope.webApp?.problemToSolve) count++;
  return count;
}

function buildAssumptions(state: EstimatorState, selected: ServiceId[]): string[] {
  const assumptions: string[] = [];
  if (selected.includes("business_website") || selected.includes("landing_page")) {
    assumptions.push("Website pricing assumes standard content is supplied by the client unless stated otherwise.");
  }
  if (selected.includes("ecommerce_website")) {
    assumptions.push("E-commerce pricing assumes product data and photography are provided in a usable format.");
  }
  if (selected.includes("seo")) {
    assumptions.push("SEO pricing covers one-time setup only; ongoing monthly SEO support is quoted separately.");
  }
  if (state.timeline.expectedInvestment === "not_sure" || !state.timeline.expectedInvestment) {
    assumptions.push("No budget range was provided, so this estimate reflects standard scope for the selected services.");
  }
  if (selected.length === 0) {
    assumptions.push("No services were confirmed yet — this is a placeholder range pending a quick consultation.");
  }
  return assumptions;
}
