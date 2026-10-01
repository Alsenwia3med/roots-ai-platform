/* ============================================================================
 * ROOTS-AI™ — Milestone 2 · C-01 answer validation (Blueprint §2)
 * ----------------------------------------------------------------------------
 * answer-types.ts DECLARES the closed ValidationFailureCode set but nothing in
 * the codebase implemented it. This file is that implementation, and it is the
 * gate the UI and the server both call.
 *
 * Design law, restated because every rule below exists to enforce it:
 *   - "unanswered" and "explicit N/A" are DIFFERENT states. Missing data is never
 *     reinterpreted as N/A (Blueprint §2), so absence is reported as
 *     MISSING_REQUIRED and never silently satisfies an optional numeric.
 *   - an empty multi-select has no valid form; it is EMPTY_MULTI_SELECT and it
 *     blocks progression.
 *   - the exclusive NONE / N/A option cannot be combined with any other.
 *   - Q73 is optional free text. N/A is NEVER forced onto it, and it is not a
 *     monitored emergency channel.
 *
 * Every message here is participant-facing copy authored in this file. It is
 * deliberately non-diagnostic and never echoes the participant's own answer.
 * =========================================================================*/

import { OPTIONAL_FREE_TEXT_QUESTION_ID } from "./canonical-constants";
import { optionById, questionById, QUESTION_BANK } from "./question-bank";
import type {
  AnswerRecord,
  AnswerSheet,
  AnswerValue,
  ValidationFailure,
  ValidationFailureCode,
  ValidationResult,
} from "./answer-types";
import type { QuestionDefinition, QuestionResponseKind } from "./types";

/* ---------------------------------------------------------------------------
 * Messages. Kept together so the wording is reviewable in one place.
 * -------------------------------------------------------------------------*/

const MESSAGES: Readonly<Record<ValidationFailureCode, string>> = {
  MISSING_REQUIRED: "Please answer this question before continuing.",
  EMPTY_MULTI_SELECT: "Please select at least one option.",
  EXCLUSIVE_OPTION_CONFLICT: "Select only one option, or clear your other selections.",
  TOO_MANY_SELECTIONS: "Please review how many options you have selected.",
  NA_NOT_PERMITTED: "This question does not offer a 'not applicable' answer.",
  NA_NOT_AFFIRMATIVE: "Choose 'not applicable' yourself if it applies.",
  REQUIRED_TEXT_BLANK: "Please enter a response.",
  FORCED_NA_ON_OPTIONAL_FREE_TEXT: "This field can simply be left blank.",
  UNKNOWN_QUESTION_ID: "An answer refers to a question that is not part of this questionnaire.",
  UNKNOWN_OPTION_ID: "Please choose one of the available answers.",
  VALUE_OUT_OF_BURDEN_SCALE: "Please choose one of the available answers.",
  ANSWER_KIND_MISMATCH: "Please review your answer to this question.",
};

const failure = (
  code: ValidationFailureCode,
  questionId: string,
  moduleIndex: number | null,
): ValidationFailure => ({ code, questionId, message: MESSAGES[code], moduleIndex });

/* ---------------------------------------------------------------------------
 * Shape checks.
 * -------------------------------------------------------------------------*/

const NUMERIC_KINDS: ReadonlySet<QuestionResponseKind> = new Set<QuestionResponseKind>([
  "integer",
  "decimal",
  "decimal_with_unit",
  "integer_scale",
]);

/** The answer shape a responseKind is allowed to carry. */
function expectedShape(question: QuestionDefinition): readonly AnswerValue["kind"][] {
  switch (question.responseKind) {
    case "multi_select":
      return ["option_set"];
    case "single_select":
    case "likert":
      return ["option"];
    case "free_text":
      return ["text"];
    default:
      return NUMERIC_KINDS.has(question.responseKind) ? ["number"] : [];
  }
}

/** True when this answer represents an affirmative "not applicable". */
export function isExplicitNa(question: QuestionDefinition, value: AnswerValue | null): boolean {
  if (value === null) return false;
  if (value.kind === "option") {
    return optionById(question.questionId, value.optionId)?.isExclusiveNoneOption === true;
  }
  if (value.kind === "option_set") return value.exclusiveNoneSelected;
  return false;
}
/**
 * Validates ONE question against ONE answer record.
 *
 * A record is valid when it is consistent with C-01: the right shape, a real
 * option, a lawful N/A, and — for a required question — an actual answer.
 * Absence is handled by the sheet-level completeness pass, not here.
 */
