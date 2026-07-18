import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Server-only secrets and Supabase/Claude config.
 *
 * On Cloudflare Workers there is NO automatic bridge from the dashboard's
 * configured Variables/Secrets into `process.env` — that's a Node.js-only
 * concept. The only documented way to read a Worker's bindings is
 * `getCloudflareContext().env` (see @opennextjs/cloudflare docs). This
 * works synchronously in production because the Worker entrypoint sets it
 * on the global scope before Next.js ever runs. It falls back to
 * `process.env` for local `next dev`/`next start`, where real env vars
 * from `.env.local` work normally and the Cloudflare context isn't set up
 * unless `initOpenNextCloudflareForDev()` has been called.
 */
function readCloudflareEnv(): Record<string, string | undefined> | null {
  try {
    const env = getCloudflareContext().env as Record<string, string | undefined>;
    console.log("[server-env] getCloudflareContext() succeeded, keys:", Object.keys(env));
    return env;
  } catch (error) {
    console.log("[server-env] getCloudflareContext() threw:", error instanceof Error ? error.message : String(error));
    return null;
  }
}

export function getServerEnv() {
  const cf = readCloudflareEnv();
  const result = {
    SUPABASE_URL: cf?.SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
    SUPABASE_ANON_KEY: cf?.SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "",
    SUPABASE_SERVICE_ROLE_KEY: cf?.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    CLAUDE_API_KEY: cf?.CLAUDE_API_KEY ?? process.env.CLAUDE_API_KEY ?? "",
    CLAUDE_MODEL: cf?.CLAUDE_MODEL ?? process.env.CLAUDE_MODEL ?? "claude-sonnet-5",
  };
  console.log("[server-env] resolved (presence only):", {
    SUPABASE_URL: !!result.SUPABASE_URL,
    SUPABASE_ANON_KEY: !!result.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!result.SUPABASE_SERVICE_ROLE_KEY,
    CLAUDE_API_KEY: !!result.CLAUDE_API_KEY,
    fromCloudflareContext: !!cf,
    processEnvKeysAvailable: Object.keys(process.env).filter((k) => k.includes("SUPABASE") || k.includes("CLAUDE")),
  });
  return result;
}
