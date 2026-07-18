import { z } from "zod";

/**
 * Canonical, typed shape of everything the estimator can know about a
 * lead. This is the ONE source of truth for state shape — the wizard UI,
 * client-side validation, the AI merge step, the pricing engine, and the
 * Supabase `project_briefs.answers` column all read and write this shape.
 * Never invent a parallel ad-hoc state object.
 */

export const SERVICE_IDS = [
  "logo_design",
  "brand_foundation",
  "landing_page",
  "business_website",
  "ecommerce_website",
  "social_profile_setup",
  "social_media_launch",
  "monthly_marketing",
  "seo",
  "custom_web_app",
  "content_creation",
  "video_production",
  "domain_email_setup",
] as const;

export const serviceIdSchema = z.enum(SERVICE_IDS);

export const yesNoNotSureSchema = z.enum(["yes", "no", "not_sure"]);
export type YesNoNotSure = z.infer<typeof yesNoNotSureSchema>;

export const businessStageSchema = z.enum([
  "idea_stage",
  "new_startup",
  "existing_business",
  "rebranding",
  "expansion",
]);

export const clientDetailsObjectSchema = z.object({
  fullName: z.string().trim().min(2, "Please share your full name."),
  businessName: z.string().trim().max(120).optional(),
  whatsappNumber: z.string().trim().max(20).optional(),
  email: z.string().trim().email("Please enter a valid email address.").optional().or(z.literal("")),
  businessStage: businessStageSchema.optional(),
});

export const clientDetailsSchema = clientDetailsObjectSchema.superRefine((val, ctx) => {
  const hasWhatsapp = !!val.whatsappNumber && val.whatsappNumber.length >= 8;
  const hasEmail = !!val.email && val.email.length > 0;
  if (!hasWhatsapp && !hasEmail) {
    ctx.addIssue({
      code: "custom",
      message: "Please provide a WhatsApp number or an email address so we can reach you.",
      path: ["whatsappNumber"],
    });
  }
});

export type ClientDetails = z.infer<typeof clientDetailsSchema>;

export const projectIdeaSchema = z.object({
  description: z.string().trim().min(1),
  referenceWebsite: z.string().trim().url().optional().or(z.literal("")),
  inspirationLink: z.string().trim().max(300).optional().or(z.literal("")),
});

export type ProjectIdea = z.infer<typeof projectIdeaSchema>;

export const servicesConfirmationObjectSchema = z.object({
  selectedServices: z.array(serviceIdSchema).default([]),
  servicesNotSure: z.boolean().default(false),
  aiSummaryConfirmed: z.boolean().default(false),
});

export const servicesConfirmationSchema = servicesConfirmationObjectSchema.refine(
  (val) => val.servicesNotSure || val.selectedServices.length > 0,
  {
    message: "Select at least one service, or choose Not Sure.",
    path: ["selectedServices"],
  }
);

export type ServicesConfirmation = z.infer<typeof servicesConfirmationObjectSchema>;

// --- Screen 4: project scope, one sub-schema per service family ---

export const logoScopeSchema = z.object({
  brandNameStatus: yesNoNotSureSchema.optional(),
  logoType: z.enum(["new", "redesign", "not_sure"]).optional(),
  logoLevel: z.enum(["basic", "professional", "complete", "not_sure"]).optional(),
  conceptCount: z.enum(["1", "2-3", "4+", "not_sure"]).optional(),
  urgent: yesNoNotSureSchema.optional(),
});

export const brandScopeSchema = z.object({
  brandNameStatus: yesNoNotSureSchema.optional(),
  namingSupportNeeded: yesNoNotSureSchema.optional(),
  brandServices: z
    .array(
      z.enum([
        "naming",
        "competitor_research",
        "positioning",
        "brand_story",
        "mission_vision",
        "tagline",
        "logo",
        "color_palette",
        "typography",
        "brand_guidelines",
        "not_sure",
      ])
    )
    .optional(),
  guidelinesRequired: yesNoNotSureSchema.optional(),
});

