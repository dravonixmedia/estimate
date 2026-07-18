import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dravonix Project Estimator",
    short_name: "Dravonix Estimator",
    description: "Get a preliminary project estimate from Dravonix Media.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    icons: [
      { src: "/brand/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
