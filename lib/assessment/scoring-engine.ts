/* ============================================================================
 * ROOTS-AI™ — Milestone 2 · deterministic C-02 scoring engine
 * ----------------------------------------------------------------------------
 * Pure calculation layer. Participant answers are translated through C-01/C-02
 * option data before scoring; C-02 Golden fixtures already contain normalized
 * burden points. No AI, I/O, clock, randomness, or persistence is used here.
 * ==========================================================================*/

import {
  DRIVER_TERMINOLOGY,
  DRIVER_TIE_BREAK_ORDER,
  SCORING_RULES_VERSION,
  QUESTIONNAIRE_VERSION,
} from "./canonical-constants";
import type { AnswerRecord } from "./answer-types";
import { optionById, questionById } from "./question-bank";
import { C02_SOURCE, GOLDEN_TEST_SUITE, SCORING_RULES, classifyScore, optionPointFor } from "./scoring-rules";
import type { CanonicalDomainCode } from "./canonical-constants";
import type {
  ClassificationBand,
  DriverDomains,
  DriverOutputEntry,
  GoldenTestCase,
  GoldenTestExpectedOutput,
  GoldenTestInput,
  GoldenTestMatrixRow,
  ProtectionFactorId,
  RecoveryPotentialLimitation,
  ScoringClassificationResult,
  ScoringInput,
  ScoringResult,
} from "./scoring-types";

const DOMAIN_CODES: readonly CanonicalDomainCode[] = DRIVER_TIE_BREAK_ORDER;
const PROTECTION_IDS: readonly ProtectionFactorId[] = ["P1", "P2", "P3", "P4", "P5"];

function evidenceWeightsFromC02(): Readonly<Record<string, number>> {
  const rule = SCORING_RULES.deterministicRules.find((candidate) => candidate.ruleId === "EVD-001");
  if (!rule) throw new Error("C-02 EVD-001 is missing");
  const weights: Record<string, number> = {};
  const expression = /(\d+(?:\.\d+)?)×(domain coverage|domain consistency|high-signal proportion)/g;
  let match: RegExpExecArray | null;
  while ((match = expression.exec(rule.deterministicRule)) !== null) weights[match[2]] = Number(match[1]);
  if (Object.keys(weights).length !== 3 || Math.abs(Object.values(weights).reduce((sum, weight) => sum + weight, 0) - 1) > 1e-9) {
    throw new Error("C-02 EVD-001 must state three weights summing to 1");
  }
  return weights;
}

const EVIDENCE_WEIGHTS = evidenceWeightsFromC02();

function classifyEvidence(score: number): string | null {
  const rule = SCORING_RULES.deterministicRules.find((candidate) => candidate.ruleId === "EVD-002");
  if (!rule) throw new Error("C-02 EVD-002 is missing");
  const bands = Array.from(rule.deterministicRule.matchAll(/(\d+)-(\d+)\s+([A-Za-z-]+)/g))
    .map((match) => ({ min: Number(match[1]), max: Number(match[2]), label: match[3] }));
  if (bands.length !== 4) throw new Error("C-02 EVD-002 must state four evidence labels");
  return bands.find((band) => score >= band.min && score <= band.max)?.label ?? null;
}

function formulaTerms(ruleId: string): Readonly<Record<string, number>> {
  const formula = SCORING_RULES.formulas.find((rule) => rule.ruleId === ruleId)?.normativeFormula;
  if (!formula) throw new Error(`C-02 ${ruleId} formula is missing`);
  const terms: Record<string, number> = {};
  const matcher = /(\d+(?:\.\d+)?)×(?:\(([^)]+)\)|([^+]+?))(?=\s*\+|$)/g;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(formula)) !== null) {
    const term = (match[2] ?? match[3]).trim();
    if (terms[term] !== undefined) throw new Error(`C-02 ${ruleId} repeats formula term "${term}"`);
    terms[term] = Number(match[1]);
  }
  if (Object.keys(terms).length === 0) throw new Error(`C-02 ${ruleId} weighted terms could not be read`);
  return terms;
}

function requiredTerm(terms: Readonly<Record<string, number>>, term: string): number {
  const value = terms[term];
  if (value === undefined || !Number.isFinite(value)) throw new Error(`C-02 formula does not define "${term}"`);
  return value;
}

function formulaMultiplier(ruleId: string, pattern: RegExp, description: string): number {
  const formula = SCORING_RULES.formulas.find((rule) => rule.ruleId === ruleId)?.normativeFormula ?? "";
  const match = pattern.exec(formula);
  if (!match) throw new Error(`C-02 ${ruleId} does not define ${description}`);
  return Number(match[1]);
}

