/* ============================================================================
 * ROOTS-AI™ — Milestone 2 · C-02 canonical scoring rules — DERIVED, NOT TYPED
 * ----------------------------------------------------------------------------
 * This module turns the controlled C-02 rows into typed rule data. It performs
 * no scoring arithmetic; scoring lives in scoring-engine.ts. Every numeric rule,
 * driver threshold, band, and Golden Test below is read from C-02 v1.0.1.
 * ==========================================================================*/

import {
  BIO_STATE_DOMAIN_TOTAL,
  BIO_STATE_MIN_VALID_DOMAINS,
  CANONICAL_SCORED_COUNT,
  CO_PRIMARY_MAX_POINT_GAP,
  DOMAIN_COVERAGE_MIN_RATIO,
  DRIVER_TIE_BREAK_ORDER,
  OPPORTUNITY_DECIMALS,
  RAW_BURDEN_SCALE,
  RECOVERY_DECIMALS,
  SCORING_RULES_VERSION,
} from "./canonical-constants";
import {
  C02_CLASSIFICATION_ROWS,
  C02_DRIVER_RULE_ROWS,
  C02_DOMAIN_ROWS,
  C02_FORMULA_ROWS,
  C02_GOLDEN_TEST_ROWS,
  C02_OPTION_POINT_ROWS,
  C02_PROTECTIVE_ROWS,
  C02_QUESTION_MAP_ROWS,
  CONTROLLED_C02,
  CONTROLLED_ROW_COUNTS,
} from "./controlled";
import { questionById } from "./question-bank";
import type {
  C02ClassificationRow,
  C02DriverRuleRow,
  C02FormulaRow,
  C02GoldenTestRow,
  C02OptionPointRow,
  C02ProtectiveRow,
  C02QuestionMapRow,
} from "./controlled";
import type { CanonicalDomainCode } from "./canonical-constants";
import type { StructureViolation, StructureViolationCode } from "./invariants";
import type { ControlledSourceProvenance } from "./types";
import type {
  CanonicalDeterministicRule,
  CanonicalDomainDefinition,
  CanonicalFormulaRule,
  CanonicalOptionPoint,
  CanonicalProtectiveFactor,
  CanonicalScoringRules,
  ClassificationBand,
  ClassificationSet,
  DriverEligibilityThresholds,
  DomainQuestionMapping,
  GoldenTestCase,
  GoldenTestExpectedOutput,
  GoldenTestInput,
  GoldenTestSuite,
  ProtectionFactorId,
  RoundingRule,
} from "./scoring-types";

const CLASSIFICATION_SHEET: string | null =
  CONTROLLED_C02.sheets.find((sheet) => sheet.toLowerCase() === "classifications") ?? null;

const NUMBER_TEXT = /^-?\d+(?:\.\d+)?$/;

function controlledNumber(cell: string, where: string): number {
  const text = cell.trim();
  if (!NUMBER_TEXT.test(text)) {
    throw new Error(`${where} holds |${cell}|, which is not a controlled number`);
  }
  return Number(text);
}

function controlledInteger(cell: string, where: string): number {
  const value = controlledNumber(cell, where);
  if (!Number.isInteger(value)) {
    throw new Error(`${where} holds |${cell}|, which is not a whole number`);
  }
  return value;
}

function requiredControlField(key: string): string {
  const value = CONTROLLED_C02.controlFields[key]?.trim();
  if (!value) throw new Error(`C-02 README does not define required control field "${key}"`);
  return value;
}

function percentageRatio(text: string, where: string): number {
  const match = /^(\d+(?:\.\d+)?)\s*%$/.exec(text.trim());
  if (!match) throw new Error(`${where} must be a percent such as 50%; found "${text}"`);
  return Number(match[1]) / 100;
}

function requireSame<T>(actual: T, expected: T, where: string): T {
  if (actual !== expected) {
    throw new Error(`${where}: expected ${String(expected)} from the implementation contract, found ${String(actual)} in C-02`);
  }
  return actual;
}

