import type { EstimatorState } from "./schema";

export type StepId =
  | "client_details"
  | "project_idea"
  | "confirm_services"
  | "project_scope"
  | "assets_support"
  | "timeline_investment"
  | "review_generate";

export type StepDefinition = {
  id: StepId;
  title: string;
  /** Whether this screen has anything to show given the current state. */
  isVisible: (state: EstimatorState) => boolean;
};

function hasSelectedServices(state: EstimatorState): boolean {
  return (state.services.selectedServices?.length ?? 0) > 0;
}

/**
 * Project Scope only has content when at least one selected service has a
 * dedicated scope block (every catalog service does except the purely
 * content/setup ones that don't materially change price by a follow-up
 * question). If the client only picked "Not Sure", there is nothing to
 * merge questions for yet, so the screen is skipped.
 */
function scopeHasQuestions(state: EstimatorState): boolean {
  return hasSelectedServices(state);
}

/**
 * Assets & Support is conditional: skip it once the client has nothing
 * left to tell us — either because no services are confirmed yet, or
 * because the combined "what's available" / "what support do you need"
 * answers are already on file (from a direct answer or a confirmed AI
 * inference copied into canonical state on Screen 3).
 */
function assetsAndSupportIsUnresolved(state: EstimatorState): boolean {
  if (!hasSelectedServices(state)) return false;
  return state.assetsAndSupport === null;
}

/** All possible screens, in fixed order. This is the ONLY place screen
 * order and screen visibility rules are defined. */
export const STEP_DEFINITIONS: readonly StepDefinition[] = [
  { id: "client_details", title: "Client Details", isVisible: () => true },
  { id: "project_idea", title: "Project Idea", isVisible: () => true },
  { id: "confirm_services", title: "Confirm Services", isVisible: () => true },
  { id: "project_scope", title: "Project Scope", isVisible: scopeHasQuestions },
  { id: "assets_support", title: "Assets and Support", isVisible: assetsAndSupportIsUnresolved },
  { id: "timeline_investment", title: "Timeline and Investment", isVisible: () => true },
  { id: "review_generate", title: "Review and Generate", isVisible: () => true },
];

export type VisibleStep = StepDefinition & { number: number };

/** Derives the ordered, gap-free list of visible screens for the current
 * state. Every consumer (progress bar, Next/Back, saved progress, session
 * restoration, analytics, step titles) must call this — never hardcode
 * "step 5" anywhere else. */
export function getVisibleSteps(state: EstimatorState): VisibleStep[] {
  return STEP_DEFINITIONS.filter((step) => step.isVisible(state)).map((step, index) => ({
    ...step,
    number: index + 1,
  }));
}

export function getStepById(state: EstimatorState, id: StepId): VisibleStep | undefined {
  return getVisibleSteps(state).find((s) => s.id === id);
}

export function getNextStepId(state: EstimatorState, currentId: StepId): StepId | null {
  const visible = getVisibleSteps(state);
  const index = visible.findIndex((s) => s.id === currentId);
  if (index === -1 || index === visible.length - 1) return null;
  return visible[index + 1].id;
}

export function getPreviousStepId(state: EstimatorState, currentId: StepId): StepId | null {
  const visible = getVisibleSteps(state);
  const index = visible.findIndex((s) => s.id === currentId);
  if (index <= 0) return null;
  return visible[index - 1].id;
}

/** If the current step became invisible because state changed (e.g. a
 * service was removed), move the client to the nearest valid visible step. */
export function resolveNearestVisibleStep(state: EstimatorState, currentId: StepId): StepId {
  const visible = getVisibleSteps(state);
  if (visible.some((s) => s.id === currentId)) return currentId;

  const fullOrder = STEP_DEFINITIONS.map((s) => s.id);
  const originalIndex = fullOrder.indexOf(currentId);

  for (let i = originalIndex - 1; i >= 0; i--) {
    const found = visible.find((s) => s.id === fullOrder[i]);
    if (found) return found.id;
  }
  return visible[0]?.id ?? "client_details";
}