const RECOVERY_WEIGHTS = formulaTerms("SC-005");
const CONFIDENCE_WEIGHTS = formulaTerms("SC-008");
const RECOVERY_WEIGHT_SUM = Object.values(RECOVERY_WEIGHTS).reduce((sum, value) => sum + value, 0);
const CONFIDENCE_WEIGHT_SUM = Object.values(CONFIDENCE_WEIGHTS).reduce((sum, value) => sum + value, 0);
if (Math.abs(RECOVERY_WEIGHT_SUM - 1) > 1e-9 || Math.abs(CONFIDENCE_WEIGHT_SUM - 1) > 1e-9) {
  throw new Error("C-02 SC-005 and SC-008 weights must each sum to 1");
}
const OPPORTUNITY_BIOSTATE_WEIGHT = formulaMultiplier("SC-003", /Biological State\s*[×x]\s*(\d+(?:\.\d+)?)/i, "the BIO_STATE multiplier");
const COVERAGE_PERCENT_MULTIPLIER = formulaMultiplier("SC-006", /eligible scored items\s*[×x]\s*(\d+)/i, "the percentage multiplier");
const CONSISTENCY_SD_DIVISOR = formulaMultiplier("SC-007", /populationSD\(points\)\/(\d+(?:\.\d+)?)/i, "the population SD divisor");
const DOMAIN_SCORE_MAX = Math.max(...(SCORING_RULES.classifications.find((set) => set.scaleCode === "DOMAIN")?.bands.map((band) => band.max) ?? []));
const DOMAIN_SCORE_MULTIPLIER = formulaMultiplier("SC-001", /^(\d+)\s*[×x]/i, "the domain-score multiplier");
const DOMAIN_RAW_MAX_MATCH = /Σ\(\s*(\d+(?:\.\d+)?)\s*[×x]\s*weight\s*\)/i.exec(
  SCORING_RULES.formulas.find((rule) => rule.ruleId === "SC-001")?.normativeFormula ?? "",
);
if (!DOMAIN_RAW_MAX_MATCH || Number(DOMAIN_RAW_MAX_MATCH[1]) !== SCORING_RULES.rawBurdenScale.max) {
  throw new Error("C-02 SC-001 denominator does not match the raw burden scale");
}
const DOMAIN_RAW_MAX = Number(DOMAIN_RAW_MAX_MATCH[1]);
const PROTECTIVE_POINTS = Number(SCORING_RULES.protectiveFactors.find((factor) => factor.factorId === "P1")?.outputValue);
if (!Number.isFinite(DOMAIN_SCORE_MAX) || !Number.isFinite(PROTECTIVE_POINTS)) throw new Error("C-02 score scale or protective points are missing");
if (PROTECTION_IDS.some((id) => SCORING_RULES.protectiveFactors.find((factor) => factor.factorId === id)?.outputValue !== String(PROTECTIVE_POINTS))) {
  throw new Error("C-02 P1-P5 protective factor points must agree");
}

function decimalsForFormula(ruleId: string): number {
  const formula = SCORING_RULES.formulas.find((rule) => rule.ruleId === ruleId);
  if (!formula) throw new Error(`C-02 ${ruleId} formula is missing`);
  if (formula.rounding.toLowerCase().includes("one decimal")) return ruleId === "SC-003"
    ? SCORING_RULES.rounding.opportunityDecimals
    : SCORING_RULES.rounding.recoveryDecimals;
  if (formula.rounding.toLowerCase().includes("half away from zero")) return 0;
  throw new Error(`C-02 ${ruleId} rounding rule is not implemented: ${formula.rounding}`);
}

function roundHalfAwayFromZero(value: number, decimals = 0): number {
  if (!Number.isFinite(value)) throw new Error(`Cannot round a non-finite value: ${value}`);
  const scale = 10 ** decimals;
  const scaled = Math.abs(value) * scale;
  const rounded = Math.floor(scaled + 0.5 + Number.EPSILON * Math.max(1, scaled));
  return Math.sign(value) * rounded / scale;
}

function clampScore(value: number): number {
  return Math.min(DOMAIN_SCORE_MAX, Math.max(0, value));
}

