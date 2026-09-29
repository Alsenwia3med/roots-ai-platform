/* ============================================================================
 * ROOTS-AI™ — Milestone 2 · Canonical structure invariants
 * ----------------------------------------------------------------------------
 * Turns every count and relationship the M2 Blueprint states into an executable
 * check, so that the C-01 / C-02 transcription is verified rather than trusted.
 *
 * It cannot tell you whether a transcribed question is CORRECT — only the
 * controlled source can. What it does guarantee is that a transcription which is
 * short, duplicated, off-by-one, mis-partitioned, or that lets a contextual
 * question into the scoring path is reported instead of shipping.
 *
 * Call sites: the Golden Test suite setup, and the server-side submission
 * handler before any scoring runs. A non-empty violation list blocks both.
 * ==========================================================================*/

import {
  BIO_STATE_DOMAIN_TOTAL,
  CANONICAL_FIRST_QUESTION_NUMBER,
  CANONICAL_LAST_QUESTION_NUMBER,
  CANONICAL_MODULE_COUNT,
  CANONICAL_OPTIONAL_COUNT,
  CANONICAL_QUESTION_COUNT,
  CANONICAL_REQUIRED_COUNT,
  CANONICAL_SCORED_COUNT,
  CANONICAL_CONTEXTUAL_COUNT,
  DOMAIN_COVERAGE_MIN_RATIO,
  DOMAIN_COUNT,
  DRIVER_TIE_BREAK_ORDER,
  MULTIPLE_SELECT_QUESTION_IDS,
  OPTIONAL_FREE_TEXT_QUESTION_ID,
  QUESTIONNAIRE_VERSION,
  RAW_BURDEN_SCALE,
  SCORING_RULES_VERSION,
} from "./canonical-constants";
import { QUESTION_BANK, c01MissingSourceViolations } from "./question-bank";
import { GOLDEN_TEST_SUITE, SCORING_RULES, c02MissingSourceViolations } from "./scoring-rules";
import { CANONICAL_GOLDEN_TEST_COUNT } from "./scoring-types";
import type { CanonicalDomainCode } from "./canonical-constants";
import type { QuestionDefinition } from "./types";

/**
 * "SOURCE_UNPOPULATED" is the honest state of this repository today: the
 * controlled C-01 / C-02 files have not been provided. Every other code is a
 * transcription defect that can only appear after they have been.
 */
export type StructureViolationCode =
  | "SOURCE_UNPOPULATED"
  | "QUESTION_COUNT"
  | "MODULE_COUNT"
  | "QUESTION_NUMBER_RANGE"
  | "QUESTION_NUMBER_SEQUENCE"
  | "MODULE_INDEX_RANGE"
  | "MODULE_MEMBERSHIP"
  | "MODULE_ROSTER_MISMATCH"
  | "DUPLICATE_QUESTION_ID"
  | "REQUIRED_COUNT"
  | "OPTIONAL_COUNT"
  | "SCORED_COUNT"
  | "CONTEXTUAL_COUNT"
  | "DOMAIN_MEMBERSHIP"
  | "DOMAIN_UNCOVERED"
  | "MULTI_SELECT_SET"
  | "MULTI_SELECT_RULE"
  | "EXCLUSIVE_NONE_OPTION"
  | "OPTION_ORDER"
  | "OPTION_DUPLICATE_ID"
  | "BURDEN_VALUE_RANGE"
  | "GOLDEN_TEST_COUNT"
  | "GOLDEN_TEST_DUPLICATE_ID"
  | "RULE_VALUE_MISSING"
  | "MAPPING_UNKNOWN_QUESTION"
  | "MAPPING_CONTEXTUAL_QUESTION"
  | "MAPPING_DOMAIN_MISMATCH"
  | "SCORED_QUESTION_UNMAPPED"
  | "MAPPING_COUNT"
  | "VERSION_PIN_MISMATCH";

export interface StructureViolation {
  readonly code: StructureViolationCode;
  /** The row or field at fault: a questionId, module index, or field name. */
  readonly subject: string;
  readonly detail: string;
}

const v = (
  code: StructureViolationCode,
  subject: string,
  detail: string,
): StructureViolation => ({ code, subject, detail });

/** Count of questions satisfying a predicate. */
function countWhere(
  questions: readonly QuestionDefinition[],
  predicate: (q: QuestionDefinition) => boolean,
): number {
  return questions.reduce((total, q) => (predicate(q) ? total + 1 : total), 0);
}

/* ---------------------------------------------------------------------------
 * C-01 checks — Blueprint §1 counts and §2 multi-select law.
 * -------------------------------------------------------------------------*/
