import type { Metadata } from "next";

import { ResumeScreen } from "../../../../components/assessment/ResumeScreen";

export const metadata: Metadata = {
  title: "Resume — ROOTS-AI™",
  robots: { index: false, follow: false },
};

/**
 * ASM-08 — /assessment/[session]/resume.
 *
 * This route was previously linked from the Save & Exit modal and returned 404,
 * so a participant who chose to leave could never come back.
 */
export default function ResumePage({ params }: { params: { session: string } }) {
  return <ResumeScreen session={params.session} />;
}