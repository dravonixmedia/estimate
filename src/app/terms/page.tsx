import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { publicEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms of use for the Dravonix Media Project Estimator.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <Logo variant="full" className="mb-8 h-8" />
      <h1 className="mb-2 text-3xl font-semibold text-brand-text">Terms and Conditions</h1>
      <p className="mb-8 text-sm text-brand-muted-foreground">Last updated: {new Date().getFullYear()}</p>

      <div className="space-y-8 text-brand-text [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_p]:text-brand-muted-foreground [&_p]:leading-relaxed [&_li]:text-brand-muted-foreground">
        <section>
          <h2>1. Acceptance</h2>
          <p>
            By using the Dravonix Project Estimator at {publicEnv.NEXT_PUBLIC_ESTIMATOR_URL}, you agree to these
            Terms and Conditions.
          </p>
        </section>

        <section>
          <h2>2. Nature of the estimate</h2>
          <p>
            The estimator provides a preliminary, non-binding budget range based on information you provide. It is
            not a formal quotation, invoice, or contract. Final pricing is confirmed only after a detailed project
            discussion with Dravonix Media and a signed proposal.
          </p>
        </section>

        <section>
          <h2>3. Excluded costs</h2>
          <p>
            Domain registration, hosting, premium software or plugin subscriptions, advertising spend,
            payment-gateway fees, taxes, and other third-party costs are not included in any estimate shown by this
            tool unless explicitly stated.
          </p>
        </section>

        <section>
          <h2>4. Accuracy of information</h2>
          <p>
            You are responsible for the accuracy of the information you provide. Dravonix Media is not liable for
            estimate inaccuracies resulting from incomplete or incorrect information.
          </p>
        </section>

        <section>
          <h2>5. No account required</h2>
          <p>
            The estimator does not require you to create an account. Your submission is identified by a unique
            estimate reference, which you can use to revisit your result.
          </p>
        </section>

        <section>
          <h2>6. Intellectual property</h2>
          <p>
            All branding, design, and content on this site belong to Dravonix Media and may not be reproduced
            without permission.
          </p>
        </section>

        <section>
          <h2>7. Changes to these terms</h2>
          <p>We may update these Terms and Conditions from time to time. Continued use of the estimator constitutes acceptance of any changes.</p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            Questions can be sent to{" "}
            <a href={`mailto:${publicEnv.NEXT_PUBLIC_CONTACT_EMAIL}`} className="text-brand-primary underline">
              {publicEnv.NEXT_PUBLIC_CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>

      <Link href="/" className="mt-10 inline-block text-sm text-brand-primary underline">
        Back to the estimator
      </Link>
    </div>
  );
}
