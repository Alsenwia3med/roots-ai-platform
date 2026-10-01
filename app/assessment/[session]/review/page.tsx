import type { Metadata } from "next";

import { ReviewScreen } from "../../../../components/assessment/ReviewScreen";

export const metadata: Metadata = {
  title: "Review — ROOTS-AI™",
  robots: { index: false, follow: false },
};

/**
 * ASM-09 — /assessment/[session]/review.
 *
 * Reached from the final module. This route was previously linked from module 13
 * and returned 404, which was also the end of the assessment: there was nowhere
 * to submit from.
 */
export default function ReviewPage({ params }: { params: { session: string } }) {
  return <ReviewScreen session={params.session} />;
}