export function validateC01(): readonly StructureViolation[] {
  const missing = c01MissingSourceViolations();
  if (missing.length > 0) return missing;

  const out: StructureViolation[] = [];
  const questions = QUESTION_BANK.questions;
  const modules = QUESTION_BANK.modules;

  if (QUESTION_BANK.source.version !== QUESTIONNAIRE_VERSION) {
    out.push(v("VERSION_PIN_MISMATCH", "C-01 source.version",
      `expected ${QUESTIONNAIRE_VERSION}, found ${QUESTION_BANK.source.version}`));
  }

  if (questions.length !== CANONICAL_QUESTION_COUNT) {
    out.push(v("QUESTION_COUNT", "questions",
      `expected exactly ${CANONICAL_QUESTION_COUNT}, found ${questions.length}`));
  }
  if (modules.length !== CANONICAL_MODULE_COUNT) {
    out.push(v("MODULE_COUNT", "modules",
      `expected exactly ${CANONICAL_MODULE_COUNT}, found ${modules.length}`));
  }
  if (DOMAIN_COUNT !== BIO_STATE_DOMAIN_TOTAL) {
    out.push(v("DOMAIN_MEMBERSHIP", "domain enumeration",
      `tie order holds ${DOMAIN_COUNT} codes but BIO_STATE expects ${BIO_STATE_DOMAIN_TOTAL}`));
  }

  // Identity + numbering: unique ids, and 1..73 each exactly once.
  const seenIds = new Set<string>();
  const seenNumbers = new Map<number, string>();
  for (const q of questions) {
    if (seenIds.has(q.questionId)) {
      out.push(v("DUPLICATE_QUESTION_ID", q.questionId, "questionId appears more than once"));
    }
    seenIds.add(q.questionId);
    const n = q.questionNumber;
    if (n < CANONICAL_FIRST_QUESTION_NUMBER || n > CANONICAL_LAST_QUESTION_NUMBER) {
      out.push(v("QUESTION_NUMBER_RANGE", q.questionId, `questionNumber ${n} is outside 1..73`));
    }
    if (seenNumbers.has(n)) {
      out.push(v("QUESTION_NUMBER_SEQUENCE", q.questionId,
        `questionNumber ${n} is also used by ${seenNumbers.get(n)}`));
    }
    seenNumbers.set(n, q.questionId);
  }
  for (let n = CANONICAL_FIRST_QUESTION_NUMBER; n <= CANONICAL_LAST_QUESTION_NUMBER; n += 1) {
    if (!seenNumbers.has(n)) {
      out.push(v("QUESTION_NUMBER_SEQUENCE", `questionNumber ${n}`, "no question carries this number"));
    }
  }

  // Requirement / eligibility partitions must each equal the canonical split.
  const partitionChecks: readonly [StructureViolationCode, number, number][] = [
    ["REQUIRED_COUNT", countWhere(questions, (q) => q.requirement === "required"), CANONICAL_REQUIRED_COUNT],
    ["OPTIONAL_COUNT", countWhere(questions, (q) => q.requirement === "optional"), CANONICAL_OPTIONAL_COUNT],
    ["SCORED_COUNT", countWhere(questions, (q) => q.eligibility === "scored"), CANONICAL_SCORED_COUNT],
    ["CONTEXTUAL_COUNT", countWhere(questions, (q) => q.eligibility === "contextual"), CANONICAL_CONTEXTUAL_COUNT],
  ];
  for (const [code, actual, expected] of partitionChecks) {
    if (actual !== expected) {
      out.push(v(code, "requirement/eligibility split", `expected ${expected}, found ${actual}`));
    }
  }

  // Domain axis: scored questions carry exactly one of the 7 codes, contextual
  // questions carry none, and no domain may end up with zero scored questions.
  const scoredPerDomain = new Map<CanonicalDomainCode, number>();
  for (const q of questions) {
    if (q.eligibility === "scored" && q.domainCode === null) {
      out.push(v("DOMAIN_MEMBERSHIP", q.questionId, "scored question has no domainCode"));
    }
    if (q.eligibility === "contextual") {
      // Blueprint §1: contextual questions are displayed, collected and required —
      // they are excluded from the calculation, never from the questionnaire.
      if (q.requirement !== "required") {
        out.push(v("CONTEXTUAL_COUNT", q.questionId,
          "contextual question must be required — §1 keeps all 33 in the required total of 71"));
      }
      if (q.domainCode !== null) {
        out.push(v("DOMAIN_MEMBERSHIP", q.questionId,
          `contextual question must not carry domainCode ${q.domainCode} — it would enter the calculation`));
      }
    }
    if (q.eligibility === "scored" && q.domainCode !== null) {
      scoredPerDomain.set(q.domainCode, (scoredPerDomain.get(q.domainCode) ?? 0) + 1);
    }
  }
  for (const code of DRIVER_TIE_BREAK_ORDER) {
    if (!scoredPerDomain.has(code)) {
      out.push(v("DOMAIN_UNCOVERED", code, "no scoring-eligible question maps to this domain"));
    }
  }

  return out;
}