function validateScoringInput(input: ScoringInput): void {
  if (input.questionnaireVersion !== QUESTIONNAIRE_VERSION) {
    throw new Error(`Unsupported questionnaire version ${input.questionnaireVersion}; expected ${QUESTIONNAIRE_VERSION}`);
  }
  if (input.scoringRulesVersion !== SCORING_RULES_VERSION) {
    throw new Error(`Unsupported scoring rules version ${input.scoringRulesVersion}; expected ${SCORING_RULES_VERSION}`);
  }
  if (!Number.isInteger(input.age) || input.age < 16 || input.age > 110) throw new Error("Age factor must be an integer from 16 through 110");
  if (!Number.isInteger(input.diseaseCount) || input.diseaseCount < 0) throw new Error("Disease count must be a non-negative integer");
  if (!Number.isInteger(input.medicationCount) || input.medicationCount < 0) throw new Error("Medication count must be a non-negative integer");
  if (!Number.isInteger(input.answerConfidence) || input.answerConfidence < 0 || input.answerConfidence > 100) throw new Error("Q72 answer confidence must be an integer from 0 through 100");
  for (const id of PROTECTION_IDS) {
    if (typeof input.protectiveFactors[id] !== "boolean") throw new Error(`${id} protective factor must be boolean`);
  }
  const scoredQuestionIds = new Set(SCORING_RULES.domainQuestionMap.map((mapping) => mapping.questionId));
  for (const questionId of Object.keys(input.answers)) {
    if (!questionById.has(questionId)) throw new Error(`Unknown answer question ${questionId}`);
    // Contextual answers are intentionally ignored by every scoring equation.
    if (questionById.get(questionId)?.eligibility === "contextual") continue;
    if (!scoredQuestionIds.has(questionId)) throw new Error(`${questionId} is not in the C-02 scoring map`);
  }
  for (const mapping of SCORING_RULES.domainQuestionMap) {
    const answer = input.answers[mapping.questionId];
    if (!answer) continue;
    if (answer.rawValue === null) {
      if (answer.isNa !== true && answer.isNa !== false) throw new Error(`${mapping.questionId} answer state is invalid`);
      continue;
    }
    if (!Number.isInteger(answer.rawValue) || answer.rawValue < SCORING_RULES.rawBurdenScale.min || answer.rawValue > SCORING_RULES.rawBurdenScale.max) {
      throw new Error(`${mapping.questionId} normalized burden value must be a whole number from ${SCORING_RULES.rawBurdenScale.min} through ${SCORING_RULES.rawBurdenScale.max}`);
    }
    if (answer.isNa) throw new Error(`${mapping.questionId} cannot be both N/A and carry a burden value`);
  }
}

function isCounted(answer: ScoringInput["answers"][string] | undefined): answer is { readonly rawValue: number; readonly isNa: false } {
  return answer !== undefined && answer.rawValue !== null && !answer.isNa;
}

function scoreDomains(input: ScoringInput) {
  const results = {} as Record<CanonicalDomainCode, ScoringResult["domains"][CanonicalDomainCode]>;
  const traces: Record<string, unknown> = {};
  for (const code of DOMAIN_CODES) {
    const mappings = SCORING_RULES.domainQuestionMap.filter((mapping) => mapping.domainCode === code);
    const values: number[] = [];
    let numerator = 0;
    let denominator = 0;
    let answeredCount = 0;
    for (const mapping of mappings) {
      const answer = input.answers[mapping.questionId];
      if (!isCounted(answer)) continue;
      values.push(answer.rawValue);
      numerator += answer.rawValue * mapping.weight;
      denominator += DOMAIN_RAW_MAX * mapping.weight;
      answeredCount += 1;
    }
    const coverageRatio = mappings.length === 0 ? 0 : answeredCount / mappings.length;
    const belowCoverageThreshold = coverageRatio < SCORING_RULES.domainCoverageMinRatio;
    const score = belowCoverageThreshold || denominator === 0
      ? null
      : roundHalfAwayFromZero(DOMAIN_SCORE_MULTIPLIER * numerator / denominator, decimalsForFormula("SC-001"));
    results[code] = {
      code,
      score,
      eligibleQuestionCount: mappings.length,
      answeredQuestionCount: answeredCount,
      coverageRatio,
      belowCoverageThreshold,
    };
    traces[code] = {
      questionIds: mappings.map((mapping) => mapping.questionId),
      rawOptionIds: mappings.map((mapping) => input.answers[mapping.questionId]?.rawOptionId ?? null),
      burdenValues: mappings.map((mapping) => input.answers[mapping.questionId]?.rawValue ?? null),
      weights: mappings.map((mapping) => mapping.weight),
      numerator,
      denominator,
      coverageRatio,
      score,
    };
    // SC-007 consistency uses the same answered, non-N/A point set as SC-001.
    const mean = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    const populationVariance = mean === null ? null : values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
    const populationSd = populationVariance === null ? null : Math.sqrt(populationVariance);
    const consistencyScore = score === null || populationSd === null
      ? null
      : roundHalfAwayFromZero(Math.max(0, 1 - populationSd / CONSISTENCY_SD_DIVISOR) * 100, decimalsForFormula("SC-007"));
    const highSignalProportion = values.length ? values.filter((value) => value >= 3).length / values.length : null;
    const evidenceScore = score === null || consistencyScore === null || highSignalProportion === null
      ? null
      : EVIDENCE_WEIGHTS["domain coverage"] * coverageRatio * 100 +
        EVIDENCE_WEIGHTS["domain consistency"] * consistencyScore +
        EVIDENCE_WEIGHTS["high-signal proportion"] * highSignalProportion * 100;
    traces[code] = {
      ...(traces[code] as Record<string, unknown>),
      answerStates: mappings.map((mapping) => ({
        questionId: mapping.questionId,
        rawValue: input.answers[mapping.questionId]?.rawValue ?? null,
        isNa: input.answers[mapping.questionId]?.isNa ?? false,
      })),
      consistencyMean: mean,
      consistencyPopulationSd: populationSd,
      consistencyScore,
      highSignalProportion,
      evidenceScore,
      evidenceLabel: evidenceScore === null ? null : classifyEvidence(evidenceScore),
    };
  }
  return { results, traces };
}

