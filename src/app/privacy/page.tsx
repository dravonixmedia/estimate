import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { publicEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Dravonix Media collects, uses, and protects information submitted through the Project Estimator.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
      <Logo variant="full" className="mb-8 h-8" />
      <h1 className="mb-2 text-3xl font-semibold text-brand-text">Privacy Policy</h1>
      <p className="mb-8 text-sm text-brand-muted-foreground">Last updated: {new Date().getFullYear()}</p>

      <div className="space-y-8 text-brand-text [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_p]:text-brand-muted-foreground [&_p]:leading-relaxed [&_li]:text-brand-muted-foreground">
        <section>
          <h2>1. What this policy covers</h2>
          <p>
            This Privacy Policy explains how Dravonix Media (&quot;we&quot;, &quot;us&quot;) collects and uses
            information when you use the Dravonix Project Estimator at {publicEnv.NEXT_PUBLIC_ESTIMATOR_URL}.
          </p>
        </section>

        <section>
          <h2>2. Information we collect</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Contact details you provide: your name, business name, WhatsApp number and/or email address.</li>
            <li>Project information: your project description, selected services, and answers to scope questions.</li>
            <li>Technical information: UTM parameters, referrer, and basic usage analytics events.</li>
          </ul>
        </section>

        <section>
          <h2>3. How we use your information</h2>
          <p>
            We use the information you provide to generate a preliminary estimate, to follow up with you about your
            project, and to improve our services. Your project description may be processed by a third-party AI
            service (Anthropic&apos;s Claude) solely to help interpret your requirements — it is never used to
            calculate pricing, and it is not used to train third-party models.
          </p>
        </section>

        <section>
          <h2>4. Data storage and security</h2>
          <p>
            Your information is stored securely using Supabase, with access restricted to authorised Dravonix Media
            staff. We apply reasonable technical and organisational measures to protect your data from unauthorised
            access, alteration, or disclosure.
          </p>
        </section>

        <section>
          <h2>5. Sharing your information</h2>
          <p>
            We do not sell your information. We share information only with service providers who help us operate
            the estimator (such as our database and AI providers), and only to the extent necessary for them to
            provide that service.
          </p>
        </section>

        <section>
          <h2>6. Your choices</h2>
          <p>
            You may contact us at{" "}
            <a href={`mailto:${publicEnv.NEXT_PUBLIC_CONTACT_EMAIL}`} className="text-brand-primary underline">
              {publicEnv.NEXT_PUBLIC_CONTACT_EMAIL}
            </a>{" "}
            to request access to, correction of, or deletion of your information.
          </p>
        </section>

        <section>
          <h2>7. Contact us</h2>
          <p>
            Questions about this policy can be sent to{" "}
            <a href={`mailto:${publicEnv.NEXT_PUBLIC_CONTACT_EMAIL}`} className="text-brand-primary underline">
              {publicEnv.NEXT_PUBLIC_CONTACT_EMAIL}
            </a>{" "}
            or via our{" "}
            <a href={publicEnv.NEXT_PUBLIC_CONTACT_PAGE_URL} className="text-brand-primary underline">
              contact page
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
