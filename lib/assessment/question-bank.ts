/* ============================================================================
 * ROOTS-AI™ — Milestone 2 · C-01 canonical question bank — EMPTY TEMPLATE
 * ----------------------------------------------------------------------------
 *  ⛔ THIS STRUCTURE IS DELIBERATELY UNPOPULATED.
 *
 *  The controlled C-01 v1.0.1 CORRECTED question bank is NOT in this repository
 *  yet. Question text, option labels, option order, burden values, N/A
 *  permission, domain membership and module titles exist ONLY in that source.
 *  Inventing any of it would produce a questionnaire that looks canonical and
 *  scores wrong, and would be almost impossible to detect later. So nothing is
 *  invented: `populated` is false and both arrays are empty.
 *
 *  What IS encoded here, because the M2 Blueprint states it and it is not
 *  assessment content: the 73 / 13 / 71 / 2 / 40 / 33 counts, the five
 *  multi-select question IDs, optional free-text Q73, and the version pins.
 *  Those live in canonical-constants.ts and are checked by invariants.ts.
 *
 *  POPULATION PROCEDURE — exactly two edits, in this order:
 *    1. Transcribe C-01 into `modules` and `questions` below, one entry per
 *       controlled row, using asModuleIndex()/asQuestionNumber() for the
 *       branded ordinals. Copy verbatim. Where a controlled cell is blank,
 *       leave the field null — do not fill the gap with a plausible value.
 *    2. Set `populated: true`.
 *  Then run the invariant check. It must report zero violations AND every
 *  canonical count must match. A partially transcribed bank fails rather than
 *  silently presenting a shorter questionnaire.
 * ==========================================================================*/

import {
  CANONICAL_MODULE_COUNT,
  CANONICAL_QUESTION_COUNT,
  QUESTIONNAIRE_VERSION,
} from "./canonical-constants";
import type {
  CanonicalQuestionBank,
  ControlledSourceProvenance,
  ModuleDefinition,
  ModuleIndex,
  QuestionDefinition,
  QuestionNumber,
} from "./types";
import type { StructureViolation, StructureViolationCode } from "./invariants";

/* ---------------------------------------------------------------------------
 * Branding helpers.
 * The `QuestionNumber` / `ModuleIndex` brands exist so a loop counter or an
 * array index cannot be passed where a canonical number is required. These are
 * the only sanctioned escape hatches; they widen, they do not validate. Range
 * checking is invariants.ts's job, where it can report every breach at once
 * instead of throwing on the first.
 * -------------------------------------------------------------------------*/
export const asQuestionNumber = (n: number): QuestionNumber => n as QuestionNumber;
export const asModuleIndex = (n: number): ModuleIndex => n as ModuleIndex;

/* ---------------------------------------------------------------------------
 * Provenance. Filled from the controlled file's identity when it arrives —
 * the SHA-256 values come from the receiving step, never from a re-creation.
 * -------------------------------------------------------------------------*/
export const C01_SOURCE: ControlledSourceProvenance = {
  documentTitle: "C-01 Canonical Question Bank",
  version: QUESTIONNAIRE_VERSION,
  fileSha256: null,
  contentSha256: null,
  receivedOn: null,
};

/* ---------------------------------------------------------------------------
 * The 13 ordered modules. Titles and question ranges come from C-01.
 * -------------------------------------------------------------------------*/
export const C01_MODULES: readonly ModuleDefinition[] = [];

/* ---------------------------------------------------------------------------
 * The 73 canonical questions, in canonical order.
 * -------------------------------------------------------------------------*/
export const C01_QUESTIONS: readonly QuestionDefinition[] = [];

/* ---------------------------------------------------------------------------
 * The assembled bank.
 * -------------------------------------------------------------------------*/
export const QUESTION_BANK: CanonicalQuestionBank = {
  source: C01_SOURCE,
  populated: false,
  modules: C01_MODULES,
  questions: C01_QUESTIONS,
};

/* ---------------------------------------------------------------------------
 * Readiness gate.
 *
 * The empty arrays above are structurally well-formed, so a naive validator
 * would call them valid and M2 would "pass" with zero questions. `source absent`
 * is reported first and short-circuits: nothing downstream may treat an empty
 * bank as a legitimate questionnaire.
 * -------------------------------------------------------------------------*/
export const C01_UNPOPULATED_CODE: StructureViolationCode = "SOURCE_UNPOPULATED";

export function c01MissingSourceViolations(): readonly StructureViolation[] {
  const detail =
    `${C01_SOURCE.documentTitle} (${QUESTIONNAIRE_VERSION}) is not present in this repository: ` +
    `${C01_QUESTIONS.length} of ${CANONICAL_QUESTION_COUNT} questions and ` +
    `${C01_MODULES.length} of ${CANONICAL_MODULE_COUNT} modules are transcribed. ` +
    "Populate from the controlled source; do not author content here.";
  return QUESTION_BANK.populated
    ? []
    : [{ code: C01_UNPOPULATED_CODE, subject: "C-01 question bank", detail }];
}

/** Index lookups used by validation, scoring and resume. */
export const questionById: ReadonlyMap<string, QuestionDefinition> = new Map(
  C01_QUESTIONS.map((q) => [q.questionId, q]),
);

export const questionsByModule: ReadonlyMap<number, readonly QuestionDefinition[]> = new Map(
  C01_MODULES.map((m) => [
    m.moduleIndex,
    C01_QUESTIONS.filter((q) => q.moduleIndex === m.moduleIndex),
  ]),
);
