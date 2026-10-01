import type { Metadata } from "next";

import { ConsentScreen } from "../../../components/assessment/ConsentScreen";

/** ASM-04 — /assessment/consent. Reached with a valid secure link. */
export const metadata: Metadata = {
  title: "Consent — ROOTS-AI™",
  description: "Service and optional research consent for the ROOTS-AI assessment.",
  robots: { index: false, follow: false },
};

export default function ConsentPage({
  searchParams,
}: {
  searchParams?: { email?: string };
}) {
  const email =
    typeof searchParams?.email === "string" ? searchParams.email.slice(0, 254) : undefined;
  return <ConsentScreen email={email} />;
}