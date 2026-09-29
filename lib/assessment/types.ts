/* ============================================================================
 * ROOTS-AI™ — Milestone 2 · C-01 canonical questionnaire types
 * ----------------------------------------------------------------------------
 * Source of truth: M2 Strict Implementation Blueprint §1 (flow/architecture)
 * and §2 (strict validation rules), mirroring C-01 v1.0.1 CORRECTED.
 *
 * These are the SHAPES the controlled question bank must fit. They describe
 * structure and validation law only. Nothing here is assessment content:
 * questions, options and values arrive only from the controlled C-01 source.
 * ==========================================================================*/

import type { CanonicalDomainCode } from "./canonical-constants";

/* ---------------------------------------------------------------------------
 * 1. Identity & placement
 * -------------------------------------------------------------------------*/

/** A canonical question number, 1 … 73. Branded so a raw index can't be passed. */
export type QuestionNumber = number & { readonly __questionNumber: unique symbol };

/** A canonical module ordinal, 1 … 13, in fixed presentation order. */
export type ModuleIndex = number & { readonly __moduleIndex: unique symbol };

/* ---------------------------------------------------------------------------
 * 2. Requirement & eligibility states — Blueprint §1.
 *    Two INDEPENDENT axes, never collapsed into one:
 *      requirement -> must the participant answer?          (71 required / 2 optional)
 *      eligibility -> does the answer enter the calculation? (40 scored / 33 contextual)
 *    A contextual question may be required; a scored question may be optional.
 * -------------------------------------------------------------------------*/

export type QuestionRequirement = "required" | "optional";

/**
 * "scored"     — one of the 40 scoring-eligible questions.
 * "contextual" — one of the 33 contextual-only questions. It MUST NOT affect any
 *                calculation (Blueprint §1). Enforced by never letting a
 *                contextual questionId appear in the C-02 domain question map.
 */
export type ScoringEligibility = "scored" | "contextual";

/* ---------------------------------------------------------------------------
 * 3. N/A law — Blueprint §2.
 *    Missing data MUST NOT be read as N/A, so absence and explicit N/A are
 *    distinct states in the type system rather than both being "null".
 *      "not_permitted" — an N/A answer on this question is always invalid.
 *      "explicit_only" — N/A is valid ONLY when the participant actively chose
 *                        the approved C-01 N/A option; never by omission.
 * -------------------------------------------------------------------------*/
export type NaPolicy = "not_permitted" | "explicit_only";

/* ---------------------------------------------------------------------------
 * 4. Response kinds
 *  ⚠ PENDING C-01: the definitive set of response types used by the controlled
 *    bank is not yet confirmed. This union covers what the Blueprint names
 *    explicitly (multi-select §2, free text §2) plus the single-select, numeric
 *    and boolean shapes a 0.0–4.0 burden scale implies. Trim or extend it once
 *    C-01 is loaded: a member the controlled bank never uses should be removed
 *    rather than silently kept as dead vocabulary.
 * -------------------------------------------------------------------------*/
export type QuestionResponseKind =
  | "single_select"
  | "multiple_select"
  | "numeric"
  | "boolean"
  | "free_text";

/* ---------------------------------------------------------------------------
 * 5. Options
 * -------------------------------------------------------------------------*/
export interface QuestionOptionDefinition {
  /** Stable canonical option id from C-01. Never renumbered. */
  readonly optionId: string;
  /** Verbatim C-01 label. Empty string is legal only in the unpopulated template. */
  readonly label: string;
  /** 1-based display order within the question, exactly as C-01 lists it. */
  readonly order: number;
  /**
   * Raw burden contribution on the canonical 0.0–4.0 scale, or null when the
   * option carries no burden value (contextual option, "prefer not to say", the
   * exclusive NONE option, etc.). The value comes from C-01/C-02 verbatim — it
   * is never derived, scaled or interpolated here.
   */
  readonly rawBurdenValue: number | null;
  /**
   * True for the "NONE / N/A"-style option of a multi-select question.
   * Mutually exclusive: selecting it clears and disables every other option
   * (Blueprint §2). At most one option per question may set this.
   */
  readonly isExclusiveNoneOption: boolean;
  /** False when selecting this option must be excluded from the scoring input. */
  readonly countsTowardScore: boolean;
}

