import "server-only";
import { SERVICE_CATALOG, type ServiceDefinition } from "@/lib/estimator/services";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Loads admin-edited service prices/availability from Supabase. Falls
 * back to the built-in catalog defaults if Supabase is unreachable or not
 * configured yet, so pricing keeps working during local development and
 * if the database has an outage.
 */
export async function getActiveServices(): Promise<ServiceDefinition[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("services").select("*").eq("active", true);
    if (error || !data || data.length === 0) throw error ?? new Error("empty");

    return data.map((row) => ({
      id: row.id as ServiceDefinition["id"],
      name: row.name,
      category: row.category,
      unit: row.unit,
      priceMin: Number(row.price_min),
      priceMax: Number(row.price_max),
      description: row.description,
      manualQuotationPossible: row.manual_quotation_possible,
    }));
  } catch (error) {
    console.error("[pricing] Falling back to built-in service catalog:", error);
    return [...SERVICE_CATALOG];
  }
}