function computeBiologicalState(domains: ScoringResult["domains"]): ScoringResult["biologicalState"] {
  const availableDomains = DOMAIN_CODES.filter((code) => domains[code].score !== null);
  const scores = availableDomains.map((code) => domains[code].score as number);
  const value = availableDomains.length < SCORING_RULES.bioStateMinValidDomains
    ? null
    : roundHalfAwayFromZero(scores.reduce((sum, score) => sum + score, 0) / scores.length, decimalsForFormula("SC-002"));
  return {
    value,
    validDomainCount: availableDomains.length,
    requiredDomainCount: SCORING_RULES.bioStateMinValidDomains,
    availableDomains,
  };
}

function rankDrivers(domains: ScoringResult["domains"]): readonly DriverOutputEntry[] {
  const tieRank = new Map(DRIVER_TIE_BREAK_ORDER.map((code, index) => [code, index]));
  const eligible = DOMAIN_CODES
    .map((code) => ({ code, score: domains[code].score }))
    .filter((entry): entry is { code: CanonicalDomainCode; score: number } =>
      entry.score !== null && entry.score >= (SCORING_RULES.driverEligibility.minimumDomainScore ?? Infinity),
    )
    .sort((a, b) => b.score - a.score || (tieRank.get(a.code) ?? Infinity) - (tieRank.get(b.code) ?? Infinity));

  const groups: { domains: DriverDomains; score: number; tieBrokenByFixedOrder: boolean }[] = [];
  let cursor = 0;
  const coPrimary = eligible.length >= 2 &&
    eligible[0].score - eligible[1].score <= SCORING_RULES.driverEligibility.coPrimaryMaxGap;
  if (coPrimary) {
    const first = eligible[0];
    const second = eligible[1];
    groups.push({
      domains: [first.code, second.code],
      score: first.score,
      tieBrokenByFixedOrder: first.score === second.score,
    });
    cursor = 2;
    // DRV-003 specifies the co-primary pair and the next distinct domain, if
    // present. It does not fill a tertiary slot after a co-primary pair.
    if (eligible[cursor]) {
      groups.push({
        domains: [eligible[cursor].code],
        score: eligible[cursor].score,
        tieBrokenByFixedOrder: eligible[cursor].score === second.score,
      });
    }
  }
  for (; !coPrimary && cursor < eligible.length && groups.length < SCORING_RULES.driverEligibility.maxOutputEntries; cursor += 1) {
    const current = eligible[cursor];
    groups.push({
      domains: [current.code],
      score: current.score,
      tieBrokenByFixedOrder: cursor > 0 && eligible[cursor - 1].score === current.score,
    });
  }
  return groups.map((group, index) => ({
    kind: group.domains.length === 2 ? "co_primary" : "single",
    domains: group.domains,
    score: group.score,
    tieBrokenByFixedOrder: group.tieBrokenByFixedOrder,
    gapToNext: groups[index + 1] ? group.score - groups[index + 1].score : null,
  }));
}

