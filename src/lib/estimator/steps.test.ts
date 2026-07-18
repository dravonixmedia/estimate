import { describe, it, expect } from "vitest";
import { getVisibleSteps, resolveNearestVisibleStep } from "./steps";
import { buildEstimatorState } from "./fixtures";

describe("getVisibleSteps", () => {
  it("shows all 7 screens when services are selected and assets/support is unresolved", () => {
    const state = buildEstimatorState({ services: { selectedServices: ["logo_design"], servicesNotSure: false } });
    const steps = getVisibleSteps(state);
    expect(steps.map((s) => s.id)).toEqual([
      "client_details",
      "project_idea",
      "confirm_services",
      "project_scope",
      "assets_support",
      "timeline_investment",
      "review_generate",
    ]);
    expect(steps.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("skips project_scope and assets_support when Not Sure is selected with no services", () => {
    const state = buildEstimatorState({ services: { selectedServices: [], servicesNotSure: true } });
    const steps = getVisibleSteps(state);
    expect(steps.map((s) => s.id)).toEqual([
      "client_details",
      "project_idea",
      "confirm_services",
      "timeline_investment",
      "review_generate",
    ]);
    // numbering has no gaps
    expect(steps.map((s) => s.number)).toEqual([1, 2, 3, 4, 5]);
  });

  it("skips assets_support once it has been resolved", () => {
    const state = buildEstimatorState({
      services: { selectedServices: ["logo_design"], servicesNotSure: false },
      assetsAndSupport: { available: [], support: ["none"] },
    });
    const steps = getVisibleSteps(state);
    expect(steps.map((s) => s.id)).not.toContain("assets_support");
  });

  it("never exceeds seven visible steps", () => {
    const state = buildEstimatorState({
      services: {
        selectedServices: ["logo_design", "brand_foundation", "business_website", "ecommerce_website", "seo", "custom_web_app"],
        servicesNotSure: false,
      },
    });
    expect(getVisibleSteps(state).length).toBeLessThanOrEqual(7);
  });
});

describe("resolveNearestVisibleStep", () => {
  it("moves to the nearest visible step when a service is removed", () => {
    const withService = buildEstimatorState({ services: { selectedServices: ["logo_design"], servicesNotSure: false } });
    // Now simulate removing the service — project_scope disappears.
    const withoutService = buildEstimatorState({ services: { selectedServices: [], servicesNotSure: true } });

    const resolved = resolveNearestVisibleStep(withoutService, "project_scope");
    expect(resolved).not.toBe("project_scope");
    expect(getVisibleSteps(withoutService).map((s) => s.id)).toContain(resolved);
    // sanity: the step existed while the service was selected
    expect(getVisibleSteps(withService).map((s) => s.id)).toContain("project_scope");
  });

  it("keeps the current step if it is still visible", () => {
    const state = buildEstimatorState({ services: { selectedServices: ["logo_design"], servicesNotSure: false } });
    expect(resolveNearestVisibleStep(state, "confirm_services")).toBe("confirm_services");
  });
});
