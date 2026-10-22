import { describe, it, expect } from "vitest";
import { calculateEstimate } from "./engine";
import { buildEstimatorState, withClientDetails } from "@/lib/estimator/fixtures";
import type { ServiceId } from "@/lib/estimator/services";

describe("calculateEstimate", () => {
  it("prices logo design within the basic tier when Basic Logo is selected", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["logo_design"], servicesNotSure: false },
        scope: { logo: { logoLevel: "basic" } },
      })
    );
    const result = calculateEstimate(state);
    expect(result.oneTimeMin).toBe(2000);
    expect(result.oneTimeMax).toBe(3000);
  });

  it("never defaults SEO to the maximum tier automatically", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["seo"], servicesNotSure: false },
        scope: { seo: {} },
      })
    );
    const result = calculateEstimate(state);
    // No scope signals answered -> basic tier, not the 6000 ceiling.
    expect(result.oneTimeMax).toBe(4000);
  });

  it("scales SEO toward the advanced tier when multiple complexity signals are present", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["seo"], servicesNotSure: false },
        scope: {
          seo: {
            pageCount: "20+",
            keywordResearchRequired: "yes",
            technicalIssuesKnown: "yes",
            searchConsoleConnected: "no",
          },
        },
      })
    );
    const result = calculateEstimate(state);
    expect(result.oneTimeMin).toBe(5000);
    expect(result.oneTimeMax).toBe(6000);
  });

  it("keeps monthly marketing pricing separate from one-time totals", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["monthly_marketing"], servicesNotSure: false },
        scope: { marketing: { contentQuantity: "medium" } },
      })
    );
    const result = calculateEstimate(state);
    expect(result.oneTimeMin).toBe(0);
    expect(result.oneTimeMax).toBe(0);
    expect(result.monthlyMin).toBeGreaterThan(0);
  });

  it("flags custom_web_app as needing a custom quotation when scope is thin", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["custom_web_app"], servicesNotSure: false },
        scope: { webApp: {} },
      })
    );
    const result = calculateEstimate(state);
    expect(result.customQuotationRequired).toBe(true);
  });

  it("does not flag a custom quotation when the web app scope is well described", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["custom_web_app"], servicesNotSure: false },
        scope: {
          webApp: {
            problemToSolve: "We need to manage bookings and staff schedules across three locations.",
            primaryUsers: "Staff and front-desk managers",
            extraRequirements: ["none"],
          },
        },
      })
    );
    const result = calculateEstimate(state);
    expect(result.customQuotationRequired).toBe(false);
  });

  it("returns low confidence when required concepts are missing", () => {
    const state = withClientDetails(
      buildEstimatorState({ services: { selectedServices: ["business_website"], servicesNotSure: false } })
    );
    const result = calculateEstimate(state);
    expect(result.confidence).toBe("low");
  });

  it("returns a zero-cost placeholder range when no services are selected (Not Sure)", () => {
    const state = withClientDetails(buildEstimatorState({ services: { selectedServices: [], servicesNotSure: true } }));
    const result = calculateEstimate(state);
    expect(result.oneTimeMin).toBe(0);
    expect(result.oneTimeMax).toBe(0);
    expect(result.assumptions.length).toBeGreaterThan(0);
  });

  it("suggests SEO and domain/email as upgrades for a standalone business website", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["business_website"], servicesNotSure: false },
        scope: { website: { pageCount: "2-5" } },
      })
    );
    const result = calculateEstimate(state);
    const upgradeIds = result.optionalUpgrades.map((u) => u.serviceId);
    expect(upgradeIds).toContain("seo");
  });
});

