import { createEmptyEstimatorState, type EstimatorState } from "./schema";

type StateOverrides = Partial<Omit<EstimatorState, "services" | "scope">> & {
  services?: Partial<EstimatorState["services"]>;
  scope?: EstimatorState["scope"];
};

/** Test/dev helper: builds a valid estimator state with sensible defaults,
 * overridable via a deep-ish partial. Not used in production code paths. */
export function buildEstimatorState(overrides: StateOverrides = {}): EstimatorState {
  const base = createEmptyEstimatorState("test-session");
  return {
    ...base,
    ...overrides,
    clientDetails: { ...base.clientDetails, ...overrides.clientDetails },
    projectIdea: { ...base.projectIdea, ...overrides.projectIdea },
    services: { ...base.services, ...overrides.services },
    scope: { ...base.scope, ...overrides.scope },
    timeline: { ...base.timeline, ...overrides.timeline },
    review: { ...base.review, ...overrides.review },
    attribution: { ...base.attribution, ...overrides.attribution },
  };
}

export function withClientDetails(state: EstimatorState): EstimatorState {
  return {
    ...state,
    clientDetails: {
      fullName: "Asha Menon",
      whatsappNumber: "919999999999",
      businessStage: "existing_business",
    },
    projectIdea: { description: "I need a five page business website with a contact form and gallery." },
    review: { privacyAccepted: true, contactConsent: true },
  };
}