export function validateAnswer(
  question: QuestionDefinition,
  record: AnswerRecord,
): ValidationResult {
  const failures: ValidationFailure[] = [];
  const moduleIndex = question.moduleIndex;
  const value = record.value;

  // 1. Q73 must never carry N/A, whatever the record claims. Checked FIRST so
  // that forcing N/A onto the optional free-text question reports the precise
  // FORCED_NA_ON_OPTIONAL_FREE_TEXT rule rather than the generic
  // NA_NOT_AFFIRMATIVE: a text value can never be an approved N/A option, so the
  // generic rule would otherwise mask the real problem.
  if (
    question.questionId === OPTIONAL_FREE_TEXT_QUESTION_ID &&
    record.status === "explicit_na"
  ) {
    return {
      valid: false,
      failures: [
        failure("FORCED_NA_ON_OPTIONAL_FREE_TEXT", question.questionId, moduleIndex),
      ],
    };
  }

  // 2. Status must agree with the value it claims to hold.
  if (record.status === "answered" && value === null) {
    return {
      valid: false,
      failures: [failure("ANSWER_KIND_MISMATCH", question.questionId, moduleIndex)],
    };
  }
  if (record.status === "explicit_na" && !isExplicitNa(question, value)) {
    // N/A must be affirmative: never inferred, never forced (Blueprint §2).
    return {
      valid: false,
      failures: [failure("NA_NOT_AFFIRMATIVE", question.questionId, moduleIndex)],
    };
  }

  // 3. N/A is only lawful where C-01 says so.
  if (record.status === "explicit_na" && question.naPolicy === "not_permitted") {
    return {
      valid: false,
      failures: [failure("NA_NOT_PERMITTED", question.questionId, moduleIndex)],
    };
  }

  // 4. Absent answer on a required question.
  if (record.status === "unanswered" || value === null) {
    if (question.requirement === "required") {
      failures.push(failure("MISSING_REQUIRED", question.questionId, moduleIndex));
    }
    return { valid: failures.length === 0, failures };
  }

  // 5. Shape must match the response kind.
  if (!expectedShape(question).includes(value.kind)) {
    return {
      valid: false,
      failures: [failure("ANSWER_KIND_MISMATCH", question.questionId, moduleIndex)],
    };
  }

  if (value.kind === "option") {
    if (optionById(question.questionId, value.optionId) === undefined) {
      failures.push(failure("UNKNOWN_OPTION_ID", question.questionId, moduleIndex));
    }
    return { valid: failures.length === 0, failures };
  }
if (value.kind === "option_set") {
    const ids = value.optionIds;
    // An empty selection has no valid form and blocks progression (Blueprint §2).
    if (ids.length === 0) {
      failures.push(failure("EMPTY_MULTI_SELECT", question.questionId, moduleIndex));
    }
    if (ids.some((id) => optionById(question.questionId, id) === undefined)) {
      failures.push(failure("UNKNOWN_OPTION_ID", question.questionId, moduleIndex));
    }
    const rule = question.multiSelectRule;
    if (rule !== null) {
      const exclusiveId = rule.exclusiveNoneOptionId;
      const hasExclusive = exclusiveId !== null && ids.includes(exclusiveId);
      if (hasExclusive && ids.length > 1) {
        failures.push(
          failure("EXCLUSIVE_OPTION_CONFLICT", question.questionId, moduleIndex),
        );
      }
      if (rule.maxSelections !== null && ids.length > rule.maxSelections) {
        failures.push(failure("TOO_MANY_SELECTIONS", question.questionId, moduleIndex));
      }
      if (ids.length < rule.minSelections) {
        failures.push(failure("EMPTY_MULTI_SELECT", question.questionId, moduleIndex));
      }
    }
    return { valid: failures.length === 0, failures };
  }

  if (value.kind === "number") {
    // Age, height, weight and the 0-10 readiness scales are NOT burden values;
    // they are bounded by C-01, not by the C-02 0.0-4.0 burden scale. Only
    // finiteness is checked here so no legitimate measurement is ever rejected.
    if (!Number.isFinite(value.value)) {
      failures.push(
        failure("VALUE_OUT_OF_BURDEN_SCALE", question.questionId, moduleIndex),
      );
    }
    return { valid: failures.length === 0, failures };
  }

  // Free text. Blank on a required text question is blank; on the optional Q73
  // it is simply "unanswered", which step 4 has already handled. The `boolean`
  // kind is reserved by answer-types.ts but no C-01 question declares it, so it
  // is treated as a blank rather than silently accepted.
  const text = value.kind === "text" ? value.text.trim() : "";
  if (text.length === 0) {
    failures.push(
      question.requirement === "required"
        ? failure("REQUIRED_TEXT_BLANK", question.questionId, moduleIndex)
        : failure("MISSING_REQUIRED", question.questionId, moduleIndex),
    );
  }
  return { valid: failures.length === 0, failures };
}

