import type { NextConfig } from "next";

const basePath = (process.env.NEXT_PUBLIC_ESTIMATOR_BASE_PATH ?? "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Supports a future mount at https://www.dravonixmedia.com/pricing/estimate
  // without code changes — set NEXT_PUBLIC_ESTIMATOR_BASE_PATH when deployed
  // under a sub-path. Empty string (default) keeps the app at the domain root.
  basePath: basePath || undefined,
  // Deliberately NOT using next.config's `env` field for SUPABASE_URL/
  // SUPABASE_ANON_KEY: that field bakes `process.env.X` into the compiled
  // bundle at BUILD time, and on Cloudflare Workers Builds the dashboard's
  // runtime Variables/Secrets aren't available during the separate build
  // step — that froze both vars as empty, permanently overriding whatever
  // was actually configured on the deployed Worker. See
  // src/components/runtime-env.tsx for how the browser gets these values
  // instead (injected per-request from the root layout, which does have
  // correct runtime env access).
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
