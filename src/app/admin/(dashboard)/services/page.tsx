import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ServicesActiveTable } from "@/components/admin/services-table";

export default async function AdminServicesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: services } = await supabase.from("services").select("*").order("category");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text">Services</h1>
        <p className="text-brand-muted-foreground">Activate or deactivate services shown to clients.</p>
      </div>
      <ServicesActiveTable services={services ?? []} />
    </div>
  );
}
