import {
  CANONICAL_MODULE_COUNT,
  CANONICAL_QUESTION_COUNT,
  OPTIONAL_FREE_TEXT_QUESTION_ID,
} from "../../lib/assessment/canonical-constants";
import {
  LAUNCH_MINIMUM_AGE,
  checkLaunchEligibility,
  failureCodes,
  isCanonicalQuestion,
  isExplicitNa,
  validateAnswer,
  validateAnswerSheet,
  validateModule,
} from "../../lib/assessment/validation";
import { QUESTION_BANK, questionById } from "../../lib/assessment/question-bank";
import type { AnswerRecord, AnswerSheet } from "../../lib/assessment/answer-types";

/**
 * Tests for the C-01 validation gate (Blueprint §2).
 *
 * Each case pins a law the answer types declare but nothing else enforces:
 * absence is not N/A, an empty multi-select is invalid, the exclusive option
 * cannot be combined, and Q73 never carries a forced N/A.
 */

const q = (id: string) => {
  const question = questionById.get(id);
  if (!question) throw new Error(`missing question ${id}`);
  return question;
};

const answered = (questionId: string, value: AnswerRecord["value"]): AnswerRecord => ({
  questionId,
  status: value === null ? "unanswered" : "answered",
  value,
  savedAt: null,
});

const unanswered = (questionId: string): AnswerRecord => ({
  questionId,
  status: "unanswered",
  value: null,
  savedAt: null,
});

/** First multi-select question in the bank, e.g. Q13. */
const firstMultiSelect = QUESTION_BANK.questions.find((x) => x.responseKind === "multi_select");
const exclusiveIdOf = (questionId: string): string | null =>
  q(questionId).multiSelectRule?.exclusiveNoneOptionId ?? null;
const firstOptionId = (questionId: string): string =>
  q(questionId).options.find((o) => !o.isExclusiveNoneOption)!.optionId;

describe("canonical bank sanity", () => {
  it("holds 73 questions across 13 modules", () => {
    expect(QUESTION_BANK.questions).toHaveLength(CANONICAL_QUESTION_COUNT);
    expect(QUESTION_BANK.modules).toHaveLength(CANONICAL_MODULE_COUNT);
    expect(QUESTION_BANK.populated).toBe(true);
  });

  it("keeps every multi-select question inside the canonical set", () => {
    const ids = QUESTION_BANK.questions
      .filter((x) => x.responseKind === "multi_select")
      .map((x) => x.questionId)
      .sort();
    expect(ids).toEqual(["Q13", "Q14", "Q52", "Q53", "Q54"]);
  });
});

describe("required versus unanswered (MISSING_REQUIRED)", () => {
  it("fails a required question that was never touched", () => {
    const result = validateAnswer(q("Q1"), unanswered("Q1"));
    expect(result.valid).toBe(false);
    expect(failureCodes(result)).toContain("MISSING_REQUIRED");
  });

  it("passes a required question with a real answer", () => {
    expect(validateAnswer(q("Q1"), answered("Q1", { kind: "number", value: 40 })).valid).toBe(true);
  });

  it("never treats absence as an accepted N/A", () => {
    // Q1 has naPolicy "not_permitted"; an unanswered record must not pass by
    // being quietly reinterpreted as explicit N/A.
    expect(q("Q1").naPolicy).toBe("not_permitted");
    expect(validateAnswer(q("Q1"), unanswered("Q1")).valid).toBe(false);
  });
});
describe("explicit N/A is a distinct, affirmative state", () => {
  it("rejects an explicit_na record whose value is not an approved N/A option", () => {
    const question = firstMultiSelect!;
    const record: AnswerRecord = {
      questionId: question.questionId,
      status: "explicit_na",
      value: {
        kind: "option_set",
        optionIds: [firstOptionId(question.questionId)] as [string],
        exclusiveNoneSelected: false,
      },
      savedAt: null,
    };
    expect(failureCodes(validateAnswer(question, record))).toContain("NA_NOT_AFFIRMATIVE");
  });

  it("accepts an explicit N/A only where the option is actually exclusive", () => {
    const questionId = firstMultiSelect!.questionId;
    const exclusive = exclusiveIdOf(questionId);
    expect(exclusive).not.toBeNull();
    const record: AnswerRecord = {
      questionId,
      status: "explicit_na",
      value: { kind: "option_set", optionIds: [exclusive!] as [string], exclusiveNoneSelected: true },
      savedAt: null,
    };
    expect(validateAnswer(q(questionId), record).valid).toBe(true);
  });

  it("recognises isExplicitNa only for an approved exclusive option", () => {
    expect(
      isExplicitNa(firstMultiSelect!, {
        kind: "option_set",
        optionIds: [firstOptionId(firstMultiSelect!.questionId)] as [string],
        exclusiveNoneSelected: false,
      }),
    ).toBe(false);
  });

  it("never allows a forced N/A on the optional free-text question", () => {
    expect(OPTIONAL_FREE_TEXT_QUESTION_ID).toBe("Q73");
    const record: AnswerRecord = {
      questionId: OPTIONAL_FREE_TEXT_QUESTION_ID,
      status: "explicit_na",
      value: { kind: "text", text: "anything" },
      savedAt: null,
    };
    expect(failureCodes(validateAnswer(q("Q73"), record))).toContain(
      "FORCED_NA_ON_OPTIONAL_FREE_TEXT",
    );
  });

  it("leaves Q73 validly blank, because it is optional", () => {
    expect(q("Q73").requirement).toBe("optional");
    expect(validateAnswer(q("Q73"), unanswered("Q73")).valid).toBe(true);
  });
});

