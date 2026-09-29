/* ============================================================================
 * ROOTS-AI™ — Milestone 2 · C-02 canonical scoring rule & result types
 * ----------------------------------------------------------------------------
 * Source of truth: M2 Strict Implementation Blueprint §3 (deterministic
 * engine), §4 (drivers / co-primary) and §7 (30 Golden Tests), mirroring
 * C-02 v1.0.1 CORRECTED.
 *
 * HARD RULE: this file describes the CONTRACT of the scoring engine. It holds
 * no formula, no weight, no band boundary and no expected output. Those exist
 * only in the controlled C-02 source and are loaded into scoring-rules.ts.
 * AI/LLMs have ZERO calculation authority (Blueprint §3).
 * ==========================================================================*/

import type { CanonicalDomainCode } from "./canonical-constants";
import type { ControlledSourceProvenance } from "./types";

/* ---------------------------------------------------------------------------
 * 1. Domain score.
 *    Null is a FIRST-CLASS result, not an error: a domain with < 50% coverage
 *    of its scoring-eligible questions returns null (Blueprint §3).
 *
 *  ⚠ CONFLICT, UNRESOLVED — see M2_OPEN_ITEMS: M1 migration 0001 declares every
 *    domain column of `scores` as `numeric NOT NULL`, so a null domain score
 *    cannot be persisted there as-is. No migration has been written to relax
 *    that; it needs a ROOTS decision first.
 * -------------------------------------------------------------------------*/
export interface DomainScoreResult {
  readonly code: CanonicalDomainCode;
  /** Null when coverage is below DOMAIN_COVERAGE_MIN_RATIO. */
  readonly score: number | null;
  /** Denominator: scoring-eligible questions belonging to this domain. */
  readonly eligibleQuestionCount: number;
  /** Numerator: of those, how many carry a usable answer. */
  readonly answeredQuestionCount: number;
  readonly coverageRatio: number;
  /** True when coverageRatio < DOMAIN_COVERAGE_MIN_RATIO, forcing null. */
  readonly belowCoverageThreshold: boolean;
}

export type DomainScoreMap = Readonly<Record<CanonicalDomainCode, DomainScoreResult>>;

/* ---------------------------------------------------------------------------
 * 2. Biological State — Blueprint §3: valid in >= 5 of 7 domains, else null.
 *    The label vocabulary below is taken from the M1 `scores.biological_state`
 *    CHECK constraint; it still requires confirmation against C-02 before use.
 * -------------------------------------------------------------------------*/
export type BiologicalStateLabel = "optimal" | "balanced" | "strained" | "depleted";

export interface BiologicalStateResult {
  /** Null when fewer than BIO_STATE_MIN_VALID_DOMAINS domains are valid. */
  readonly state: BiologicalStateLabel | null;
  readonly validDomainCount: number;
  readonly requiredDomainCount: number;
}

/* ---------------------------------------------------------------------------
 * 3. Classification bands.
 *    Boundaries, labels and the inclusive/exclusive convention all come from the
 *    C-02 Classifications sheet and are NOT restated here. The one-decimal
 *    Recovery Potential values may fall between whole-number inclusive bounds;
 *    that boundary rule is an open ROOTS decision, so no tie behaviour is
 *    encoded.
 * -------------------------------------------------------------------------*/
export interface ClassificationBand {
  readonly label: string;
  readonly min: number;
  readonly max: number;
}

export interface ClassificationSet {
  /** The scale these bands apply to, e.g. "RECOVERY". */
  readonly scaleCode: string;
  readonly sourceSheet: string | null;
  readonly bands: readonly ClassificationBand[];
}

/* ---------------------------------------------------------------------------
 * 4. Drivers — Blueprint §4.
 *    Ranking uses eligible domains only, descending. Equal scores break ties in
 *    the fixed DRIVER_TIE_BREAK_ORDER. Co-primary applies only when the top two
 *    eligible scores differ by <= 3, and a co-primary pair is ONE output entry:
 *    never split, never duplicated, never padded from an ineligible domain.
 *
 *    The `domains` tuple type enforces "one entry, one or two domains" at
 *    compile time — a third domain is not expressible.
 * -------------------------------------------------------------------------*/
export type DriverDomains =
  | readonly [CanonicalDomainCode]
  | readonly [CanonicalDomainCode, CanonicalDomainCode];

export interface DriverOutputEntry {
  /** "co_primary" only when the top two eligible scores differ by <= 3. */
  readonly kind: "single" | "co_primary";
  readonly domains: DriverDomains;
  /** The score this entry stands for; for co-primary, the pair's top score. */
  readonly score: number;
  /** True when the ranking reached this entry through an exact tie. */
  readonly tieBrokenByFixedOrder: boolean;
  /** Point gap to the next ranked entry; null when this is the last entry. */
  readonly gapToNext: number | null;
}

/** Eligibility gate for driver candidacy, taken verbatim from C-02. */
export interface DriverEligibilityThresholds {
  /**
   * Minimum Domain score for driver candidacy. C-02 supplies this; it is not
   * restated by the Blueprint, so it is null rather than a guess.
   */
  readonly minimumDomainScore: number | null;
  /** Co-Primary window — Blueprint §4 states 3 points apart. */
  readonly coPrimaryMaxGap: 3;
  /** How many entries the driver output carries (1 alone; more with Co-Primary). */
  readonly maxOutputEntries: number;
  /** Drivers rank by Domain score, highest first — Blueprint §4. */
  readonly ranking: "descending";
  /**
   * Fixed tie-break order: MR → HS → SR → CH → SL → IB → BS. Not by module,
   * not by question number. invariants.ts compares this array element by element.
   */
  readonly tieBreakOrder: readonly CanonicalDomainCode[];
}

