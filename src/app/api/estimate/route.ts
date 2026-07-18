import { NextResponse } from "next/server";
import { estimatorStateSchema } from "@/lib/estimator/schema";
import { getMissingRequiredConcepts } from "@/lib/estimator/validation";
import { calculateEstimate } from "@/lib/pricing/engine";
import { getActiveServices } from "@/lib/pricing/active-services";
import { generateEstimateReference } from "@/lib/estimator/reference";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { notifyAdminOfNewLead } from "@/lib/email/notify-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`estimate:${ip}`, 8, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const parsed = estimatorStateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const state = parsed.data;

  // Server-side validation is authoritative — the exact same function the
  // client uses, so the answer can never disagree with what the UI showed.
  const missing = getMissingRequiredConcepts(state);
  if (missing.length > 0) {
    return NextResponse.json({ ok: false, error: "missing_required", missing }, { status: 422 });
  }

  if (!state.review.privacyAccepted || !state.review.contactConsent) {
    return NextResponse.json({ ok: false, error: "consent_required" }, { status: 422 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const activeServices = await getActiveServices();
    const pricing = calculateEstimate(state, activeServices);

    // Idempotency: reuse the existing lead for this browser session instead
    // of creating duplicates on refresh/back-navigation/double submit.
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id, reference")
      .eq("session_id", state.sessionId)
      .maybeSingle();

    let leadId: string;
    let leadReference: string;

    if (existingLead) {
      leadId = existingLead.id;
      leadReference = existingLead.reference;
      await supabase
        .from("leads")
        .update({
          full_name: state.clientDetails.fullName ?? "",
          business_name: state.clientDetails.businessName ?? null,
          whatsapp_number: state.clientDetails.whatsappNumber ?? null,
          email: state.clientDetails.email ?? null,
          business_stage: state.clientDetails.businessStage ?? null,
          privacy_accepted: state.review.privacyAccepted,
          contact_consent: state.review.contactConsent,
        })
        .eq("id", leadId);
    } else {
      leadReference = generateEstimateReference();
      const { data: inserted, error } = await supabase
        .from("leads")
        .insert({
          reference: leadReference,
          full_name: state.clientDetails.fullName ?? "",
          business_name: state.clientDetails.businessName ?? null,
          whatsapp_number: state.clientDetails.whatsappNumber ?? null,
          email: state.clientDetails.email ?? null,
          business_stage: state.clientDetails.businessStage ?? null,
          status: "new",
          privacy_accepted: state.review.privacyAccepted,
          contact_consent: state.review.contactConsent,
          utm_source: state.attribution.utmSource ?? null,
          utm_medium: state.attribution.utmMedium ?? null,
          utm_campaign: state.attribution.utmCampaign ?? null,
          utm_term: state.attribution.utmTerm ?? null,
          utm_content: state.attribution.utmContent ?? null,
          referrer: state.attribution.referrer ?? null,
          session_id: state.sessionId,
        })
        .select("id")
        .single();

      if (error || !inserted) throw error ?? new Error("lead_insert_failed");
      leadId = inserted.id;
    }

    await supabase.from("project_briefs").upsert(
      {
        lead_id: leadId,
        project_description: state.projectIdea.description ?? "",
        reference_website: state.projectIdea.referenceWebsite || null,
        inspiration_link: state.projectIdea.inspirationLink || null,
        ai_interpretation: state.aiInterpretation,
        selected_services: state.services.selectedServices ?? [],
        services_not_sure: state.services.servicesNotSure ?? false,
        answers: state,
      },
      { onConflict: "lead_id" }
    );

    const estimateReference = generateEstimateReference();
    const { data: estimateRow, error: estimateError } = await supabase
      .from("estimates")
      .insert({
        lead_id: leadId,
        reference: estimateReference,
        one_time_min: pricing.oneTimeMin,
        one_time_max: pricing.oneTimeMax,
        monthly_min: pricing.monthlyMin,
        monthly_max: pricing.monthlyMax,
        essential_launch: pricing.essentialLaunch,
        recommended_solution: pricing.recommendedSolution,
        optional_upgrades: pricing.optionalUpgrades,
        future_expansion: pricing.futureExpansion,
        assumptions: pricing.assumptions,
        exclusions: pricing.exclusions,
        estimated_timeline_label: pricing.estimatedTimelineLabel,
        confidence: pricing.confidence,
        custom_quotation_required: pricing.customQuotationRequired,
      })
      .select("id, reference")
      .single();

    if (estimateError || !estimateRow) throw estimateError ?? new Error("estimate_insert_failed");

    if (pricing.serviceBreakdown.length > 0) {
      await supabase.from("estimate_items").insert(
        pricing.serviceBreakdown.map((line) => ({
          estimate_id: estimateRow.id,
          service_id: line.serviceId,
          name: line.name,
          unit: line.unit,
          price_min: line.min,
          price_max: line.max,
          notes: line.notes ?? null,
        }))
      );
    }

    await supabase.from("lead_activity").insert({
      lead_id: leadId,
      type: "system",
      note: "Estimate generated",
    });

    // Best-effort admin notification — never blocks or fails the response
    // to the client (notifyAdminOfNewLead swallows its own errors).
    await notifyAdminOfNewLead({ state, pricing, estimateReference: estimateRow.reference, leadReference });

    return NextResponse.json({ ok: true, reference: estimateRow.reference, leadReference }, { status: 200 });
  } catch (error) {
    console.error("[estimate] Generation failed:", error);
    return NextResponse.json({ ok: false, error: "generation_failed" }, { status: 500 });
  }
}
