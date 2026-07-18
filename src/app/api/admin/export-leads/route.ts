import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function toCsvValue(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { data: leads, error } = await supabase
    .from("leads")
    .select("reference, full_name, business_name, whatsapp_number, email, business_stage, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 });
  }

  const headers = ["Reference", "Full Name", "Business Name", "WhatsApp", "Email", "Business Stage", "Status", "Created At"];
  const rows = (leads ?? []).map((lead) =>
    [lead.reference, lead.full_name, lead.business_name, lead.whatsapp_number, lead.email, lead.business_stage, lead.status, lead.created_at]
      .map(toCsvValue)
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dravonix-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
