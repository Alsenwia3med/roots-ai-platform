"use client";

import React, { useEffect, useMemo, useState } from "react";

import { AssessmentShell } from "./AssessmentShell";
import { QUESTION_BANK } from "../../lib/assessment/question-bank";
import { QUESTIONNAIRE_VERSION } from "../../lib/assessment/canonical-constants";
import type { AnswerSheet } from "../../lib/assessment/answer-types";
import {
  checkLaunchEligibility,
  validateAnswerSheet,
  validateModule,
} from "../../lib/assessment/validation";
import { CONSENT_SERVICE, FOOTER_BOUNDARY } from "../../lib/content/c04-system-messages";

/**
 * ASM-09 — Review and Submit, /assessment/[session]/review.
 *
 * C-05 zone contract:
 *   1 Summary — 13 modules with Complete / Needs attention
 *   2 Issues — links to unanswered required questions
 *   3 Optional omissions — clearly allowed
 *   4 Confirmation — answers become a submitted snapshot; educational boundary
 *   5 Actions — Submit Assessment (primary); Back to Answers
 *
 * This is the ONLY place the assessment can be submitted; the module shell has
 * no submit button, because C-05 states "Submit only after Review".
 *
 * The completeness gate is the same `validateAnswerSheet` the server will run, so
 * the screen cannot show "ready" for a payload the submission route would reject.
 *
 * The Submit button is intentionally inert for now: no submission route exists in
 * this checkout (M2_OPEN_ITEMS item 1 — persistence is blocked on the recorded
 * M1 schema conflicts). It is disabled until the gate passes, and wiring it to a
 * real endpoint is the next step rather than a call to a route that is not there.
 */

const draftKey = (session: string) => `roots.assessment.${session}.draft`;

export function ReviewScreen({ session }: { session: string }) {
  const [sheet, setSheet] = useState<AnswerSheet>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey(session));
      if (raw) setSheet(JSON.parse(raw) as AnswerSheet);
    } catch {
      /* no draft means nothing to review */
    }
    setLoaded(true);
  }, [session]);

  const modules = useMemo(
    () =>
      QUESTION_BANK.modules.map((module) => ({
        index: module.moduleIndex,
        title: module.title,
        complete: validateModule(sheet, module.moduleIndex).valid,
      })),
    [sheet],
  );

  // The same gate the submission route will apply.
  const result = useMemo(() => validateAnswerSheet(sheet), [sheet]);
  const eligibility = useMemo(() => checkLaunchEligibility(sheet), [sheet]);
  const optionalIds = QUESTION_BANK.questions
    .filter((q) => q.requirement === "optional")
    .map((q) => q.questionId);
  const ready = loaded && result.valid && eligibility.eligible;
return (
    <AssessmentShell>
      <section className="rounded-2xl border border-[#D8DEE8] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#437971]">Review</p>
        <h1 className="mt-2 text-2xl font-bold text-[#1A2A4A]">Check your answers</h1>

        {/* Zone 1 — per-module completeness. */}
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {modules.map((module) => (
            <li
              key={module.index}
              className={`flex items-baseline justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
                module.complete ? "border-[#D8DEE8]" : "border-[#B91C1C] bg-[#FEF2F2]"
              }`}
            >
              <span className="text-[#1A1A1A]">
                <span className="mr-2 font-semibold text-[#437971]">{module.index}.</span>
                {module.title}
              </span>
              <span className="shrink-0 text-xs font-semibold text-[#6B7280]">
                {module.complete ? "Complete" : "Needs attention"}
              </span>
            </li>
          ))}
        </ul>

        {/* Zone 2 — jump back to a specific unanswered required question. */}
        {result.failures.length > 0 ? (
          <div className="mt-6 rounded-xl border border-[#B91C1C] bg-[#FEF2F2] p-5">
            <h2 className="text-sm font-bold text-[#1A1A1A]">
              {result.failures.length} question{result.failures.length === 1 ? "" : "s"} still
              need attention
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {result.failures.map((failure) => (
                <li key={failure.questionId}>
                  <a
                    href={`/assessment/${session}/module/${failure.moduleIndex ?? 1}`}
                    className="inline-flex min-h-11 items-center rounded-lg border border-[#D8DEE8] bg-white px-3 text-xs font-semibold text-[#1A2A4A] hover:bg-[#F3F4F6]"
                  >
                    {failure.questionId} — Module {failure.moduleIndex}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Zone 3 — optional omissions are allowed, and said to be allowed. */}
        <p className="mt-4 text-sm leading-6 text-[#6B7280]">
          {optionalIds.length} questions are optional ({optionalIds.join(", ")}). Leaving them
          blank is allowed and does not affect your report.
        </p>

        {!eligibility.eligible ? (
          <p role="alert" className="mt-4 rounded-lg bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B91C1C]">
            {eligibility.reason}
          </p>
        ) : null}

        {/* Zone 4 — the snapshot statement and the educational boundary. */}
        <div className="mt-6 rounded-xl border border-[#D8DEE8] bg-[#F3F4F6] p-5">
          <p className="text-sm leading-6 text-[#4B5563]">
            When you submit, your answers become a fixed snapshot and are passed to the scoring
            engine. You cannot change them afterwards.
          </p>
          <p className="mt-3 text-sm leading-6 text-[#4B5563]">{FOOTER_BOUNDARY}</p>
          <p className="mt-3 text-xs leading-5 text-[#6B7280]">
            Questionnaire version {QUESTIONNAIRE_VERSION}. {CONSENT_SERVICE}
          </p>
        </div>

        {/* Zone 5 — submit is enabled only once the gate passes. */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={!ready}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1A2A4A] px-6 text-sm font-semibold text-white hover:bg-[#24365C] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit Assessment
          </button>
          <a
            href={`/assessment/${session}/module/1`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D8DEE8] bg-[#F3F4F6] px-6 text-sm font-semibold text-[#1A2A4A] hover:bg-[#E5E7EB]"
          >
            Back to Answers
          </a>
        </div>

        {!ready && loaded ? (
          <p role="status" className="mt-4 text-sm text-[#6B7280]">
            Complete every required question to enable submission.
          </p>
        ) : null}
      </section>
    </AssessmentShell>
  );
}