export const websiteScopeSchema = z.object({
  websiteType: z.enum(["landing_page", "business_website", "ecommerce_website", "not_sure"]).optional(),
  pageCount: z.enum(["1", "2-5", "6-10", "10+", "not_sure"]).optional(),
  contentReady: yesNoNotSureSchema.optional(),
  features: z
    .array(
      z.enum([
        "contact_form",
        "whatsapp_integration",
        "booking",
        "online_payments",
        "blog",
        "user_login",
        "multi_language",
        "admin_dashboard",
        "advanced_animation",
        "custom_scrolling",
        "not_sure",
      ])
    )
    .optional(),
  seoAddOnRequested: yesNoNotSureSchema.optional(),
});

export const ecommerceScopeSchema = z.object({
  productCount: z.enum(["1-20", "21-100", "101-500", "500+", "not_sure"]).optional(),
  productDetailsReady: yesNoNotSureSchema.optional(),
  onlinePaymentRequired: yesNoNotSureSchema.optional(),
  shippingIntegrationRequired: yesNoNotSureSchema.optional(),
  advancedFeatures: z
    .array(
      z.enum([
        "inventory_management",
        "customer_accounts",
        "product_variations",
        "discount_coupons",
        "order_tracking",
        "product_uploading",
        "multicurrency",
        "automated_invoices",
        "marketplace_integration",
        "not_sure",
      ])
    )
    .optional(),
});

export const socialLaunchScopeSchema = z.object({
  platforms: z
    .array(z.enum(["instagram", "facebook", "linkedin", "youtube", "tiktok", "x", "pinterest", "not_sure"]))
    .optional(),
  accountsExist: yesNoNotSureSchema.optional(),
  postQuantity: z.enum(["1-10", "11-20", "21-40", "40+", "not_sure"]).optional(),
  reelQuantity: z.enum(["0", "1-5", "6-10", "10+", "not_sure"]).optional(),
  extraNeeds: z
    .array(z.enum(["content_production", "meta_business_setup", "advertising_management", "none", "not_sure"]))
    .optional(),
});

export const marketingScopeSchema = z.object({
  platforms: z
    .array(z.enum(["instagram", "facebook", "linkedin", "youtube", "tiktok", "x", "pinterest", "not_sure"]))
    .optional(),
  objective: z
    .enum(["brand_awareness", "lead_generation", "sales", "community_growth", "not_sure"])
    .optional(),
  contentQuantity: z.enum(["low", "medium", "high", "not_sure"]).optional(),
  contentProductionRequired: yesNoNotSureSchema.optional(),
  adManagementRequired: yesNoNotSureSchema.optional(),
});

export const seoScopeSchema = z.object({
  websiteLive: yesNoNotSureSchema.optional(),
  pageCount: z.enum(["1-5", "6-10", "11-20", "20+", "not_sure"]).optional(),
  keywordResearchRequired: yesNoNotSureSchema.optional(),
  searchConsoleConnected: yesNoNotSureSchema.optional(),
  technicalIssuesKnown: yesNoNotSureSchema.optional(),
});

export const webAppScopeSchema = z.object({
  problemToSolve: z.string().trim().max(500).optional(),
  primaryUsers: z.string().trim().max(300).optional(),
  userAccountsRequired: yesNoNotSureSchema.optional(),
  adminDashboardRequired: yesNoNotSureSchema.optional(),
  extraRequirements: z
    .array(z.enum(["payments", "third_party_integrations", "mobile_installable", "none", "not_sure"]))
    .optional(),
});

export const projectScopeSchema = z.object({
  logo: logoScopeSchema.optional(),
  brand: brandScopeSchema.optional(),
  website: websiteScopeSchema.optional(),
  ecommerce: ecommerceScopeSchema.optional(),
  socialLaunch: socialLaunchScopeSchema.optional(),
  marketing: marketingScopeSchema.optional(),
  seo: seoScopeSchema.optional(),
  webApp: webAppScopeSchema.optional(),
});

export type ProjectScope = z.infer<typeof projectScopeSchema>;

/**
 * What Claude is allowed to return. `inferredAnswers` reuses the exact
 * project-scope schema (not a free-form record) so a confirmed AI
 * inference can be merged straight into `state.scope` with no separate
 * translation step — and so a malformed/hallucinated field is rejected by
 * Zod instead of silently corrupting canonical state.
 */
