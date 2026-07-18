"use client";

import { ChoiceCard } from "@/components/ui/choice-card";

type Option = { value: string; label: string; description?: string };

type ChoiceGroupProps = {
  label: string;
  options: Option[];
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
  multi?: boolean;
};

/** Grouped set of ChoiceCards for a single question — single-select
 * (radio-like) or multi-select, sharing the same large tap-target style. */
export function ChoiceGroup({ label, options, value, onChange, multi }: ChoiceGroupProps) {
  const selectedValues = multi ? ((value as string[] | undefined) ?? []) : value ? [value as string] : [];

  function handleSelect(optionValue: string) {
    if (multi) {
      const current = (value as string[] | undefined) ?? [];
      const next = current.includes(optionValue) ? current.filter((v) => v !== optionValue) : [...current, optionValue];
      onChange(next);
    } else {
      onChange(optionValue);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-brand-text">{label}</p>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {options.map((option) => (
          <ChoiceCard
            key={option.value}
            title={option.label}
            description={option.description}
            selected={selectedValues.includes(option.value)}
            onSelect={() => handleSelect(option.value)}
          />
        ))}
      </div>
    </div>
  );
}
