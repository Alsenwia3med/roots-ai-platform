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
 * 2. Biological State — SC-002: "Mean of available seven domain scores", null if
 *    fewer than 5 domains are available. C-02 v1.0.1 states BIO_STATE as an
 *    INTEGER 0-100 (QA_Checks: "BIO_STATE identifier unambiguous = 1"; all 30
 *    golden tests carry an integer), and SC-003 reads it arithmetically:
 *    Opportunity = 100 - (BIO_STATE x 0.5). It is therefore a number, not a
 *    label — and C-02's Classifications sheet defines DOMAIN, CONFIDENCE and
 *    RECOVERY bands but NO BIO_STATE band, so no BIO_STATE label exists anywhere
 *    in the controlled sources.
 *
 *  ⚠ CONFLICT, UNRESOLVED — see M2_OPEN_ITEMS: M1 migration 0001 stores
 *    biological_state in two shapes, one of which is a CHECK-constrained label
 *    vocabulary ("optimal", "balanced", "strained", "depleted"). C-02 confirms
 *    that vocabulary is not canonical, and it is deliberately NOT re-created
 *    here: inventing a numeric-to-label mapping would fabricate a classification
 *    C-02 never approved. Persist the integer; the label column needs a ROOTS
 *    decision before anything may write to it.
 * -------------------------------------------------------------------------*/
export interface BiologicalStateResult {
  /** Mean of available domain scores, half-away-from-zero to integer. */
  readonly value: number | null;
  readonly validDomainCount: number;
  readonly requiredDomainCount: number;
  /** The domains whose score was available, in canonical tie-break order. */
  readonly availableDomains: readonly CanonicalDomainCode[];
}


/* ---------------------------------------------------------------------------
 * 3. Classification bands — the C-02 Classifications sheet, verbatim.
 *    Three scales exist there: DOMAIN, CONFIDENCE and RECOVERY. Bounds are
 *    inclusive whole numbers on both ends. ROOTS explicitly selected rule (a)
 *    for one-decimal Recovery Potential values: classify by the highest band
 *    minimum reached (74.5 → Moderate; 75.0 → High). C-02 QA_Checks proves the
 *    12 source rows partition 0-100 with no gap and no overlap, which
 *    scoring-rules.ts re-checks. `approvedInterpretation` and `colorHex` remain
 *    the source-approved display metadata for each classification.
 * -------------------------------------------------------------------------*/
export interface ClassificationBand {
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly colorHex: string;
  readonly approvedInterpretation: string;
}