/* ---------------------------------------------------------------------------
 * Sheet-level validation — the gate used by the UI and the submission route.
 * -------------------------------------------------------------------------*/

/**
 * Validates every question in the canonical bank, not merely the answered ones.
 *
 * A question absent from the sheet is still validated: it produces
 * MISSING_REQUIRED when required, so a participant cannot skip past a question
 * by never touching it.
 */
export function validateAnswerSheet(sheet: AnswerSheet): ValidationResult {
  const failures: ValidationFailure[] = [];
  for (const question of QUESTION_BANK.questions) {
    const record = sheet[question.questionId];
    if (record === undefined) {
      if (question.requirement === "required") {
        failures.push(
          failure("MISSING_REQUIRED", question.questionId, question.moduleIndex),
        );
      }
      continue;
    }
    failures.push(...validateAnswer(question, record).failures);
  }
  return { valid: failures.length === 0, failures };
}

/** Failures for one module — drives the per-module "not finished" marker. */
export function validateModule(
  sheet: AnswerSheet,
  moduleIndex: number,
): ValidationResult {
  const result = validateAnswerSheet(sheet);
  return {
    valid: result.failures.every((f) => f.moduleIndex !== moduleIndex),
    failures: result.failures.filter((f) => f.moduleIndex === moduleIndex),
  };
}

/** Every failure code present — a compact form for logs and evidence. */
export function failureCodes(result: ValidationResult): readonly ValidationFailureCode[] {
  // Array.from rather than [...set]: this package targets a lib without
  // downlevelIteration, where spreading a Set is a compile error.
  return Array.from(new Set(result.failures.map((f) => f.code)));
}

/* ---------------------------------------------------------------------------
 * LAUNCH_ELIGIBILITY — the one rule that is NOT a per-question format check.
 *
 * Launch defaults to adults 18+. This is deliberately separate from validation:
 * an age of 16 is a VALID answer to the age question (C-01 permits 16-110), but
 * the participant is still not eligible to submit. Confusing the two would
 * either corrupt a valid answer or wrongly report the age as malformed.
 * -------------------------------------------------------------------------*/

/** Minimum age for launch, per C-01 VAL-010. */
export const LAUNCH_MINIMUM_AGE = 18;

/** The age question's canonical id, Q1. */
const AGE_QUESTION_ID = "Q1";

export type EligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: string; questionId: string };

/**
 * Reads the recorded age and applies the launch rule.
 *
 * An unanswered age is NOT treated as ineligible here — it is already reported
 * as MISSING_REQUIRED by validateAnswerSheet. Only a recorded age can fail this.
 */
export function checkLaunchEligibility(sheet: AnswerSheet): EligibilityResult {
  const record = sheet[AGE_QUESTION_ID];
  if (record?.value?.kind !== "number") return { eligible: true };
  const age = record.value.value;
  if (!Number.isFinite(age) || age >= LAUNCH_MINIMUM_AGE) return { eligible: true };
  return {
    eligible: false,
    reason:
      "This version of the assessment is currently available to adults aged 18 or older.",
    questionId: AGE_QUESTION_ID,
  };
}

/** Convenience: true when the question exists in the canonical bank. */
export function isCanonicalQuestion(questionId: string): boolean {
  return questionById.get(questionId) !== undefined;
}