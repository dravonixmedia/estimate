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
      <p className="rounded-md border border-brand-border bg-brand-surface p-3 text-xs text-brand-muted-foreground">
        Note: Landing Page / Portfolio, Business Website, Logo Design, and SEO show a representative range here, but
        their actual estimate uses fixed page-count, logo-level, or SEO-tier pricing bands defined in code — editing
        the numbers below for these services will not change what customers see. Every other service&apos;s price
        here (including E-commerce Website) is the real, live price used in every estimate.
      </p>
      <PricingTable services={services ?? []} />
    </div>
  );
}
