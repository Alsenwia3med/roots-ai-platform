/* ============================================================================
 * ROOTS-AI™ — Milestone 2 · Answer, validation and progress types
 * ----------------------------------------------------------------------------
 * Source of truth: M2 Strict Implementation Blueprint §2 (validation) and §1
 * (progress must integrate with the M1 autosave/resume foundation).
 *
 * Design law carried by these types:
 *   - "unanswered" and "explicit N/A" are DIFFERENT states (Blueprint §2:
 *     missing data must never be reinterpreted as N/A).
 *   - an empty multi-select selection has no representable valid form.
 * ==========================================================================*/

import type { QuestionResponseKind } from "./types";

/* ---------------------------------------------------------------------------
 * 1. Answer states.
 *    "unanswered" is the absence of a decision — never coerced into N/A.
 *    "explicit_na" exists only where C-01 permits it, and only from an
 *    affirmative participant action.
 * -------------------------------------------------------------------------*/
export type AnswerStatus = "answered" | "explicit_na" | "unanswered";

/**
 * The participant's value for one question.
 * `optionIds` is a non-empty tuple: the empty multi-select case is
 * unrepresentable as "answered", so it must be recorded as "unanswered" and the
 * validator turns that into a blocking failure.
 */
export type AnswerValue =
  | { readonly kind: "option"; readonly optionId: string }
  | {
      readonly kind: "option_set";
      readonly optionIds: readonly [string, ...string[]];
      /** True when the participant chose the exclusive NONE / N/A option. */
      readonly exclusiveNoneSelected: boolean;
    }
  | { readonly kind: "number"; readonly value: number }
  | { readonly kind: "boolean"; readonly value: boolean }
  | { readonly kind: "text"; readonly text: string };

export interface AnswerRecord {
  readonly questionId: string;
  readonly status: AnswerStatus;
  /** Non-null exactly when status === "answered". */
  readonly value: AnswerValue | null;
  /** Autosave bookkeeping for M1 resume. Server-set; client value untrusted. */
  readonly savedAt: string | null;
}

/** Sparse map keyed by canonical questionId. Absent key == never answered. */
export type AnswerSheet = Readonly<Record<string, AnswerRecord>>;

/* ---------------------------------------------------------------------------
 * 2. Validation failure codes. Each code maps to one Blueprint §2 rule; the set
 *    is closed so a new rule cannot be skipped silently.
 * -------------------------------------------------------------------------*/
export type ValidationFailureCode =
  /** Required question with no answer and no approved N/A. */
  | "MISSING_REQUIRED"
  /** Multi-select with [] — invalid, blocks progression (Blueprint §2). */
  | "EMPTY_MULTI_SELECT"
  /** Exclusive NONE / N/A selected alongside other options (Blueprint §2). */
  | "EXCLUSIVE_OPTION_CONFLICT"
  /** Selection count above the C-01 maxSelections bound. */
  | "TOO_MANY_SELECTIONS"
  /** N/A recorded on a question whose naPolicy is "not_permitted". */
  | "NA_NOT_PERMITTED"
  /** N/A inferred from absence instead of an affirmative choice. */
  | "NA_NOT_AFFIRMATIVE"
  /** Free text blank on a REQUIRED free-text question (never on Q73). */
  | "REQUIRED_TEXT_BLANK"
  /** N/A forced onto optional free-text Q73 (forbidden by Blueprint §2). */
  | "FORCED_NA_ON_OPTIONAL_FREE_TEXT"
  /** Answer references a questionId absent from the canonical bank. */
  | "UNKNOWN_QUESTION_ID"
  /** Answer references an optionId absent from that question. */
  | "UNKNOWN_OPTION_ID"
  /** Numeric answer outside the canonical 0.0–4.0 burden scale. */
  | "VALUE_OUT_OF_BURDEN_SCALE"
  /** Answer shape does not match the question's responseKind. */
  | "ANSWER_KIND_MISMATCH";

export interface ValidationFailure {
  readonly code: ValidationFailureCode;
  readonly questionId: string;
  /** Human-readable, non-diagnostic wording. Never contains health data. */
  readonly message: string;
  readonly moduleIndex: number | null;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly failures: readonly ValidationFailure[];
}

/** Which failure codes apply to which response kind — the validator's table. */
export type FailureCodeByKind = Readonly<
  Partial<Record<QuestionResponseKind, readonly ValidationFailureCode[]>>
>;

/* ---------------------------------------------------------------------------
 * 3. Progress / resume — Blueprint §1: progress across all 13 modules must
 *    survive refresh and re-login without corruption.
 * -------------------------------------------------------------------------*/
export interface ModuleProgress {
  readonly moduleIndex: number;
  readonly totalQuestions: number;
  readonly answeredQuestions: number;
  readonly requiredRemaining: number;
}

/**
 * Shape persisted alongside `assessments.current_question_index` plus the
 * derived module view. Versions travel with it so a resumed run can prove it is
 * resuming the SAME canonical questionnaire it started; a version mismatch must
 * block resume rather than silently re-map old answers onto a different bank.
 */
export interface AssessmentProgressSnapshot {
  readonly assessmentId: string;
  readonly currentQuestionIndex: number;
  readonly currentModuleIndex: number;
  readonly moduleProgress: readonly ModuleProgress[];
  readonly answeredCount: number;
  readonly requiredRemaining: number;
  readonly questionnaireVersion: string;
  readonly scoringRulesVersion: string;
  readonly lastActivityAt: string | null;
}

/**
 * Payload handed to the server-side scorer once validation passes. Carries both
 * version pins so the persisted score record states exactly which canonical
 * sources produced it (Blueprint §5).
 */
export interface SubmissionPayload {
  readonly assessmentId: string;
  /** M1 sessionStorage idempotency key — prevents duplicate score rows. */
  readonly idempotencyKey: string;
  readonly questionnaireVersion: string;
  readonly scoringRulesVersion: string;
  readonly answers: readonly AnswerRecord[];
}

