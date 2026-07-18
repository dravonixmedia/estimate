/**
 * Canonical service catalog. This is the single list of services the
 * estimator can offer, referenced by the question registry (Screen 3),
 * the pricing engine, and the Supabase seed data. Admins may edit prices
 * and active/inactive state in Supabase — they cannot add new services
 * outside this catalog or change these ids.
 */
export type ServiceId =
  | "logo_design"
  | "brand_foundation"
  | "landing_page"
  | "business_website"
  | "ecommerce_website"
  | "social_profile_setup"
  | "social_media_launch"
  | "monthly_marketing"
  | "seo"
  | "custom_web_app"
  | "content_creation"
  | "video_production"
  | "domain_email_setup";

export type ServiceUnit = "one_time" | "monthly";

export type ServiceDefinition = {
  id: ServiceId;
  name: string;
  category: "branding" | "web" | "marketing" | "content" | "technical";
  unit: ServiceUnit;
  priceMin: number;
  priceMax: number;
  description: string;
  /** Set when the service is too variable to estimate without a manual quote. */
  manualQuotationPossible?: boolean;
};

export const SERVICE_CATALOG: readonly ServiceDefinition[] = [
  {
    id: "logo_design",
    name: "Logo Design",
    category: "branding",
    unit: "one_time",
    priceMin: 2000,
    priceMax: 6000,
    description: "A custom logo mark and wordmark for your brand.",
  },
  {
    id: "brand_foundation",
    name: "Brand Foundation",
    category: "branding",
    unit: "one_time",
    priceMin: 12000,
    priceMax: 12000,
    description: "Naming, positioning, story and full brand guideline support.",
  },
  {
    id: "landing_page",
    name: "Landing Page or Portfolio",
    category: "web",
    unit: "one_time",
    priceMin: 4000,
    priceMax: 15000,
    description: "A single-page site to introduce your business or showcase work.",
  },
  {
    id: "business_website",
    name: "Business Website",
    category: "web",
    unit: "one_time",
    priceMin: 25000,
    priceMax: 60000,
    description: "A full multi-page website for an established business.",
  },
  {
    id: "ecommerce_website",
    name: "E-commerce Website",
    category: "web",
    unit: "one_time",
    priceMin: 45000,
    priceMax: 200000,
    description: "An online store with product catalogue and checkout.",
  },
  {
    id: "social_profile_setup",
    name: "Social Media Profile Setup",
    category: "marketing",
    unit: "one_time",
    priceMin: 5000,
    priceMax: 5000,
    description: "Professional setup of your social media profiles.",
  },
  {
    id: "social_media_launch",
    name: "Social Media Launch",
    category: "marketing",
    unit: "one_time",
    priceMin: 15000,
    priceMax: 20000,
    description: "A structured launch package across your chosen platforms.",
  },
  {
    id: "monthly_marketing",
    name: "Monthly Marketing and Growth",
    category: "marketing",
    unit: "monthly",
    priceMin: 10000,
    priceMax: 25000,
    description: "Ongoing content, growth and management of your social presence.",
  },
  {
    id: "seo",
    name: "Search Engine Optimization",
    category: "marketing",
    unit: "one_time",
    priceMin: 3000,
    priceMax: 6000,
    description: "On-page and technical SEO setup for your website.",
  },
  {
    id: "custom_web_app",
    name: "Custom Web Application",
    category: "technical",
    unit: "one_time",
    priceMin: 100000,
    priceMax: 350000,
    description: "A bespoke web application built around your workflow.",
    manualQuotationPossible: true,
  },
  {
    id: "content_creation",
    name: "Content Creation",
    category: "content",
    unit: "one_time",
    priceMin: 5000,
    priceMax: 20000,
    description: "Written and visual content for your brand and channels.",
  },
  {
    id: "video_production",
    name: "Video Production",
    category: "content",
    unit: "one_time",
    priceMin: 8000,
    priceMax: 40000,
    description: "Short-form or promotional video production.",
  },
  {
    id: "domain_email_setup",
    name: "Domain and Business Email Setup",
    category: "technical",
    unit: "one_time",
    priceMin: 1500,
    priceMax: 4000,
    description: "Domain registration guidance and professional email setup.",
  },
] as const;

export function getService(id: ServiceId): ServiceDefinition {
  const service = SERVICE_CATALOG.find((s) => s.id === id);
  if (!service) throw new Error(`Unknown service id: ${id}`);
  return service;
}

export const LOGO_LEVEL_PRICING = {
  basic: { min: 2000, max: 3000, label: "Basic Logo" },
  professional: { min: 3000, max: 4500, label: "Professional Custom Logo" },
  complete: { min: 4500, max: 6000, label: "Complete Logo System" },
} as const;

export const SEO_TIER_PRICING = {
  basic: { min: 3000, max: 4000, label: "Basic SEO Setup" },
  standard: { min: 4000, max: 5000, label: "Standard SEO Optimisation" },
  advanced: { min: 5000, max: 6000, label: "Advanced SEO Setup" },
} as const;
