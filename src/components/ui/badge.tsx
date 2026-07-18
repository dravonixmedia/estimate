import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-primary text-white",
        secondary: "border-transparent bg-brand-background text-brand-muted",
        outline: "border-brand-border text-brand-text",
        success: "border-transparent bg-brand-success/10 text-brand-success",
        warning: "border-transparent bg-brand-warning/10 text-brand-warning",
        danger: "border-transparent bg-brand-danger/10 text-brand-danger",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