/* ---------------------------------------------------------------------------
 * C-01 option-level checks — Blueprint §2 multi-select law, §3 burden scale.
 * -------------------------------------------------------------------------*/
export function validateC01Options(): readonly StructureViolation[] {
  if (c01MissingSourceViolations().length > 0) return [];
  const out: StructureViolation[] = [];
  const multiSelectIds = new Set<string>(MULTIPLE_SELECT_QUESTION_IDS);

  for (const q of QUESTION_BANK.questions) {
    // Exactly the five Blueprint questions are multi-select — no more, no less.
    const isMulti = q.responseKind === "multiple_select";
    if (isMulti !== multiSelectIds.has(q.questionId)) {
      out.push(v("MULTI_SELECT_SET", q.questionId, isMulti
        ? "is multi-select but is not one of the canonical five (Q13, Q14, Q52, Q53, Q54)"
        : "is one of the canonical multi-select questions but responseKind is not multiple_select"));
    }
    if (isMulti && q.multiSelectRule === null) {
      out.push(v("MULTI_SELECT_RULE", q.questionId, "multi-select question has no multiSelectRule"));
    }
    if (!isMulti && q.multiSelectRule !== null) {
      out.push(v("MULTI_SELECT_RULE", q.questionId, "multiSelectRule set on a non-multi-select question"));
    }

    // Option identity and ordering.
    const optionIds = new Set<string>();
    const orders = new Set<number>();
    let exclusiveCount = 0;
    for (const opt of q.options) {
      if (optionIds.has(opt.optionId)) {
        out.push(v("OPTION_DUPLICATE_ID", `${q.questionId}/${opt.optionId}`, "duplicate optionId"));
      }
      optionIds.add(opt.optionId);
      if (orders.has(opt.order)) {
        out.push(v("OPTION_ORDER", `${q.questionId}/${opt.optionId}`, `duplicate order ${opt.order}`));
      }
      orders.add(opt.order);
      if (opt.isExclusiveNoneOption) exclusiveCount += 1;
      if (opt.rawBurdenValue !== null &&
          (opt.rawBurdenValue < RAW_BURDEN_SCALE.min || opt.rawBurdenValue > RAW_BURDEN_SCALE.max)) {
        out.push(v("BURDEN_VALUE_RANGE", `${q.questionId}/${opt.optionId}`,
          `rawBurdenValue ${opt.rawBurdenValue} is outside ${RAW_BURDEN_SCALE.min}–${RAW_BURDEN_SCALE.max}`));
      }
    }
    if (exclusiveCount > 1) {
      out.push(v("EXCLUSIVE_NONE_OPTION", q.questionId,
        `${exclusiveCount} options claim mutual exclusion; at most one may`));
    }
    if (q.multiSelectRule !== null) {
      const rule = q.multiSelectRule;
      // minSelections is 1 and emptySelectionIsValid is false by the type; this
      // catches a data file that arrived from JSON and dodged the compiler.
      if (rule.minSelections < 1 || rule.emptySelectionIsValid !== false) {
        out.push(v("MULTI_SELECT_RULE", q.questionId,
          "an empty selection must be invalid: minSelections must be >= 1 and emptySelectionIsValid must be false"));
      }
      if (rule.exclusiveNoneOptionId !== null && !optionIds.has(rule.exclusiveNoneOptionId)) {
        out.push(v("EXCLUSIVE_NONE_OPTION", q.questionId,
          `exclusiveNoneOptionId ${rule.exclusiveNoneOptionId} is not one of its options`));
      }
    }
  }

  const q73 = QUESTION_BANK.questions.find((q) => q.questionId === OPTIONAL_FREE_TEXT_QUESTION_ID);
  if (q73 !== undefined && (q73.requirement !== "optional" || q73.naPolicy !== "not_permitted")) {
    out.push(v("OPTIONAL_COUNT", OPTIONAL_FREE_TEXT_QUESTION_ID,
      "Q73 must be optional with naPolicy not_permitted — no N/A may be forced onto it"));
  }
  return out;
}

