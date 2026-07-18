"use client";

import * as React from "react";
import { useEstimator } from "../estimator-context";
import { StepShell, StepFooter } from "../step-shell";
import { ChoiceGroup } from "../choice-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EstimatorState } from "@/lib/estimator/schema";

const YES_NO_NOT_SURE = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not_sure", label: "Not Sure" },
];

function useScopeUpdater() {
  const { updateState } = useEstimator();
  return function updateScope<K extends keyof EstimatorState["scope"]>(
    section: K,
    patch: Partial<NonNullable<EstimatorState["scope"][K]>>
  ) {
    updateState((prev) => ({
      ...prev,
      scope: { ...prev.scope, [section]: { ...(prev.scope[section] as object), ...patch } },
    }));
  };
}

export function StepProjectScope() {
  const { state, goNext, goBack, missingConcepts } = useEstimator();
  const services = state.services.selectedServices ?? [];
  const updateScope = useScopeUpdater();

  const blocks: React.ReactNode[] = [];
  if (services.includes("logo_design")) {
    blocks.push(<LogoBlock key="logo" state={state} updateScope={updateScope} />);
  }
  if (services.includes("brand_foundation")) {
    blocks.push(<BrandBlock key="brand" state={state} updateScope={updateScope} />);
  }
  if (services.includes("landing_page") || services.includes("business_website")) {
    blocks.push(<WebsiteBlock key="website" state={state} services={services} updateScope={updateScope} />);
  }
  if (services.includes("ecommerce_website")) {
    blocks.push(<EcommerceBlock key="ecommerce" state={state} updateScope={updateScope} />);
  }
  if (services.includes("social_media_launch")) {
    blocks.push(<SocialLaunchBlock key="social" state={state} updateScope={updateScope} />);
  }
  if (services.includes("monthly_marketing")) {
    blocks.push(<MarketingBlock key="marketing" state={state} updateScope={updateScope} />);
  }
  if (services.includes("seo")) {
    blocks.push(<SeoBlock key="seo" state={state} services={services} updateScope={updateScope} />);
  }
  if (services.includes("custom_web_app")) {
    blocks.push(<WebAppBlock key="webapp" state={state} updateScope={updateScope} />);
  }

  // No more than five grouped question blocks on this screen.
  const visibleBlocks = blocks.slice(0, 5);

  const relevantMissing = missingConcepts.filter((m) => m.step === 4);
  const canContinue = relevantMissing.length === 0;

  return (
    <StepShell
      heading="Tell us about your project scope"
      description="Only questions that materially affect price, timeline or deliverables."
      onBack={goBack}
    >
      <div className="space-y-5">{visibleBlocks}</div>

      {!canContinue && (
        <p className="text-sm text-brand-danger">Please complete: {relevantMissing.map((m) => m.label).join(", ")}</p>
      )}

      <StepFooter nextDisabled={!canContinue} onNext={goNext} />
    </StepShell>
  );
}

type BlockProps = { state: EstimatorState; updateScope: ReturnType<typeof useScopeUpdater> };

function LogoBlock({ state, updateScope }: BlockProps) {
  const scope = state.scope.logo ?? {};
  return (
    <ScopeCard title="Logo Design">
      <ChoiceGroup
        label="Is the brand name finalized?"
        options={YES_NO_NOT_SURE}
        value={scope.brandNameStatus}
        onChange={(v) => updateScope("logo", { brandNameStatus: v as never })}
      />
      <ChoiceGroup
        label="Is this a new logo or redesign?"
        options={[
          { value: "new", label: "New logo" },
          { value: "redesign", label: "Redesign" },
          { value: "not_sure", label: "Not Sure" },
        ]}
        value={scope.logoType}
        onChange={(v) => updateScope("logo", { logoType: v as never })}
      />
      <ChoiceGroup
        label="Which logo level is required?"
        options={[
          { value: "basic", label: "Basic Logo" },
          { value: "professional", label: "Professional Custom Logo" },
          { value: "complete", label: "Complete Logo System" },
          { value: "not_sure", label: "Not Sure" },
        ]}
        value={scope.logoLevel}
        onChange={(v) => updateScope("logo", { logoLevel: v as never })}
      />
      <ChoiceGroup
        label="How many initial concepts are expected?"
        options={[
          { value: "1", label: "1" },
          { value: "2-3", label: "2-3" },
          { value: "4+", label: "4+" },
          { value: "not_sure", label: "Not Sure" },
        ]}
        value={scope.conceptCount}
        onChange={(v) => updateScope("logo", { conceptCount: v as never })}
      />
      <ChoiceGroup
        label="Is delivery urgent?"
        options={YES_NO_NOT_SURE}
        value={scope.urgent}
        onChange={(v) => updateScope("logo", { urgent: v as never })}
      />
    </ScopeCard>
  );
}