function indexUnique<T>(rows: readonly T[], keyOf: (row: T) => string, sheet: string): Map<string, T> {
  const indexed = new Map<string, T>();
  for (const row of rows) {
    const key = keyOf(row);
    if (indexed.has(key)) throw new Error(`C-02 ${sheet} contains duplicate key "${key}"`);
    indexed.set(key, row);
  }
  return indexed;
}

const sourceVersion = CONTROLLED_C02.version;
if (!SCORING_RULES_VERSION.includes(sourceVersion)) {
  throw new Error(`SCORING_RULES_VERSION ${SCORING_RULES_VERSION} does not include C-02 ${sourceVersion}`);
}

export const C02_SOURCE: ControlledSourceProvenance = {
  documentTitle: "C-02 Canonical Scoring Rules and Golden Tests",
  version: SCORING_RULES_VERSION,
  fileSha256: CONTROLLED_C02.packageSha256,
  contentSha256: CONTROLLED_C02.contentSha256,
  receivedOn: null,
};

function parseDomainRow(row: (typeof C02_DOMAIN_ROWS)[number]): CanonicalDomainDefinition {
  return {
    code: row.domain_id as CanonicalDomainCode,
    displayName: row.display_name,
    meaning: row.meaning,
    formula: row.formula,
  };
}

function parseMappingRow(row: C02QuestionMapRow): DomainQuestionMapping {
  const weight = controlledNumber(row.weight, `C-02 Question_Mapping ${row.question_id} weight`);
  if (weight <= 0) throw new Error(`C-02 ${row.question_id} weight must be positive`);
  if (row.reverse_scored !== "0" && row.reverse_scored !== "1") {
    throw new Error(`C-02 ${row.question_id} reverse_scored must be 0 or 1`);
  }
  return {
    questionId: row.question_id,
    domainCode: row.domain_id as CanonicalDomainCode,
    weight,
    direction: row.reverse_scored === "1" ? "decrease" : "increase",
    pointsMap: row.points_map,
    questionReference: row.question_reference,
    normalizedRange: row.normalized_range,
  };
}

function parseOptionPointRow(row: C02OptionPointRow): CanonicalOptionPoint {
  if (row.excluded_as_na !== "0" && row.excluded_as_na !== "1") {
    throw new Error(`C-02 Option_Points ${row.question_id}/${row.option_id} excluded_as_na must be 0 or 1`);
  }
  const excludedAsNa = row.excluded_as_na === "1";
  const burdenPoints = row.burden_points === ""
    ? null
    : controlledNumber(row.burden_points, `C-02 Option_Points ${row.question_id}/${row.option_id} burden_points`);
  if (excludedAsNa !== (burdenPoints === null)) {
    throw new Error(`C-02 Option_Points ${row.question_id}/${row.option_id} N/A flag and burden value disagree`);
  }
  return {
    questionId: row.question_id,
    domainCode: row.domain_id as CanonicalDomainCode,
    optionSetId: row.option_set_id,
    optionId: row.option_id,
    displayLabel: row.display_label,
    burdenPoints,
    excludedAsNa,
  };
}

function parseFormulaRow(row: C02FormulaRow): CanonicalFormulaRule {
  return {
    ruleId: row.rule_id,
    output: row.output,
    normativeFormula: row.normative_formula,
    nullOrBoundaryRule: row.null_or_boundary_rule,
    rounding: row.rounding,
    auditFields: row.audit_fields,
  };
}

function parseProtectiveRow(row: C02ProtectiveRow): CanonicalProtectiveFactor {
  return {
    factorId: row.factor_id,
    source: row.source,
    activationRule: row["activation/value rule"],
    outputValue: row.output_value,
    purpose: row.purpose,
    notes: row.notes,
  };
}

function parseDriverRow(row: C02DriverRuleRow): CanonicalDeterministicRule {
  return {
    ruleId: row.rule_id,
    subject: row.subject,
    deterministicRule: row["deterministic rule"],
    output: row.output,
    tieOrFallback: row.tie_or_fallback,
    auditRequirement: row["audit requirement"],
  };
}

