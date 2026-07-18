import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { publicEnv } from "@/lib/env";
import { PwaRegister } from "@/components/pwa-register";
import { RuntimeEnv } from "@/components/runtime-env";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// Force every route to render per-request rather than being statically
// prerendered at build time. Without this, Next.js froze pages like `/`
// and `/admin/login` as static HTML generated during the Cloudflare CI
// build — baking in whatever <RuntimeEnv /> read at that moment (empty,
// since the CI build container doesn't have the deployed Worker's runtime
// env) and serving that same frozen HTML for every subsequent request,
// no matter what was actually configured on Cloudflare afterwards.
export const dynamic = "force-dynamic";

const siteUrl = publicEnv.NEXT_PUBLIC_ESTIMATOR_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Project Cost Estimator | Dravonix Media",
    template: "%s | Dravonix Media Estimator",
  },
  description:
    "Share your branding, website, social media or digital project requirements and receive a preliminary estimate from Dravonix Media.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Project Cost Estimator | Dravonix Media",
    description:
      "Share your branding, website, social media or digital project requirements and receive a preliminary estimate from Dravonix Media.",
    url: siteUrl,
    siteName: "Dravonix Project Estimator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Cost Estimator | Dravonix Media",
    description:
      "Share your branding, website, social media or digital project requirements and receive a preliminary estimate from Dravonix Media.",
  },
  icons: {
    icon: [
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/brand/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
  robots:
    process.env.NEXT_PUBLIC_ALLOW_INDEXING === "false"
      ? { index: false, follow: false }
      : { index: true, follow: true },
};

export const viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Dravonix Project Estimator",
    url: siteUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    provider: {
      "@type": "Organization",
      name: "Dravonix Media",
      url: publicEnv.NEXT_PUBLIC_MAIN_SITE_URL,
    },
  };

  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="antialiased bg-brand-background text-brand-text">
        <RuntimeEnv />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
