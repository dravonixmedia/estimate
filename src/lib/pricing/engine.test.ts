import { describe, it, expect } from "vitest";
import { calculateEstimate } from "./engine";
import { buildEstimatorState, withClientDetails } from "@/lib/estimator/fixtures";

describe("calculateEstimate", () => {
  it("prices logo design within the basic tier when Basic Logo is selected", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["logo_design"], servicesNotSure: false },
        scope: { logo: { logoLevel: "basic" } },
      })
    );
    const result = calculateEstimate(state);
    expect(result.oneTimeMin).toBe(2000);
    expect(result.oneTimeMax).toBe(3000);
  });

  it("never defaults SEO to the maximum tier automatically", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["seo"], servicesNotSure: false },
        scope: { seo: {} },
      })
    );
    const result = calculateEstimate(state);
    // No scope signals answered -> basic tier, not the 6000 ceiling.
    expect(result.oneTimeMax).toBe(4000);
  });

  it("scales SEO toward the advanced tier when multiple complexity signals are present", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["seo"], servicesNotSure: false },
        scope: {
          seo: {
            pageCount: "20+",
            keywordResearchRequired: "yes",
            technicalIssuesKnown: "yes",
            searchConsoleConnected: "no",
          },
        },
      })
    );
    const result = calculateEstimate(state);
    expect(result.oneTimeMin).toBe(5000);
    expect(result.oneTimeMax).toBe(6000);
  });

  it("keeps monthly marketing pricing separate from one-time totals", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["monthly_marketing"], servicesNotSure: false },
        scope: { marketing: { contentQuantity: "medium" } },
      })
    );
    const result = calculateEstimate(state);
    expect(result.oneTimeMin).toBe(0);
    expect(result.oneTimeMax).toBe(0);
    expect(result.monthlyMin).toBeGreaterThan(0);
  });

  it("flags custom_web_app as needing a custom quotation when scope is thin", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["custom_web_app"], servicesNotSure: false },
        scope: { webApp: {} },
      })
    );
    const result = calculateEstimate(state);
    expect(result.customQuotationRequired).toBe(true);
  });

  it("does not flag a custom quotation when the web app scope is well described", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["custom_web_app"], servicesNotSure: false },
        scope: {
          webApp: {
            problemToSolve: "We need to manage bookings and staff schedules across three locations.",
            primaryUsers: "Staff and front-desk managers",
            extraRequirements: ["none"],
          },
        },
      })
    );
    const result = calculateEstimate(state);
    expect(result.customQuotationRequired).toBe(false);
  });

  it("returns low confidence when required concepts are missing", () => {
    const state = withClientDetails(
      buildEstimatorState({ services: { selectedServices: ["business_website"], servicesNotSure: false } })
    );
    const result = calculateEstimate(state);
    expect(result.confidence).toBe("low");
  });

  it("returns a zero-cost placeholder range when no services are selected (Not Sure)", () => {
    const state = withClientDetails(buildEstimatorState({ services: { selectedServices: [], servicesNotSure: true } }));
    const result = calculateEstimate(state);
    expect(result.oneTimeMin).toBe(0);
    expect(result.oneTimeMax).toBe(0);
    expect(result.assumptions.length).toBeGreaterThan(0);
  });

  it("suggests SEO and domain/email as upgrades for a standalone business website", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["business_website"], servicesNotSure: false },
        scope: { website: { pageCount: "2-5" } },
      })
    );
    const result = calculateEstimate(state);
    const upgradeIds = result.optionalUpgrades.map((u) => u.serviceId);
    expect(upgradeIds).toContain("seo");
  });
});

