/**
 * Reference snippet for the Dravonix Media main website
 * (www.dravonixmedia.com), NOT part of this app's build.
 *
 * Drop this into the main site's codebase (e.g. on /pricing) to link
 * through to the estimator while preserving UTM parameters. Opens in the
 * same tab, same-origin navigation is not required since the estimator
 * is a separate deployment at estimate.dravonix.dev.
 */
"use client";

const ESTIMATOR_URL = "https://estimate.dravonix.dev";

function buildEstimatorHref(): string {
  if (typeof window === "undefined") return ESTIMATOR_URL;
  const params = new URLSearchParams(window.location.search);
  const utmParams = new URLSearchParams();
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const value = params.get(key);
    if (value) utmParams.set(key, value);
  }
  const query = utmParams.toString();
  return query ? `${ESTIMATOR_URL}/?${query}` : `${ESTIMATOR_URL}/`;
}

export function PricingEstimatorCta() {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
      <h2 className="text-2xl font-semibold text-slate-900">Not sure which service fits your project?</h2>
      <p className="mx-auto mt-2 max-w-xl text-slate-600">
        Share your requirements and receive a client-friendly preliminary estimate from Dravonix Media.
      </p>
      <a
        href={buildEstimatorHref()}
        className="mt-6 inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
      >
        Get an Instant Estimate
      </a>
    </section>
  );
}
