import { NextResponse } from "next/server";
import { estimatorStateSchema } from "@/lib/estimator/schema";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateEstimateReference } from "@/lib/estimator/reference";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Best-effort server-side draft save, fired once contact details are
 * available (Screen 1 onward). This exists alongside local autosave so a
 * client who abandons and returns on a different device/browser doesn't
 * lose everything — it never blocks the wizard and failures are silent.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`draft:${ip}`, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = estimatorStateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const state = parsed.data;

  const hasContact = !!state.clientDetails.whatsappNumber || !!state.clientDetails.email;
  if (!hasContact) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: existing } = await supabase.from("leads").select("id").eq("session_id", state.sessionId).maybeSingle();

    let leadId: string;
    if (existing) {
      leadId = existing.id;
      await supabase
        .from("leads")
        .update({
          full_name: state.clientDetails.fullName ?? "",
          business_name: state.clientDetails.businessName ?? null,
          whatsapp_number: state.clientDetails.whatsappNumber ?? null,
          email: state.clientDetails.email ?? null,
          business_stage: state.clientDetails.businessStage ?? null,
        })
        .eq("id", leadId);
    } else {
      const { data: inserted, error } = await supabase
        .from("leads")
        .insert({
          reference: generateEstimateReference(),
          full_name: state.clientDetails.fullName ?? "",
          business_name: state.clientDetails.businessName ?? null,
          whatsapp_number: state.clientDetails.whatsappNumber ?? null,
          email: state.clientDetails.email ?? null,
          business_stage: state.clientDetails.businessStage ?? null,
          status: "new",
          session_id: state.sessionId,
          utm_source: state.attribution.utmSource ?? null,
          utm_medium: state.attribution.utmMedium ?? null,
          utm_campaign: state.attribution.utmCampaign ?? null,
          referrer: state.attribution.referrer ?? null,
        })
        .select("id")
        .single();
      if (error || !inserted) throw error ?? new Error("draft_insert_failed");
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

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Draft saves are best-effort — never surface this to the client.
    console.error("[leads/draft] Save failed:", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