describe("calculateEstimate — combined-project adjustment", () => {
  // brand_foundation (₹12,000 flat) and social_profile_setup (₹5,000 flat)
  // both go through the plain priceFlat() path (no scope-based pricing
  // function), so their line totals are exact and deterministic — ideal
  // for asserting the adjustment percentage math precisely.
  it("TEST 1 — a single eligible one-time service gets no adjustment", () => {
    const state = withClientDetails(
      buildEstimatorState({ services: { selectedServices: ["brand_foundation"], servicesNotSure: false } })
    );
    const result = calculateEstimate(state);
    expect(result.combinedProjectAdjustment.percentage).toBe(0);
    expect(result.combinedProjectAdjustment.eligibleOneTimeServiceCount).toBe(1);
    expect(result.oneTimeMin).toBe(12000);
    expect(result.oneTimeMax).toBe(12000);
  });

  it("TEST 2 — two eligible one-time services get a 5% combined-project adjustment", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["brand_foundation", "social_profile_setup"], servicesNotSure: false },
      })
    );
    const result = calculateEstimate(state);
    // subtotal 17000, 5% = 850 (kept precise for the admin-facing figure)
    expect(result.combinedProjectAdjustment.percentage).toBe(0.05);
    expect(result.combinedProjectAdjustment.oneTimeSubtotalMin).toBe(17000);
    expect(result.combinedProjectAdjustment.adjustmentAmountMin).toBe(850);
    // final customer-facing total is rounded to the nearest ₹500
    expect(result.oneTimeMin).toBe(16000);
  });

  it("TEST 3 — three eligible one-time services get an 8% combined-project adjustment", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: ["brand_foundation", "social_profile_setup", "content_creation"],
          servicesNotSure: false,
        },
      })
    );
    const result = calculateEstimate(state);
    expect(result.combinedProjectAdjustment.percentage).toBe(0.08);
    expect(result.combinedProjectAdjustment.eligibleOneTimeServiceCount).toBe(3);
  });

  it("TEST 4 — four or more eligible one-time services get a 10% combined-project adjustment (matches worked example)", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: ["brand_foundation", "business_website", "seo", "social_profile_setup"],
          servicesNotSure: false,
        },
        scope: { website: { pageCount: "1" } },
      })
    );
    const result = calculateEstimate(state);
    expect(result.combinedProjectAdjustment.percentage).toBe(0.1);
    expect(result.combinedProjectAdjustment.eligibleOneTimeServiceCount).toBe(4);
  });

  it("TEST 5 — one one-time service plus one monthly service stays fully separate, never a combined total", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["brand_foundation", "monthly_marketing"], servicesNotSure: false },
        scope: { marketing: { contentQuantity: "medium" } },
      })
    );
    const result = calculateEstimate(state);
    expect(result.combinedProjectAdjustment.percentage).toBe(0); // only 1 eligible one-time service
    expect(result.oneTimeMin).toBe(12000);
    expect(result.oneTimeMax).toBe(12000);
    expect(result.monthlyMin).toBeGreaterThan(0);
    expect(result.serviceBreakdown.find((l) => l.serviceId === "monthly_marketing")?.unit).toBe("monthly");
  });

  it("TEST 6 — four one-time services + monthly marketing: 10% applies only to the one-time subtotal", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: [
            "brand_foundation",
            "business_website",
            "seo",
            "social_profile_setup",
            "monthly_marketing",
          ],
          servicesNotSure: false,
        },
        scope: { website: { pageCount: "1" }, marketing: { contentQuantity: "medium" } },
      })
    );
    const result = calculateEstimate(state);
    expect(result.combinedProjectAdjustment.percentage).toBe(0.1);
    expect(result.combinedProjectAdjustment.eligibleOneTimeServiceCount).toBe(4);
    expect(result.monthlyMin).toBeGreaterThan(0);
    // Monthly total is untouched by the one-time adjustment percentage.
    const marketingLine = result.serviceBreakdown.find((l) => l.serviceId === "monthly_marketing")!;
    expect(result.monthlyMin).toBe(marketingLine.min);
    expect(result.monthlyMax).toBe(marketingLine.max);
  });

  it("TEST 7 — a monthly-only selection never fabricates a fake upfront one-time cost", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["monthly_marketing"], servicesNotSure: false },
        scope: { marketing: { contentQuantity: "low" } },
      })
    );
    const result = calculateEstimate(state);
    expect(result.oneTimeMin).toBe(0);
    expect(result.oneTimeMax).toBe(0);
    expect(result.combinedProjectAdjustment.percentage).toBe(0);
    expect(result.monthlyMin).toBeGreaterThan(0);
  });

  it("TEST 8 — services are not auto-excluded as overlaps unless explicitly configured (none are, today)", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: ["ecommerce_website", "business_website", "brand_foundation", "logo_design"],
          servicesNotSure: false,
        },
      })
    );
    const result = calculateEstimate(state);
    // No relationship between these is established anywhere else in the
    // app (see audit notes), so none should be silently dropped.
    expect(result.excludedOverlapServiceIds).toEqual([]);
    expect(result.serviceBreakdown.map((l) => l.serviceId).sort()).toEqual(
      ["brand_foundation", "business_website", "ecommerce_website", "logo_design"].sort()
    );
  });

  it("TEST 9 — a duplicate service id in the selection is only charged once", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: ["brand_foundation", "brand_foundation", "social_profile_setup"] as never,
          servicesNotSure: false,
        },
      })
    );
    const result = calculateEstimate(state);
    expect(result.serviceBreakdown.filter((l) => l.serviceId === "brand_foundation")).toHaveLength(1);
    expect(result.combinedProjectAdjustment.eligibleOneTimeServiceCount).toBe(2);
    expect(result.combinedProjectAdjustment.oneTimeSubtotalMin).toBe(17000);
  });

  it("excludes configured non-eligible services (domain/email setup, custom web app) from the adjustment tier while still charging them in full", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: ["brand_foundation", "social_profile_setup", "domain_email_setup"],
          servicesNotSure: false,
        },
      })
    );
    const result = calculateEstimate(state);
    // Only the 2 eligible services count toward the tier (still 5%, not 8%).
    expect(result.combinedProjectAdjustment.eligibleOneTimeServiceCount).toBe(2);
    expect(result.combinedProjectAdjustment.percentage).toBe(0.05);
    expect(result.combinedProjectAdjustment.excludedFromAdjustmentServiceIds).toEqual(["domain_email_setup"]);
    // domain_email_setup (₹1,500 flat) is still added at full price.
    const domainLine = result.serviceBreakdown.find((l) => l.serviceId === "domain_email_setup")!;
    expect(result.oneTimeMin).toBe(16000 + domainLine.min);
  });

  it("never labels the combined-project adjustment as a discount anywhere in the pricing result", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: ["brand_foundation", "business_website", "seo", "social_profile_setup"],
          servicesNotSure: false,
        },
        scope: { website: { pageCount: "1" } },
      })
    );
    const result = calculateEstimate(state);
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain("discount");
    expect(serialized).not.toContain("you saved");
  });
});
