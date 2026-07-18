import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-32 w-full rounded-md border border-brand-border bg-brand-surface px-4 py-3 text-base text-brand-text placeholder:text-brand-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-brand-danger",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