function BrandBlock({ state, updateScope }: BlockProps) {
  const scope = state.scope.brand ?? {};
  return (
    <ScopeCard title="Brand Foundation">
      <ChoiceGroup
        label="Is the brand name finalized?"
        options={YES_NO_NOT_SURE}
        value={scope.brandNameStatus}
        onChange={(v) => updateScope("brand", { brandNameStatus: v as never })}
      />
      <ChoiceGroup
        label="Is naming support required?"
        options={YES_NO_NOT_SURE}
        value={scope.namingSupportNeeded}
        onChange={(v) => updateScope("brand", { namingSupportNeeded: v as never })}
      />
      <ChoiceGroup
        label="Which brand services are required?"
        multi
        options={[
          { value: "naming", label: "Naming" },
          { value: "competitor_research", label: "Competitor research" },
          { value: "positioning", label: "Brand positioning" },
          { value: "brand_story", label: "Brand story" },
          { value: "mission_vision", label: "Mission and vision" },
          { value: "tagline", label: "Tagline" },
          { value: "logo", label: "Logo" },
          { value: "color_palette", label: "Colour palette" },
          { value: "typography", label: "Typography" },
          { value: "brand_guidelines", label: "Brand guidelines" },
          { value: "not_sure", label: "Not Sure" },
        ]}
        value={scope.brandServices}
        onChange={(v) => updateScope("brand", { brandServices: v as never })}
      />
      <ChoiceGroup
        label="Are brand guidelines required?"
        options={YES_NO_NOT_SURE}
        value={scope.guidelinesRequired}
        onChange={(v) => updateScope("brand", { guidelinesRequired: v as never })}
      />
    </ScopeCard>
  );
}

function WebsiteBlock({ state, services, updateScope }: BlockProps & { services: string[] }) {
  const scope = state.scope.website ?? {};
  const websiteType = services.includes("business_website") ? "business_website" : "landing_page";
  return (
    <ScopeCard title="Website">
      <ChoiceGroup
        label="Approximately how many pages are required?"
        options={[
          { value: "1", label: "1 page" },
          { value: "2-5", label: "2-5 pages" },
          { value: "6-10", label: "6-10 pages" },
          { value: "10+", label: "10+ pages" },
          { value: "not_sure", label: "Not Sure" },
        ]}
        value={scope.pageCount}
        onChange={(v) => updateScope("website", { pageCount: v as never, websiteType: websiteType as never })}
      />
      <ChoiceGroup
        label="Is written content ready?"
        options={YES_NO_NOT_SURE}
        value={scope.contentReady}
        onChange={(v) => updateScope("website", { contentReady: v as never })}
      />
      <ChoiceGroup
        label="Which important features are required?"
        multi
        options={[
          { value: "contact_form", label: "Contact form" },
          { value: "whatsapp_integration", label: "WhatsApp integration" },
          { value: "booking", label: "Booking" },
          { value: "online_payments", label: "Online payments" },
          { value: "blog", label: "Blog" },
          { value: "user_login", label: "User login" },
          { value: "multi_language", label: "Multiple languages" },
          { value: "admin_dashboard", label: "Administrator dashboard" },
          { value: "advanced_animation", label: "Advanced animation" },
          { value: "custom_scrolling", label: "Custom scrolling experience" },
          { value: "not_sure", label: "Not Sure" },
        ]}
        value={scope.features}
        onChange={(v) => updateScope("website", { features: v as never })}
      />
      <ChoiceGroup
        label="Is SEO setup required?"
        options={YES_NO_NOT_SURE}
        value={scope.seoAddOnRequested}
        onChange={(v) => updateScope("website", { seoAddOnRequested: v as never })}
      />
    </ScopeCard>
  );
}

