import { describe, it, expect } from "vitest";
import {
  getCombinedProjectAdjustmentPercentage,
  resolveOverlapExclusions,
  SERVICE_PRICING_RULES,
  type ServicePricingRule,
} from "./combined-project-config";
import type { ServiceId } from "@/lib/estimator/services";

describe("getCombinedProjectAdjustmentPercentage", () => {
  it("returns 0% for zero or one eligible service", () => {
    expect(getCombinedProjectAdjustmentPercentage(0)).toBe(0);
    expect(getCombinedProjectAdjustmentPercentage(1)).toBe(0);
  });

  it("returns 5% for exactly two eligible services", () => {
    expect(getCombinedProjectAdjustmentPercentage(2)).toBe(0.05);
  });

  it("returns 8% for exactly three eligible services", () => {
    expect(getCombinedProjectAdjustmentPercentage(3)).toBe(0.08);
  });

  it("returns 10% for four eligible services, and stays at 10% beyond that", () => {
    expect(getCombinedProjectAdjustmentPercentage(4)).toBe(0.1);
    expect(getCombinedProjectAdjustmentPercentage(5)).toBe(0.1);
    expect(getCombinedProjectAdjustmentPercentage(20)).toBe(0.1);
  });
});

describe("SERVICE_PRICING_RULES (shipped config)", () => {
  it("excludes only domain_email_setup, custom_web_app, and the recurring monthly_marketing service from the combined-project adjustment", () => {
    const excluded = (Object.entries(SERVICE_PRICING_RULES) as [ServiceId, ServicePricingRule][])
      .filter(([, rule]) => !rule.eligibleForCombinedAdjustment)
      .map(([id]) => id)
      .sort();
    expect(excluded).toEqual(["custom_web_app", "domain_email_setup", "monthly_marketing"]);
  });

  it("declares no overlaps by default — nothing is auto-excluded without explicit confirmation", () => {
    const anyOverlaps = Object.values(SERVICE_PRICING_RULES).some((rule) => rule.overlapsWith.length > 0);
    expect(anyOverlaps).toBe(false);
  });

  it("does not share a mutable overlapsWith array reference across services", () => {
    expect(SERVICE_PRICING_RULES.logo_design.overlapsWith).not.toBe(SERVICE_PRICING_RULES.brand_foundation.overlapsWith);
  });
});

describe("resolveOverlapExclusions", () => {
  it("excludes nothing when the selection has no configured overlap", () => {
    const excluded = resolveOverlapExclusions(["ecommerce_website", "business_website"]);
    expect(excluded.size).toBe(0);
  });

  it("excludes the included service when a real overlap rule is configured and both are selected (mechanism proof)", () => {
    const fakeRules = {
      ...SERVICE_PRICING_RULES,
      ecommerce_website: { eligibleForCombinedAdjustment: true, overlapsWith: ["business_website" as ServiceId] },
    };
    const excluded = resolveOverlapExclusions(["ecommerce_website", "business_website"], fakeRules);
    expect(excluded.has("business_website")).toBe(true);
    expect(excluded.size).toBe(1);
  });

  it("does not exclude the overlapping service unless it is actually selected", () => {
    const fakeRules = {
      ...SERVICE_PRICING_RULES,
      ecommerce_website: { eligibleForCombinedAdjustment: true, overlapsWith: ["business_website" as ServiceId] },
    };
    const excluded = resolveOverlapExclusions(["ecommerce_website"], fakeRules);
    expect(excluded.size).toBe(0);
  });
});
