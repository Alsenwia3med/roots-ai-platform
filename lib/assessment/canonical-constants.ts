/* ============================================================================
 * ROOTS-AI™ — Milestone 2 · Canonical structural constants
 * ----------------------------------------------------------------------------
 * Every value in this file is QUOTED, not derived. Provenance of each constant
 * is the M2 Strict Implementation Blueprint (§1–§5), which itself mirrors the
 * controlled sources C-01 v1.0.1 CORRECTED and C-02 v1.0.1 CORRECTED.
 *
 * HARD RULE: this file holds STRUCTURAL invariants only (counts, versions,
 * thresholds, terminology). It contains NO question text, NO option labels and
 * NO scoring formula — those live only in the controlled C-01 / C-02 sources.
 * Do not add content here; populate the templates in question-bank.ts and
 * scoring-rules.ts from the controlled sources instead.
 * ==========================================================================*/

/* ---------------------------------------------------------------------------
 * 1. Version pins — Blueprint §5. Both strings are persisted verbatim with
 *    every assessment and score record, side by side, never conflated.
 * -------------------------------------------------------------------------*/
export const QUESTIONNAIRE_VERSION = "C-01 v1.0.1 CORRECTED";
export const SCORING_RULES_VERSION = "C-02 v1.0.1 CORRECTED";

/* ---------------------------------------------------------------------------
 * 2. Canonical counts — Blueprint §1.
 *    The two pairs below are exhaustive partitions and must stay consistent:
 *      71 required + 2 optional            = 73 questions
 *      40 scoring-eligible + 33 contextual = 73 questions
 * -------------------------------------------------------------------------*/
export const CANONICAL_QUESTION_COUNT = 73;
export const CANONICAL_MODULE_COUNT = 13;
export const CANONICAL_REQUIRED_COUNT = 71;
export const CANONICAL_OPTIONAL_COUNT = 2;
export const CANONICAL_SCORED_COUNT = 40;
export const CANONICAL_CONTEXTUAL_COUNT = 33;

/** Inclusive bounds of the canonical question numbering (1 … 73). */
export const CANONICAL_FIRST_QUESTION_NUMBER = 1;
export const CANONICAL_LAST_QUESTION_NUMBER = CANONICAL_QUESTION_COUNT;

/**
 * Q13, Q14, Q52, Q53, Q54 — the multi-select questions named in Blueprint §2.
 * C-01 v1.0.1 uses these same canonical `question_id` values; C-01/C-02
 * transcription and invariant checks confirm the IDs and their eligibility.
 */
export const MULTIPLE_SELECT_QUESTION_IDS = ["Q13", "Q14", "Q52", "Q53", "Q54"] as const;
export type MultipleSelectQuestionId = (typeof MULTIPLE_SELECT_QUESTION_IDS)[number];

/** Q73 — free text, OPTIONAL. Blueprint §2: never force an N/A onto it. */
export const OPTIONAL_FREE_TEXT_QUESTION_ID = "Q73";

/* ---------------------------------------------------------------------------
 * 3. Canonical domain codes — Blueprint §3 ("5 out of 7 domains") and §4
 *    (the fixed tie order). The tie order is the authoritative enumeration of
 *    the seven domains, so the domain union is derived from it rather than
 *    restated, and the two can never drift apart.
 *
 *  ⚠ PERSISTENCE CONFLICT — see M2_OPEN_ITEMS. M1 migration 0001 constrains
 *    `responses.domain_code` to ('HU','SL','ME','CI','SA','ST','IN') and gives
 *    `scores` the columns hu/sl/me/ci/sa/st/ins. That is a different code set
 *    from the one C-02/Blueprint driver logic uses. Only "SL" appears in both.
 *    The in-memory scorer uses the C-02 codes; no DB mapping is invented.
 * -------------------------------------------------------------------------*/
export const DRIVER_TIE_BREAK_ORDER = ["MR", "HS", "SR", "CH", "SL", "IB", "BS"] as const;
export type CanonicalDomainCode = (typeof DRIVER_TIE_BREAK_ORDER)[number];

/** BS is explicitly annotated in Blueprint §4 as Biological Safety Signals™. */
export const BIOLOGICAL_SAFETY_SIGNALS_DOMAIN: CanonicalDomainCode = "BS";

export const DOMAIN_COUNT = DRIVER_TIE_BREAK_ORDER.length; // 7 — asserted in invariants.ts

/* ---------------------------------------------------------------------------
 * 4. Scoring parameters — Blueprint §3 and §4.
 * -------------------------------------------------------------------------*/

/** Canonical raw burden scale, inclusive: 0.0 … 4.0 (Blueprint §3). */
export const RAW_BURDEN_SCALE = { min: 0.0, max: 4.0 } as const;

/** A domain scores only at >= 50% coverage of its scoring-eligible questions. */
export const DOMAIN_COVERAGE_MIN_RATIO = 0.5;

/** BIO_STATE needs >= 5 valid domain scores out of 7, otherwise null. */
export const BIO_STATE_MIN_VALID_DOMAINS = 5;
export const BIO_STATE_DOMAIN_TOTAL = DOMAIN_COUNT;

/** Co-primary applies only when the top two eligible scores differ by <= 3. */
export const CO_PRIMARY_MAX_POINT_GAP = 3;

/** Rounding — Blueprint §3. */
export type RoundingMode = "half_away_from_zero";
export const ROUNDING_MODE: RoundingMode = "half_away_from_zero";
export const OPPORTUNITY_DECIMALS = 1;
export const RECOVERY_DECIMALS = 1;

/* ---------------------------------------------------------------------------
 * 5. Terminology — Blueprint §4. The exact string, replacing the legacy
 *    "strongest area(s)". Rendering must not paraphrase it.
 * -------------------------------------------------------------------------*/
export const DRIVER_TERMINOLOGY = "highest-ranked driver(s) in this assessment";

/** Blueprint §2: an empty multi-select array is always invalid. */
export const MULTI_SELECT_MIN_SELECTIONS = 1 as const;
