import type { NextConfig } from "next";

const basePath = (process.env.NEXT_PUBLIC_ESTIMATOR_BASE_PATH ?? "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Supports a future mount at https://www.dravonixmedia.com/pricing/estimate
  // without code changes — set NEXT_PUBLIC_ESTIMATOR_BASE_PATH when deployed
  // under a sub-path. Empty string (default) keeps the app at the domain root.
  basePath: basePath || undefined,
  // The Supabase anon key is safe to ship to the browser by design, but the
  // project spec names the vars without the NEXT_PUBLIC_ prefix. `env` inlines
  // them at build time the same way NEXT_PUBLIC_* vars are inlined, without
  // renaming them.
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
