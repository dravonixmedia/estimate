import { getServerEnv } from "@/lib/server-env";

declare global {
  interface Window {
    __DRAVONIX_PUBLIC_ENV__?: {
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      WHATSAPP_NUMBER: string;
    };
  }
}

/**
 * Injects browser-safe runtime config as a global on every request. This
 * exists because these values are NOT NEXT_PUBLIC_-prefixed (SUPABASE_URL/
 * SUPABASE_ANON_KEY per the project's fixed env var names) or were proven
 * unreliable when build-time inlined (WHATSAPP_NUMBER, which — even as a
 * NEXT_PUBLIC_ var — would be frozen at whatever value existed during the
 * separate Cloudflare CI build step, not the deployed Worker's actual
 * runtime config). A Server Component rendered per-request has correct
 * runtime env access, so this reads it fresh and hands it to the browser
 * as plain JSON.
 */
export function RuntimeEnv() {
  const env = getServerEnv();
  const payload = JSON.stringify({
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
    WHATSAPP_NUMBER: env.WHATSAPP_NUMBER,
  });

  return (
    <script id="dravonix-runtime-env" dangerouslySetInnerHTML={{ __html: `window.__DRAVONIX_PUBLIC_ENV__ = ${payload};` }} />
  );
}