export interface ClassificationSet {
  /** The scale these bands apply to: C-02 names DOMAIN, CONFIDENCE, RECOVERY. */
  readonly scaleCode: string;
  /** The sheet they came from, so a reviewer knows where to look. */
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

/** Eligibility gate for driver candidacy, taken from the C-02 Drivers sheet. */
export interface DriverEligibilityThresholds {
  /**
   * DRV-001: "Available domain score ≥25" — so a domain below 25 is never a
   * driver, and DRV-004: with no domain ≥25 the output is "No primary driver".
   */
  readonly minimumDomainScore: number | null;
  /** Co-Primary window — DRV-003 states ≤3 points apart. */
  readonly coPrimaryMaxGap: 3;
  /**
   * How many ranked entries the output may hold. DRV-002 states the output as
   * "Primary/secondary/tertiary" — THREE slots — and DRV-003 decides what fills
   * the first one: "If top two eligible scores differ by ≤3, report them once as
   * one co-primary pair … then next highest-ranked distinct eligible domain if
   * one exists". A pair therefore occupies ONE slot, never two, and no ineligible
   * domain may be pulled in to pad the rest. C-02's own golden tests confirm the
   * reading: GT-013, GT-015 and GT-028 each state three entries.
   */
  readonly maxOutputEntries: number;
  /** Drivers rank by Domain score, highest first — DRV-002. */
  readonly ranking: "descending";
  /**
   * Fixed tie-break order, quoted by DRV-002 itself: "exact ties use fixed order
   * MR,HS,SR,CH,SL,IB,BS" — scoring-rules.ts reads the codes out of that cell
   * rather than restating them. NOTE: `lib/report/c03-content.ts` holds driver
   * SENTENCE templates only and names no domain code, so it neither confirms nor
   * conflicts with this order; the M1 `scores` table columns (hu/sl/me/ci/sa/st/
   * ins) still do, and remain an open ROOTS decision (see M2_OPEN_ITEMS).
   * invariants.ts compares element by element.
   */
  readonly tieBreakOrder: readonly CanonicalDomainCode[];
}

/**
 * Rounding law — one rule across every scale: C-02's Formulas sheet says "Half
 * away from zero to integer" on SC-001, SC-002, SC-004, SC-006, SC-007 and
 * SC-008, and "One decimal" on SC-003 (Opportunity) and SC-005 (Recovery).
 * `integerScales` therefore names the RULE ids whose output is an integer —
 * listed verbatim from the sheet, never inferred from a scale's meaning.
 */
export interface RoundingRule {
  readonly integerMode: "half_away_from_zero";
  readonly opportunityDecimals: 1;
  readonly recoveryDecimals: 1;
  /** Rule ids whose output C-02 rounds to a whole number. */
  readonly integerScales: readonly string[];
}

/* ---------------------------------------------------------------------------
 * 5. Per-question scoring input mapping — the C-02 Question_Mapping sheet.
 *    Cardinality is exactly 40: the 33 contextual questions never appear here
 *    (Blueprint §1), which invariants.ts proves in both directions.
 * -------------------------------------------------------------------------*/
export interface DomainQuestionMapping {
  readonly questionId: string;
  readonly domainCode: CanonicalDomainCode;
  /** C-02 `weight`, verbatim. 1 for all 40 rows in v1.0.1. */
  readonly weight: number;
  /**
   * C-02 `reverse_scored`: "decrease" (1) marks a question whose raw answer scale
   * runs opposite to burden — Q26 and Q28 in v1.0.1.
   *
   * ⚠ It is AUDIT information, not a second instruction. C-02's Option_Points are
   * ALREADY direction-adjusted (for Q26/Q28 C-01 stores NVR=0 … ALW=4 while C-02
   * stores NVR=4 … ALW=0), so an engine that multiplies or inverts by this flag
   * would double-reverse and score the two questions upside down. Use the option's
   * rawBurdenValue as it stands; read this field only when explaining a score.
   * invariants.ts proves the pre-adjustment still holds.
   */
  readonly direction: "increase" | "decrease";
  /** C-02 `points_map`: the option set that supplies this question's points. */
  readonly pointsMap: string;
  /** C-02 `question_reference`: the prompt text as C-02 recorded it. */
  readonly questionReference: string;
  /** C-02 `normalized_range`, e.g. "0-4 burden points". */
  readonly normalizedRange: string;
}

/* ---------------------------------------------------------------------------
 * 5b. The remaining C-02 sheets, carried as data so the engine cites a rule id
 *     instead of paraphrasing one. Each mirrors one sheet, one row per entry.
 * -------------------------------------------------------------------------*/
/** One row of C-02 Domains. */
export interface CanonicalDomainDefinition {
  readonly code: CanonicalDomainCode;
  /** C-02 `display_name`, trademark-signalled as C-02 spells it. */
  readonly displayName: string;
  readonly meaning: string;
  /** C-02's own restatement of the formula, per domain. */
  readonly formula: string;
}

/** One row of C-02 Formulas (SC-001 … SC-008). */
export interface CanonicalFormulaRule {
  readonly ruleId: string;
  readonly output: string;
  readonly normativeFormula: string;
  /** When the output is null, and what happens at the edges. */
  readonly nullOrBoundaryRule: string;
  readonly rounding: string;
  /** What the audit record must contain for this rule. */
  readonly auditFields: string;
}

/**
 * One row of C-02 Protective_Factors: five factors worth 20 each feed SC-004,
 * and three band-valued inputs (AGE, CONDITION, MEDICATION) feed SC-005.
 * `activationRule` is C-02's own wording and, for P1, names option IDs — the
 * engine must read it as data, never parse it as an expression.
 */
export interface CanonicalProtectiveFactor {
  readonly factorId: string;
  /** The question(s) that decide it, e.g. "Q46/Q47". */
  readonly source: string;
  readonly activationRule: string;
  /** "20" for P1-P5; "Band value" for the Recovery Potential inputs. */
  readonly outputValue: string;
  readonly purpose: string;
  readonly notes: string;
}

/**
 * One row of C-02 Drivers_Evidence: DRV-001..004 driver law, EVD-001/002 evidence
 * score and label, CNF-001 confidence. Column names are C-02's own; the sheet
 * mixes driver and evidence rules, so they stay in one table rather than being
 * re-sorted by guesswork.
 */
export interface CanonicalDeterministicRule {
  readonly ruleId: string;
  readonly subject: string;
  readonly deterministicRule: string;
  readonly output: string;
  readonly tieOrFallback: string;
  readonly auditRequirement: string;
}


/* ---------------------------------------------------------------------------
 * 6. The rule set. `populated` gates the validators exactly as the bank's does:
 *    an empty rule set must be reported as UNPOPULATED, never as valid.
 *    Every list below is derived from one C-02 sheet, in sheet order, so a
 *    reviewer can diff any entry against its row.
 * -------------------------------------------------------------------------*/
export interface CanonicalScoringRules {
  readonly source: ControlledSourceProvenance;
  readonly populated: boolean;
  readonly rawBurdenScale: { readonly min: number; readonly max: number };
  /** C-02 Domains: the seven burden domains, in C-02's row order. */
  readonly domains: readonly CanonicalDomainDefinition[];
  /** C-02 Question_Mapping: the 40 scored questions and their domains. */
  readonly domainQuestionMap: readonly DomainQuestionMapping[];
  /** C-02 Option_Points, keyed per question — the only points the engine may use. */
  readonly optionPoints: readonly CanonicalOptionPoint[];
  readonly domainCoverageMinRatio: number;
  readonly bioStateMinValidDomains: number;
  readonly rounding: RoundingRule;
  readonly driverEligibility: DriverEligibilityThresholds;
  /** C-02 Formulas: SC-001 … SC-008, the arithmetic the engine must implement. */
  readonly formulas: readonly CanonicalFormulaRule[];
  /** C-02 Protective_Factors: P1-P5 and the three Recovery Potential inputs. */
  readonly protectiveFactors: readonly CanonicalProtectiveFactor[];
  /** C-02 Drivers_Evidence: DRV / EVD / CNF rules, verbatim. */
  readonly deterministicRules: readonly CanonicalDeterministicRule[];
  /** Domain classifications + Recovery/other scale bands, from Classifications. */
  readonly classifications: readonly ClassificationSet[];
}

/** One row of C-02 Option_Points, resolved against its question. */
export interface CanonicalOptionPoint {
  readonly questionId: string;
  readonly domainCode: CanonicalDomainCode;
  readonly optionSetId: string;
  readonly optionId: string;
  /** Must equal C-01's label for the same option — proved at load. */
  readonly displayLabel: string;
  /** Null only when `excludedAsNa` is true; C-02 leaves those cells blank. */
  readonly burdenPoints: number | null;
  readonly excludedAsNa: boolean;
}


/* ---------------------------------------------------------------------------
 * 7. Engine input / output contract. The engine is a pure function of these:
 *    identical input + identical rule version => identical output, always.
 * -------------------------------------------------------------------------*/
export type RecoveryPotentialLimitation = "CONDITION_UNAVAILABLE" | "MEDICATION_UNAVAILABLE";

export interface ScoringInput {
  /** C-02-normalized burden points keyed by canonical scored question ID. */
  readonly answers: Readonly<Record<string, {
    readonly rawValue: number | null;
    readonly isNa: boolean;
    /** The selected C-01 option, present for submitted answers and absent in C-02 normalized fixtures. */
    readonly rawOptionId?: string | null;
  }>>;
  readonly age: number;
  readonly diseaseCount: number;
  readonly medicationCount: number;
  readonly answerConfidence: number;
  readonly protectiveFactors: Readonly<Record<ProtectionFactorId, boolean>>;
  /** C-02 flags these answers as unavailable rather than imputing factor values. */
  readonly recoveryPotentialLimitations?: readonly RecoveryPotentialLimitation[];
  readonly questionnaireVersion: string;
  readonly scoringRulesVersion: string;
}

export interface ScoringClassificationResult {
  readonly domains: Readonly<Record<CanonicalDomainCode, ClassificationBand | null>>;
  readonly confidence: ClassificationBand | null;
  readonly recoveryPotential: ClassificationBand | null;
}

export interface ScoringResult {
  readonly domains: DomainScoreMap;
  readonly biologicalState: BiologicalStateResult;
  /** One decimal place, half-away-from-zero. */
  readonly opportunity: number | null;
  /** One decimal place; null if BIO_STATE or a C-02 recovery factor is unavailable. */
  readonly recoveryPotential: number | null;
  readonly recoveryPotentialLimitations: readonly RecoveryPotentialLimitation[];
  readonly protectiveCount: number;
  readonly confidence: number;
  /** Co-primary pairs occupy ONE entry; order follows canonical driver ranking. */
  readonly drivers: readonly DriverOutputEntry[];
  /** Terminology the renderer must use, verbatim from Blueprint §4. */
  readonly driverTerminology: string;
  readonly classifications: ScoringClassificationResult;
  /** Reproducibility record: source versions, arithmetic, factors and ranking. */
  readonly trace: Readonly<Record<string, unknown>>;
  readonly questionnaireVersion: string;
  readonly scoringRulesVersion: string;
}

/* ---------------------------------------------------------------------------
 * 8. Golden Tests — Blueprint §7: exactly 30 canonical cases, 30/30 PASS, and a
 *    logged matrix of Test ID -> Input -> Expected -> Actual -> PASS/FAIL.
 *    Both sides below are transcribed from C-02 and parsed, never re-typed:
 *    no expected value is ever produced by running our own engine, which would
 *    make the suite circular and its 30/30 result meaningless.
 *
 *    Note the shape C-02 actually uses: a golden input supplies the ANSWER VALUE
 *    (burden points 0-4) for each of the 40 scored questions plus the four
 *    non-question inputs SC-004/SC-005/SC-008 need (age, diseaseCount,
 *    medicationCount, answerConfidence, P1-P5). It does NOT name option IDs, so a
 *    harness comparing these cases must feed the engine values, not options.
 * -------------------------------------------------------------------------*/
export const PROTECTION_FACTOR_IDS = ["P1", "P2", "P3", "P4", "P5"] as const;
export type ProtectionFactorId = (typeof PROTECTION_FACTOR_IDS)[number];

/** One golden case's normalized_input_json, parsed. */
export interface GoldenTestInput {
  /** SC-005's AGE factor input. */
  readonly age: number;
  /** SC-005's CONDITION factor input: how many condition categories were chosen. */
  readonly diseaseCount: number;
  /** SC-005's MEDICATION factor input. */
  readonly medicationCount: number;
  /** SC-008's Q72 component, already resolved to its stored value (25/50/75/100). */
  readonly answerConfidence: number;
  /** SC-004's five booleans. */
  readonly protectiveFactors: Readonly<Record<ProtectionFactorId, boolean>>;
  /**
   * Burden points per scored question. C-02 lists all 40 keys in all 30 cases,
   * and six of them (GT-016…GT-020, GT-029) carry `null` for some of those keys:
   * null is C-02's own way of saying the item was not answered / answered N/A,
   * which is what drives the reduced coverage and the null domains in those
   * cases. A harness must therefore pass null through, never coerce it to 0.
   */
  readonly answers: Readonly<Record<string, number | null>>;
}

/**
 * One golden case's expected_output_json, parsed. Field names are C-02's own,
 * translated to camelCase; nothing is added and nothing is renamed silently.
 * `coverage` is a RATIO (0, 0.25 … 1), not a percentage — SC-006's own output is
 * a percentage, so the two must not be conflated by a comparator.
 */
export interface GoldenTestExpectedOutput {
  /** Keyed by C-02 domain id; every domain states a score or null in each test. */
  readonly domainScores: Readonly<Record<string, number | null>>;
  readonly coverage: Readonly<Record<string, number>>;
  /** SC-002 — an integer 0-100, or null below 5 available domains. */
  readonly biologicalState: number | null;
  /** SC-003 — one decimal. */
  readonly opportunity: number | null;
  /** SC-005 — one decimal. */
  readonly recoveryPotential: number | null;
  /** SC-004's input count (0-5), stated directly by C-02. */
  readonly protectiveCount: number;
  /** SC-008 — integer. */
  readonly confidence: number;
  /**
   * Verbatim C-02 driver tokens, e.g. [], ["MR"], ["HS+SL co-primary", "BS"].
   * A comparator must render the engine's DriverOutputEntry[] into this same
   * token form (see formatDriverTokens in scoring-rules.ts) rather than
   * hand-building strings at each call site.
   */
  readonly drivers: readonly string[];
}

export interface GoldenTestCase {
  readonly testId: string;
  /** C-02 `purpose`, verbatim. */
  readonly description: string | null;
  readonly input: GoldenTestInput;
  readonly expected: GoldenTestExpectedOutput;
}

/** Canonical count is fixed at 30 by Blueprint §7 and by C-02's own QA sheet. */
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
  readonly input: GoldenTestInput;
  readonly expected: GoldenTestExpectedOutput;
  /** Null when the engine could not produce an output at all for that input. */
  readonly actual: GoldenTestExpectedOutput | null;
  readonly result: "PASS" | "FAIL";
  /** One entry per field that differs, in `field: expected vs actual` form. */
  readonly mismatches: readonly string[];
}
