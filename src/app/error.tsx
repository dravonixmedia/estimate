"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo variant="mark" href={null} className="h-10" />
      <h1 className="text-2xl font-semibold text-brand-text">Something went wrong</h1>
      <p className="max-w-sm text-brand-muted-foreground">
        We couldn&apos;t complete that action. Your progress has been saved — please try again.
      </p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
