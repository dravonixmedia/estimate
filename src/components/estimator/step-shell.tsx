"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type StepShellProps = {
  heading: string;
  description?: string;
  children: React.ReactNode;
  onBack?: () => void;
  footer?: React.ReactNode;
  className?: string;
};

/** Shared layout for every estimator screen: heading, body, and a sticky
 * mobile-friendly footer so the primary action is always reachable. */
export function StepShell({ heading, description, children, onBack, footer, className }: StepShellProps) {
  return (
    <div className="flex flex-col gap-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 self-start text-sm text-brand-muted-foreground hover:text-brand-text"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      )}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-text sm:text-3xl">{heading}</h1>
        {description && <p className="text-brand-muted-foreground">{description}</p>}
      </div>
      <div className={cn("space-y-6", className)}>{children}</div>
      {footer && (
        <div className="sticky bottom-0 -mx-4 mt-4 border-t border-brand-border bg-brand-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-brand-background/80 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 [padding-bottom:calc(env(safe-area-inset-bottom)+1rem)] sm:[padding-bottom:0]">
          {footer}
        </div>
      )}
    </div>
  );
}

export function StepFooter({
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  extra,
}: {
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      {extra}
      <Button type="button" size="lg" className="ml-auto min-w-40" onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
      </Button>
    </div>
  );
}