/* ---------------------------------------------------------------------------
 * C-01 module checks — 13 ordered modules, every question placed exactly once.
 * -------------------------------------------------------------------------*/
export function validateC01Modules(): readonly StructureViolation[] {
  if (c01MissingSourceViolations().length > 0) return [];
  const out: StructureViolation[] = [];
  const byIndex = new Map<number, number[]>();

  for (const m of QUESTION_BANK.modules) {
    const idx = m.moduleIndex;
    if (idx < 1 || idx > CANONICAL_MODULE_COUNT) {
      out.push(v("MODULE_INDEX_RANGE", `module ${idx}`, "moduleIndex is outside 1..13"));
    }
    if (byIndex.has(idx)) {
      out.push(v("MODULE_INDEX_RANGE", `module ${idx}`, "moduleIndex appears more than once"));
    }
    const declared = [...m.questionNumbers].sort((a, b) => a - b);
    if (declared.length === 0) {
      out.push(v("MODULE_MEMBERSHIP", `module ${idx}`, "module declares no questions"));
    }
    byIndex.set(idx, declared);
  }
  for (let idx = 1; idx <= CANONICAL_MODULE_COUNT; idx += 1) {
    if (!byIndex.has(idx)) {
      out.push(v("MODULE_INDEX_RANGE", `module ${idx}`, "module index is missing from the bank"));
    }
  }

  // The module rosters and the questions' own moduleIndex must agree exactly.
  const actual = new Map<number, number[]>();
  for (const q of QUESTION_BANK.questions) {
    const list = actual.get(q.moduleIndex) ?? [];
    list.push(q.questionNumber);
    actual.set(q.moduleIndex, list);
  }
  for (const [idx, declared] of Array.from(byIndex.entries())) {
    const found = [...(actual.get(idx) ?? [])].sort((a, b) => a - b);
    const same = declared.length === found.length && declared.every((n, i) => n === found[i]);
    if (!same) {
      out.push(v("MODULE_ROSTER_MISMATCH", `module ${idx}`,
        `declares [${declared.join(", ")}] but holds [${found.join(", ")}]`));
    }
  }
  for (const idx of Array.from(actual.keys())) {
    if (!byIndex.has(idx)) {
      out.push(v("MODULE_ROSTER_MISMATCH", `module ${idx}`, "questions reference an undeclared module"));
    }
  }

  return out;
}

/* ---------------------------------------------------------------------------
 * C-02 checks — Blueprint §1 contextual isolation, §3 thresholds, §7 Golden 30.
 * Cross-checked against the bank: a scoring map may only reference scored
 * questions, which is what makes "the remaining 33 MUST NOT affect
 * calculations" a checked property rather than an intention.
 * -------------------------------------------------------------------------*/
