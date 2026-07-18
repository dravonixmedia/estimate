import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  price_min: z.number().min(0).optional(),
  price_max: z.number().min(0).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });

  if (
    parsed.data.price_min !== undefined &&
    parsed.data.price_max !== undefined &&
    parsed.data.price_min > parsed.data.price_max
  ) {
    return NextResponse.json({ ok: false, error: "min_exceeds_max" }, { status: 400 });
  }

  const { error } = await supabase.from("services").update(parsed.data).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
