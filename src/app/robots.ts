import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "false";

export default function robots(): MetadataRoute.Robots {
  if (!allowIndexing) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/result"] },
    ],
    sitemap: `${publicEnv.NEXT_PUBLIC_ESTIMATOR_URL}/sitemap.xml`,
  };
}