function parseClassificationRow(row: C02ClassificationRow): { scale: string; band: ClassificationBand } {
  const min = controlledInteger(row.minimum, `C-02 Classifications ${row.scale}/${row.label} minimum`);
  const max = controlledInteger(row.maximum, `C-02 Classifications ${row.scale}/${row.label} maximum`);
  if (min > max) throw new Error(`C-02 Classifications ${row.scale}/${row.label} minimum exceeds maximum`);
  return {
    scale: row.scale,
    band: {
      label: row.label,
      min,
      max,
      colorHex: row.color_hex,
      approvedInterpretation: row.approved_interpretation,
    },
  };
}

const domains = C02_DOMAIN_ROWS.map(parseDomainRow);
if (domains.length !== BIO_STATE_DOMAIN_TOTAL) throw new Error(`C-02 defines ${domains.length} domains; expected ${BIO_STATE_DOMAIN_TOTAL}`);
if (domains.map((domain) => domain.code).join(",") !== DRIVER_TIE_BREAK_ORDER.join(",")) {
  throw new Error("C-02 domain order differs from the canonical driver tie-break order");
}

const mappings = C02_QUESTION_MAP_ROWS.map(parseMappingRow);
if (mappings.length !== CANONICAL_SCORED_COUNT) throw new Error(`C-02 mapping has ${mappings.length} rows; expected ${CANONICAL_SCORED_COUNT}`);
const mappingByQuestion = indexUnique(mappings, (row) => row.questionId, "Question_Mapping");
for (const mapping of mappings) {
  const question = questionById.get(mapping.questionId);
  if (!question || question.eligibility !== "scored") {
    throw new Error(`C-02 maps ${mapping.questionId}, which is absent or not scoring-eligible in C-01`);
  }
  if (question.domainCode !== mapping.domainCode || question.optionSetId !== mapping.pointsMap) {
    throw new Error(`C-01/C-02 mapping mismatch for ${mapping.questionId}`);
  }
}

const optionPoints = C02_OPTION_POINT_ROWS.map(parseOptionPointRow);
if (optionPoints.length !== CONTROLLED_ROW_COUNTS["C-02/Option_Points"]) {
  throw new Error("C-02 Option_Points row count does not match its provenance index");
}
const pointsByQuestionOption = indexUnique(optionPoints, (point) => `${point.questionId}\u241f${point.optionId}`, "Option_Points");
for (const point of optionPoints) {
  const mapping = mappingByQuestion.get(point.questionId);
  const question = questionById.get(point.questionId);
  const option = question?.options.find((candidate) => candidate.optionId === point.optionId);
  if (!mapping || !option || mapping.domainCode !== point.domainCode || mapping.pointsMap !== point.optionSetId) {
    throw new Error(`C-01/C-02 Option_Points mismatch for ${point.questionId}/${point.optionId}`);
  }
  if (option.label !== point.displayLabel || option.rawBurdenValue !== point.burdenPoints || option.countsTowardScore === point.excludedAsNa) {
    throw new Error(`C-01/C-02 option data disagree for ${point.questionId}/${point.optionId}`);
  }
}

const formulas = C02_FORMULA_ROWS.map(parseFormulaRow);
const expectedFormulaIds = ["SC-001", "SC-002", "SC-003", "SC-004", "SC-005", "SC-006", "SC-007", "SC-008"];
if (formulas.map((rule) => rule.ruleId).join(",") !== expectedFormulaIds.join(",")) {
  throw new Error("C-02 Formulas must contain SC-001 through SC-008 in order");
}
const formulaById = indexUnique(formulas, (rule) => rule.ruleId, "Formulas");
requireSame(percentageRatio(requiredControlField("Domain coverage threshold"), "C-02 README Domain coverage threshold"), DOMAIN_COVERAGE_MIN_RATIO, "C-02 domain coverage threshold");
requireSame(controlledInteger(requiredControlField("Biological State minimum").split(" ")[0], "C-02 README Biological State minimum"), BIO_STATE_MIN_VALID_DOMAINS, "C-02 Biological State minimum domain count");
if (!formulaById.get("SC-001")?.nullOrBoundaryRule.includes("0.50")) throw new Error("C-02 SC-001 does not state the 50% null boundary");
if (!formulaById.get("SC-005")?.rounding.toLowerCase().includes("one decimal")) throw new Error("C-02 SC-005 must retain one decimal");

