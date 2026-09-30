import {
  GOLDEN_TEST_SUITE,
  SCORING_RULES,
  classifyScore,
} from "../../lib/assessment/scoring-rules";
import { CANONICAL_GOLDEN_TEST_COUNT } from "../../lib/assessment/scoring-types";
import { validateCanonicalStructure } from "../../lib/assessment/invariants";
import {
  formatGoldenTestMatrix,
  goldenOutputFromResult,
  runGoldenTestMatrix,
  scoreAnswerRecords,
  scoreAssessment,
  scoringInputFromAnswers,
  scoringInputFromGolden,
} from "../../lib/assessment/scoring-engine";
import { C02_CLASSIFICATION_ROWS } from "../../lib/assessment/controlled";
import { questionById } from "../../lib/assessment/question-bank";
import { QUESTIONNAIRE_VERSION, SCORING_RULES_VERSION } from "../../lib/assessment/canonical-constants";
import type { AnswerRecord, AnswerValue } from "../../lib/assessment/answer-types";
import type { ClassificationBand } from "../../lib/assessment/scoring-types";

function sourceBand(scale: string, score: number | null, recoveryRuleA = false): ClassificationBand | null {
  if (score === null) return null;
  const rows = C02_CLASSIFICATION_ROWS
    .filter((row) => row.scale === scale)
    .map((row) => ({
      label: row.label,
      min: Number(row.minimum),
      max: Number(row.maximum),
      colorHex: row.color_hex,
      approvedInterpretation: row.approved_interpretation,
    }));
  if (recoveryRuleA) return [...rows].sort((a, b) => b.min - a.min).find((row) => score >= row.min) ?? null;
  return rows.find((row) => score >= row.min && score <= row.max) ?? null;
}