describe("multi-select law (empty and exclusive)", () => {
  it("rejects an empty selection", () => {
    const question = firstMultiSelect!;
    const record: AnswerRecord = {
      questionId: question.questionId,
      status: "answered",
      value: { kind: "option_set", optionIds: [] as unknown as [string], exclusiveNoneSelected: false },
      savedAt: null,
    };
    expect(failureCodes(validateAnswer(question, record))).toContain("EMPTY_MULTI_SELECT");
  });

  it("rejects the exclusive option combined with any other", () => {
    const questionId = firstMultiSelect!.questionId;
    const record: AnswerRecord = {
      questionId,
      status: "answered",
      value: {
        kind: "option_set",
        optionIds: [exclusiveIdOf(questionId)!, firstOptionId(questionId)],
        exclusiveNoneSelected: true,
      },
      savedAt: null,
    };
    expect(failureCodes(validateAnswer(q(questionId), record))).toContain(
      "EXCLUSIVE_OPTION_CONFLICT",
    );
  });

  it("rejects an option id the question does not declare", () => {
    const question = firstMultiSelect!;
    const record: AnswerRecord = {
      questionId: question.questionId,
      status: "answered",
      value: { kind: "option_set", optionIds: ["NOT_A_REAL_OPTION"] as [string], exclusiveNoneSelected: false },
      savedAt: null,
    };
    expect(failureCodes(validateAnswer(question, record))).toContain("UNKNOWN_OPTION_ID");
  });
});

