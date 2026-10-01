import type { Metadata } from "next";

import { AssessmentEntry } from "../../components/assessment/AssessmentEntry";

/**
 * ASM-01 — /assessment. C-05 §2 "Primary CTA" entry point.
 *
 * The zone contract lives in the component. This route carries the C-04 §10
 * metadata for /assessment verbatim.
 */
export const metadata: Metadata = {
  title: "ROOTS Biological Assessment™ — ROOTS-AI™",
  description:
    "Complete 73 questions across 13 modules and receive a transparent educational report.",
};

export default function AssessmentPage() {
  return <AssessmentEntry />;
}