describe("M2 canonical scoring", () => {
  it("loads the complete C-01/C-02 structure without violations", () => {
    expect(validateCanonicalStructure()).toEqual([]);
    expect(SCORING_RULES.populated).toBe(true);
  });

  it("loads the 30 canonical C-02 cases in order", () => {
    expect(GOLDEN_TEST_SUITE.cases).toHaveLength(CANONICAL_GOLDEN_TEST_COUNT);
    expect(GOLDEN_TEST_SUITE.cases.map(({ testId }) => testId)).toEqual(
      Array.from({ length: CANONICAL_GOLDEN_TEST_COUNT }, (_, index) => `GT-${String(index + 1).padStart(3, "0")}`),
    );
  });

  it("matches every C-02 expected output exactly across all 30 cases", () => {
    const matrix = runGoldenTestMatrix();
    expect(matrix).toHaveLength(CANONICAL_GOLDEN_TEST_COUNT);
    console.log(formatGoldenTestMatrix(matrix));
    const failures = matrix.filter((row) => row.result !== "PASS");
    expect(failures.map((row) => `${row.testId}: ${row.mismatches.join("; ")}`)).toEqual([]);
  });

  it("matches source-derived domain, confidence and Recovery classifications for all cases", () => {
    for (const testCase of GOLDEN_TEST_SUITE.cases) {
      const result = scoreAssessment(scoringInputFromGolden(testCase.input));
      for (const domain of SCORING_RULES.domains) {
        const score = result.domains[domain.code].score;
        expect(result.classifications.domains[domain.code]).toEqual(sourceBand("DOMAIN", score));
      }
      expect(result.classifications.confidence).toEqual(sourceBand("CONFIDENCE", result.confidence));
      expect(result.classifications.recoveryPotential).toEqual(
        sourceBand("RECOVERY", result.recoveryPotential, true),
      );
    }
  });

  it("applies ROOTS decision (a) to one-decimal Recovery Potential values", () => {
    expect(classifyScore("RECOVERY", 24.9)?.label).toBe("Low");
    expect(classifyScore("RECOVERY", 25)?.label).toBe("Limited");
    expect(classifyScore("RECOVERY", 49.9)?.label).toBe("Limited");
    expect(classifyScore("RECOVERY", 50)?.label).toBe("Moderate");
    expect(classifyScore("RECOVERY", 74.5)?.label).toBe("Moderate");
    expect(classifyScore("RECOVERY", 75)?.label).toBe("High");
    expect(classifyScore("RECOVERY", null)).toBeNull();
  });

  it("uses canonical co-primary tokens and null availability behavior", () => {
    const coPrimary = GOLDEN_TEST_SUITE.cases.find(({ testId }) => testId === "GT-021");
    const unavailable = GOLDEN_TEST_SUITE.cases.find(({ testId }) => testId === "GT-020");
    expect(coPrimary).toBeDefined();
    expect(unavailable).toBeDefined();
    expect(goldenOutputFromResult(scoreAssessment(scoringInputFromGolden(coPrimary!.input))).drivers).toEqual(
      coPrimary!.expected.drivers,
    );
    const result = scoreAssessment(scoringInputFromGolden(unavailable!.input));
    expect(result.biologicalState.value).toBeNull();
    expect(result.opportunity).toBeNull();
    expect(result.recoveryPotential).toBeNull();
    expect(goldenOutputFromResult(result).drivers).toEqual(unavailable!.expected.drivers);
  });

  it("rejects out-of-range and fractional normalized burden points", () => {
    const base = GOLDEN_TEST_SUITE.cases[0].input;
    expect(() => scoreAssessment(scoringInputFromGolden({
      ...base,
      answers: { ...base.answers, Q9: 4.1 },
    }))).toThrow(/Q9/);
    expect(() => scoreAssessment(scoringInputFromGolden({
      ...base,
      answers: { ...base.answers, Q9: 1.5 },
    }))).toThrow(/whole number/);
  });

  it("uses direction-adjusted C-02 points for Q26/Q28 exactly once", () => {
    const q26 = GOLDEN_TEST_SUITE.cases.find(({ testId }) => testId === "GT-014")!;
    const q28 = GOLDEN_TEST_SUITE.cases.find(({ testId }) => testId === "GT-015")!;
    expect(goldenOutputFromResult(scoreAssessment(scoringInputFromGolden(q26.input)))).toEqual(q26.expected);
    expect(goldenOutputFromResult(scoreAssessment(scoringInputFromGolden(q28.input)))).toEqual(q28.expected);
  });

  it("records C-02 evidence score and label components in its calculation trace", () => {
    const result = scoreAssessment(scoringInputFromGolden(GOLDEN_TEST_SUITE.cases[0].input));
    const domains = result.trace.domains as Record<string, { evidenceScore: number; evidenceLabel: string }>;
    expect(domains.MR.evidenceScore).toBe(80);
    expect(domains.MR.evidenceLabel).toBe("Strong");
  });

  it("translates canonical answer records to option points before scoring", () => {
    const answer = (questionId: string, value: AnswerValue): AnswerRecord => ({
      questionId,
      status: "answered",
      value,
      savedAt: null,
    });
    const scoredAnswers = SCORING_RULES.domainQuestionMap.map((mapping) => {
      const zeroOption = SCORING_RULES.optionPoints.find((point) =>
        point.questionId === mapping.questionId && point.burdenPoints === 0,
      );
      if (!zeroOption) throw new Error(`No zero-burden option for ${mapping.questionId}`);
      return answer(mapping.questionId, { kind: "option", optionId: zeroOption.optionId });
    });
    const records = [
      ...scoredAnswers,
      answer("Q1", { kind: "number", value: 40 }),
      answer("Q13", { kind: "option_set", optionIds: ["NONE"], exclusiveNoneSelected: true }),
      answer("Q14", { kind: "option_set", optionIds: ["NONE"], exclusiveNoneSelected: true }),
      answer("Q61", { kind: "option", optionId: "NEVER" }),
      answer("Q64", { kind: "option", optionId: "OFT" }),
      answer("Q65", { kind: "option", optionId: "GOOD" }),
      answer("Q69", { kind: "number", value: 7 }),
      answer("Q72", { kind: "option", optionId: "HIGH" }),
    ];
    const input = scoringInputFromAnswers(records, {
      questionnaireVersion: QUESTIONNAIRE_VERSION,
      scoringRulesVersion: SCORING_RULES_VERSION,
    });
    expect(input.answers.Q26).toEqual({ rawValue: 0, isNa: false });
    expect(input.answers.Q28).toEqual({ rawValue: 0, isNa: false });
    expect(scoreAnswerRecords(records, {
      questionnaireVersion: QUESTIONNAIRE_VERSION,
      scoringRulesVersion: SCORING_RULES_VERSION,
    })).toMatchObject({ recoveryPotential: 96, protectiveCount: 5 });
    const mixedNone = [...records.filter(({ questionId }) => questionId !== "Q13"), answer("Q13", {
      kind: "option_set",
      optionIds: ["NONE", "T2D"],
      exclusiveNoneSelected: false,
    })];
    expect(() => scoringInputFromAnswers(mixedNone, {
      questionnaireVersion: QUESTIONNAIRE_VERSION,
      scoringRulesVersion: SCORING_RULES_VERSION,
    })).toThrow(/exclusive None\/N\/A/);
    expect(questionById.get("Q5")?.eligibility).toBe("contextual");
  });
});
