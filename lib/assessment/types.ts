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
 * 4. Response kinds — the eight codes C-01 v1.0.1 writes in its own
 *    `question_type` column, with the counts that sheet produces:
 *      integer 1 (Q1), decimal 3 (Q3, Q4, Q5), decimal_with_unit 1 (Q2),
 *      integer_scale 2 (Q69, Q70), likert 37, single_select 23,
 *      multi_select 5, free_text 1 (Q73) = 73.
 *    `likert` and `single_select` are both single-choice; C-01 keeps them apart
 *    because the likert items share the FREQ scale whose option IDs the C-02
 *    rules name, so the distinction is preserved rather than collapsed.
 *    A numeric question can still take an explicit N/A (VAL-003 allows it for
 *    Q5) even though no option set carries one — naPolicy, not options, is what
 *    says whether N/A is lawful.
 *    invariants.ts pins the multi_select membership to the five canonical ids.
 * -------------------------------------------------------------------------*/
export type QuestionResponseKind =
  | "integer"
  | "decimal"
  | "decimal_with_unit"
  | "integer_scale"
  | "single_select"
  | "likert"
  | "multi_select"
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
   * C-01 Option_Sets `stored_value_or_points`, kept as that sheet's own text
   * (null when the cell is blank). This is NOT the burden value: for the two
   * reverse-scored questions C-01 stores the raw frequency while C-02 stores the
   * burden points, so the two columns legitimately disagree and both are kept —
   * `rawBurdenValue` (C-02) is what may be added up, `storedValue` is what shows
   * why. Never score this field.
   */
  readonly storedValue: string | null;
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
  /**
   * C-01 Questions `option_set_id` — the Option_Sets row group this question's
   * options came from, or null when C-01 defines no option set (the numeric and
   * free-text questions). Audit only: the options themselves are the contract.
   */
  readonly optionSetId: string | null;
  /**
   * C-01 Questions `conditional_logic`, verbatim ("NONE" for all 73 questions in
   * v1.0.1). Carried so that a future conditional module is a visible data
   * change rather than a silent one; nothing branches on it yet.
   */
  readonly conditionalLogic: string;
  readonly options: readonly QuestionOptionDefinition[];
  /**
   * Non-null if and only if `responseKind === "multi_select"`, and then
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
  /**
   * Participant-facing introduction. C-01 defines none for any of the 13 modules
   * in v1.0.1, so this is null throughout — it exists so M2's UI has one honest
   * place to render intro copy, and is never filled with C-01's internal
   * `purpose` text.
   */
  readonly introText: string | null;
  /**
   * C-01 Modules `purpose`, verbatim. INTERNAL metadata (e.g. "Contextual only.")
   * — audit and reviewer aid, never participant-facing copy.
   */
  readonly purpose: string;
  /**
   * C-01 Modules `question_range`, verbatim (e.g. "Q9-Q15"). Kept as text because
   * invariants.ts compares the roster C-01 declares here against the roster its
   * own question rows produce; a parse would hide a disagreement behind a match.
   */
  readonly questionRange: string;
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