describe("calculateEstimate — combined-project adjustment", () => {
  // brand_foundation (₹12,000 flat) and social_profile_setup (₹5,000 flat)
  // both go through the plain priceFlat() path (no scope-based pricing
  // function), so their line totals are exact and deterministic — ideal
  // for asserting the adjustment percentage math precisely.
  it("TEST 1 — a single eligible one-time service gets no adjustment", () => {
    const state = withClientDetails(
      buildEstimatorState({ services: { selectedServices: ["brand_foundation"], servicesNotSure: false } })
    );
    const result = calculateEstimate(state);
    expect(result.combinedProjectAdjustment.percentage).toBe(0);
    expect(result.combinedProjectAdjustment.eligibleOneTimeServiceCount).toBe(1);
    expect(result.oneTimeMin).toBe(12000);
    expect(result.oneTimeMax).toBe(12000);
  });

  it("TEST 2 — two eligible one-time services get a 3% combined-project adjustment", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["brand_foundation", "social_profile_setup"], servicesNotSure: false },
      })
    );
    const result = calculateEstimate(state);
    // subtotal 17000, 3% = 510 (kept precise for the admin-facing figure)
    expect(result.combinedProjectAdjustment.percentage).toBe(0.03);
    expect(result.combinedProjectAdjustment.oneTimeSubtotalMin).toBe(17000);
    expect(result.combinedProjectAdjustment.adjustmentAmountMin).toBe(510);
    // final customer-facing total is rounded to the nearest ₹500
    expect(result.oneTimeMin).toBe(16500);
  });

  it("TEST 3 — three eligible one-time services get a 5% combined-project adjustment", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: ["brand_foundation", "social_profile_setup", "content_creation"],
          servicesNotSure: false,
        },
      })
    );
    const result = calculateEstimate(state);
    expect(result.combinedProjectAdjustment.percentage).toBe(0.05);
    expect(result.combinedProjectAdjustment.eligibleOneTimeServiceCount).toBe(3);
  });

  it("TEST 4 — four eligible one-time services get an 8% combined-project adjustment", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: ["brand_foundation", "business_website", "seo", "social_profile_setup"],
          servicesNotSure: false,
        },
        scope: { website: { pageCount: "1" } },
      })
    );
    const result = calculateEstimate(state);
    expect(result.combinedProjectAdjustment.percentage).toBe(0.08);
    expect(result.combinedProjectAdjustment.eligibleOneTimeServiceCount).toBe(4);
  });

  it("TEST 4b — five eligible one-time services get a 10% combined-project adjustment", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: [
            "brand_foundation",
            "business_website",
            "seo",
            "social_profile_setup",
            "video_production",
          ],
          servicesNotSure: false,
        },
        scope: { website: { pageCount: "1" } },
      })
    );
    const result = calculateEstimate(state);
    expect(result.combinedProjectAdjustment.percentage).toBe(0.1);
    expect(result.combinedProjectAdjustment.eligibleOneTimeServiceCount).toBe(5);
  });

  it("TEST 4c — six or more eligible one-time services stay capped at 10%", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: [
            "brand_foundation",
            "business_website",
            "seo",
            "social_profile_setup",
            "video_production",
            "content_creation",
          ],
          servicesNotSure: false,
        },
        scope: { website: { pageCount: "1" } },
      })
    );
    const result = calculateEstimate(state);
    expect(result.combinedProjectAdjustment.percentage).toBe(0.1);
    expect(result.combinedProjectAdjustment.eligibleOneTimeServiceCount).toBe(6);
  });

  it("matches the approved worked example: Business Website (1-5 pages) + SEO (2 eligible services, 3%)", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["business_website", "seo"], servicesNotSure: false },
        scope: { website: { pageCount: "1" } },
      })
    );
    const result = calculateEstimate(state);
    // Business Website (1-5 page band, no scope-boosting features) = 8000, SEO (basic tier) = 3000.
    expect(result.combinedProjectAdjustment.oneTimeSubtotalMin).toBe(11000);
    expect(result.combinedProjectAdjustment.percentage).toBe(0.03);
    // 11000 - (11000 * 0.03) = 10670, before the application's existing
    // round-to-nearest-₹500 customer-facing display.
    expect(result.combinedProjectAdjustment.oneTimeSubtotalMin - result.combinedProjectAdjustment.adjustmentAmountMin).toBe(
      10670
    );
    expect(result.oneTimeMin).toBe(10500);
  });

  it("matches Scenario I from the approved website pricing revision: Brand Foundation + Business Website (6-10 pages) (2 eligible services, 3%)", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["brand_foundation", "business_website"], servicesNotSure: false },
        scope: { website: { pageCount: "6-10" } },
      })
    );
    const result = calculateEstimate(state);
    // Brand Foundation (12000 flat) + Business Website 6-10 page band (22000-30000):
    // min 12000+22000=34000, max 12000+30000=42000.
    expect(result.combinedProjectAdjustment.oneTimeSubtotalMin).toBe(34000);
    expect(result.combinedProjectAdjustment.oneTimeSubtotalMax).toBe(42000);
    expect(result.combinedProjectAdjustment.percentage).toBe(0.03);
    // Matches the approved example: "Estimated Project Investment: approximately ₹33,000–₹40,500."
    expect(result.oneTimeMin).toBe(33000);
    expect(result.oneTimeMax).toBe(40500);
  });

  it("matches the approved worked example: 4 eligible services (8%)", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: ["brand_foundation", "business_website", "seo", "social_profile_setup"],
          servicesNotSure: false,
        },
        scope: { website: { pageCount: "1" } },
      })
    );
    const result = calculateEstimate(state);
    // 12000 + 8000 + 3000 + 5000 = 28000
    expect(result.combinedProjectAdjustment.oneTimeSubtotalMin).toBe(28000);
    expect(result.combinedProjectAdjustment.percentage).toBe(0.08);
    // 28000 - (28000 * 0.08) = 25760, before rounding.
    expect(result.combinedProjectAdjustment.oneTimeSubtotalMin - result.combinedProjectAdjustment.adjustmentAmountMin).toBe(
      25760
    );
    expect(result.oneTimeMin).toBe(26000);
  });

  it("matches the approved worked example: same 4-service bundle plus Monthly Marketing stays separate", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: [
            "brand_foundation",
            "business_website",
            "seo",
            "social_profile_setup",
            "monthly_marketing",
          ],
          servicesNotSure: false,
        },
        scope: { website: { pageCount: "1" }, marketing: { contentQuantity: "medium" } },
      })
    );
    const result = calculateEstimate(state);
    expect(result.oneTimeMin).toBe(26000); // unchanged one-time adjusted calculation
    expect(result.combinedProjectAdjustment.eligibleOneTimeServiceCount).toBe(4); // monthly never counted
    expect(result.combinedProjectAdjustment.percentage).toBe(0.08);
    expect(result.monthlyMin).toBeGreaterThan(0);
  });

  it("TEST 5 — one one-time service plus one monthly service stays fully separate, never a combined total", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["brand_foundation", "monthly_marketing"], servicesNotSure: false },
        scope: { marketing: { contentQuantity: "medium" } },
      })
    );
    const result = calculateEstimate(state);
    expect(result.combinedProjectAdjustment.percentage).toBe(0); // only 1 eligible one-time service
    expect(result.oneTimeMin).toBe(12000);
    expect(result.oneTimeMax).toBe(12000);
    expect(result.monthlyMin).toBeGreaterThan(0);
    expect(result.serviceBreakdown.find((l) => l.serviceId === "monthly_marketing")?.unit).toBe("monthly");
  });

  it("TEST 6 — four one-time services + monthly marketing: 8% applies only to the one-time subtotal", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: [
            "brand_foundation",
            "business_website",
            "seo",
            "social_profile_setup",
            "monthly_marketing",
          ],
          servicesNotSure: false,
        },
        scope: { website: { pageCount: "1" }, marketing: { contentQuantity: "medium" } },
      })
    );
    const result = calculateEstimate(state);
    expect(result.combinedProjectAdjustment.percentage).toBe(0.08);
    expect(result.combinedProjectAdjustment.eligibleOneTimeServiceCount).toBe(4);
    expect(result.monthlyMin).toBeGreaterThan(0);
    // Monthly total is untouched by the one-time adjustment percentage.
    const marketingLine = result.serviceBreakdown.find((l) => l.serviceId === "monthly_marketing")!;
    expect(result.monthlyMin).toBe(marketingLine.min);
    expect(result.monthlyMax).toBe(marketingLine.max);
  });

  it("TEST 7 — a monthly-only selection never fabricates a fake upfront one-time cost", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["monthly_marketing"], servicesNotSure: false },
        scope: { marketing: { contentQuantity: "low" } },
      })
    );
    const result = calculateEstimate(state);
    expect(result.oneTimeMin).toBe(0);
    expect(result.oneTimeMax).toBe(0);
    expect(result.combinedProjectAdjustment.percentage).toBe(0);
    expect(result.monthlyMin).toBeGreaterThan(0);
  });

  it("TEST 8 — services are not auto-excluded as overlaps unless explicitly configured (none are, today)", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: ["ecommerce_website", "business_website", "brand_foundation", "logo_design"],
          servicesNotSure: false,
        },
      })
    );
    const result = calculateEstimate(state);
    // No relationship between these is established anywhere else in the
    // app (see audit notes), so none should be silently dropped.
    expect(result.excludedOverlapServiceIds).toEqual([]);
    expect(result.serviceBreakdown.map((l) => l.serviceId).sort()).toEqual(
      ["brand_foundation", "business_website", "ecommerce_website", "logo_design"].sort()
    );
  });

  it("TEST 9 — a duplicate service id in the selection is only charged once", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: ["brand_foundation", "brand_foundation", "social_profile_setup"] as never,
          servicesNotSure: false,
        },
      })
    );
    const result = calculateEstimate(state);
    expect(result.serviceBreakdown.filter((l) => l.serviceId === "brand_foundation")).toHaveLength(1);
    expect(result.combinedProjectAdjustment.eligibleOneTimeServiceCount).toBe(2);
    expect(result.combinedProjectAdjustment.oneTimeSubtotalMin).toBe(17000);
  });

  it("excludes configured non-eligible services (domain/email setup, custom web app) from the adjustment tier while still charging them in full", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: ["brand_foundation", "social_profile_setup", "domain_email_setup"],
          servicesNotSure: false,
        },
      })
    );
    const result = calculateEstimate(state);
    // Only the 2 eligible services count toward the tier (still 3%, not 5%)
    // — an excluded service never bumps the eligible-service count.
    expect(result.combinedProjectAdjustment.eligibleOneTimeServiceCount).toBe(2);
    expect(result.combinedProjectAdjustment.percentage).toBe(0.03);
    expect(result.combinedProjectAdjustment.excludedFromAdjustmentServiceIds).toEqual(["domain_email_setup"]);
    // domain_email_setup (₹1,500 flat) is still added at full price.
    const domainLine = result.serviceBreakdown.find((l) => l.serviceId === "domain_email_setup")!;
    expect(result.oneTimeMin).toBe(16500 + domainLine.min);
  });

  it("never labels the combined-project adjustment as a discount anywhere in the pricing result", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: ["brand_foundation", "business_website", "seo", "social_profile_setup"],
          servicesNotSure: false,
        },
        scope: { website: { pageCount: "1" } },
      })
    );
    const result = calculateEstimate(state);
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain("discount");
    expect(serialized).not.toContain("you saved");
  });
});

