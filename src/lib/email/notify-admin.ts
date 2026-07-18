import "server-only";
import { createMimeMessage } from "mimetext";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { EstimatorState } from "@/lib/estimator/schema";
import type { PricingResult } from "@/lib/pricing/engine";
import { formatCurrencyRange } from "@/lib/format";
import { publicEnv } from "@/lib/env";

const FROM_ADDRESS = "estimator@dravonixmedia.com";

/**
 * Notifies the Dravonix team by email whenever a client generates an
 * estimate, using Cloudflare's native Send Email Worker binding (Email
 * Routing) rather than a third-party provider/API key. Best-effort only:
 * failures are logged and swallowed, never surfaced to the client and
 * never block estimate generation. Does nothing outside the deployed
 * Cloudflare Worker (e.g. local `next dev`) since the binding and the
 * `cloudflare:email` module only exist there.
 */
export async function notifyAdminOfNewLead(params: {
  state: EstimatorState;
  pricing: PricingResult;
  estimateReference: string;
  leadReference: string;
}) {
  try {
    const binding = getCloudflareContext().env.SEND_EMAIL;
    if (!binding) {
      console.log("[notify-admin] SEND_EMAIL binding not available (expected in local dev) — skipping.");
      return;
    }

    // A variable (not an inline string literal) sidesteps a TypeScript
    // quirk: with `paths` configured in tsconfig, its "bundler" module
    // resolution fails to resolve colon-containing specifiers like this
    // one via the ambient `declare module` in cloudflare-email.d.ts.
    const cloudflareEmailModule = "cloudflare:email";
    const { EmailMessage } = await import(cloudflareEmailModule);
    const { state, estimateReference } = params;
    const to = publicEnv.NEXT_PUBLIC_CONTACT_EMAIL;

    const services = (state.services.selectedServices ?? [])
      .map((id) => id.replace(/_/g, " "))
      .join(", ") || (state.services.servicesNotSure ? "Not Sure" : "None selected");

    const msg = createMimeMessage();
    msg.setSender({ name: "Dravonix Project Estimator", addr: FROM_ADDRESS });
    msg.setRecipient(to);
    msg.setSubject(`New estimate: ${state.clientDetails.fullName ?? "Unknown"} (${estimateReference})`);
    msg.addMessage({
      contentType: "text/plain",
      data: buildPlainTextSummary({ ...params, services, to }),
    });

    const raw = new EmailMessage(FROM_ADDRESS, to, msg.asRaw());
    await binding.send(raw);
  } catch (error) {
    console.error("[notify-admin] Failed to send admin notification email:", error);
  }
}

function buildPlainTextSummary({
  state,
  pricing,
  estimateReference,
  leadReference,
  services,
  to,
}: {
  state: EstimatorState;
  pricing: PricingResult;
  estimateReference: string;
  leadReference: string;
  services: string;
  to: string;
}) {
  const lines = [
    `A new estimate was generated on the Dravonix Project Estimator.`,
    ``,
    `Client: ${state.clientDetails.fullName ?? "-"}`,
    `Business: ${state.clientDetails.businessName ?? "-"}`,
    `WhatsApp: ${state.clientDetails.whatsappNumber ?? "-"}`,
    `Email: ${state.clientDetails.email ?? "-"}`,
    `Business stage: ${state.clientDetails.businessStage ?? "-"}`,
    ``,
    `Project description:`,
    state.projectIdea.description ?? "-",
    ``,
    `Services: ${services}`,
    ``,
    `One-time estimate: ${formatCurrencyRange(pricing.oneTimeMin, pricing.oneTimeMax)}`,
    pricing.monthlyMin > 0 ? `Monthly estimate: ${formatCurrencyRange(pricing.monthlyMin, pricing.monthlyMax)}` : null,
    `Confidence: ${pricing.confidence}`,
    `Timeline: ${pricing.estimatedTimelineLabel}`,
    ``,
    `Estimate reference: ${estimateReference}`,
    `Lead reference: ${leadReference}`,
    `Result page: ${publicEnv.NEXT_PUBLIC_ESTIMATOR_URL}/result/${estimateReference}`,
    ``,
    `This notification was sent to ${to} via Cloudflare Email Routing.`,
  ];
  return lines.filter((line) => line !== null).join("\n");
}
