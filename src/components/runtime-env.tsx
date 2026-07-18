import { getServerEnv } from "@/lib/server-env";

declare global {
  interface Window {
    __DRAVONIX_PUBLIC_ENV__?: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
    };
  }
}

/**
 * Injects browser-safe runtime config (Supabase URL + anon key) as a
 * global on every request. This exists because those two values are NOT
 * NEXT_PUBLIC_-prefixed, and on Cloudflare Workers the dashboard's
 * runtime Variables/Secrets are only visible at request time, not during
 * the separate build step — so build-time inlining (next.config's `env`
 * field, or a NEXT_PUBLIC_ rename) would freeze them incorrectly. A
 * Server Component rendered per-request has correct runtime env access,
 * so this reads it fresh and hands it to the browser as plain JSON.
 */
export function RuntimeEnv() {
  const env = getServerEnv();
  const payload = JSON.stringify({
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
  });

  return (
    <script id="dravonix-runtime-env" dangerouslySetInnerHTML={{ __html: `window.__DRAVONIX_PUBLIC_ENV__ = ${payload};` }} />
  );
}