/** Rounding law — Blueprint §3: half-away-from-zero; one decimal on two scales. */
export interface RoundingRule {
  readonly integerMode: "half_away_from_zero";
  readonly opportunityDecimals: 1;
  readonly recoveryDecimals: 1;
  /** Which scales are reported as integers. C-02 states the list; not restated. */
  readonly integerScales: readonly string[];
}

/* ---------------------------------------------------------------------------
 * 5. Per-question scoring input mapping (the C-02 "which question feeds which
 *    domain" table). Membership + weights/keying come from C-02 only; the
 *    nullable fields below stay null until that source is loaded.
 * -------------------------------------------------------------------------*/
export interface DomainQuestionMapping {
  readonly questionId: string;
  readonly domainCode: CanonicalDomainCode;
  /** Verbatim C-02 weight/coefficient; null until C-02 supplies it. */
  readonly weight: number | null;
  /**
   * Whether a higher raw burden value raises or lowers the domain score.
   * C-02 states this per question; never assumed.
   */
  readonly direction: "increase" | "decrease" | null;
}

/* ---------------------------------------------------------------------------
 * 6. The rule set. `populated` gates the validators exactly as the bank's does:
 *    an empty rule set must be reported as UNPOPULATED, never as valid.
 * -------------------------------------------------------------------------*/
export interface CanonicalScoringRules {
  readonly source: ControlledSourceProvenance;
  readonly populated: boolean;
  readonly rawBurdenScale: { readonly min: number; readonly max: number };
  readonly domainQuestionMap: readonly DomainQuestionMapping[];
  readonly domainCoverageMinRatio: number;
  readonly bioStateMinValidDomains: number;
  readonly rounding: RoundingRule;
  readonly driverEligibility: DriverEligibilityThresholds;
  /** Domain classifications + Recovery/other scale bands. Empty until C-02. */
  readonly classifications: readonly ClassificationSet[];
  /** Full published payload, kept for content-addressed replay. */
  readonly payload: Readonly<Record<string, unknown>> | null;
}

/* ---------------------------------------------------------------------------
 * 7. Engine input / output contract. The engine is a pure function of these:
 *    identical input + identical rule version => identical output, always.
 * -------------------------------------------------------------------------*/
export interface ScoringInput {
  readonly answers: Readonly<Record<string, { readonly rawValue: number | null; readonly isNa: boolean }>>;
  readonly questionnaireVersion: string;
  readonly scoringRulesVersion: string;
}

export interface ScoringResult {
  readonly domains: DomainScoreMap;
  readonly biologicalState: BiologicalStateResult;
  /** One decimal place, half-away-from-zero. Null only where C-02 yields null. */
  readonly opportunity: number | null;
  /** One decimal place, half-away-from-zero. Null only where C-02 yields null. */
  readonly recoveryPotential: number | null;
  readonly confidence: number;
  /** Co-primary pairs occupy ONE slot. Order is the canonical ranked order. */
  readonly drivers: readonly DriverOutputEntry[];
  /** Terminology the renderer must use, verbatim from Blueprint §4. */
  readonly driverTerminology: string;
  readonly classifications: readonly ClassificationSet[];
  /** Reproducibility record: rule version, per-domain arithmetic, tie events. */
  readonly trace: Readonly<Record<string, unknown>>;
  readonly questionnaireVersion: string;
  readonly scoringRulesVersion: string;
}

/* ---------------------------------------------------------------------------
 * 8. Golden Tests — Blueprint §7: exactly 30 canonical cases, 30/30 PASS, and a
 *    logged matrix of Test ID -> Input -> Expected -> Actual -> PASS/FAIL.
 *    `expected` is copied from C-02 verbatim. No expected value is ever
 *    produced by running our own engine — that would make the test circular.
 * -------------------------------------------------------------------------*/
export interface GoldenTestInputCell {
  readonly questionId: string;
  readonly rawValue: number | null;
  readonly isNa: boolean;
}

/**
 * The expected-output shape is C-02's, and C-02's exact field names are not yet
 * in the repo, so each field is optional and null-tolerant. The comparator must
 * require a match on every field that C-02 populates for that test rather than
 * treating a missing field as a pass.
 */
export interface GoldenTestExpectedOutput {
  readonly domainScores?: Partial<Record<CanonicalDomainCode, number | null>>;
  readonly biologicalState?: BiologicalStateLabel | null;
  readonly opportunity?: number | null;
  readonly recoveryPotential?: number | null;
  readonly confidence?: number | null;
  readonly drivers?: readonly DriverOutputEntry[];
  readonly classifications?: Readonly<Record<string, string | null>>;
}

export interface GoldenTestCase {
  readonly testId: string;
  readonly description: string | null;
  readonly input: readonly GoldenTestInputCell[];
  readonly expected: GoldenTestExpectedOutput;
}

/** Canonical count is fixed at 30 by Blueprint §7 — asserted in invariants.ts. */
export const CANONICAL_GOLDEN_TEST_COUNT = 30;

export interface GoldenTestSuite {
  readonly source: ControlledSourceProvenance;
  readonly populated: boolean;
  readonly expectedCount: number;
  readonly cases: readonly GoldenTestCase[];
}

/** One logged matrix row — the compliance evidence Blueprint §7 requires. */
export interface GoldenTestMatrixRow {
  readonly testId: string;
  readonly input: readonly GoldenTestInputCell[];
  readonly expected: GoldenTestExpectedOutput;
  readonly actual: GoldenTestExpectedOutput | null;
  readonly result: "PASS" | "FAIL";
  readonly mismatches: readonly string[];
}

