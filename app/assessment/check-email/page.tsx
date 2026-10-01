import type { Metadata } from "next";

import { CheckEmailScreen } from "../../../components/assessment/CheckEmailScreen";

/** ASM-02 — /assessment/check-email. Public, reached after link request. */
export const metadata: Metadata = {
  title: "Check your email — ROOTS-AI™",
  description: "Request a new secure access link for your ROOTS-AI assessment.",
  // Neutral message; must not be indexed or cached as an account-existence hint.
  robots: { index: false, follow: false },
};

export default function CheckEmailPage({
  searchParams,
}: {
  searchParams?: { email?: string };
}) {
  // The address is echoed only so the participant can confirm what they typed.
  // It is not used to decide whether this page is shown.
  const email =
    typeof searchParams?.email === "string" ? searchParams.email.slice(0, 254) : undefined;
  return <CheckEmailScreen email={email} />;
}