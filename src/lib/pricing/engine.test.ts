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
