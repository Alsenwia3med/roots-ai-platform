import type { Metadata } from "next";

import { StartScreen } from "../../../components/assessment/StartScreen";

/** ASM-05 — /assessment/start. Reached once consent is accepted. */
export const metadata: Metadata = {
  title: "Start — ROOTS-AI™",
  description: "What the ROOTS-AI assessment covers, how saving works, and your progress.",
  robots: { index: false, follow: false },
};

export default function StartPage() {
  return <StartScreen />;
}