describe("answer shape must match the question", () => {
  it("rejects a text answer to a single-select question", () => {
    expect(failureCodes(validateAnswer(q("Q2"), answered("Q2", { kind: "text", text: "hi" })))).toContain(
      "ANSWER_KIND_MISMATCH",
    );
  });

  it("rejects an 'answered' status that carries no value", () => {
    const record: AnswerRecord = { questionId: "Q2", status: "answered", value: null, savedAt: null };
    expect(failureCodes(validateAnswer(q("Q2"), record))).toContain("ANSWER_KIND_MISMATCH");
  });

  /**
   * Documented gap in the declared answer contract.
   *
   * C-01 types Q6 as `decimal_with_unit`: the participant supplies a number AND a
   * unit (WAIST_UNIT: centimetres or inches). `AnswerValue` in answer-types.ts
   * has no shape carrying both, so the validator accepts only a plain number and
   * the unit cannot be persisted with the value. This is recorded rather than
   * silently worked around, because storing the unit as a single-choice answer
   * would record "CM" where the waist measurement belongs.
   *
   * Resolving it needs a controlled decision: either an added `measure` shape in
   * answer-types.ts, or a C-01 confirmation that Q6 is recorded in centimetres.
   */
  it("records the decimal_with_unit answer-shape gap on Q6", () => {
    const question = q("Q6");
    expect(question.responseKind).toBe("decimal_with_unit");
    expect(question.optionSetId).toBe("WAIST_UNIT");
    // A number is the only shape the current contract can accept.
    expect(validateAnswer(question, answered("Q6", { kind: "number", value: 80 })).valid).toBe(true);
    // A unit id is not an acceptable answer for the value itself.
    expect(failureCodes(validateAnswer(question, answered("Q6", { kind: "option", optionId: "CM" })))).toContain(
      "ANSWER_KIND_MISMATCH",
    );
  });
});
describe("sheet-level completeness", () => {
  /**
   * Answers every required question.
   *
   * `AnswerSheet` is declared Readonly, so the builder works in a mutable local
   * type and returns the sheet — the readonly type is the contract for CONSUMERS,
   * not a restriction on the code that assembles one.
   *
   * Option-bearing questions take their first non-exclusive option. Numeric
   * questions (Q1 age, Q3/Q4 height/weight, the 0-10 scales) carry no options in
   * C-01, so they are answered with a number instead — skipping them would look
   * like a validator failure rather than a gap in this helper.
   */
  type MutableSheet = Record<string, AnswerRecord>;

  const completeSheet = (): AnswerSheet => {
    const sheet: MutableSheet = {};
    for (const question of QUESTION_BANK.questions) {
      if (question.requirement !== "required") continue;

      // Q6 is decimal_with_unit: the answer is a NUMBER, and its two options are
      // the UNIT choice (WAIST_UNIT), not answer values. answer-types.ts has no
      // combined "value + unit" shape, so the validator requires a plain number
      // and the unit choice is carried separately. This is a documented gap in the
      // answer contract, not something to encode as a single-choice answer —
      // doing so would store centimetres as if they were unit ids.
      if (question.responseKind === "decimal_with_unit") {
        sheet[question.questionId] = {
          questionId: question.questionId,
          status: "answered",
          value: { kind: "number", value: 80 },
          savedAt: null,
        };
        continue;
      }

      const option = question.options.find((o) => !o.isExclusiveNoneOption);
      if (!option) {
        sheet[question.questionId] =
          question.responseKind === "free_text"
            ? {
                questionId: question.questionId,
                status: "answered",
                value: { kind: "text", text: "test response" },
                savedAt: null,
              }
            : {
                questionId: question.questionId,
                status: "answered",
                value: { kind: "number", value: 3 },
                savedAt: null,
              };
        continue;
      }
      sheet[question.questionId] =
        question.responseKind === "multi_select"
          ? {
              questionId: question.questionId,
              status: "answered",
              value: {
                kind: "option_set",
                optionIds: [option.optionId] as [string],
                exclusiveNoneSelected: false,
              },
              savedAt: null,
            }
          : {
              questionId: question.questionId,
              status: "answered",
              value: { kind: "option", optionId: option.optionId },
              savedAt: null,
            };
    }
    return sheet;
  };

  it("fails an empty sheet on required questions only", () => {
    const result = validateAnswerSheet({});
    expect(result.valid).toBe(false);
    // Q73 is optional, so it must never appear among the failures.
    expect(result.failures.some((f) => f.questionId === OPTIONAL_FREE_TEXT_QUESTION_ID)).toBe(false);
  });

  it("validates a fully answered required sheet", () => {
    const result = validateAnswerSheet(completeSheet());
    expect(result.failures).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("covers all 71 required questions once answered", () => {
    expect(Object.keys(completeSheet())).toHaveLength(71);
  });

  it("scopes module validation to that module only", () => {
    const sheet: MutableSheet = { ...completeSheet() };
    delete sheet.Q1;
    const module1 = validateModule(sheet, 1);
    expect(module1.valid).toBe(false);
    expect(module1.failures.every((f) => f.moduleIndex === 1)).toBe(true);
    expect(validateModule(sheet, 2).valid).toBe(true);
  });
});

describe("launch eligibility is separate from format validation", () => {
  const ageSheet = (age: number): AnswerSheet => ({
    Q1: { questionId: "Q1", status: "answered", value: { kind: "number", value: age }, savedAt: null },
  });

  it("blocks a submission below the launch age", () => {
    expect(checkLaunchEligibility(ageSheet(17)).eligible).toBe(false);
  });

  it("allows an adult at the launch age", () => {
    expect(checkLaunchEligibility(ageSheet(LAUNCH_MINIMUM_AGE)).eligible).toBe(true);
  });

  it("does not call an unanswered age ineligible, leaving that to MISSING_REQUIRED", () => {
    expect(checkLaunchEligibility({}).eligible).toBe(true);
  });
});

describe("canonical question lookup", () => {
  it("recognises real question ids and rejects invented ones", () => {
    expect(isCanonicalQuestion("Q1")).toBe(true);
    expect(isCanonicalQuestion("Q73")).toBe(true);
    expect(isCanonicalQuestion("Q74")).toBe(false);
    expect(isCanonicalQuestion("")).toBe(false);
  });
});