function EcommerceBlock({ state, updateScope }: BlockProps) {
  const scope = state.scope.ecommerce ?? {};
  return (
    <ScopeCard title="E-commerce">
      <ChoiceGroup
        label="Approximately how many products will be available at launch?"
        options={[
          { value: "1-20", label: "1-20" },
          { value: "21-100", label: "21-100" },
          { value: "101-500", label: "101-500" },
          { value: "500+", label: "500+" },
          { value: "not_sure", label: "Not Sure" },
        ]}
        value={scope.productCount}
        onChange={(v) => updateScope("ecommerce", { productCount: v as never })}
      />
      <ChoiceGroup
        label="Are product details and photographs ready?"
        options={YES_NO_NOT_SURE}
        value={scope.productDetailsReady}
        onChange={(v) => updateScope("ecommerce", { productDetailsReady: v as never })}
      />
      <ChoiceGroup
        label="Is online payment required?"
        options={YES_NO_NOT_SURE}
        value={scope.onlinePaymentRequired}
        onChange={(v) => updateScope("ecommerce", { onlinePaymentRequired: v as never })}
      />
      <ChoiceGroup
        label="Is shipping integration required?"
        options={YES_NO_NOT_SURE}
        value={scope.shippingIntegrationRequired}
        onChange={(v) => updateScope("ecommerce", { shippingIntegrationRequired: v as never })}
      />
      <ChoiceGroup
        label="Which advanced features are required?"
        multi
        options={[
          { value: "inventory_management", label: "Inventory management" },
          { value: "customer_accounts", label: "Customer accounts" },
          { value: "product_variations", label: "Product variations" },
          { value: "discount_coupons", label: "Discount coupons" },
          { value: "order_tracking", label: "Order tracking" },
          { value: "product_uploading", label: "Product uploading" },
          { value: "multicurrency", label: "Multicurrency" },
          { value: "automated_invoices", label: "Automated invoices" },
          { value: "marketplace_integration", label: "Marketplace integration" },
          { value: "not_sure", label: "Not Sure" },
        ]}
        value={scope.advancedFeatures}
        onChange={(v) => updateScope("ecommerce", { advancedFeatures: v as never })}
      />
    </ScopeCard>
  );
}

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X" },
  { value: "pinterest", label: "Pinterest" },
  { value: "not_sure", label: "Not Sure" },
];

function SocialLaunchBlock({ state, updateScope }: BlockProps) {
  const scope = state.scope.socialLaunch ?? {};
  return (
    <ScopeCard title="Social Media Launch">
      <ChoiceGroup
        label="Which platforms are required?"
        multi
        options={PLATFORM_OPTIONS}
        value={scope.platforms}
        onChange={(v) => updateScope("socialLaunch", { platforms: v as never })}
      />
      <ChoiceGroup
        label="Are the accounts already created?"
        options={YES_NO_NOT_SURE}
        value={scope.accountsExist}
        onChange={(v) => updateScope("socialLaunch", { accountsExist: v as never })}
      />
      <ChoiceGroup
        label="How many posts are required?"
        options={[
          { value: "1-10", label: "1-10" },
          { value: "11-20", label: "11-20" },
          { value: "21-40", label: "21-40" },
          { value: "40+", label: "40+" },
          { value: "not_sure", label: "Not Sure" },
        ]}
        value={scope.postQuantity}
        onChange={(v) => updateScope("socialLaunch", { postQuantity: v as never })}
      />
      <ChoiceGroup
        label="How many reels are required?"
        options={[
          { value: "0", label: "None" },
          { value: "1-5", label: "1-5" },
          { value: "6-10", label: "6-10" },
          { value: "10+", label: "10+" },
          { value: "not_sure", label: "Not Sure" },
        ]}
        value={scope.reelQuantity}
        onChange={(v) => updateScope("socialLaunch", { reelQuantity: v as never })}
      />
      <ChoiceGroup
        label="Is content production, Meta Business setup, or advertising management required?"
        multi
        options={[
          { value: "content_production", label: "Content production" },
          { value: "meta_business_setup", label: "Meta Business setup" },
          { value: "advertising_management", label: "Advertising management" },
          { value: "none", label: "None" },
          { value: "not_sure", label: "Not Sure" },
        ]}
        value={scope.extraNeeds}
        onChange={(v) => updateScope("socialLaunch", { extraNeeds: v as never })}
      />
    </ScopeCard>
  );
}

function MarketingBlock({ state, updateScope }: BlockProps) {
  const scope = state.scope.marketing ?? {};
  return (
    <ScopeCard title="Monthly Marketing">
      <ChoiceGroup
        label="Which platforms should be managed?"
        multi
        options={PLATFORM_OPTIONS}
        value={scope.platforms}
        onChange={(v) => updateScope("marketing", { platforms: v as never })}
      />
      <ChoiceGroup
        label="What is the primary objective?"
        options={[
          { value: "brand_awareness", label: "Brand awareness" },
          { value: "lead_generation", label: "Lead generation" },
          { value: "sales", label: "Sales" },
          { value: "community_growth", label: "Community growth" },
          { value: "not_sure", label: "Not Sure" },
        ]}
        value={scope.objective}
        onChange={(v) => updateScope("marketing", { objective: v as never })}
      />
      <ChoiceGroup
        label="What monthly content quantity is expected?"
        options={[
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" },
          { value: "not_sure", label: "Not Sure" },
        ]}
        value={scope.contentQuantity}
        onChange={(v) => updateScope("marketing", { contentQuantity: v as never })}
      />
      <ChoiceGroup
        label="Is content production required?"
        options={YES_NO_NOT_SURE}
        value={scope.contentProductionRequired}
        onChange={(v) => updateScope("marketing", { contentProductionRequired: v as never })}
      />
      <ChoiceGroup
        label="Is paid-advertising management required?"
        options={YES_NO_NOT_SURE}
        value={scope.adManagementRequired}
        onChange={(v) => updateScope("marketing", { adManagementRequired: v as never })}
      />
    </ScopeCard>
  );
}

