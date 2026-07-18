"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { clearLocalDraft } from "@/lib/estimator/session";
import { trackEvent } from "@/lib/analytics";
import { Download, RefreshCw, RotateCcw, Sparkles } from "lucide-react";

export function ResultActions({ reference }: { reference: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button asChild size="lg" variant="secondary">
        <a href={`/api/pdf/${reference}`} onClick={() => trackEvent("estimate_downloaded", { reference })} download>
          <Download className="h-4 w-4" /> Download Estimate
        </a>
      </Button>
      <Button asChild size="lg" variant="secondary">
        <Link href="/">
          <RefreshCw className="h-4 w-4" /> Edit Requirements
        </Link>
      </Button>
      <Button
        asChild
        size="lg"
        variant="outline"
        onClick={() => {
          clearLocalDraft();
        }}
      >
        <Link href="/">
          <RotateCcw className="h-4 w-4" /> Start Another Estimate
        </Link>
      </Button>
      <Button
        asChild
        size="lg"
        variant="outline"
        onClick={() => trackEvent("refine_estimate_opened", { reference })}
      >
        <Link href="/">
          <Sparkles className="h-4 w-4" /> Refine My Estimate
        </Link>
      </Button>
    </div>
  );
}
