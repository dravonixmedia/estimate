"use client";

import * as React from "react";
import type { AiInterpretation } from "@/lib/estimator/schema";

type AnalyzeStatus = "idle" | "loading" | "success" | "fallback";

const CLIENT_TIMEOUT_MS = 14_000;

/**
 * Calls the protected /api/analyze endpoint. On any failure (timeout,
 * network error, invalid response, or the server reporting `ok: false`)
 * it resolves to the "fallback" status silently — callers must never show
 * an error banner or mention AI, per the silent-fallback requirement.
 */
export function useAnalyzeProject() {
  const [status, setStatus] = React.useState<AnalyzeStatus>("idle");
  const [data, setData] = React.useState<AiInterpretation | null>(null);

  const run = React.useCallback(async (description: string, referenceWebsite?: string, inspirationLink?: string) => {
    setStatus("loading");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, referenceWebsite, inspirationLink }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("non_200");
      const json = await response.json();

      if (json?.ok && json.data) {
        setData(json.data as AiInterpretation);
        setStatus("success");
      } else {
        setStatus("fallback");
      }
    } catch {
      setStatus("fallback");
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  return { status, data, run };
}
