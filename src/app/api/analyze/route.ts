import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeProjectDescription } from "@/lib/ai/analyze";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const requestSchema = z.object({
  description: z.string().trim().min(1).max(4000),
  referenceWebsite: z.string().trim().max(300).optional(),
  inspirationLink: z.string().trim().max(300).optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`analyze:${ip}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "invalid_body" }, { status: 400 });
  }

  const result = await analyzeProjectDescription(
    parsed.data.description,
    parsed.data.referenceWebsite,
    parsed.data.inspirationLink
  );

  if (!result.ok) {
    // Log server-side only — the client must never see this reason, it
    // silently falls back to manual service selection.
    console.error("[analyze] AI analysis unavailable:", result.reason);
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  return NextResponse.json({ ok: true, data: result.data }, { status: 200 });
}
