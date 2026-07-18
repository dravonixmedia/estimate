import type { EstimatorState } from "./schema";

/**
 * The one typed question registry for the whole application (rule #20).
 * Every concept a client can be asked about has exactly one entry here,
 * with one canonical key. `getMissingRequiredConcepts` (validation.ts) and
 * the visible-step engine (steps.ts) both read this list — nothing else
 * in the codebase should invent its own idea of "is this answered".
 */

export const CONCEPT_KEYS = [
  "client_name",
  "contact_method",
  "business_stage",
  "project_description",
  "selected_services",
  "logo_level",
  "website_page_count",
  "product_count",
  "privacy_accepted",
  "contact_consent",
] as const;

export type ConceptKey = (typeof CONCEPT_KEYS)[number];

export type ConceptDefinition = {
  key: ConceptKey;
  label: string;
  /** Which visible step this concept's question lives on (for the Edit link). */
  step: number;
  /** Whether this concept is relevant at all given the current state. */
  appliesWhen: (state: EstimatorState) => boolean;
  /** Whether the concept currently has a value — direct answer, confirmed AI
   * inference, explicit "Not Sure"/"None"/N/A all count as answered. */
  isAnswered: (state: EstimatorState) => boolean;
  /**
   * Pricing-critical concepts are the only ones allowed to block
   * submission (rule #15 / validation architecture). Everything else
   * widens the estimate range instead of blocking.
   */
  blocksSubmission: boolean;
};

function hasText(value: string | undefined | null, minLength = 1) {
  return !!value && value.trim().length >= minLength;
}

export const QUESTION_REGISTRY: readonly ConceptDefinition[] = [
  {
    key: "client_name",
    label: "Your full name",
    step: 1,
    appliesWhen: () => true,
    isAnswered: (s) => hasText(s.clientDetails.fullName, 2),
    blocksSubmission: true,
  },
  {
    key: "contact_method",
    label: "A WhatsApp number or email address",
    step: 1,
    appliesWhen: () => true,
    isAnswered: (s) => {
      const wa = s.clientDetails.whatsappNumber;
      const email = s.clientDetails.email;
      return (!!wa && wa.trim().length >= 8) || (!!email && email.trim().length > 0);
    },
    blocksSubmission: true,
  },
  {
    key: "business_stage",
    label: "Your business stage",
    step: 1,
    appliesWhen: () => true,
    isAnswered: (s) => !!s.clientDetails.businessStage,
    blocksSubmission: true,
  },
  {
    key: "project_description",
    label: "A short description of your project",
    step: 2,
    appliesWhen: () => true,
    isAnswered: (s) => hasText(s.projectIdea.description, 10),
    blocksSubmission: true,
  },
  {
    key: "selected_services",
    label: "The services you need (or Not Sure)",
    step: 3,
    appliesWhen: () => true,
    isAnswered: (s) => s.services.servicesNotSure === true || (s.services.selectedServices?.length ?? 0) > 0,
    blocksSubmission: true,
  },
  {
    key: "logo_level",
    label: "Which logo level is required",
    step: 4,
    appliesWhen: (s) => (s.services.selectedServices ?? []).includes("logo_design"),
    isAnswered: (s) => !!s.scope.logo?.logoLevel,
    blocksSubmission: true,
  },
  {
    key: "website_page_count",
    label: "Approximate website page count",
    step: 4,
    appliesWhen: (s) => {
      const services = s.services.selectedServices ?? [];
      return services.includes("business_website") || services.includes("landing_page");
    },
    isAnswered: (s) => !!s.scope.website?.pageCount,
    blocksSubmission: true,
  },
  {
    key: "product_count",
    label: "Number of products",
    step: 4,
    appliesWhen: (s) => (s.services.selectedServices ?? []).includes("ecommerce_website"),
    isAnswered: (s) => !!s.scope.ecommerce?.productCount,
    blocksSubmission: true,
  },
  {
    key: "privacy_accepted",
    label: "Privacy policy acceptance",
    step: 7,
    appliesWhen: () => true,
    isAnswered: (s) => s.review.privacyAccepted === true,
    blocksSubmission: true,
  },
  {
    key: "contact_consent",
    label: "Permission to contact you",
    step: 7,
    appliesWhen: () => true,
    isAnswered: (s) => s.review.contactConsent === true,
    blocksSubmission: true,
  },
];

export function getConcept(key: ConceptKey): ConceptDefinition {
  const concept = QUESTION_REGISTRY.find((c) => c.key === key);
  if (!concept) throw new Error(`Unknown concept key: ${key}`);
  return concept;
}