const protectiveFactors = C02_PROTECTIVE_ROWS.map(parseProtectiveRow);
if (protectiveFactors.map((factor) => factor.factorId).join(",") !== "P1,P2,P3,P4,P5,AGE,CONDITION,MEDICATION") {
  throw new Error("C-02 Protective_Factors identities or order changed");
}

const deterministicRules = C02_DRIVER_RULE_ROWS.map(parseDriverRow);
const deterministicRuleById = indexUnique(deterministicRules, (rule) => rule.ruleId, "Drivers_Evidence");
const driverMinimumText = deterministicRuleById.get("DRV-001")?.deterministicRule ?? "";
const driverMinimumMatch = /score\s*≥\s*(\d+)/i.exec(driverMinimumText);
if (!driverMinimumMatch) throw new Error("C-02 DRV-001 does not define a driver eligibility threshold");
const driverMinimum = controlledInteger(driverMinimumMatch[1], "C-02 DRV-001 threshold");
const rankingText = deterministicRuleById.get("DRV-002")?.deterministicRule ?? "";
const tieOrderMatch = /fixed order\s+([A-Z,]+)/i.exec(rankingText);
if (!tieOrderMatch || tieOrderMatch[1].split(",").join(",") !== DRIVER_TIE_BREAK_ORDER.join(",")) {
  throw new Error("C-02 DRV-002 fixed tie order differs from canonical constants");
}
const coPrimaryText = deterministicRuleById.get("DRV-003")?.deterministicRule ?? "";
const coPrimaryMatch = /differ by\s*≤\s*(\d+)/i.exec(coPrimaryText);
if (!coPrimaryMatch) throw new Error("C-02 DRV-003 does not define the co-primary gap");
requireSame(controlledInteger(coPrimaryMatch[1], "C-02 DRV-003 co-primary gap"), CO_PRIMARY_MAX_POINT_GAP, "C-02 co-primary gap");
const maxOutputEntries = (deterministicRuleById.get("DRV-002")?.output.match(/[A-Za-z]+/g) ?? []).length;
if (maxOutputEntries < 1) throw new Error("C-02 DRV-002 does not define any driver output slots");

const rounding: RoundingRule = {
  integerMode: "half_away_from_zero",
  opportunityDecimals: requireSame(1, OPPORTUNITY_DECIMALS, "Opportunity decimal places"),
  recoveryDecimals: requireSame(1, RECOVERY_DECIMALS, "Recovery Potential decimal places"),
  integerScales: formulas.filter((rule) => rule.rounding.toLowerCase().includes("half away from zero")).map((rule) => rule.ruleId),
};
if (rounding.integerScales.length !== 6) throw new Error("C-02 integer rounding rules changed; expected six formulas");

const classificationsByScale = new Map<string, ClassificationBand[]>();
for (const row of C02_CLASSIFICATION_ROWS) {
  const { scale, band } = parseClassificationRow(row);
  const bands = classificationsByScale.get(scale) ?? [];
  bands.push(band);
  classificationsByScale.set(scale, bands);
}
if (Array.from(classificationsByScale.keys()).sort().join(",") !== "CONFIDENCE,DOMAIN,RECOVERY") {
  throw new Error("C-02 must define DOMAIN, CONFIDENCE and RECOVERY classifications");
}
export const CLASSIFICATION_SETS: readonly ClassificationSet[] = Array.from(classificationsByScale.entries()).map(([scaleCode, bands]) => ({
  scaleCode,
  sourceSheet: CLASSIFICATION_SHEET,
  bands: [...bands].sort((a, b) => a.min - b.min),
}));
for (const set of CLASSIFICATION_SETS) {
  if (set.bands.length !== 4 || set.bands[0].min !== 0 || set.bands[3].max !== 100) {
    throw new Error(`C-02 ${set.scaleCode} classification bands do not partition 0..100`);
  }
  for (let index = 1; index < set.bands.length; index += 1) {
    if (set.bands[index].min !== set.bands[index - 1].max + 1) {
      throw new Error(`C-02 ${set.scaleCode} classification bands have a gap or overlap`);
    }
  }
}