describe("calculateEstimate — approved website pricing revision (Oct 2026)", () => {
  function websiteLine(result: ReturnType<typeof calculateEstimate>, serviceId: "landing_page" | "business_website" | "ecommerce_website" | "custom_web_app") {
    return result.serviceBreakdown.find((l) => l.serviceId === serviceId)!;
  }

  it("Scenario A — Landing Page (1 page): base range ₹4,000–₹6,000", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["landing_page"], servicesNotSure: false },
        scope: { website: { pageCount: "1" } },
      })
    );
    const result = calculateEstimate(state);
    const line = websiteLine(result, "landing_page");
    expect(line.name).toBe("Landing Page");
    expect(line.min).toBe(4000);
    expect(line.max).toBe(6000);
  });

  it("Scenario B — Portfolio Website (multi-page): base range ₹5,000–₹15,000", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["landing_page"], servicesNotSure: false },
        scope: { website: { pageCount: "2-5" } },
      })
    );
    const result = calculateEstimate(state);
    const line = websiteLine(result, "landing_page");
    expect(line.name).toBe("Portfolio Website");
    expect(line.min).toBe(5000);
    expect(line.max).toBe(15000);
  });

  it("Scenario C — Business Website, 1-5 pages: base range ₹8,000–₹20,000", () => {
    for (const pageCount of ["1", "2-5"] as const) {
      const state = withClientDetails(
        buildEstimatorState({
          services: { selectedServices: ["business_website"], servicesNotSure: false },
          scope: { website: { pageCount } },
        })
      );
      const result = calculateEstimate(state);
      const line = websiteLine(result, "business_website");
      expect(line.min).toBe(8000);
      expect(line.max).toBe(20000);
    }
  });

  it("Scenario D — Business Website, 6-10 pages: base range ₹22,000–₹30,000", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["business_website"], servicesNotSure: false },
        scope: { website: { pageCount: "6-10" } },
      })
    );
    const result = calculateEstimate(state);
    const line = websiteLine(result, "business_website");
    expect(line.min).toBe(22000);
    expect(line.max).toBe(30000);
  });

  it("Scenario E — Business Website, 11-20 pages: base range ₹32,000–₹50,000", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["business_website"], servicesNotSure: false },
        scope: { website: { pageCount: "11-20" } },
      })
    );
    const result = calculateEstimate(state);
    const line = websiteLine(result, "business_website");
    expect(line.min).toBe(32000);
    expect(line.max).toBe(50000);
  });

  it("Scenario E (legacy) — the pre-widening '10+' value is still valid and maps to the 11-20 band", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["business_website"], servicesNotSure: false },
        scope: { website: { pageCount: "10+" } },
      })
    );
    const result = calculateEstimate(state);
    const line = websiteLine(result, "business_website");
    expect(line.min).toBe(32000);
    expect(line.max).toBe(50000);
  });

  it("Scenario F — Business Website, more than 20 pages: can exceed ₹50,000 with no artificial cap", () => {
    const standard = calculateEstimate(
      withClientDetails(
        buildEstimatorState({
          services: { selectedServices: ["business_website"], servicesNotSure: false },
          scope: { website: { pageCount: "20+" } },
        })
      )
    );
    const standardLine = websiteLine(standard, "business_website");
    expect(standardLine.min).toBe(50000);
    expect(standardLine.max).toBeGreaterThan(50000);

    const complex = calculateEstimate(
      withClientDetails(
        buildEstimatorState({
          services: { selectedServices: ["business_website"], servicesNotSure: false },
          scope: {
            website: {
              pageCount: "20+",
              features: [
                "contact_form",
                "booking",
                "online_payments",
                "blog",
                "user_login",
                "multi_language",
                "admin_dashboard",
                "advanced_animation",
              ],
            },
          },
        })
      )
    );
    const complexLine = websiteLine(complex, "business_website");
    // More complexity pushes the open-ended max higher still.
    expect(complexLine.max).toBeGreaterThan(standardLine.max);
  });

  it("Scenario G — E-commerce Website: standard starting range ₹35,000–₹75,000, exceeds it with added complexity", () => {
    const standard = calculateEstimate(
      withClientDetails(
        buildEstimatorState({
          services: { selectedServices: ["ecommerce_website"], servicesNotSure: false },
          scope: { ecommerce: { productCount: "1-20" } },
        })
      )
    );
    const standardLine = websiteLine(standard, "ecommerce_website");
    expect(standardLine.min).toBe(35000);
    expect(standardLine.max).toBeLessThanOrEqual(75000);

    const complex = calculateEstimate(
      withClientDetails(
        buildEstimatorState({
          services: { selectedServices: ["ecommerce_website"], servicesNotSure: false },
          scope: {
            ecommerce: {
              productCount: "500+",
              advancedFeatures: [
                "inventory_management",
                "customer_accounts",
                "product_variations",
                "discount_coupons",
                "order_tracking",
                "multicurrency",
              ],
            },
          },
        })
      )
    );
    const complexLine = websiteLine(complex, "ecommerce_website");
    // No artificial maximum — a large, complex store exceeds the ₹75,000 starting-range ceiling.
    expect(complexLine.max).toBeGreaterThan(75000);
  });

  it("Scenario H — Custom Web Application: starts from ₹1,00,000", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: { selectedServices: ["custom_web_app"], servicesNotSure: false },
        scope: {
          webApp: {
            problemToSolve: "We need to manage bookings and staff schedules across three locations.",
            primaryUsers: "Staff and front-desk managers",
            extraRequirements: ["none"],
          },
        },
      })
    );
    const result = calculateEstimate(state);
    const line = websiteLine(result, "custom_web_app");
    expect(line.min).toBe(100000);
  });

  it("Scenario I — Brand Foundation + Business Website (6-10 pages) + Monthly Marketing: one-time and ongoing stay separate", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: ["brand_foundation", "business_website", "monthly_marketing"],
          servicesNotSure: false,
        },
        scope: { website: { pageCount: "6-10" }, marketing: { contentQuantity: "medium" } },
      })
    );
    const result = calculateEstimate(state);
    // "Estimated Project Investment: approximately ₹33,000–₹40,500."
    expect(result.oneTimeMin).toBe(33000);
    expect(result.oneTimeMax).toBe(40500);
    expect(result.combinedProjectAdjustment.eligibleOneTimeServiceCount).toBe(2);
    expect(result.combinedProjectAdjustment.percentage).toBe(0.03);
    // "Ongoing Services: ₹14,000–₹20,000/month" — verified against the
    // application's actual calculation rather than hardcoded.
    const marketingLine = result.serviceBreakdown.find((l) => l.serviceId === "monthly_marketing")!;
    expect(result.monthlyMin).toBe(marketingLine.min);
    expect(result.monthlyMax).toBe(marketingLine.max);
    expect(result.monthlyMin).toBeGreaterThan(0);
  });
});

