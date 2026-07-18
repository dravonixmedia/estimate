"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { ContactCards } from "@/components/contact/contact-cards";
import { SERVICE_CATALOG } from "@/lib/estimator/services";
import { publicEnv } from "@/lib/env";
import { trackEvent } from "@/lib/analytics";
import { CheckCircle2, MessageSquareText, Sparkles, Wallet } from "lucide-react";

const HOW_IT_WORKS = [
  { icon: MessageSquareText, title: "Tell us your idea", description: "Describe your business or project in your own words." },
  { icon: Sparkles, title: "Confirm the services", description: "We suggest what fits — you confirm, add, or remove anything." },
  { icon: Wallet, title: "Get your estimate", description: "See a clear preliminary budget and timeline in minutes." },
];

const SERVICE_CATEGORIES = [
  { title: "Branding", items: ["Logo Design", "Brand Foundation"] },
  { title: "Websites", items: ["Landing Pages", "Business Websites", "E-commerce"] },
  { title: "Marketing", items: ["Social Media", "SEO", "Monthly Growth"] },
  { title: "Technical", items: ["Custom Web Apps", "Domain & Email"] },
];

export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-svh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <Logo variant="full" className="h-8" />
        <Button variant="ghost" asChild>
          <a href={publicEnv.NEXT_PUBLIC_MAIN_SITE_URL}>Main Website</a>
        </Button>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-12 text-center sm:py-20">
        <h1 className="text-4xl font-semibold tracking-tight text-brand-text sm:text-5xl">
          Tell us what you want to build.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-brand-muted-foreground">
          Share your project idea and receive a client-friendly preliminary estimate from Dravonix Media.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => {
              trackEvent("estimator_started");
              onStart();
            }}
          >
            Start Your Estimate
          </Button>
          <Button size="lg" variant="secondary" className="w-full sm:w-auto" asChild>
            <a href={publicEnv.NEXT_PUBLIC_MAIN_SITE_URL}>Visit Dravonix Media</a>
          </Button>
        </div>
        <p className="mt-3 text-sm text-brand-muted-foreground">Takes about 2-4 minutes. No account required.</p>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-8 text-center text-2xl font-semibold text-brand-text">How the estimator works</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardContent className="space-y-3 py-6">
                <Icon className="h-6 w-6 text-brand-primary" />
                <h3 className="font-semibold text-brand-text">{title}</h3>
                <p className="text-sm text-brand-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-8 text-center text-2xl font-semibold text-brand-text">Main service categories</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE_CATEGORIES.map((category) => (
            <Card key={category.title}>
              <CardContent className="space-y-3 py-6">
                <h3 className="font-semibold text-brand-text">{category.title}</h3>
                <ul className="space-y-1.5 text-sm text-brand-muted-foreground">
                  {category.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand-secondary" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-brand-muted-foreground">
          {SERVICE_CATALOG.length} services available — the estimator will recommend what fits your project.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <h2 className="text-xl font-semibold text-brand-text">What is a preliminary estimate?</h2>
            <p className="text-brand-muted-foreground">
              This estimator gives you a realistic budget range and timeline based on the information you share — not a
              final quotation. A detailed project discussion with our team refines it into a formal proposal.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12">
        <ContactCards />
      </section>

      <footer className="border-t border-brand-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-brand-muted-foreground sm:flex-row">
          <Logo variant="mark" href={null} className="h-6 opacity-70" />
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-brand-text">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-brand-text">
              Terms and Conditions
            </Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Dravonix Media</p>
        </div>
      </footer>
    </div>
  );
}
