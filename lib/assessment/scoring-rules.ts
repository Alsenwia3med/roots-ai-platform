/* ============================================================================
 * ROOTS-AI™ — Milestone 2 · C-02 canonical scoring rules + Golden Tests
 *                            — EMPTY TEMPLATE
 * ----------------------------------------------------------------------------
 *  ⛔ THIS STRUCTURE IS DELIBERATELY UNPOPULATED.
 *
 *  The controlled C-02 v1.0.1 CORRECTED workbook (Formulas, Classifications,
 *  Drivers, Golden Tests sheets) is NOT in this repository. Which of the 40
 *  eligible questions feed which domain, every weight and keying direction, the
 *  classification band boundaries, and all 30 expected outputs exist ONLY in
 *  that source. Inventing them would produce a deterministic engine that is
 *  deterministically wrong — and one that would pass 30/30 Golden Tests written
 *  against our own guesses.
 *
 *  What IS encoded, because the M2 Blueprint states it and it is a law rather
 *  than content: the 0.0–4.0 scale, the 50% coverage threshold, the 5-of-7
 *  BIO_STATE rule, half-away-from-zero rounding, one decimal on Opportunity and
 *  Recovery, the fixed tie order, and the <= 3 co-primary gap.
 *
 *  What is NOT encoded, because only C-02 may say it: the arithmetic itself,
 *  per-question weights, driver eligibility minimum, and every band boundary.
 *
 *  POPULATION PROCEDURE: transcribe each C-02 sheet into the matching block
 *  below, then set `populated: true` on both the rule set and the Golden suite,
 *  and fill C02_SOURCE from the received files' own fingerprints.
 * ==========================================================================*/

import {
  BIO_STATE_MIN_VALID_DOMAINS,
  CO_PRIMARY_MAX_POINT_GAP,
  DRIVER_TIE_BREAK_ORDER,
  DOMAIN_COVERAGE_MIN_RATIO,
  OPPORTUNITY_DECIMALS,
  RAW_BURDEN_SCALE,
  RECOVERY_DECIMALS,
  ROUNDING_MODE,
  SCORING_RULES_VERSION,
} from "./canonical-constants";
import { CANONICAL_GOLDEN_TEST_COUNT } from "./scoring-types";
import type {
  CanonicalScoringRules,
  ClassificationSet,
  DomainQuestionMapping,
  GoldenTestCase,
  GoldenTestSuite,
} from "./scoring-types";
import type { ControlledSourceProvenance } from "./types";
import type { StructureViolation, StructureViolationCode } from "./invariants";

/* ---------------------------------------------------------------------------
 * Provenance — filled from the controlled artifact's own identity.
 * -------------------------------------------------------------------------*/
export const C02_SOURCE: ControlledSourceProvenance = {
  documentTitle: "C-02 Canonical Scoring Rules and Golden Tests",
  version: SCORING_RULES_VERSION,
  fileSha256: null,
  contentSha256: null,
  receivedOn: null,
};

/* ---------------------------------------------------------------------------
 * Which question feeds which domain — from the C-02 formulas sheet. Its
 * cardinality is expected to be exactly 40: the 33 contextual questions must
 * never appear here (Blueprint §1).
 * -------------------------------------------------------------------------*/
export const C02_DOMAIN_QUESTION_MAP: readonly DomainQuestionMapping[] = [];

/* ---------------------------------------------------------------------------
 * Classification bands (domains, Recovery Potential, further scales) — from the
 * C-02 Classifications sheet, including its stated inclusive/exclusive rule.
 * -------------------------------------------------------------------------*/
export const C02_CLASSIFICATIONS: readonly ClassificationSet[] = [];

/* ---------------------------------------------------------------------------
 * The rule set. Structural constants are the Blueprint's; the null-valued and
 * empty-list fields are the ones only C-02 can supply.
 * -------------------------------------------------------------------------*/
export const SCORING_RULES: CanonicalScoringRules = {
  source: C02_SOURCE,
  populated: false,
  rawBurdenScale: RAW_BURDEN_SCALE,
  domainQuestionMap: C02_DOMAIN_QUESTION_MAP,
  domainCoverageMinRatio: DOMAIN_COVERAGE_MIN_RATIO,
  bioStateMinValidDomains: BIO_STATE_MIN_VALID_DOMAINS,
  rounding: {
    integerMode: ROUNDING_MODE,
    opportunityDecimals: OPPORTUNITY_DECIMALS,
    recoveryDecimals: RECOVERY_DECIMALS,
    // C-02 names which scales are reported as integers. Not restated from memory.
    integerScales: [],
  },
  driverEligibility: {
    // The driver candidacy minimum is a C-02 value; not restated from memory.
    minimumDomainScore: null,
    ranking: "descending",
    tieBreakOrder: DRIVER_TIE_BREAK_ORDER,
    coPrimaryMaxGap: CO_PRIMARY_MAX_POINT_GAP,
    // C-02 states how many driver entries are produced.
    maxOutputEntries: 0,
  },
  classifications: C02_CLASSIFICATIONS,
  payload: null,
};

/* ---------------------------------------------------------------------------
 * The 30 canonical Golden Tests. `expected` is transcribed from C-02 verbatim;
 * it is never produced by running our own engine, which would make the suite
 * circular and its 30/30 result meaningless.
 * -------------------------------------------------------------------------*/
export const C02_GOLDEN_TESTS: readonly GoldenTestCase[] = [];

export const GOLDEN_TEST_SUITE: GoldenTestSuite = {
  source: C02_SOURCE,
  populated: false,
  expectedCount: CANONICAL_GOLDEN_TEST_COUNT,
  cases: C02_GOLDEN_TESTS,
};

/* ---------------------------------------------------------------------------
 * Readiness gate — mirrors the bank's, for the same reason: an empty rule set is
 * structurally well-formed, so it must be reported as a missing source rather
 * than as a valid rule set with nothing in it.
 * -------------------------------------------------------------------------*/
export const C02_UNPOPULATED_CODE: StructureViolationCode = "SOURCE_UNPOPULATED";

export function c02MissingSourceViolations(): readonly StructureViolation[] {
  if (SCORING_RULES.populated && GOLDEN_TEST_SUITE.populated) return [];
  return [
    {
      code: C02_UNPOPULATED_CODE,
      subject: "C-02 scoring rules",
      detail:
        `${C02_SOURCE.documentTitle} (${SCORING_RULES_VERSION}) is not present in this repository: ` +
        `${C02_DOMAIN_QUESTION_MAP.length} domain-question mappings, ` +
        `${C02_CLASSIFICATIONS.length} classification sets and ` +
        `${C02_GOLDEN_TESTS.length} of ${CANONICAL_GOLDEN_TEST_COUNT} Golden Tests ` +
        "are transcribed. Populate from the controlled source; do not author " +
        "formulas, bands or expected outputs here.",
    },
  ];
}

