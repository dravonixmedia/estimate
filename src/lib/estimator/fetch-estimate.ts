import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { EstimateItemRow, EstimateRow, LeadRow, ProjectBriefRow } from "@/types/database";

export type ResultPageData = {
  lead: LeadRow;
  brief: ProjectBriefRow;
  estimate: EstimateRow;
  items: EstimateItemRow[];
};

export async function getEstimateByReference(reference: string): Promise<ResultPageData | null> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: estimate, error: estimateError } = await supabase
      .from("estimates")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();

    if (estimateError || !estimate) return null;

    const [{ data: lead }, { data: brief }, { data: items }] = await Promise.all([
      supabase.from("leads").select("*").eq("id", estimate.lead_id).maybeSingle(),
      supabase.from("project_briefs").select("*").eq("lead_id", estimate.lead_id).maybeSingle(),
      supabase.from("estimate_items").select("*").eq("estimate_id", estimate.id),
    ]);

    if (!lead || !brief) return null;

    return { lead, brief, estimate, items: items ?? [] };
  } catch (error) {
    console.error("[result] Failed to load estimate:", error);
    return null;
  }
}
