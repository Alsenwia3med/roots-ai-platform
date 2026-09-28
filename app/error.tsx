"use client";

import { SafeErrorFallback } from "../components/system/AvailabilityStates";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <SafeErrorFallback reset={reset} />;
}
