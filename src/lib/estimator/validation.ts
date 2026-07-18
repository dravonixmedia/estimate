import type { EstimatorState } from "./schema";
import { QUESTION_REGISTRY, type ConceptDefinition } from "./registry";

export type MissingConcept = {
  key: ConceptDefinition["key"];
  label: string;
  step: number;
};

/**
 * The one shared validation function. Used for step completion, the
 * Generate button's disabled state, client-side submission, and the
 * server-side estimate API — every caller gets identical answers because
 * they all call this same function against the same canonical state.
 *
 * Only active (appliesWhen === true) AND pricing-critical
 * (blocksSubmission === true) concepts can appear here. Optional,
 * skipped, or removed-service questions never block.
 */
export function getMissingRequiredConcepts(state: EstimatorState): MissingConcept[] {
  const missing: MissingConcept[] = [];

  for (const concept of QUESTION_REGISTRY) {
    if (!concept.blocksSubmission) continue;
    if (!concept.appliesWhen(state)) continue;
    if (concept.isAnswered(state)) continue;
    missing.push({ key: concept.key, label: concept.label, step: concept.step });
  }

  return missing;
}

export function isConceptAnswered(state: EstimatorState, key: ConceptDefinition["key"]): boolean {
  const concept = QUESTION_REGISTRY.find((c) => c.key === key);
  if (!concept) return false;
  if (!concept.appliesWhen(state)) return true; // not applicable == not blocking
  return concept.isAnswered(state);
}
