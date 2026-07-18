import type { Metadata } from "next";
import Link from "next/link";
import { getEstimateByReference } from "@/lib/estimator/fetch-estimate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/logo";
import { ContactCards } from "@/components/contact/contact-cards";
import { ResultActions } from "@/components/result/result-actions";
import { formatCurrencyRange, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ResultPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const data = await getEstimateByReference(reference);

  if (!data) {
    return (
      <div className="mx-auto flex min-h-svh max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <Logo variant="mark" href={null} className="h-10" />
        <h1 className="text-2xl font-semibold text-brand-text">We couldn&apos;t find that estimate</h1>
        <p className="text-brand-muted-foreground">
          This link may be incorrect or the estimate may no longer be available. You can start a new estimate below.
        </p>
        <Button asChild size="lg">
          <Link href="/">Start Your Estimate</Link>
        </Button>
      </div>
    );
  }

  const { lead, brief, estimate, items } = data;
  const essentialLaunch = estimate.essential_launch as { title: string; description: string; min: number; max: number };
  const recommendedSolution = estimate.recommended_solution as { title: string; description: string; min: number; max: number };
  const optionalUpgrades = estimate.optional_upgrades as { name: string; min: number; max: number; reason: string }[];
  const futureExpansion = estimate.future_expansion as string[];
  const assumptions = estimate.assumptions as string[];
  const exclusions = estimate.exclusions as string[];
  const aiInterpretation = brief.ai_interpretation as { summary?: string } | null;

  const confidenceLabel = { high: "High confidence", medium: "Medium confidence", low: "Consultation recommended" }[
    estimate.confidence
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-8 flex items-center justify-between">
        <Logo variant="full" className="h-8" />
        <Badge variant="outline">{reference}</Badge>
      </div>

      <div className="mb-8 space-y-1">
        <p className="text-sm font-medium text-brand-primary">Preliminary Estimate</p>
        <h1 className="text-3xl font-semibold tracking-tight text-brand-text">
          {lead.business_name || lead.full_name}&apos;s Project
        </h1>
        <p className="text-brand-muted-foreground">Prepared for {lead.full_name} · {formatDate(estimate.created_at)}</p>
      </div>

      <Card className="mb-6 border-brand-primary/30 bg-brand-primary/5">
        <CardContent className="space-y-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-brand-muted">One-time investment</p>
            <Badge variant={estimate.confidence === "high" ? "success" : estimate.confidence === "medium" ? "warning" : "secondary"}>
              {confidenceLabel}
            </Badge>
          </div>
          <p className="text-3xl font-semibold text-brand-text sm:text-4xl">
            {formatCurrencyRange(estimate.one_time_min, estimate.one_time_max)}
          </p>
          {estimate.monthly_min > 0 && (
            <p className="text-brand-muted-foreground">
              Plus {formatCurrencyRange(estimate.monthly_min, estimate.monthly_max)} / month for ongoing services
            </p>
          )}
          <p className="text-sm text-brand-muted-foreground">Estimated timeline: {estimate.estimated_timeline_label}</p>
          {estimate.custom_quotation_required && (
            <p className="text-sm font-medium text-brand-warning">
              This project needs a short consultation for an accurate custom quotation.
            </p>
          )}
        </CardContent>
      </Card>

      {(aiInterpretation?.summary || brief.project_description) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Project Summary</CardTitle>
          </CardHeader>
          <CardContent className="text-brand-text">
            <p>{aiInterpretation?.summary || brief.project_description}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Essential Launch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-brand-muted-foreground">{essentialLaunch.description}</p>
          <p className="text-xl font-semibold text-brand-text">
            {formatCurrencyRange(essentialLaunch.min, essentialLaunch.max)}
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recommended Solution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-brand-muted-foreground">{recommendedSolution.description}</p>
          <p className="text-xl font-semibold text-brand-text">
            {formatCurrencyRange(recommendedSolution.min, recommendedSolution.max)}
          </p>
          <ul className="divide-y divide-brand-border rounded-md border border-brand-border">
            {items.map((item) => (
              <li key={item.id} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-brand-text">{item.name}</p>
                  {item.notes && <p className="text-xs text-brand-muted-foreground">{item.notes}</p>}
                </div>
                <p className="text-sm text-brand-text">
                  {formatCurrencyRange(item.price_min, item.price_max)}
                  {item.unit === "monthly" ? " /mo" : ""}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {optionalUpgrades.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Optional Upgrades</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {optionalUpgrades.map((upgrade) => (
                <li key={upgrade.name} className="flex items-center justify-between text-sm">
                  <span className="text-brand-text">{upgrade.name}</span>
                  <span className="text-brand-muted-foreground">{formatCurrencyRange(upgrade.min, upgrade.max)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {futureExpansion.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Future Expansion</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm text-brand-muted-foreground">
              {futureExpansion.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Main Assumptions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm text-brand-muted-foreground">
              {assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Main Exclusions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm text-brand-muted-foreground">
              {exclusions.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="mb-8 rounded-md border border-brand-border bg-brand-surface p-4 text-xs text-brand-muted-foreground">
        This is a preliminary estimate based on the information provided. The final quotation will be prepared after a
        detailed project discussion. Domain, hosting, premium software, paid plugins, advertising budgets,
        payment-gateway fees, taxes, and other third-party expenses may be charged separately.
      </p>

      <div className="mb-10">
        <ResultActions reference={reference} />
      </div>

      <ContactCards reference={reference} />
    </div>
  );
}
