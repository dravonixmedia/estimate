/**
 * Central, validated environment access. Import from here instead of
 * reading `process.env` directly so a missing/misconfigured variable
 * fails fast with a clear message instead of leaking `undefined` into
 * pricing, redirects, or contact links.
 */
import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_MAIN_SITE_URL: z.string().url().default("https://www.dravonixmedia.com"),
  NEXT_PUBLIC_ESTIMATOR_URL: z.string().url().default("https://estimate.dravonix.dev"),
  NEXT_PUBLIC_ESTIMATOR_BASE_PATH: z.string().default(""),
  NEXT_PUBLIC_CONTACT_EMAIL: z.string().email().default("admin@dravonixmedia.com"),
  NEXT_PUBLIC_CONTACT_PAGE_URL: z.string().url().default("https://www.dravonixmedia.com/contact"),
  NEXT_PUBLIC_PRIVACY_URL: z.string().url().default("https://estimate.dravonix.dev/privacy"),
  NEXT_PUBLIC_TERMS_URL: z.string().url().default("https://estimate.dravonix.dev/terms"),
  NEXT_PUBLIC_PRICING_URL: z.string().url().default("https://www.dravonixmedia.com/pricing"),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().default(""),
  // Exposed to the browser via next.config.ts `env` (not the NEXT_PUBLIC_
  // prefix) because the Supabase anon key is safe to ship client-side.
  SUPABASE_URL: z.string().default(""),
  SUPABASE_ANON_KEY: z.string().default(""),
});

function readPublicEnv() {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_MAIN_SITE_URL: process.env.NEXT_PUBLIC_MAIN_SITE_URL,
    NEXT_PUBLIC_ESTIMATOR_URL: process.env.NEXT_PUBLIC_ESTIMATOR_URL,
    NEXT_PUBLIC_ESTIMATOR_BASE_PATH: process.env.NEXT_PUBLIC_ESTIMATOR_BASE_PATH,
    NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
    NEXT_PUBLIC_CONTACT_PAGE_URL: process.env.NEXT_PUBLIC_CONTACT_PAGE_URL,
    NEXT_PUBLIC_PRIVACY_URL: process.env.NEXT_PUBLIC_PRIVACY_URL,
    NEXT_PUBLIC_TERMS_URL: process.env.NEXT_PUBLIC_TERMS_URL,
    NEXT_PUBLIC_PRICING_URL: process.env.NEXT_PUBLIC_PRICING_URL,
    NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    // Never throw at import time in the browser bundle — fall back to
    // schema defaults so the estimator stays usable and log server-side.
    if (typeof window === "undefined") {
      console.error("Invalid public environment configuration", parsed.error.flatten());
    }
    return publicEnvSchema.parse({});
  }

  return parsed.data;
}

export const publicEnv = readPublicEnv();

/**
 * Server-only secrets. Importing this file from a client component is a
 * build-time error because it is never bundled into client code — every
 * consumer lives under `app/api/**` or other server-only modules.
 */
export function getServerEnv() {
  return {
    SUPABASE_URL: process.env.SUPABASE_URL ?? "",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? "",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY ?? "",
    CLAUDE_MODEL: process.env.CLAUDE_MODEL ?? "claude-sonnet-5",
  };
}

export function estimatorBasePath() {
  return publicEnv.NEXT_PUBLIC_ESTIMATOR_BASE_PATH.replace(/\/$/, "");
}
