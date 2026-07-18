import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { publicEnv } from "@/lib/env";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

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
    icon: "/brand/icon.svg",
    apple: "/brand/icon.svg",
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