function SeoBlock({ state, services, updateScope }: BlockProps & { services: string[] }) {
  const scope = state.scope.seo ?? {};
  const websitePageCount = state.scope.website?.pageCount;
  const hasSharedWebsite = services.includes("business_website") || services.includes("landing_page");

  return (
    <ScopeCard title="Search Engine Optimization">
      <ChoiceGroup
        label="Is the website already live?"
        options={YES_NO_NOT_SURE}
        value={scope.websiteLive}
        onChange={(v) => updateScope("seo", { websiteLive: v as never })}
      />
      {hasSharedWebsite && websitePageCount ? (
        <p className="text-sm text-brand-muted-foreground">
          Using the {websitePageCount} pages already confirmed for your website.
        </p>
      ) : (
        <ChoiceGroup
          label="Approximately how many pages require optimisation?"
          options={[
            { value: "1-5", label: "1-5" },
            { value: "6-10", label: "6-10" },
            { value: "11-20", label: "11-20" },
            { value: "20+", label: "20+" },
            { value: "not_sure", label: "Not Sure" },
          ]}
          value={scope.pageCount}
          onChange={(v) => updateScope("seo", { pageCount: v as never })}
        />
      )}
      <ChoiceGroup
        label="Is keyword research required?"
        options={YES_NO_NOT_SURE}
        value={scope.keywordResearchRequired}
        onChange={(v) => updateScope("seo", { keywordResearchRequired: v as never })}
      />
      <ChoiceGroup
        label="Is Google Search Console already connected?"
        options={YES_NO_NOT_SURE}
        value={scope.searchConsoleConnected}
        onChange={(v) => updateScope("seo", { searchConsoleConnected: v as never })}
      />
      <ChoiceGroup
        label="Are there known technical or indexing issues?"
        options={YES_NO_NOT_SURE}
        value={scope.technicalIssuesKnown}
        onChange={(v) => updateScope("seo", { technicalIssuesKnown: v as never })}
      />
    </ScopeCard>
  );
}

function WebAppBlock({ state, updateScope }: BlockProps) {
  const scope = state.scope.webApp ?? {};
  return (
    <ScopeCard title="Custom Web Application">
      <div className="space-y-2">
        <Label htmlFor="webapp-problem">What problem should the application solve?</Label>
        <Textarea
          id="webapp-problem"
          rows={3}
          value={scope.problemToSolve ?? ""}
          onChange={(e) => updateScope("webApp", { problemToSolve: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="webapp-users">Who will use it?</Label>
        <Textarea
          id="webapp-users"
          rows={2}
          value={scope.primaryUsers ?? ""}
          onChange={(e) => updateScope("webApp", { primaryUsers: e.target.value })}
        />
      </div>
      <ChoiceGroup
        label="Are user accounts required?"
        options={YES_NO_NOT_SURE}
        value={scope.userAccountsRequired}
        onChange={(v) => updateScope("webApp", { userAccountsRequired: v as never })}
      />
      <ChoiceGroup
        label="Is an administrator dashboard required?"
        options={YES_NO_NOT_SURE}
        value={scope.adminDashboardRequired}
        onChange={(v) => updateScope("webApp", { adminDashboardRequired: v as never })}
      />
      <ChoiceGroup
        label="Are payments, third-party integrations, or mobile installation required?"
        multi
        options={[
          { value: "payments", label: "Payments" },
          { value: "third_party_integrations", label: "Third-party integrations" },
          { value: "mobile_installable", label: "Mobile installation" },
          { value: "none", label: "None" },
          { value: "not_sure", label: "Not Sure" },
        ]}
        value={scope.extraRequirements}
        onChange={(v) => updateScope("webApp", { extraRequirements: v as never })}
      />
    </ScopeCard>
  );
}

function ScopeCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}
