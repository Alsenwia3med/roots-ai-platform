"use client";

import React from "react";

import { QUESTION_BANK } from "../../lib/assessment/question-bank";

/**
 * ASM shared shell — the layout every assessment screen uses.
 *
 * C-05's responsive rule is quoted literally and implemented once here rather
 * than repeated per screen: "Mobile shows one primary question region at a time;
 * desktop question column max 760 px; progress and navigation remain reachable."
 * The 760 px cap is the `maxWidth` below, and the single-region rule is why only
 * one question region is ever mounted.
 *
 * ASM-01 zone 1 is a "Minimal brand header", so this header is deliberately
 * quieter than the public marketing header: no product nav, no secondary CTAs.
 * Nothing here may collect analytics or replay traffic — C-04 states protected
 * routes carry no marketing pixels.
 */

type SaveState = "idle" | "saving" | "saved" | "failed";

export function AssessmentShell({
  children,
  saveState = "idle",
  onSaveExit,
  sessionMinutesRemaining,
}: {
  children: React.ReactNode;
  /** ASM-06 zone 6 — debounced autosave status. */
  saveState?: SaveState;
  /** ASM-07 entry point. Omitted on screens with no in-progress answers. */
  onSaveExit?: () => void;
  /** ASM-06 zone 7 — session expiry countdown. */
  sessionMinutesRemaining?: number | null;
}) {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>
      <header className="border-b border-[#D8DEE8] bg-[#1A2A4A] px-5 text-white">
        <div className="mx-auto flex min-h-16 max-w-[760px] items-center justify-between gap-4">
          <a href="/" aria-label="ROOTS-AI home" className="inline-flex min-h-11 items-center font-semibold">
            ROOTS-AI™
          </a>
          <div className="flex items-center gap-3 text-sm">
            {saveState !== "idle" ? (
              <span
                // ASM-06 zone 6: Saving / Saved / Failed, announced politely so
                // a screen-reader user is told when the answer is durable.
                role="status"
                aria-live="polite"
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  saveState === "failed"
                    ? "bg-[#B91C1C] text-white"
                    : "bg-white/15 text-white"
                }`}
              >
                {saveState === "saving"
                  ? "Saving…"
                  : saveState === "saved"
                    ? "Saved"
                    : "Save failed"}
              </span>
            ) : null}
            {sessionMinutesRemaining !== null && sessionMinutesRemaining !== undefined ? (
              <span className="text-xs text-white/80">
                Session expires in {sessionMinutesRemaining} min
              </span>
            ) : null}
            {onSaveExit ? (
              <button
                type="button"
                onClick={onSaveExit}
                className="inline-flex min-h-11 items-center rounded-lg border border-white/40 px-4 text-sm font-semibold hover:bg-white/10"
              >
                Save &amp; Exit
              </button>
            ) : null}
          </div>
        </div>
      </header>
      {/* The single primary region. `mx-auto max-w-[760px]` is the C-05
          desktop question-column rule; regions stack vertically on mobile. */}
      <main id="main" className="mx-auto w-full max-w-[760px] px-5 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}

/** ASM-06 zone 1 — module n of 13 plus completion percentage. */
export function ModuleProgressBar({
  moduleIndex,
  totalModules = 13,
  percentComplete,
}: {
  moduleIndex: number;
  totalModules?: number;
  percentComplete: number;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between text-sm text-[#1A2A4A]">
        <span className="font-semibold">
          Module {moduleIndex} of {totalModules}
        </span>
        <span className="text-[#6B7280]">{Math.round(percentComplete)}% complete</span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-[#E5E7EB]"
        role="progressbar"
        aria-valuenow={Math.round(percentComplete)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Assessment completion"
      >
        <div
          className="h-2 rounded-full bg-[#437971] transition-all"
          style={{ width: `${Math.min(100, Math.max(0, percentComplete))}%` }}
        />
      </div>
    </div>
  );
}

/** ASM-06 zone 2 — module title and its one-sentence purpose. */
export function ModuleIntro({ title, purpose }: { title: string; purpose: string }) {
  return (
    <section className="mb-6 rounded-xl border border-[#D8DEE8] bg-[#F3F8F7] px-5 py-4">
      <h1 className="text-lg font-bold text-[#1A2A4A]">{title}</h1>
      <p className="mt-1 text-sm leading-6 text-[#437971]">{purpose}</p>
    </section>
  );
}

/** Canonical module list, so a screen never re-derives the order. */
export const ASSESSMENT_MODULES = QUESTION_BANK.modules;

/**
 * Module count.
 *
 * Deliberately NOT a module-level `const`, and deliberately NOT re-exported for
 * Server Components to import. Both were tried and both broke:
 *
 *   const TOTAL = QUESTION_BANK.modules.length
 *     -> a Server Component importing it from this "use client" module received a
 *        client-reference OBJECT, not 13, so every guard failed and every module
 *        rendered "That module does not exist".
 *
 *   function totalModuleCount() exported for a Server Component to call
 *     -> arrived as {} and threw "is not a function" at render time (HTTP 500 on
 *        /assessment/start).
 *
 * Any component that needs the count should read `QUESTION_BANK.modules.length`
 * from lib/ directly. lib/ is a plain module, so it is imported by value on both
 * sides of the boundary.
 */
export { ASSESSMENT_MODULES as CANONICAL_MODULES };