function bandValue(factorId: "AGE" | "CONDITION" | "MEDICATION", inputValue: number): number {
  const rule = SCORING_RULES.protectiveFactors.find((factor) => factor.factorId === factorId);
  if (!rule) throw new Error(`C-02 does not define ${factorId}`);
  const expression = rule.activationRule;
  if (factorId === "AGE") {
    const ranges = expression.split(";").map((part) => {
      const match = /^(\d+)-(\d+)\s*=\s*(\d+(?:\.\d+)?)$/.exec(part.trim());
      if (!match) throw new Error(`Unsupported C-02 AGE band "${part}"`);
      return { min: Number(match[1]), max: Number(match[2]), value: Number(match[3]) };
    });
    const found = ranges.find((range) => inputValue >= range.min && inputValue <= range.max);
    if (!found) throw new Error(`Age ${inputValue} is not covered by C-02 AGE bands`);
    return found.value;
  }
  const labels: Readonly<Record<string, { min: number; max: number }>> = factorId === "CONDITION"
    ? { "None": { min: 0, max: 0 }, "one category": { min: 1, max: 1 }, "two": { min: 2, max: 2 }, "three or more": { min: 3, max: Infinity } }
    : { "None": { min: 0, max: 0 }, "one category": { min: 1, max: 1 }, "two or more": { min: 2, max: Infinity } };
  const bands = expression.split(";").map((part) => {
    const match = /^(.+?)\s*=\s*(\d+(?:\.\d+)?)$/.exec(part.trim());
    if (!match || !labels[match[1]]) throw new Error(`Unsupported C-02 ${factorId} band "${part}"`);
    return { ...labels[match[1]], value: Number(match[2]) };
  });
  const found = bands.find((band) => inputValue >= band.min && inputValue <= band.max);
  if (!found) throw new Error(`${factorId} count ${inputValue} is not covered by C-02`);
  return found.value;
}

function buildClassifications(
  domains: ScoringResult["domains"],
  confidence: number,
  recoveryPotential: number | null,
): ScoringClassificationResult {
  const domainBands = {} as Record<CanonicalDomainCode, ClassificationBand | null>;
  for (const code of DOMAIN_CODES) domainBands[code] = classifyScore("DOMAIN", domains[code].score);
  return {
    domains: domainBands,
    confidence: classifyScore("CONFIDENCE", confidence),
    recoveryPotential: classifyScore("RECOVERY", recoveryPotential),
  };
}

