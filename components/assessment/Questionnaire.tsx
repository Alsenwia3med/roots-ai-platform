"use client";

import { useMemo, useState } from "react";
import { QUESTION_BANK } from "../../lib/assessment/question-bank";
import type { QuestionDefinition } from "../../lib/assessment/types";

const NUMBER_KINDS = new Set(["integer", "decimal", "decimal_with_unit", "integer_scale"]);

type AnswerValue = string | string[];

type Answers = Record<string, AnswerValue>;

function questionInput(question: QuestionDefinition, value: AnswerValue | undefined, onChange: (value: AnswerValue) => void) {
  if (question.responseKind === "free_text") {
    return (
      <textarea
        id={question.questionId}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 min-h-32 w-full rounded-lg border-[#D8DEE8] bg-white px-4 py-3 text-[#1A1A1A] focus:border-[#437971] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
      />
    );
  }

  if (NUMBER_KINDS.has(question.responseKind)) {
    const step = question.responseKind === "integer" || question.responseKind === "integer_scale" ? 1 : "any";
    return (
      <input
        id={question.questionId}
        type="number"
        step={step}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 min-h-11 w-full rounded-lg border-[#D8DEE8] bg-white px-4 py-3 text-[#1A1A1A] focus:border-[#437971] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
      />
    );
  }

  if (question.responseKind === "multi_select") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <fieldset className="mt-4 space-y-3">
        <legend className="sr-only">Options for {question.questionId}</legend>
        {question.options.map((option) => (
          <label key={option.optionId} className="flex min-h-11 items-center gap-3 rounded-lg border-[#D8DEE8] bg-white px-4 py-3 text-[#1A1A1A] transition-colors hover:border-[#437971] has-[:checked]:border-[#437971] has-[:checked]:bg-[#F3F8F7]">
            <input
              type="checkbox"
              value={option.optionId}
              checked={selected.includes(option.optionId)}
              onChange={(event) => onChange(event.target.checked ? [...selected, option.optionId] : selected.filter((id) => id !== option.optionId))}
              className="h-5 w-5 accent-[#437971]"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
    );
  }

  return (
    <fieldset className="mt-4 space-y-3">
      <legend className="sr-only">Options for {question.questionId}</legend>
      {question.options.map((option) => (
        <label key={option.optionId} className="flex min-h-11 items-center gap-3 rounded-lg border-[#D8DEE8] bg-white px-4 py-3 text-[#1A1A1A] transition-colors hover:border-[#437971] has-[:checked]:border-[#437971] has-[:checked]:bg-[#F3F8F7]">
          <input
            type="radio"
            name={question.questionId}
            value={option.optionId}
            checked={value === option.optionId}
            onChange={(event) => onChange(event.target.value)}
            className="h-5 w-5 accent-[#437971]"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export function Questionnaire() {
  const questions = QUESTION_BANK.questions;
  const modules = QUESTION_BANK.modules.map((module) => ({
    module,
    questions: questions.filter((question) => question.moduleIndex === module.moduleIndex),
  }));
  const [modulePosition, setModulePosition] = useState(0);
  const [questionPosition, setQuestionPosition] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const currentModule = modules[modulePosition];
  const question = currentModule?.questions[questionPosition];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const completedBeforeModule = modules.slice(0, modulePosition).reduce((total, item) => total + item.questions.length, 0);
  const absolutePosition = completedBeforeModule + questionPosition;

  if (!question || !currentModule) return <p role="status">The canonical questionnaire is unavailable.</p>;

  const setAnswer = (value: AnswerValue) => setAnswers((current) => ({ ...current, [question.questionId]: value }));
  const canContinue = question.requirement === "optional" || answers[question.questionId] !== undefined;
  const isFirstQuestion = modulePosition === 0 && questionPosition === 0;
  const isLastQuestion = modulePosition === modules.length - 1 && questionPosition === currentModule.questions.length - 1;
  const goBack = () => {
    if (questionPosition > 0) return setQuestionPosition((current) => current - 1);
    if (modulePosition > 0) {
      const previousModule = modules[modulePosition - 1];
      setModulePosition((current) => current - 1);
      setQuestionPosition(previousModule.questions.length - 1);
    }
  };
  const goNext = () => {
    if (questionPosition < currentModule.questions.length - 1) return setQuestionPosition((current) => current + 1);
    if (modulePosition < modules.length - 1) {
      setModulePosition((current) => current + 1);
      setQuestionPosition(0);
    }
  };

  return (
    <section aria-labelledby="assessment-question-title" className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      <div className="mb-6 flex-wrap items-center justify-between gap-3 text-sm text-[#437971]">
        <span>Module {modulePosition + 1} of {modules.length}</span>
        <span>Question {question.questionNumber} of {questions.length}</span>
      </div>
      <div className="mb-8 h-2 overflow-hidden rounded-full bg-[#E5E7EB]" aria-hidden="true">
        <div className="h-2 rounded-full bg-[#437971] transition-all" style={{ width: `${((absolutePosition + 1) / questions.length) * 100}%` }} />
      </div>
      <div className="mb-8 rounded-xl border-[#D8DEE8] bg-[#F3F8F7] px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#886b2e]">Module {modulePosition + 1}</p>
        <h2 className="mt-1 text-xl font-bold text-[#1A2A4A]">{currentModule.module.title}</h2>
        <p className="mt-1 text-sm text-[#437971]">{currentModule.questions.length} questions in this module</p>
      </div>
      <div className="rounded-2xl border-[#D8DEE8] bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#886b2e]">Question {question.questionNumber}</p>
        <h1 id="assessment-question-title" className="mt-3 text-2xl font-bold leading-tight text-[#1A2A4A]">{question.prompt}</h1>
        {question.helperText ? <p className="mt-3 text-base leading-6 text-[#437971]">{question.helperText}</p> : null}
        <p className="mt-4 text-sm text-[#5B6577]">{question.requirement === "required" ? "Required" : "Optional"} · {question.eligibility === "scored" ? "Scoring input" : "Context only"}</p>
        {questionInput(question, answers[question.questionId], setAnswer)}
        <div className="mt-8 flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={goBack} disabled={isFirstQuestion} className="min-h-11 rounded-lg border-[#1A2A4A] px-5 font-semibold text-[#1A2A4A] transition-colors hover:bg-[#F3F8F7] disabled:cursor-not-allowed disabled:opacity-40">Back</button>
          <button type="button" onClick={goNext} disabled={!canContinue || isLastQuestion} className="min-h-11 rounded-lg bg-[#1A2A4A] px-5 font-semibold text-white transition-colors hover:bg-[#24365C] disabled:cursor-not-allowed disabled:opacity-40">{questionPosition === currentModule.questions.length - 1 && !isLastQuestion ? "Next module" : "Next"}</button>
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-[#5B6577]" role="status">{answeredCount} of {questions.length} answered</p>
      <aside aria-label="Biological Triad captions" className="mt-8 rounded-xl border-[#D8DEE8] bg-[#FAF8] p-5 text-sm text-[#437971]">
        <p className="font-semibold text-[#1A2A4A]">Biological Triad captions</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-3"><li><strong>Driver</strong></li><li><strong>Protective factor</strong></li><li><strong>Not available</strong></li></ul>
      </aside>
    </section>
  );
}