export function classifyScore(scaleCode: string, score: number | null): ClassificationBand | null {
  if (score === null) return null;
  if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error(`${scaleCode} score must be between 0 and 100`);
  const set = CLASSIFICATION_SETS.find((candidate) => candidate.scaleCode === scaleCode);
  if (!set) throw new Error(`Unknown C-02 classification scale "${scaleCode}"`);
  if (scaleCode === "RECOVERY") {
    // ROOTS decision: classify the unrounded one-decimal score by the highest
    // inclusive band minimum it has reached. Thus 74.5 remains Moderate.
    return [...set.bands].reverse().find((band) => score >= band.min) ?? null;
  }
  return set.bands.find((band) => score >= band.min && score <= band.max) ?? null;
}

const expectedInputKeys = [
  "age", "diseaseCount", "medicationCount", "P1", "P2", "P3", "P4", "P5", "answerConfidence",
  ...mappings.map((mapping) => mapping.questionId),
].sort();
const expectedOutputKeys = [
  "domains", "coverage", "biological_state", "opportunity", "recovery_potential", "protective_count", "confidence", "drivers",
].sort();
const expectedDomainKeys = DRIVER_TIE_BREAK_ORDER.slice().sort();
const testIds = Array.from({ length: 30 }, (_, index) => `GT-${String(index + 1).padStart(3, "0")}`);

function parseGoldenInput(row: C02GoldenTestRow): GoldenTestInput {
  let parsed: unknown;
  try { parsed = JSON.parse(row.normalized_input_json); }
  catch (error) { throw new Error(`C-02 ${row.test_id} normalized input is invalid JSON: ${String(error)}`); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(`C-02 ${row.test_id} input must be an object`);
  const raw = parsed as Record<string, unknown>;
  if (Object.keys(raw).sort().join("\u241f") !== expectedInputKeys.join("\u241f")) {
    throw new Error(`C-02 ${row.test_id} input keys do not match the 40 scored questions and nine controls`);
  }
  const answers: Record<string, number | null> = {};
  for (const mapping of mappings) {
    const value = raw[mapping.questionId];
    if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < RAW_BURDEN_SCALE.min || value > RAW_BURDEN_SCALE.max)) {
      throw new Error(`C-02 ${row.test_id} ${mapping.questionId} must be null or a burden value from 0 to 4`);
    }
    answers[mapping.questionId] = value as number | null;
  }
  const integerControls = ["age", "diseaseCount", "medicationCount", "answerConfidence"] as const;
  for (const key of integerControls) {
    if (typeof raw[key] !== "number" || !Number.isInteger(raw[key])) throw new Error(`C-02 ${row.test_id} ${key} must be an integer`);
  }
  const protectiveFactors = {} as Record<ProtectionFactorId, boolean>;
  for (const id of ["P1", "P2", "P3", "P4", "P5"] as const) {
    if (typeof raw[id] !== "boolean") throw new Error(`C-02 ${row.test_id} ${id} must be boolean`);
    protectiveFactors[id] = raw[id] as boolean;
  }
  return {
    age: raw.age as number,
    diseaseCount: raw.diseaseCount as number,
    medicationCount: raw.medicationCount as number,
    answerConfidence: raw.answerConfidence as number,
    protectiveFactors,
    answers,
  };
}