/** Calculate SC-001..SC-008 and DRV-001..004 from normalized burden points. */
export function scoreAssessment(input: ScoringInput): ScoringResult {
  validateScoringInput(input);
  const { results: domains, traces: domainTrace } = scoreDomains(input);
  const biologicalState = computeBiologicalState(domains);
  const opportunity = biologicalState.value === null
    ? null
    : roundHalfAwayFromZero(clampScore(100 - biologicalState.value * OPPORTUNITY_BIOSTATE_WEIGHT), decimalsForFormula("SC-003"));
  const protectiveCount = PROTECTION_IDS.filter((id) => input.protectiveFactors[id]).length;
  const protectivePointsText = SCORING_RULES.protectiveFactors.find((factor) => factor.factorId === "P1")?.outputValue;
  const protectivePoints = protectivePointsText ? Number(protectivePointsText) : NaN;
  if (!Number.isFinite(protectivePoints) || PROTECTION_IDS.some((id) => SCORING_RULES.protectiveFactors.find((factor) => factor.factorId === id)?.outputValue !== protectivePointsText)) {
    throw new Error("C-02 protective factor points are missing or inconsistent");
  }
  const protectiveScore = protectivePoints * protectiveCount;
  const ageValue = bandValue("AGE", input.age);
  const conditionValue = bandValue("CONDITION", input.diseaseCount);
  const medicationValue = bandValue("MEDICATION", input.medicationCount);
  const recoveryPotential = biologicalState.value === null || (input.recoveryPotentialLimitations?.length ?? 0) > 0
    ? null
    : roundHalfAwayFromZero(clampScore(
      requiredTerm(RECOVERY_WEIGHTS, "100-BIO_STATE") * (100 - biologicalState.value) +
      requiredTerm(RECOVERY_WEIGHTS, "Protective") * protectiveScore +
      requiredTerm(RECOVERY_WEIGHTS, "Age") * ageValue +
      requiredTerm(RECOVERY_WEIGHTS, "Condition") * conditionValue +
      requiredTerm(RECOVERY_WEIGHTS, "Medication") * medicationValue,
    ), decimalsForFormula("SC-005"));

  const totalScored = SCORING_RULES.domainQuestionMap.length;
  const answeredScored = SCORING_RULES.domainQuestionMap.reduce((count, mapping) =>
    count + (isCounted(input.answers[mapping.questionId]) ? 1 : 0), 0);
  const overallCoverage = totalScored === 0 ? 0 : answeredScored / totalScored;
  const availableConsistency = DOMAIN_CODES
    .map((code) => (domainTrace[code] as { consistencyScore: number | null }).consistencyScore)
    .filter((value): value is number => value !== null);
  const meanConsistency = availableConsistency.length
    ? availableConsistency.reduce((sum, value) => sum + value, 0) / availableConsistency.length
    : null;
  const confidence = roundHalfAwayFromZero(
    requiredTerm(CONFIDENCE_WEIGHTS, "overall coverage") * overallCoverage * COVERAGE_PERCENT_MULTIPLIER +
    requiredTerm(CONFIDENCE_WEIGHTS, "Q72 value") * input.answerConfidence +
    requiredTerm(CONFIDENCE_WEIGHTS, "mean available-domain consistency") * (meanConsistency ?? 0),
    decimalsForFormula("SC-008"),
  );
  const drivers = rankDrivers(domains);
  const classifications = buildClassifications(domains, confidence, recoveryPotential);
  const trace = {
    source: C02_SOURCE,
    rules: { domainCoverageMinRatio: SCORING_RULES.domainCoverageMinRatio, integerRounding: SCORING_RULES.rounding.integerMode },
    domains: domainTrace,
    biologicalState: { availableDomains: biologicalState.availableDomains, value: biologicalState.value },
    opportunity,
    recoveryPotential: {
      ageValue,
      ageContribution: requiredTerm(RECOVERY_WEIGHTS, "Age") * ageValue,
      protectiveScore,
      protectiveContribution: requiredTerm(RECOVERY_WEIGHTS, "Protective") * protectiveScore,
      conditionValue,
      conditionContribution: requiredTerm(RECOVERY_WEIGHTS, "Condition") * conditionValue,
      medicationValue,
      medicationContribution: requiredTerm(RECOVERY_WEIGHTS, "Medication") * medicationValue,
      biologicalStateContribution: biologicalState.value === null ? null : requiredTerm(RECOVERY_WEIGHTS, "100-BIO_STATE") * (100 - biologicalState.value),
      limitations: input.recoveryPotentialLimitations ?? [],
      value: recoveryPotential,
    },
    protectiveFactors: { ...input.protectiveFactors, count: protectiveCount, score: protectiveScore },
    confidence: {
      answeredScored,
      totalScored,
      overallCoverage,
      coverageContribution: requiredTerm(CONFIDENCE_WEIGHTS, "overall coverage") * overallCoverage * COVERAGE_PERCENT_MULTIPLIER,
      q72: input.answerConfidence,
      q72Contribution: requiredTerm(CONFIDENCE_WEIGHTS, "Q72 value") * input.answerConfidence,
      meanConsistency,
      consistencyContribution: requiredTerm(CONFIDENCE_WEIGHTS, "mean available-domain consistency") * (meanConsistency ?? 0),
      value: confidence,
    },
    driverRanking: drivers,
  } satisfies Readonly<Record<string, unknown>>;

  return {
    domains,
    biologicalState,
    opportunity,
    recoveryPotential,
    protectiveCount,
    confidence,
    drivers,
    driverTerminology: DRIVER_TERMINOLOGY,
    classifications,
    recoveryPotentialLimitations: input.recoveryPotentialLimitations ?? [],
    trace,
    questionnaireVersion: input.questionnaireVersion,
    scoringRulesVersion: input.scoringRulesVersion,
  };
}

export function scoringInputFromGolden(input: GoldenTestInput): ScoringInput {
  const answers: Record<string, { rawValue: number | null; isNa: boolean }> = {};
  for (const [questionId, rawValue] of Object.entries(input.answers)) {
    answers[questionId] = { rawValue, isNa: rawValue === null };
  }
  return {
    answers,
    age: input.age,
    diseaseCount: input.diseaseCount,
    medicationCount: input.medicationCount,
    answerConfidence: input.answerConfidence,
    protectiveFactors: input.protectiveFactors,
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    scoringRulesVersion: SCORING_RULES_VERSION,
  };
}

function optionIdOf(record: AnswerRecord | undefined, questionId: string): string | null {
  if (!record || record.status !== "answered" || !record.value) return null;
  if (record.value.kind !== "option") throw new Error(`${questionId} must be a single option answer for this factor`);
  return record.value.optionId;
}

function numericValueOf(record: AnswerRecord | undefined, questionId: string): number | null {
  if (!record || record.status !== "answered" || !record.value) return null;
  if (record.value.kind !== "number") throw new Error(`${questionId} must be a numeric answer for this factor`);
  return record.value.value;
}

