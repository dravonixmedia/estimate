"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Browser client for admin-authenticated pages only (anon key + RLS).
 * Reads config from `window.__DRAVONIX_PUBLIC_ENV__` (injected per-request
 * by <RuntimeEnv /> in the root layout) rather than `process.env` — browser
 * bundles have no real runtime env access, and build-time inlining would
 * freeze whatever value was present in the CI build container instead of
 * the deployed Worker's actual configured value. See runtime-env.tsx.
 */
export function createSupabaseBrowserClient() {
  const env = typeof window !== "undefined" ? window.__DRAVONIX_PUBLIC_ENV__ : undefined;
  if (!env?.SUPABASE_URL || !env?.SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured for this deployment.");
  }
  return createBrowserClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}
