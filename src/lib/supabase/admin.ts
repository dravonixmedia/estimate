import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getServerEnv } from "@/lib/env";

/**
 * Privileged, service-role Supabase client. Used only from server-side
 * API routes that must bypass RLS (saving a public lead, generating an
 * estimate). Never import this from a client component — the `server-only`
 * import will fail the build if it leaks into the browser bundle.
 */
export function createSupabaseAdminClient() {
  const env = getServerEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase service-role credentials are not configured.");
  }
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
