/**
 * Minimal first-party analytics event tracker. Never send project
 * description text or any free-text answer content here — only event
 * names and small structured metadata (step ids, numbers, booleans).
 */
export type AnalyticsEvent =
  | "estimator_started"
  | "project_description_completed"
  | "services_confirmed"
  | "estimator_step_completed"
  | "estimator_abandoned"
  | "estimate_generated"
  | "refine_estimate_opened"
  | "whatsapp_clicked"
  | "email_clicked"
  | "contact_page_clicked"
  | "estimate_downloaded"
  | "pricing_estimator_clicked";

const SAFE_KEYS = new Set(["step", "stepNumber", "reference", "confidence", "serviceCount", "abandonmentStep"]);

function sanitizeMetadata(metadata: Record<string, unknown>) {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SAFE_KEYS.has(key) && (typeof value === "string" || typeof value === "number" || typeof value === "boolean")) {
      safe[key] = value;
    }
  }
  return safe;
}

export function trackEvent(event: AnalyticsEvent, metadata: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const payload = { event, ...sanitizeMetadata(metadata), timestamp: Date.now() };

  // Placeholder sink: replace with a real analytics provider by listening
  // on window for `dravonix:analytics`, or wiring a provider SDK here.
  window.dispatchEvent(new CustomEvent("dravonix:analytics", { detail: payload }));

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", payload);
  }
}
