"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { EstimatorProvider, useEstimator } from "./estimator-context";
import { Landing } from "./landing";
import { Wizard } from "./wizard";
import { getEstimatorStarted, setEstimatorStarted } from "@/lib/estimator/session";

function EstimatorAppInner() {
  const [started, setStarted] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const { updateState } = useEstimator();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    setStarted(getEstimatorStarted());
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!searchParams) return;
    const utm = {
      utmSource: searchParams.get("utm_source") ?? undefined,
      utmMedium: searchParams.get("utm_medium") ?? undefined,
      utmCampaign: searchParams.get("utm_campaign") ?? undefined,
      utmTerm: searchParams.get("utm_term") ?? undefined,
      utmContent: searchParams.get("utm_content") ?? undefined,
    };
    if (Object.values(utm).some(Boolean)) {
      updateState((prev) => ({
        ...prev,
        attribution: { ...prev.attribution, ...utm, referrer: prev.attribution.referrer ?? document.referrer },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStart() {
    setEstimatorStarted(true);
    setStarted(true);
  }

  function handleGoHome() {
    setEstimatorStarted(false);
    setStarted(false);
    window.scrollTo({ top: 0 });
  }

  if (!hydrated) return null;

  return started ? <Wizard onHome={handleGoHome} /> : <Landing onStart={handleStart} />;
}

export function EstimatorApp() {
  return (
    <EstimatorProvider>
      <EstimatorAppInner />
    </EstimatorProvider>
  );
}
