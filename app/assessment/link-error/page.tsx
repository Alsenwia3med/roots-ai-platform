import type { Metadata } from "next";

import { LinkErrorScreen } from "../../../components/assessment/LinkErrorScreen";

/** ASM-03 — /assessment/link-error. Shown for an invalid or expired token. */
export const metadata: Metadata = {
  title: "Link expired — ROOTS-AI™",
  description: "Request a new secure access link to continue your ROOTS-AI assessment.",
  robots: { index: false, follow: false },
};

export default function LinkErrorPage() {
  return <LinkErrorScreen />;
}