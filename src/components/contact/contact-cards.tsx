"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { publicEnv } from "@/lib/env";
import { trackEvent } from "@/lib/analytics";
import { MessageCircle, Mail, Globe } from "lucide-react";

function buildWhatsAppLink(number: string, reference?: string) {
  const digits = number.replace(/[^\d+]/g, "");
  const message = reference
    ? `Hello Dravonix Media, I completed the Project Estimator. My estimate reference is ${reference}. I would like to discuss the project.`
    : "Hello Dravonix Media, I would like to discuss a project.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function ContactCards({ reference }: { reference?: string }) {
  // WhatsApp number comes from window.__DRAVONIX_PUBLIC_ENV__ (injected by
  // <RuntimeEnv /> in the root layout), not build-time NEXT_PUBLIC_
  // inlining — that was proven unreliable on this Cloudflare deployment
  // (frozen at whatever value existed during the separate CI build step).
  // Read it in an effect (not directly during render) so the server-
  // rendered HTML and the client's first hydration pass match — window
  // isn't available during SSR.
  const [whatsappNumber, setWhatsappNumber] = React.useState("");
  React.useEffect(() => {
    setWhatsappNumber(window.__DRAVONIX_PUBLIC_ENV__?.WHATSAPP_NUMBER ?? "");
  }, []);

  const hasWhatsapp = !!whatsappNumber;
  const emailSubject = reference ? `Project Estimate Enquiry — ${reference}` : "Project Estimate Enquiry";
  const mailtoLink = `mailto:${publicEnv.NEXT_PUBLIC_CONTACT_EMAIL}?subject=${encodeURIComponent(emailSubject)}`;

  return (
    <div className="space-y-4">
      <div className="space-y-1 text-center sm:text-left">
        <h2 className="text-xl font-semibold text-brand-text">Need help with your estimate?</h2>
        <p className="text-brand-muted-foreground">
          Connect directly with the Dravonix Media team to discuss your requirements, clarify the estimate, or request a
          detailed proposal.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {hasWhatsapp && (
          <ContactCard
            href={buildWhatsAppLink(whatsappNumber, reference)}
            icon={<MessageCircle className="h-5 w-5" />}
            label="Chat on WhatsApp"
            description="Get a quick response from our team."
            onClick={() => trackEvent("whatsapp_clicked", { reference })}
            primary
          />
        )}
        <ContactCard
          href={mailtoLink}
          icon={<Mail className="h-5 w-5" />}
          label="Send an Email"
          description="Share your project details with our team."
          onClick={() => trackEvent("email_clicked", { reference })}
        />
        <ContactCard
          href={publicEnv.NEXT_PUBLIC_CONTACT_PAGE_URL}
          icon={<Globe className="h-5 w-5" />}
          label="Visit Contact Page"
          description="View all available contact information."
          onClick={() => trackEvent("contact_page_clicked", { reference })}
          external
        />
      </div>
    </div>
  );
}

function ContactCard({
  href,
  icon,
  label,
  description,
  onClick,
  primary,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  primary?: boolean;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="block min-h-[3.5rem]"
    >
      <Card className={primary ? "h-full border-brand-primary bg-brand-primary/5" : "h-full"}>
        <CardContent className="flex h-full flex-col items-center gap-2 py-6 text-center sm:items-start sm:text-left">
          <span
            className={
              primary
                ? "flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-white"
                : "flex h-10 w-10 items-center justify-center rounded-full bg-brand-background text-brand-primary"
            }
          >
            {icon}
          </span>
          <span className="font-semibold text-brand-text">{label}</span>
          <span className="text-sm text-brand-muted-foreground">{description}</span>
        </CardContent>
      </Card>
    </a>
  );
}
