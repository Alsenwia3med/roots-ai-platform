import React from "react";

import { AssessmentShell, totalModuleCount } from "./AssessmentShell";
import { QUESTION_BANK } from "../../lib/assessment/question-bank";

/**
 * ASM-05 — Assessment Introduction, /assessment/start.
 *
 * C-05 zone contract:
 *   1 Welcome — what the assessment covers
 *   2 Instructions — answer your current experience; use N/A only where offered
 *   3 Privacy — save/resume and session security
 *   4 Progress preview — 13 modules, NO scores
 *   5 CTA — Start Module 1
 *
 * Zone 4 is a preview of structure only. No score, band, classification or
 * driver may appear anywhere on this screen: showing a result before the
 * questions are answered would misrepresent the deterministic engine, which
 * cannot produce one until the answers exist. Module names and question counts
 * come from the C-01 bank, so this list cannot drift from the questionnaire.
 */
export function StartScreen() {
  const modules = QUESTION_BANK.modules;
  const questionCount = QUESTION_BANK.questions.length;

  return (
    <AssessmentShell>
      <section className="rounded-2xl border border-[#D8DEE8] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#437971]">Welcome</p>
        {/* C-05 zone 1. */}
        <h1 className="mt-2 text-2xl font-bold text-[#1A2A4A]">
          What this assessment covers
        </h1>
        <p className="mt-4 text-base leading-7 text-[#4B5563]">
          You will answer {questionCount} questions across {totalModuleCount()} modules about your
          sleep, hunger and fullness, weight history, energy, stress, daily timing, activity and
          current goals. Most people finish in about 20 minutes.
        </p>

        {/* C-05 zone 2 — instructions. */}
        <div className="mt-6 rounded-lg border border-[#D8DEE8] bg-[#F3F4F6] p-4">
          <h2 className="text-sm font-bold text-[#1A2A4A]">Before you start</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[#4B5563]">
            <li>Answer about how things are for you now, not how you would like them to be.</li>
            <li>
              Choose &ldquo;Not applicable&rdquo; only where the question offers it. Leaving a
              required question blank will stop you at review.
            </li>
            <li>This is educational. It does not diagnose a condition or replace medical advice.</li>
          </ul>
        </div>

        {/* C-05 zone 3 — privacy, save/resume, session security. */}
        <div className="mt-4 rounded-lg border border-[#D8DEE8] bg-[#F3F4F6] p-4">
          <h2 className="text-sm font-bold text-[#1A2A4A]">Saving and privacy</h2>
          <p className="mt-2 text-sm leading-6 text-[#4B5563]">
            Your answers save automatically as you move between questions. You can leave and return
            using your secure email link, and you can pause at any time. Access is protected by a
            secure link that expires, and your answers are never shared with advertising or
            session-replay tools.
          </p>
        </div>

        {/* C-05 zone 4 — structure preview, explicitly no scores. */}
        <section className="mt-8">
          <h2 className="text-sm font-bold text-[#1A2A4A]">
            Your progress will look like this
          </h2>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {modules.map((module) => (
              <li
                key={module.moduleCode ?? module.moduleIndex}
                className="flex items-baseline justify-between gap-3 rounded-lg border border-[#D8DEE8] px-3 py-2"
              >
                <span className="text-sm text-[#1A2A4A]">
                  <span className="mr-2 font-semibold text-[#437971]">{module.moduleIndex}.</span>
                  {module.title}
                </span>
                <span className="shrink-0 text-xs text-[#6B7280]">
                  {module.questionRange}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* C-05 zone 5 — CTA. */}
        <a
          href="/assessment/demo/module/1"
          className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#1A2A4A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#24365C] sm:w-auto"
        >
          Start Module 1
        </a>
      </section>
    </AssessmentShell>
  );
}