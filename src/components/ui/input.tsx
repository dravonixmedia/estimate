import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-md border border-brand-border bg-brand-surface px-4 py-2 text-base text-brand-text placeholder:text-brand-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-brand-danger",
        className
      )}
      {...props}
    />
  );
}

export { Input };