function selectedOptionIds(record: AnswerRecord | undefined, questionId: string): readonly string[] | null {
  if (!record || record.status !== "answered" || !record.value) return null;
  if (record.value.kind !== "option_set") throw new Error(`${questionId} must be a multi-select answer for this factor`);
  return record.value.optionIds;
}

function storedOptionValue(questionId: string, optionId: string | null): number | null {
  if (optionId === null) return null;
  const option = optionById(questionId, optionId);
  if (!option || option.storedValue === null) throw new Error(`${questionId}/${optionId} has no C-01 stored value`);
  const value = Number(option.storedValue);
  if (!Number.isFinite(value)) throw new Error(`${questionId}/${optionId} stored value is not numeric`);
  return value;
}

/** Translate validated C-01 AnswerRecords to the engine's C-02 normalized input. */
export function scoringInputFromAnswers(
  records: readonly AnswerRecord[],
  versions: { readonly questionnaireVersion: string; readonly scoringRulesVersion: string },
): ScoringInput {
  const byId = new Map<string, AnswerRecord>();
  for (const record of records) {
    if (byId.has(record.questionId)) throw new Error(`Duplicate answer record for ${record.questionId}`);
    byId.set(record.questionId, record);
  }
  const answers: Record<string, { rawValue: number | null; isNa: boolean }> = {};
  for (const mapping of SCORING_RULES.domainQuestionMap) {
    const record = byId.get(mapping.questionId);
    if (!record || record.status === "unanswered") {
      answers[mapping.questionId] = { rawValue: null, isNa: false };
      continue;
    }
    if (record.status === "explicit_na") {
      answers[mapping.questionId] = { rawValue: null, isNa: true };
      continue;
    }
    const optionId = optionIdOf(record, mapping.questionId);
    if (optionId === null) throw new Error(`${mapping.questionId} is answered without a value`);
    const point = optionPointFor(mapping.questionId, optionId);
    if (!point) throw new Error(`${mapping.questionId}/${optionId} is not in C-02 Option_Points`);
    if (point.excludedAsNa) {
      answers[mapping.questionId] = { rawValue: null, isNa: true };
    } else if (point.burdenPoints === null) {
      throw new Error(`${mapping.questionId}/${optionId} has no burden points and is not marked N/A`);
    } else {
      answers[mapping.questionId] = { rawValue: point.burdenPoints, isNa: false };
    }
  }

  const age = numericValueOf(byId.get("Q1"), "Q1");
  if (age === null) throw new Error("Q1 age is required to calculate Recovery Potential");
  const conditionIds = selectedOptionIds(byId.get("Q13"), "Q13");
  const medicationIds = selectedOptionIds(byId.get("Q14"), "Q14");
  if (conditionIds === null || medicationIds === null) throw new Error("Q13 and Q14 are required to calculate Recovery Potential");
  for (const [questionId, ids] of [["Q13", conditionIds], ["Q14", medicationIds]] as const) {
    const question = questionById.get(questionId);
    if (!question || ids.length === 0 || ids.some((id) => !optionById(questionId, id))) {
      throw new Error(`${questionId} must contain one or more approved C-01 option IDs`);
    }
    const exclusiveIds = new Set([question.multiSelectRule?.exclusiveNoneOptionId, "NONE"].filter((id): id is string => Boolean(id)));
    if (ids.some((id) => exclusiveIds.has(id)) && ids.length !== 1) {
      throw new Error(`${questionId} exclusive None/N/A option cannot be combined with other selections`);
    }
  }
  const conditionUnavailable = conditionIds.some((id) => id === "PREFER_NOT" || id === "NA");
  const medicationUnavailable = medicationIds.some((id) => id === "UNSURE" || id === "PREFER_NOT" || id === "NA");
  const diseaseCount = conditionIds.filter((id) => id !== "NONE" && id !== "PREFER_NOT" && id !== "NA").length;
  const medicationCount = medicationIds.filter((id) => id !== "NONE" && id !== "UNSURE" && id !== "PREFER_NOT" && id !== "NA").length;
  const activityDaysId = optionIdOf(byId.get("Q46"), "Q46");
  const activityDurationId = optionIdOf(byId.get("Q47"), "Q47");
  const mealTimingId = optionIdOf(byId.get("Q64"), "Q64");
  const supportId = optionIdOf(byId.get("Q65"), "Q65");
  const tobaccoId = optionIdOf(byId.get("Q61"), "Q61");
  const readiness = numericValueOf(byId.get("Q69"), "Q69");
  const confidenceId = optionIdOf(byId.get("Q72"), "Q72");
  const answerConfidence = storedOptionValue("Q72", confidenceId);
  if (answerConfidence === null) throw new Error("Q72 answer confidence is required");
  const protectiveFactors: Record<ProtectionFactorId, boolean> = {
    P1: ["D3_4", "D5_7"].includes(activityDaysId ?? "") && ["M30_59", "M60_PLUS"].includes(activityDurationId ?? ""),
    P2: ["OFT", "ALW"].includes(mealTimingId ?? ""),
    P3: ["GOOD", "STRONG"].includes(supportId ?? ""),
    P4: ["NEVER", "FORMER"].includes(tobaccoId ?? ""),
    P5: readiness !== null && readiness >= 7 && readiness <= 10,
  };
  const recoveryPotentialLimitations: RecoveryPotentialLimitation[] = [];
  if (conditionUnavailable) recoveryPotentialLimitations.push("CONDITION_UNAVAILABLE");
  if (medicationUnavailable) recoveryPotentialLimitations.push("MEDICATION_UNAVAILABLE");
  return {
    answers,
    age,
    diseaseCount,
    medicationCount,
    answerConfidence,
    protectiveFactors,
    recoveryPotentialLimitations,
    questionnaireVersion: versions.questionnaireVersion,
    scoringRulesVersion: versions.scoringRulesVersion,
  };
}