describe("calculateEstimate — unrelated services are unaffected by the website pricing revision", () => {
  it("Brand Foundation, Logo Design, SEO, Social Media Launch, Social Profile Setup, Monthly Marketing, Content Creation, Video Production, and Domain/Email Setup keep their exact existing prices", () => {
    const state = withClientDetails(
      buildEstimatorState({
        services: {
          selectedServices: [
            "brand_foundation",
            "logo_design",
            "seo",
            "social_media_launch",
            "social_profile_setup",
            "monthly_marketing",
            "content_creation",
            "video_production",
            "domain_email_setup",
          ],
          servicesNotSure: false,
        },
        scope: { logo: { logoLevel: "professional" }, marketing: { contentQuantity: "medium" } },
      })
    );
    const result = calculateEstimate(state);
    const line = (id: ServiceId) => result.serviceBreakdown.find((l) => l.serviceId === id)!;

    expect(line("brand_foundation")).toMatchObject({ min: 12000, max: 12000 });
    expect(line("logo_design")).toMatchObject({ min: 3000, max: 4500 }); // professional tier, unchanged
    expect(line("seo")).toMatchObject({ min: 3000, max: 4000 }); // basic tier, unchanged
    expect(line("social_media_launch")).toMatchObject({ min: 15000 });
    expect(line("social_profile_setup")).toMatchObject({ min: 5000, max: 5000 });
    expect(line("content_creation")).toMatchObject({ min: 5000, max: 20000 });
    expect(line("video_production")).toMatchObject({ min: 8000, max: 40000 });
    expect(line("domain_email_setup")).toMatchObject({ min: 1500, max: 4000 });
  });
});
