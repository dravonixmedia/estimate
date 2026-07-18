import { nanoid } from "nanoid";

const SESSION_STORAGE_KEY = "dravonix_estimator_session_id";
const STATE_STORAGE_KEY = "dravonix_estimator_state_v1";
const STARTED_STORAGE_KEY = "dravonix_estimator_started";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return nanoid();
  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;
  const created = nanoid();
  window.localStorage.setItem(SESSION_STORAGE_KEY, created);
  return created;
}

export function saveDraftToLocalStorage<T>(payload: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Local storage can be unavailable (private browsing, quota) — the
    // estimator must keep working from in-memory state either way.
  }
}

export function loadDraftFromLocalStorage<T>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STATE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearLocalDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STATE_STORAGE_KEY);
  window.localStorage.removeItem(STARTED_STORAGE_KEY);
}

export function setEstimatorStarted(started: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STARTED_STORAGE_KEY, started ? "1" : "0");
}

export function getEstimatorStarted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STARTED_STORAGE_KEY) === "1";
}