export function validateC02(): readonly StructureViolation[] {
  const missing = c02MissingSourceViolations();
  if (missing.length > 0) return missing;

  const out: StructureViolation[] = [];
  const bankAvailable = c01MissingSourceViolations().length === 0;

  if (SCORING_RULES.source.version !== SCORING_RULES_VERSION) {
    out.push(v("VERSION_PIN_MISMATCH", "C-02 source.version",
      `expected ${SCORING_RULES_VERSION}, found ${SCORING_RULES.source.version}`));
  }

  if (GOLDEN_TEST_SUITE.cases.length !== CANONICAL_GOLDEN_TEST_COUNT) {
    out.push(v("GOLDEN_TEST_COUNT", "golden tests",
      `expected exactly ${CANONICAL_GOLDEN_TEST_COUNT}, found ${GOLDEN_TEST_SUITE.cases.length}`));
  }
  const seenTestIds = new Set<string>();
  for (const t of GOLDEN_TEST_SUITE.cases) {
    if (seenTestIds.has(t.testId)) {
      out.push(v("GOLDEN_TEST_DUPLICATE_ID", t.testId, "testId appears more than once"));
    }
    seenTestIds.add(t.testId);
  }

  // Values only C-02 may supply. A null/zero here means the sheet was not read.
  if (SCORING_RULES.driverEligibility.minimumDomainScore === null) {
    out.push(v("RULE_VALUE_MISSING", "driverEligibility.minimumDomainScore",
      "driver eligibility minimum is still null — read it from the C-02 drivers sheet"));
  }
  if (SCORING_RULES.driverEligibility.maxOutputEntries < 1) {
    out.push(v("RULE_VALUE_MISSING", "driverEligibility.maxOutputEntries",
      "driver output entry count is unset — read it from the C-02 drivers sheet"));
  }

  // Structural constants must still equal the Blueprint's.
  const structural: readonly [string, number, number][] = [
    ["domainCoverageMinRatio", SCORING_RULES.domainCoverageMinRatio, DOMAIN_COVERAGE_MIN_RATIO],
    ["bioStateMinValidDomains", SCORING_RULES.bioStateMinValidDomains, BIO_STATE_DOMAIN_TOTAL],
    ["driverEligibility.coPrimaryMaxGap", SCORING_RULES.driverEligibility.coPrimaryMaxGap, 3],
    ["rawBurdenScale.min", SCORING_RULES.rawBurdenScale.min, RAW_BURDEN_SCALE.min],
    ["rawBurdenScale.max", SCORING_RULES.rawBurdenScale.max, RAW_BURDEN_SCALE.max],
  ];
  for (const [field, actualValue, expected] of structural) {
    if (actualValue !== expected) {
      out.push(v("RULE_VALUE_MISSING", field, `expected ${expected}, found ${actualValue}`));
    }
  }

  // The tie-break order is fixed AND order-sensitive: reordering it silently
  // changes which domain becomes the driver whenever two scores are equal.
  const tieOrder = SCORING_RULES.driverEligibility.tieBreakOrder;
  const tieOrderMatches =
    tieOrder.length === DRIVER_TIE_BREAK_ORDER.length &&
    DRIVER_TIE_BREAK_ORDER.every((code, i) => tieOrder[i] === code);
  if (!tieOrderMatches) {
    out.push(v("RULE_VALUE_MISSING", "driverEligibility.tieBreakOrder",
      `must be exactly ${DRIVER_TIE_BREAK_ORDER.join(", ")} — found ${tieOrder.join(", ") || "(empty)"}`));
  }

  // The domain question map.
  const byId = new Map(QUESTION_BANK.questions.map((q) => [q.questionId, q]));
  const mappedIds = new Set<string>();
  for (const m of SCORING_RULES.domainQuestionMap) {
    if (mappedIds.has(m.questionId)) {
      out.push(v("MAPPING_COUNT", m.questionId, "question appears twice in the domain question map"));
    }
    mappedIds.add(m.questionId);
    const q = byId.get(m.questionId);
    if (q === undefined) {
      out.push(v("MAPPING_UNKNOWN_QUESTION", m.questionId, "map references a questionId absent from C-01"));
      continue;
    }
    if (q.eligibility === "contextual") {
      out.push(v("MAPPING_CONTEXTUAL_QUESTION", m.questionId,
        "contextual question must never enter the scoring map (Blueprint §1)"));
    }
    if (q.domainCode !== null && q.domainCode !== m.domainCode) {
      out.push(v("MAPPING_DOMAIN_MISMATCH", m.questionId,
        `map assigns ${m.domainCode} but C-01 records ${q.domainCode}`));
    }
  }
  if (bankAvailable) {
    const scoredCount = QUESTION_BANK.questions.filter((q) => q.eligibility === "scored").length;
    if (mappedIds.size !== scoredCount) {
      out.push(v("MAPPING_COUNT", "domain question map",
        `map covers ${mappedIds.size} questions but C-01 marks ${scoredCount} scoring-eligible`));
    }
    for (const q of QUESTION_BANK.questions) {
      if (q.eligibility === "scored" && !mappedIds.has(q.questionId)) {
        out.push(v("SCORED_QUESTION_UNMAPPED", q.questionId,
          "scoring-eligible question is absent from the C-02 domain question map"));
      }
    }
  }
  return out;
}

/* ---------------------------------------------------------------------------
 * Aggregate. Non-empty => the M2 data structures are not usable, and the caller
 * (Golden Test setup, or the server submission handler) must not proceed.
 * -------------------------------------------------------------------------*/
export function validateCanonicalStructure(): readonly StructureViolation[] {
  return [
    ...validateC01(),
    ...validateC01Options(),
    ...validateC01Modules(),
    ...validateC02(),
  ];
}

export function canonicalStructureIsReady(): boolean {
  return validateCanonicalStructure().length === 0;
}

/** Deterministic, greppable report — the shape the acceptance evidence needs. */
export function formatViolations(
  violations: readonly StructureViolation[],
): string {
  if (violations.length === 0) return "canonical structure: OK (0 violations)";
  const head = `canonical structure: ${violations.length} VIOLATION(S)`;
  return [head, ...violations.map((x) => `  [${x.code}] ${x.subject}: ${x.detail}`)].join("\n");
}