export const aiInterpretationSchema = z.object({
  summary: z.string().max(600),
  inferredRequirements: z.array(z.string().max(160)).max(8),
  recommendedServiceIds: z.array(serviceIdSchema).max(SERVICE_IDS.length),
  complexity: z.enum(["simple", "moderate", "complex"]),
  confidence: z.number().min(0).max(1),
  inferredAnswers: projectScopeSchema.partial().default({}),
});

export type AiInterpretation = z.infer<typeof aiInterpretationSchema>;

// --- Screen 5: assets & support (conditional) ---

export const assetKeySchema = z.enum([
  "brand_name",
  "logo",
  "brand_colours",
  "written_content",
  "photographs",
  "videos",
  "product_details",
  "domain",
  "hosting",
  "social_accounts",
  "nothing_ready",
  "not_sure",
]);

export const supportKeySchema = z.enum([
  "content_writing",
  "image_sourcing",
  "photography",
  "video_production",
  "product_uploading",
  "business_email_setup",
  "domain_hosting_setup",
  "ongoing_maintenance",
  "none",
  "not_sure",
]);

export const assetsAndSupportSchema = z.object({
  available: z.array(assetKeySchema).optional(),
  support: z.array(supportKeySchema).optional(),
});

export type AssetsAndSupport = z.infer<typeof assetsAndSupportSchema>;

// --- Screen 6: timeline & investment ---

export const launchTimeframeSchema = z.enum(["asap", "2_4_weeks", "1_2_months", "3_months", "flexible", "not_decided"]);

export const investmentRangeSchema = z.enum([
  "under_25k",
  "25k_60k",
  "60k_150k",
  "150k_350k",
  "350k_plus",
  "not_sure",
]);

export const timelineSchema = z.object({
  startWhen: z.enum(["immediately", "within_2_weeks", "within_1_month", "later", "not_decided"]).optional(),
  launchTimeframe: launchTimeframeSchema.optional(),
  deadlineFlexible: yesNoNotSureSchema.optional(),
  exactDeadlineDate: z.string().optional(),
  expectedInvestment: investmentRangeSchema.optional(),
  phasedDeliveryOk: yesNoNotSureSchema.optional(),
});

export type Timeline = z.infer<typeof timelineSchema>;

// --- Screen 7: review ---

export const reviewSchema = z.object({
  privacyAccepted: z.boolean().default(false),
  contactConsent: z.boolean().default(false),
});

export type Review = z.infer<typeof reviewSchema>;

export const attributionSchema = z.object({
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
  referrer: z.string().optional(),
});

export type Attribution = z.infer<typeof attributionSchema>;

/**
 * The full canonical estimator state. Every field is optional at the
 * schema level (screens are filled progressively) — required-ness for
 * submission is enforced by `getMissingRequiredConcepts`, not by this
 * schema being strict.
 */
export const estimatorStateSchema = z.object({
  sessionId: z.string(),
  clientDetails: clientDetailsObjectSchema.partial().default({}),
  projectIdea: projectIdeaSchema.partial().default({}),
  aiInterpretation: aiInterpretationSchema.nullable().default(null),
  services: servicesConfirmationObjectSchema.default({ selectedServices: [], servicesNotSure: false, aiSummaryConfirmed: false }),
  scope: projectScopeSchema.default({}),
  assetsAndSupport: assetsAndSupportSchema.partial().nullable().default(null),
  timeline: timelineSchema.default({}),
  review: reviewSchema.default({ privacyAccepted: false, contactConsent: false }),
  attribution: attributionSchema.default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type EstimatorState = z.infer<typeof estimatorStateSchema>;

export function createEmptyEstimatorState(sessionId: string): EstimatorState {
  return {
    sessionId,
    clientDetails: {},
    projectIdea: {},
    aiInterpretation: null,
    services: { selectedServices: [], servicesNotSure: false, aiSummaryConfirmed: false },
    scope: {},
    assetsAndSupport: null,
    timeline: {},
    review: { privacyAccepted: false, contactConsent: false },
    attribution: {},
  };
}
