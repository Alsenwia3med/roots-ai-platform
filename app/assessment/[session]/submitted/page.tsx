import type { Metadata } from "next";

import { SubmittedScreen } from "../../../../components/assessment/SubmittedScreen";

export const metadata: Metadata = {
  title: "Submission received — ROOTS-AI™",
  robots: { index: false, follow: false },
};

/**
 * ASM-10 — /assessment/[session]/submitted, and ASM-11 as its error state.
 *
 * The reference shown here is a placeholder derived from the session segment,
 * NOT a stored submission id: no submission route exists in this checkout
 * (M2_OPEN_ITEMS item 1 — persistence is blocked on the recorded M1 schema
 * conflicts). It is labelled as a reference and must be replaced with the real
 * persisted id once that route is approved; inventing a plausible-looking UUID
 * would imply a submission that did not happen.
 */
export default function SubmittedPage({ params }: { params: { session: string } }) {
  return <SubmittedScreen reference={`Session ${params.session}`} />;
}