"use client";

import React, { useEffect, useMemo, useState } from "react";

import { AssessmentShell } from "./AssessmentShell";
import { QUESTION_BANK, questionsByModule } from "../../lib/assessment/question-bank";
import { QUESTIONNAIRE_VERSION } from "../../lib/assessment/canonical-constants";
import type { AnswerSheet } from "../../lib/assessment/answer-types";
import { validateModule } from "../../lib/assessment/validation";
import { DELETE_CONFIRM } from "../../lib/content/c04-system-messages";

/**
 * ASM-08 — Resume Summary, /assessment/[session]/resume.
 *
 * C-05 zone contract:
 *   1 Welcome back — NO health-answer preview on a shared screen
 *   2 Progress — completed modules and current module
 *   3 Save metadata — last saved time and questionnaire version
 *   4 CTA Resume Assessment
 *   5 Secondary Restart — requires explicit destructive confirmation
 *
 * Zone 1 is why this screen shows only counts and module titles. A shared or
 * shoulder-surfed screen must never reveal what was answered, so no prompt
 * text, option label or answer value is rendered here.
 *
 * The draft is read from the same per-session key the module shell writes, so
 * Resume lands on the first module that still needs attention.
 */

const draftKey = (session: string) => `roots.assessment.${session}.draft`;

export function ResumeScreen({ session }: { session: string }) {
  const [sheet, setSheet] = useState<AnswerSheet>({});
  const [loaded, setLoaded] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey(session));
      if (raw) setSheet(JSON.parse(raw) as AnswerSheet);
    } catch {
      /* a missing or corrupt draft simply means there is nothing to resume */
    }
    setLoaded(true);
  }, [session]);

  // Per-module completion, read from the bank so the order cannot drift.
  const modules = useMemo(
    () =>
      QUESTION_BANK.modules.map((module) => {
        const questions = questionsByModule.get(module.moduleIndex) ?? [];
        const answered = questions.filter((q) => {
          const status = sheet[q.questionId]?.status;
          return status !== undefined && status !== "unanswered";
        }).length;
        return {
          index: module.moduleIndex,
          title: module.title,
          answered,
          total: questions.length,
          complete: validateModule(sheet, module.moduleIndex).valid,
        };
      }),
    [sheet],
  );

  // Zone 2 — first module that still needs attention.
  const lastModule = QUESTION_BANK.modules.length;
  const resumeAt = Math.min(modules.find((m) => !m.complete)?.index ?? lastModule, lastModule);
  const totalAnswered = modules.reduce((sum, m) => sum + m.answered, 0);
  const hasProgress = totalAnswered > 0;
return (
    <AssessmentShell>
      <section className="rounded-2xl border border-[#D8DEE8] bg-white p-6 shadow-sm sm:p-8">
        {/* Zone 1. No answer content, ever. */}
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#437971]">Welcome back</p>
        <h1 className="mt-2 text-2xl font-bold text-[#1A2A4A]">Resume your assessment</h1>
        <p className="mt-3 text-base leading-7 text-[#4B5563]">
          {loaded && hasProgress
            ? `You have answered ${totalAnswered} of ${QUESTION_BANK.questions.length} questions. Your place has been saved.`
            : "There is no saved progress for this session yet."}
        </p>

        {/* Zone 2 — module-level progress only, no answers. */}
        <ol className="mt-6 grid gap-2 sm:grid-cols-2">
          {modules.map((module) => (
            <li
              key={module.index}
              className={`rounded-lg border px-3 py-2 text-sm ${
                module.index === resumeAt
                  ? "border-[#437971] bg-[#F3F8F7]"
                  : "border-[#D8DEE8]"
              }`}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-[#1A1A1A]">
                  <span className="mr-2 font-semibold text-[#437971]">{module.index}.</span>
                  {module.title}
                </span>
                <span className="shrink-0 text-xs text-[#6B7280]">
                  {module.complete ? "Complete" : `${module.answered}/${module.total}`}
                </span>
              </span>
            </li>
          ))}
        </ol>

        {/* Zone 3 — save metadata. */}
        <dl className="mt-6 grid gap-1 border-t border-[#D8DEE8] pt-4 text-xs text-[#6B7280] sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="font-semibold">Questionnaire version</dt>
            <dd>{QUESTIONNAIRE_VERSION}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">Last saved</dt>
            <dd>{hasProgress ? "On this device" : "No save yet"}</dd>
          </div>
        </dl>

        {/* Zone 4 + 5. */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={`/assessment/${session}/module/${resumeAt}`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1A2A4A] px-6 text-sm font-semibold text-white hover:bg-[#24365C]"
          >
            {hasProgress ? `Resume Module ${resumeAt}` : "Start Module 1"}
          </a>
          {!confirmRestart ? (
            <button
              type="button"
              onClick={() => setConfirmRestart(true)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D8DEE8] bg-[#F3F4F6] px-6 text-sm font-semibold text-[#1A2A4A] hover:bg-[#E5E7EB]"
            >
              Restart assessment
            </button>
          ) : null}
        </div>

        {/* Zone 5 — destructive action needs explicit confirmation. */}
        {confirmRestart ? (
          <div
            role="alertdialog"
            aria-labelledby="restart-title"
            className="mt-4 rounded-xl border border-[#AAB4C3] bg-[#F3F4F6] p-5"
          >
            <h2 id="restart-title" className="text-sm font-bold text-[#1A2A4A]">
              Discard your saved answers?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#4B5563]">{DELETE_CONFIRM}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  try {
                    window.localStorage.removeItem(draftKey(session));
                  } catch {
                    /* nothing to clear */
                  }
                  setSheet({});
                  setConfirmRestart(false);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#B91C1C] px-5 text-sm font-semibold text-white hover:bg-[#991B1B]"
              >
                Yes, discard and start over
              </button>
              <button
                type="button"
                onClick={() => setConfirmRestart(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D8DEE8] bg-white px-5 text-sm font-semibold text-[#1A2A4A]"
              >
                Keep my answers
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </AssessmentShell>
  );
}