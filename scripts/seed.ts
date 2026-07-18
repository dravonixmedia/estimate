/**
 * Seeds Supabase with the initial service catalog and default app
 * settings. Safe to re-run — every write is an upsert.
 *
 * Usage: npm run seed (reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * from .env.local via dotenv).
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { SERVICE_CATALOG } from "../src/lib/estimator/services";

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.example).");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

  console.log(`Seeding ${SERVICE_CATALOG.length} services...`);
  const { error: servicesError } = await supabase.from("services").upsert(
    SERVICE_CATALOG.map((service) => ({
      id: service.id,
      name: service.name,
      category: service.category,
      unit: service.unit,
      price_min: service.priceMin,
      price_max: service.priceMax,
      description: service.description,
      active: true,
      manual_quotation_possible: service.manualQuotationPossible ?? false,
    })),
    { onConflict: "id" }
  );
  if (servicesError) throw servicesError;

  console.log("Seeding default app settings...");
  const { error: settingsError } = await supabase.from("app_settings").upsert(
    [
      { key: "whatsapp_number", value: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "" },
      { key: "contact_email", value: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "admin@dravonixmedia.com" },
      {
        key: "disclaimer_text",
        value:
          "This is a preliminary estimate based on the information provided. The final quotation will be prepared after a detailed project discussion. Domain, hosting, premium software, paid plugins, advertising budgets, payment-gateway fees, taxes, and other third-party expenses may be charged separately.",
      },
    ],
    { onConflict: "key", ignoreDuplicates: true }
  );
  if (settingsError) throw settingsError;

  console.log("Seed complete.");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
