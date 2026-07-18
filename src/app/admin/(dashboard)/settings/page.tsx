import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/settings-form";
import { publicEnv } from "@/lib/env";

export default async function AdminSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase.from("app_settings").select("*");

  function getValue(key: string, fallback: string) {
    const row = rows?.find((r) => r.key === key);
    return row ? String(row.value).replace(/^"|"$/g, "") : fallback;
  }

  const initial = {
    whatsapp_number: getValue("whatsapp_number", publicEnv.NEXT_PUBLIC_WHATSAPP_NUMBER),
    contact_email: getValue("contact_email", publicEnv.NEXT_PUBLIC_CONTACT_EMAIL),
    disclaimer_text: getValue(
      "disclaimer_text",
      "This is a preliminary estimate based on the information provided. The final quotation will be prepared after a detailed project discussion."
    ),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-text">Settings</h1>
        <p className="text-brand-muted-foreground">Operational settings shown to clients across the estimator.</p>
      </div>
      <SettingsForm initial={initial} />
    </div>
  );
}