function parseGoldenExpected(row: C02GoldenTestRow): GoldenTestExpectedOutput {
  let parsed: unknown;
  try { parsed = JSON.parse(row.expected_output_json); }
  catch (error) { throw new Error(`C-02 ${row.test_id} expected output is invalid JSON: ${String(error)}`); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(`C-02 ${row.test_id} expected output must be an object`);
  const raw = parsed as Record<string, unknown>;
  if (Object.keys(raw).sort().join("\u241f") !== expectedOutputKeys.join("\u241f")) throw new Error(`C-02 ${row.test_id} expected output keys changed`);
  const domains = raw.domains as Record<string, unknown>;
  const coverage = raw.coverage as Record<string, unknown>;
  if (!domains || !coverage || Object.keys(domains).sort().join(",") !== expectedDomainKeys.join(",") || Object.keys(coverage).sort().join(",") !== expectedDomainKeys.join(",")) {
    throw new Error(`C-02 ${row.test_id} domain score or coverage keys changed`);
  }
  for (const code of DRIVER_TIE_BREAK_ORDER) {
    const domainScore = domains[code];
    const ratio = coverage[code];
    if (domainScore !== null && (typeof domainScore !== "number" || !Number.isInteger(domainScore))) throw new Error(`C-02 ${row.test_id} ${code} domain score must be integer or null`);
    if (typeof ratio !== "number" || !Number.isFinite(ratio) || ratio < 0 || ratio > 1) throw new Error(`C-02 ${row.test_id} ${code} coverage must be a ratio from 0 to 1`);
  }
  if (!Array.isArray(raw.drivers) || !raw.drivers.every((value) => typeof value === "string")) throw new Error(`C-02 ${row.test_id} drivers must be string tokens`);
  return {
    domainScores: domains as Record<string, number | null>,
    coverage: coverage as Record<string, number>,
    biologicalState: raw.biological_state as number | null,
    opportunity: raw.opportunity as number | null,
    recoveryPotential: raw.recovery_potential as number | null,
    protectiveCount: raw.protective_count as number,
    confidence: raw.confidence as number,
    drivers: raw.drivers as string[],
  };
}

if (C02_GOLDEN_TEST_ROWS.length !== testIds.length || C02_GOLDEN_TEST_ROWS.some((row, index) => row.test_id !== testIds[index])) {
  throw new Error("C-02 Golden_Tests must contain GT-001 through GT-030 in order");
}
export const GOLDEN_TESTS: readonly GoldenTestCase[] = C02_GOLDEN_TEST_ROWS.map((row) => ({
  testId: row.test_id,
  description: row.purpose || null,
  input: parseGoldenInput(row),
  expected: parseGoldenExpected(row),
}));
export const GOLDEN_TEST_SUITE: GoldenTestSuite = {
  source: C02_SOURCE,
  populated: GOLDEN_TESTS.length === testIds.length,
  expectedCount: testIds.length,
  cases: GOLDEN_TESTS,
};

const outputSlots = maxOutputEntries;
export const SCORING_RULES: CanonicalScoringRules = {
  source: C02_SOURCE,
  populated: domains.length === BIO_STATE_DOMAIN_TOTAL && mappings.length === 40 && optionPoints.length > 0 && GOLDEN_TESTS.length === 30,
  rawBurdenScale: { min: controlledNumber(requiredControlField("Raw burden scale").split("-")[0], "C-02 raw burden minimum"), max: controlledNumber(requiredControlField("Raw burden scale").split("-")[1], "C-02 raw burden maximum") },
  domains,
  domainQuestionMap: mappings,
  optionPoints,
  domainCoverageMinRatio: percentageRatio(requiredControlField("Domain coverage threshold"), "C-02 domain coverage threshold"),
  bioStateMinValidDomains: controlledInteger(requiredControlField("Biological State minimum").split(" ")[0], "C-02 Biological State minimum"),
  rounding,
  driverEligibility: {
    minimumDomainScore: driverMinimum,
    coPrimaryMaxGap: CO_PRIMARY_MAX_POINT_GAP,
    maxOutputEntries: outputSlots,
    ranking: "descending",
    tieBreakOrder: DRIVER_TIE_BREAK_ORDER,
  },
  formulas,
  protectiveFactors,
  deterministicRules,
  classifications: CLASSIFICATION_SETS,
};

export const C02_UNPOPULATED_CODE: StructureViolationCode = "SOURCE_UNPOPULATED";
export function c02MissingSourceViolations(): readonly StructureViolation[] {
  if (SCORING_RULES.populated && GOLDEN_TEST_SUITE.populated) return [];
  return [{
    code: C02_UNPOPULATED_CODE,
    subject: "C-02 scoring rules",
    detail: `${C02_SOURCE.documentTitle} (${SCORING_RULES_VERSION}) is incomplete: ${mappings.length}/40 mappings, ${CLASSIFICATION_SETS.length}/3 classification sets and ${GOLDEN_TESTS.length}/30 Golden Tests.`,
  }];
}

export function optionPointFor(questionId: string, optionId: string): CanonicalOptionPoint | undefined {
  return pointsByQuestionOption.get(`${questionId}\u241f${optionId}`);
}
