import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ModuleShell } from "../../../../../components/assessment/ModuleShell";
import { QUESTION_BANK } from "../../../../../lib/assessment/question-bank";

export const metadata: Metadata = {
  title: "Assessment — ROOTS-AI™",
  robots: { index: false, follow: false },
};

/**
 * ASM-06 — /assessment/[session]/module/[1..13].
 *
 * The module segment is parsed and range-checked against the canonical module
 * count rather than trusted: C-05 fixes the route at [1..13]. `ModuleShell`
 * renders "That module does not exist" for anything outside it instead of
 * throwing, and instead of silently falling back to module 1 — a fallback would
 * quietly put a participant on the wrong module, which C-05 §1 forbids.
 *
 * `Number(...)` rather than `parseInt`, so "1abc" resolves to NaN (rejected)
 * instead of silently becoming module 1.
 *
 * The bound is read from QUESTION_BANK here, not from AssessmentShell: a `const`
 * derived in a "use client" module arrives on the server as a client-reference
 * OBJECT rather than its number, which silently turned this comparison false for
 * every valid module.
 */
export default function ModulePage({
  params,
}: {
  params: { session: string; module: string };
}) {
  const parsed = Number(params.module);
  const moduleCount = QUESTION_BANK.modules.length;
  const inRange = Number.isInteger(parsed) && parsed >= 1 && parsed <= moduleCount;
  // Out-of-range module numbers call notFound() so they return a real HTTP 404.
  // Passing moduleIndex = 0 instead returned 200 with a rendered "That module does
  // not exist" page: wrong status code, and it masked the missing screen.
  if (!inRange) notFound();

  return <ModuleShell session={params.session} moduleIndex={parsed} />;
}