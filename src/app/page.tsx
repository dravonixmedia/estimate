import { Suspense } from "react";
import { EstimatorApp } from "@/components/estimator/estimator-app";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <EstimatorApp />
    </Suspense>
  );
}