/* ---------------------------------------------------------------------------
 * 6. Multi-select law — Blueprint §2.
 *    The literal types ARE the enforcement: an empty selection cannot satisfy
 *    `minSelections: 1`, and no rule can declare an empty selection valid.
 * -------------------------------------------------------------------------*/
export interface MultiSelectRule {
  readonly minSelections: 1;
  /** Null = no upper bound defined by C-01. */
  readonly maxSelections: number | null;
  /**
   * Option id of the mutually exclusive "NONE / N/A" option, or null when C-01
   * defines none for this question. When non-null it MUST equal the id of the
   * option carrying `isExclusiveNoneOption: true` — checked in invariants.ts.
   */
  readonly exclusiveNoneOptionId: string | null;
  /** Fixed at false. An empty selection is INVALID and must block progression. */
  readonly emptySelectionIsValid: false;
}

/* ---------------------------------------------------------------------------
 * 7. Question
 * -------------------------------------------------------------------------*/
export interface QuestionDefinition {
  readonly questionId: string;
  readonly questionNumber: QuestionNumber;
  readonly moduleIndex: ModuleIndex;
  /** Verbatim C-01 prompt. */
  readonly prompt: string;
  /** Helper text as printed in C-01; null when C-01 supplies none. */
  readonly helperText: string | null;
  readonly responseKind: QuestionResponseKind;
  readonly requirement: QuestionRequirement;
  readonly eligibility: ScoringEligibility;
  /**
   * Owning domain for a "scored" question; MUST be null for "contextual".
   * Held alongside `eligibility` rather than inferred from it, so a mismatch is
   * a detectable data error instead of a silent scoring change.
   */
  readonly domainCode: CanonicalDomainCode | null;
  readonly naPolicy: NaPolicy;
  readonly options: readonly QuestionOptionDefinition[];
  /**
   * Non-null if and only if `responseKind === "multiple_select"`, and then
   * `questionId` MUST be one of MULTIPLE_SELECT_QUESTION_IDS. Checked in
   * invariants.ts.
   */
  readonly multiSelectRule: MultiSelectRule | null;
}

/* ---------------------------------------------------------------------------
 * 8. Module — exactly 13, ordered, no gaps, no overlap.
 * -------------------------------------------------------------------------*/
export interface ModuleDefinition {
  readonly moduleIndex: ModuleIndex;
  /** Short C-01 module code if C-01 supplies one; null otherwise. */
  readonly moduleCode: string | null;
  /** Verbatim C-01 module title. */
  readonly title: string;
  readonly introText: string | null;
  /** Question numbers belonging to this module, ascending. */
  readonly questionNumbers: readonly number[];
}

/* ---------------------------------------------------------------------------
 * 9. Provenance of the controlled source that filled the structure.
 *    Fingerprints are recorded so a later re-export can be PROVEN equivalent (or
 *    shown to differ) instead of being re-typed by hand.
 * -------------------------------------------------------------------------*/
export interface ControlledSourceProvenance {
  /** e.g. "C-01 Canonical Question Bank". */
  readonly documentTitle: string;
  /** Verbatim controlled version string, e.g. QUESTIONNAIRE_VERSION. */
  readonly version: string;
  /** SHA-256 of the workbook package as received (packaging-sensitive). */
  readonly fileSha256: string | null;
  /** SHA-256 over canonical cell content only (packaging-insensitive). */
  readonly contentSha256: string | null;
  /** ISO-8601 date the controlled file was received. */
  readonly receivedOn: string | null;
}

/* ---------------------------------------------------------------------------
 * 10. The bank.
 *     `populated` is the honest gate: while false, invariants.ts reports the
 *     bank as UNPOPULATED rather than as a valid zero-question questionnaire.
 * -------------------------------------------------------------------------*/
export interface CanonicalQuestionBank {
  readonly source: ControlledSourceProvenance;
  readonly populated: boolean;
  readonly modules: readonly ModuleDefinition[];
  readonly questions: readonly QuestionDefinition[];
}