export function scoreAnswerRecords(
  records: readonly AnswerRecord[],
  versions: { readonly questionnaireVersion: string; readonly scoringRulesVersion: string },
): ScoringResult {
  return scoreAssessment(scoringInputFromAnswers(records, versions));
}

export function formatDriverTokens(drivers: readonly DriverOutputEntry[]): readonly string[] {
  return drivers.map((driver) => driver.kind === "co_primary"
    ? `${driver.domains[0]}+${driver.domains[1]} co-primary`
    : driver.domains[0]);
}

export function goldenOutputFromResult(result: ScoringResult): GoldenTestExpectedOutput {
  const domainScores: Record<string, number | null> = {};
  const coverage: Record<string, number> = {};
  for (const code of DOMAIN_CODES) {
    domainScores[code] = result.domains[code].score;
    coverage[code] = result.domains[code].coverageRatio;
  }
  return {
    domainScores,
    coverage,
    biologicalState: result.biologicalState.value,
    opportunity: result.opportunity,
    recoveryPotential: result.recoveryPotential,
    protectiveCount: result.protectiveCount,
    confidence: result.confidence,
    drivers: formatDriverTokens(result.drivers),
  };
}

function firstDifference(expected: unknown, actual: unknown, path: string): string[] {
  if (expected === actual) return [];
  if (expected === null || actual === null || typeof expected !== "object" || typeof actual !== "object") {
    return [`${path}: expected ${JSON.stringify(expected)}, actual ${JSON.stringify(actual)}`];
  }
  const expectedObject = expected as Record<string, unknown>;
  const actualObject = actual as Record<string, unknown>;
  const keys = Array.from(new Set([...Object.keys(expectedObject), ...Object.keys(actualObject)])).sort();
  return keys.flatMap((key) => firstDifference(expectedObject[key], actualObject[key], `${path}.${key}`));
}

export function runGoldenTestMatrix(): readonly GoldenTestMatrixRow[] {
  return GOLDEN_TEST_SUITE.cases.map((testCase: GoldenTestCase) => {
    try {
      const actual = goldenOutputFromResult(scoreAssessment(scoringInputFromGolden(testCase.input)));
      const mismatches = firstDifference(testCase.expected, actual, "output");
      return { testId: testCase.testId, input: testCase.input, expected: testCase.expected, actual, result: mismatches.length ? "FAIL" : "PASS", mismatches };
    } catch (error) {
      return {
        testId: testCase.testId,
        input: testCase.input,
        expected: testCase.expected,
        actual: null,
        result: "FAIL",
        mismatches: [`engine threw: ${error instanceof Error ? error.message : String(error)}`],
      };
    }
  });
}

export function formatGoldenTestMatrix(rows: readonly GoldenTestMatrixRow[] = runGoldenTestMatrix()): string {
  const lines = rows.map((row) => `${row.testId} → Input ${JSON.stringify(row.input)} → Expected ${JSON.stringify(row.expected)} → Actual ${JSON.stringify(row.actual)} → ${row.result}${row.mismatches.length ? ` (${row.mismatches.join("; ")})` : ""}`);
  const passed = rows.filter((row) => row.result === "PASS").length;
  return [`Golden Tests: ${passed}/${rows.length} PASS`, ...lines].join("\n");
}
