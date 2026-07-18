import { NextResponse } from "next/server";
import { getEstimateByReference } from "@/lib/estimator/fetch-estimate";
import { generateEstimatePdf } from "@/lib/pdf/generate";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ reference: string }> }) {
  const { reference } = await context.params;
  const data = await getEstimateByReference(reference);

  if (!data) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  try {
    const pdfBytes = await generateEstimatePdf(data, reference);
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="dravonix-estimate-${reference}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[pdf] Generation failed:", error);
    return NextResponse.json({ ok: false, error: "pdf_generation_failed" }, { status: 500 });
  }
}
