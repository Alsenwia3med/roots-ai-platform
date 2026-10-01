"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AssessmentShell,
  ModuleIntro,
  ModuleProgressBar,
} from "./AssessmentShell";
import { QuestionControl } from "./QuestionControl";
import { SaveExitDialog } from "./SaveExitDialog";
import { QUESTION_BANK, questionsByModule } from "../../lib/assessment/question-bank";
import type { AnswerRecord, AnswerSheet, AnswerValue } from "../../lib/assessment/answer-types";
import type { QuestionDefinition } from "../../lib/assessment/types";
import { validateAnswer } from "../../lib/assessment/validation";
import { SAVE_FAIL, SAVE_OK } from "../../lib/content/c04-system-messages";

/**
 * ASM-06 — Module Question Shell.
 *
 * C-05 zone contract:
 *   1 Top bar — module n of 13, percentage, Save & Exit   (AssessmentShell)
 *   2 Module intro — title and one-sentence purpose        (ModuleIntro)
 *   3 Question region — prompt, help/units, approved control, N/A only when
 *     C-01 allows                                         (QuestionControl)
 *   4 Validation — inline after blur/Next; summary at region start
 *   5 Navigation — Back and Next; Submit only after Review
 *   6 Autosave — debounced Saving / Saved / Failed
 *   7 Session warning — expiry countdown with extend
 *
 * C-05 §1 is honoured by construction: questions come from the C-01 bank, so
 * order, wording, options and required/N/A rules cannot be altered for layout
 * convenience. This component renders what the bank says.
 */

type SaveState = "idle" | "saving" | "saved" | "failed";

/** Per-session key so two runs on one device never bleed into each other. */
const draftKey = (session: string) => `roots.assessment.${session}.draft`;

/** Builds a well-formed record; absence is "unanswered", never "N/A". */
function toRecord(question: QuestionDefinition, value: AnswerValue | null): AnswerRecord {
  if (value === null) {
    return { questionId: question.questionId, status: "unanswered", value: null, savedAt: null };
  }
  const isNa =
    (value.kind === "option" &&
      question.options.find((o) => o.optionId === value.optionId)?.isExclusiveNoneOption === true) ||
    (value.kind === "option_set" && value.exclusiveNoneSelected);
  return {
    questionId: question.questionId,
    // Blueprint §2: explicit N/A is a distinct state from "answered", and is only
    // ever produced by an affirmative selection of the approved option.
    status: isNa ? "explicit_na" : "answered",
    value,
    savedAt: null,
  };
}

export function ModuleShell({ session, moduleIndex }: { session: string; moduleIndex: number }) {
  const module = QUESTION_BANK.modules[moduleIndex - 1];
  const questions = useMemo(() => questionsByModule.get(moduleIndex) ?? [], [moduleIndex]);

  const [sheet, setSheet] = useState<AnswerSheet>({});
  const [position, setPosition] = useState(0);
  const [showError, setShowError] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveExitOpen, setSaveExitOpen] = useState(false);
  const hydrated = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const question = questions[position];

  // Read from the bank, not from AssessmentShell. lib/ is a plain module and is
