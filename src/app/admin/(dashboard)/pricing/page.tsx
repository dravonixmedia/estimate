import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PricingTable } from "@/components/admin/services-table";

export default async function AdminPricingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: services } = await supabase.from("services").select("*").order("category");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text">Pricing</h1>
        <p className="text-brand-muted-foreground">Edit minimum and maximum prices for each service.</p>
      </div>
      <PricingTable services={services ?? []} />
    </div>
  );
}
