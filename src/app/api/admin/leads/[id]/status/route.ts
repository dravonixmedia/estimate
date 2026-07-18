import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "consultation_scheduled", "proposal_sent", "won", "lost", "spam"]),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });

  const { data: currentLead } = await supabase.from("leads").select("status").eq("id", id).maybeSingle();
  if (!currentLead) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const { error } = await supabase.from("leads").update({ status: parsed.data.status }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });

  await supabase.from("lead_activity").insert({
    lead_id: id,
    type: "status_change",
    previous_status: currentLead.status,
    new_status: parsed.data.status,
    created_by: user.id,
  });

  return NextResponse.json({ ok: true });
}
