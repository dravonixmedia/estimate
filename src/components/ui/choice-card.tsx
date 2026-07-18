"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ChoiceCardProps = {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * Large, mobile-friendly tap target used for every single/multi-select
 * question in the estimator (service selection, business stage, launch
 * timeframe, etc). Deliberately not a raw checkbox/radio list — the brief
 * requires large tap targets and a clear selected state on small screens.
 */
export function ChoiceCard({ selected, onSelect, title, description, className, disabled }: ChoiceCardProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors min-h-[3.5rem]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
        selected
          ? "border-brand-primary bg-brand-primary/5"
          : "border-brand-border bg-brand-surface hover:border-brand-primary/50",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
          selected ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border bg-brand-surface"
        )}
      >
        {selected && <Check className="h-3.5 w-3.5" />}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-brand-text">{title}</span>
        {description && <span className="text-xs text-brand-muted-foreground">{description}</span>}
      </span>
    </button>
  );
}
