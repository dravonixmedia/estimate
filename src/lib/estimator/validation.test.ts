import { describe, it, expect } from "vitest";
import { getMissingRequiredConcepts, isConceptAnswered } from "./validation";
import { buildEstimatorState, withClientDetails } from "./fixtures";

describe("getMissingRequiredConcepts", () => {
  it("flags all core concepts on an empty state", () => {
    const state = buildEstimatorState();
    const missing = getMissingRequiredConcepts(state);
    const keys = missing.map((m) => m.key);
    expect(keys).toContain("client_name");
    expect(keys).toContain("contact_method");
    expect(keys).toContain("project_description");
    expect(keys).toContain("selected_services");
    expect(keys).toContain("privacy_accepted");
    expect(keys).toContain("contact_consent");
  });

  it("does not require logo_level when logo_design is not selected", () => {
    const state = withClientDetails(buildEstimatorState({ services: { selectedServices: [], servicesNotSure: true } }));
    const missing = getMissingRequiredConcepts(state);
    expect(missing.find((m) => m.key === "logo_level")).toBeUndefined();
  });

  it("blocks on logo_level when logo_design is selected but unanswered", () => {
    const state = withClientDetails(
      buildEstimatorState({ services: { selectedServices: ["logo_design"], servicesNotSure: false } })
    );
    const missing = getMissingRequiredConcepts(state);
    expect(missing.find((m) => m.key === "logo_level")).toBeDefined();
  });

  it("accepts an explicit Not Sure as answered", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["logo_design"], servicesNotSure: false },
        scope: { logo: { logoLevel: "not_sure" } },
      })
    );
    expect(isConceptAnswered(state, "logo_level")).toBe(true);
  });

  it("requires website_page_count only when a website-type service is selected", () => {
    const state = withClientDetails(
      buildEstimatorState({ services: { selectedServices: ["business_website"], servicesNotSure: false } })
    );
    const missing = getMissingRequiredConcepts(state);
    expect(missing.find((m) => m.key === "website_page_count")).toBeDefined();
  });

  it("requires product_count only when e-commerce is selected", () => {
    const state = withClientDetails(
      buildEstimatorState({ services: { selectedServices: ["ecommerce_website"], servicesNotSure: false } })
    );
    const missing = getMissingRequiredConcepts(state);
    expect(missing.find((m) => m.key === "product_count")).toBeDefined();
  });

  it("does not block on optional scope answers like website features", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["business_website"], servicesNotSure: false },
        scope: { website: { pageCount: "2-5" } },
      })
    );
    const missing = getMissingRequiredConcepts(state);
    expect(missing).toHaveLength(0);
  });

  it("accepts a flexible or not-decided launch timeframe without blocking", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: [], servicesNotSure: true },
        timeline: { launchTimeframe: "flexible" },
      })
    );
    expect(getMissingRequiredConcepts(state)).toHaveLength(0);
  });

  it("is satisfied with whatsapp OR email, not both", () => {
    const state = buildEstimatorState({
      clientDetails: { fullName: "Ravi Kumar", email: "ravi@example.com", businessStage: "idea_stage" },
      projectIdea: { description: "A landing page for my new coaching business." },
      services: { selectedServices: [], servicesNotSure: true },
      review: { privacyAccepted: true, contactConsent: true },
    });
    expect(getMissingRequiredConcepts(state).find((m) => m.key === "contact_method")).toBeUndefined();
  });
});
