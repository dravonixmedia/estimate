"use client";

import * as React from "react";
import type { EstimatorState } from "@/lib/estimator/schema";
import { createEmptyEstimatorState } from "@/lib/estimator/schema";
import { getVisibleSteps, resolveNearestVisibleStep, type StepId, type VisibleStep } from "@/lib/estimator/steps";
import { getMissingRequiredConcepts, type MissingConcept } from "@/lib/estimator/validation";
import {
  clearLocalDraft,
  getOrCreateSessionId,
  loadDraftFromLocalStorage,
  saveDraftToLocalStorage,
} from "@/lib/estimator/session";
import { trackEvent } from "@/lib/analytics";

type PersistedDraft = {
  state: EstimatorState;
  currentStepId: StepId;
};

type EstimatorContextValue = {
  state: EstimatorState;
  updateState: (patch: Partial<EstimatorState> | ((prev: EstimatorState) => EstimatorState)) => void;
  visibleSteps: VisibleStep[];
  currentStepId: StepId;
  goToStep: (id: StepId) => void;
  goNext: () => void;
  goBack: () => void;
  missingConcepts: MissingConcept[];
  resetEstimator: () => void;
};

const EstimatorContext = React.createContext<EstimatorContextValue | null>(null);

export function EstimatorProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<EstimatorState>(() => createEmptyEstimatorState("pending"));
  const [currentStepId, setCurrentStepId] = React.useState<StepId>("client_details");
  const [hydrated, setHydrated] = React.useState(false);

  // Hydrate from localStorage (or a fresh session) on mount only.
  React.useEffect(() => {
    const sessionId = getOrCreateSessionId();
    const draft = loadDraftFromLocalStorage<PersistedDraft>();
    if (draft && draft.state.sessionId === sessionId) {
      setState(draft.state);
      setCurrentStepId(draft.currentStepId);
    } else {
      setState(createEmptyEstimatorState(sessionId));
    }
    setHydrated(true);
  }, []);

  // Autosave on every change once hydrated.
  React.useEffect(() => {
    if (!hydrated) return;
    saveDraftToLocalStorage<PersistedDraft>({ state, currentStepId });
  }, [state, currentStepId, hydrated]);

  // Server-side draft save, once a contact method is available — debounced
  // and best-effort. Local autosave (above) already covers same-browser
  // recovery; this covers a client who returns on a different device.
  React.useEffect(() => {
    if (!hydrated) return;
    const hasContact = !!state.clientDetails.whatsappNumber || !!state.clientDetails.email;
    if (!hasContact) return;

    const timeout = setTimeout(() => {
      fetch("/api/leads/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      }).catch(() => {
        // Best-effort only — local autosave already protects this session.
      });
    }, 1500);

    return () => clearTimeout(timeout);
  }, [state, hydrated]);

  const visibleSteps = React.useMemo(() => getVisibleSteps(state), [state]);

  // If state changes make the current step invisible (e.g. a service was
  // removed), move to the nearest valid visible step instead of stranding
  // the client on a screen that no longer renders anything.
  React.useEffect(() => {
    const resolved = resolveNearestVisibleStep(state, currentStepId);
    if (resolved !== currentStepId) setCurrentStepId(resolved);
  }, [state, currentStepId]);

  const updateState = React.useCallback((patch: Partial<EstimatorState> | ((prev: EstimatorState) => EstimatorState)) => {
    setState((prev) => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      return { ...next, updatedAt: new Date().toISOString() };
    });
  }, []);

  const goToStep = React.useCallback((id: StepId) => {
    setCurrentStepId(id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goNext = React.useCallback(() => {
    const steps = getVisibleSteps(state);
    const index = steps.findIndex((s) => s.id === currentStepId);
    trackEvent("estimator_step_completed", { step: currentStepId, stepNumber: index + 1 });
    if (index >= 0 && index < steps.length - 1) {
      goToStep(steps[index + 1].id);
    }
  }, [state, currentStepId, goToStep]);

  const goBack = React.useCallback(() => {
    const steps = getVisibleSteps(state);
    const index = steps.findIndex((s) => s.id === currentStepId);
    if (index > 0) goToStep(steps[index - 1].id);
  }, [state, currentStepId, goToStep]);

  const missingConcepts = React.useMemo(() => getMissingRequiredConcepts(state), [state]);

  const resetEstimator = React.useCallback(() => {
    clearLocalDraft();
    const sessionId = getOrCreateSessionId();
    setState(createEmptyEstimatorState(sessionId));
    setCurrentStepId("client_details");
  }, []);

  const value: EstimatorContextValue = {
    state,
    updateState,
    visibleSteps,
    currentStepId,
    goToStep,
    goNext,
    goBack,
    missingConcepts,
    resetEstimator,
  };

  return <EstimatorContext.Provider value={value}>{children}</EstimatorContext.Provider>;
}

export function useEstimator() {
  const ctx = React.useContext(EstimatorContext);
  if (!ctx) throw new Error("useEstimator must be used within an EstimatorProvider");
  return ctx;
}