// imported by value on both sides of the client boundary; a value exported from
// the "use client" shell arrives as a client reference instead. See the note on
// CANONICAL_MODULES in AssessmentShell.
const moduleCount = QUESTION_BANK.modules.length;

  // Restore a draft for THIS session only.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey(session));
      if (raw) setSheet(JSON.parse(raw) as AnswerSheet);
    } catch {
      /* a corrupt draft just means starting this module afresh */
    }
    hydrated.current = true;
  }, [session]);

  // Zone 6 — debounced autosave. Never claims a save that did not happen, and
  // never discards the participant's entry (C-04 SAVE-FAIL).
  useEffect(() => {
    if (!hydrated.current) return;
    setSaveState("saving");
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey(session), JSON.stringify(sheet));
        setSaveState("saved");
      } catch {
        setSaveState("failed");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [sheet, session]);

  const setValue = useCallback(
    (next: AnswerValue | null) => {
      if (!question) return;
      setSheet((previous) => ({ ...previous, [question.questionId]: toRecord(question, next) }));
    },
    [question],
  );

  const go = useCallback((next: number) => {
    setPosition(next);
    setShowError(false);
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }, []);

  const percent = useMemo(() => {
    const answered = QUESTION_BANK.questions.filter((q) => {
      const status = sheet[q.questionId]?.status;
      return status !== undefined && status !== "unanswered";
    }).length;
    return (answered / QUESTION_BANK.questions.length) * 100;
  }, [sheet]);
  if (!module) {
    return (
      <AssessmentShell>
        <p role="status" className="rounded-xl border border-[#D8DEE8] bg-white p-6">
          That module does not exist.
        </p>
      </AssessmentShell>
    );
  }

  const record = question ? sheet[question.questionId] : undefined;
  const value = record?.value ?? null;
  const result = question ? validateAnswer(question, record ?? toRecord(question, null)) : null;
  const errorMessage = showError && result && !result.valid ? result.failures[0].message : null;
  const unansweredInRegion = questions.filter((q) => sheet[q.questionId] === undefined);

  return (
    <AssessmentShell saveState={saveState} onSaveExit={() => setSaveExitOpen(true)}>
      {/* Zone 1. */}
      <ModuleProgressBar
        moduleIndex={moduleIndex}
        totalModules={moduleCount}
        percentComplete={percent}
      />

      {/* Zone 2. */}
      <ModuleIntro title={module.title} purpose={module.purpose} />

      {/* Zone 4 — summary at the region start. */}
      {showError && unansweredInRegion.length > 0 ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-[#D8DEE8] bg-[#F3F4F6] px-4 py-3 text-sm font-semibold text-[#B91C1C]"
        >
          Please answer this question before continuing.
        </p>
      ) : null}

      {question ? (
        <section className="rounded-2xl border border-[#D8DEE8] bg-white p-6 shadow-sm">
          {/* Zone 3 — prompt, help, control. */}
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#437971]">
            Question {question.questionNumber} of {QUESTION_BANK.questions.length}
          </p>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="mt-2 text-xl font-bold leading-snug text-[#1A2A4A] outline-none"
          >
            {question.prompt}
          </h2>
          {question.helperText ? (
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">{question.helperText}</p>
          ) : null}

          <QuestionControl
            question={question}
            value={value}
            onChange={setValue}
            invalid={Boolean(errorMessage)}
          />

          {errorMessage ? (
            <p role="alert" className="mt-3 text-sm font-semibold text-[#B91C1C]">
              {errorMessage}
            </p>
          ) : null}

          {saveState === "failed" ? (
            <p role="status" className="mt-3 text-sm text-[#B91C1C]">
              {SAVE_FAIL}
            </p>
          ) : null}

          {/* Zone 5 — Back and Next. There is deliberately NO submit button here:
              C-05 states "Submit only after Review". */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => (position > 0 ? go(position - 1) : window.history.back())}
              className="inline-flex min-h-11 items-center rounded-lg border border-[#D8DEE8] px-5 text-sm font-semibold text-[#1A2A4A] hover:bg-[#F3F4F6]"
            >
              Back
            </button>
            {position < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  setShowError(true);
                  go(position + 1);
                }}
                className="inline-flex min-h-11 items-center rounded-lg bg-[#1A2A4A] px-5 text-sm font-semibold text-white hover:bg-[#24365C]"
              >
                Next
              </button>
            ) : moduleIndex < moduleCount ? (
              <a
                href={`/assessment/${session}/module/${moduleIndex + 1}`}
                className="inline-flex min-h-11 items-center rounded-lg bg-[#1A2A4A] px-5 text-sm font-semibold text-white hover:bg-[#24365C]"
              >
                Next module
              </a>
            ) : (
              <a
                href={`/assessment/${session}/review`}
                className="inline-flex min-h-11 items-center rounded-lg bg-[#1A2A4A] px-5 text-sm font-semibold text-white hover:bg-[#24365C]"
              >
                Review answers
              </a>
            )}
          </div>
        </section>
      ) : null}

      {saveExitOpen ? (
        <SaveExitDialog
          session={session}
          savedLabel={saveState === "saved" ? SAVE_OK : null}
          onContinue={() => setSaveExitOpen(false)}
        />
      ) : null}
    </AssessmentShell>
  );
}