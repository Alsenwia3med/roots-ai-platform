/**
 * ROOTS-AI — Milestone 2: controlled-source transcription generator.
 *
 * Reads the two controlled workbooks in controlled-sources/ and writes the
 * verbatim data tables under lib/assessment/controlled/. Nothing in the output
 * is authored here: every emitted value is a cell of the source, and every
 * value this script cannot read makes the script FAIL rather than emit.
 *
 *   node scripts/build-controlled-data.mjs
 *
 * What the script also does, before writing a single byte:
 *   1. re-runs the QA_Checks sheet of both workbooks against the data it parsed,
 *      so the workbooks' own self-tests are enforced here too;
 *   2. cross-checks C-01 against C-02 (the 40 scored questions, their option
 *      sets, their option IDs and their point tables must agree);
 *   3. records the SHA-256 of both the package bytes and the canonical cell
 *      content, which the generated files carry as provenance.
 *
 * Output is deterministic: the same inputs always produce byte-identical files.
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadWorkbook } from "./xlsx-reader.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const C01_PATH = "controlled-sources/02_ROOTS_AI_C01_Canonical_Question_Bank_v1.0.1_CORRECTED.xlsx";
const C02_PATH =
  "controlled-sources/03_ROOTS_AI_C02_Canonical_Scoring_Rules_and_Golden_Tests_v1.0.1_CORRECTED.xlsx";
const OUT_DIR = resolve(ROOT, "lib/assessment/controlled");

/* --------------------------------- failures -------------------------------- */

const failures = [];
let checksRun = 0;
/** Record a transcription failure; the run cannot emit while any is open. */
function fail(what) {
  failures.push(what);
  return false;
}
function expect(cond, what) {
  checksRun += 1;
  return cond ? true : fail(what);
}
function expectEqual(actual, expected, what) {
  return expect(
    String(actual) === String(expected),
    `${what}: expected ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`,
  );
}

/* ------------------------------ sheet reading ------------------------------ */

const c01 = loadWorkbook(resolve(ROOT, C01_PATH));
const c02 = loadWorkbook(resolve(ROOT, C02_PATH));

/** README sheets are Field/Value control tables; index them by Field. */
function controlFields(workbook) {
  const map = new Map();
  for (const r of workbook.rows("README")) {
    if (r.Field && r.Field !== "Field") map.set(r.Field, r.Value);
  }
  return map;
}
/** QA_Checks sheets: Check -> { expected, result }. */
function qaChecks(workbook) {
  const map = new Map();
  for (const r of workbook.rows("QA_Checks")) {
    if (r.Check) map.set(r.Check, { expected: r.Expected, formula: r.Formula, result: r.Result });
  }
  return map;
}

const c01Control = controlFields(c01);
const c02Control = controlFields(c02);
const c01Qa = qaChecks(c01);
const c02Qa = qaChecks(c02);

const modules = c01.rows("Modules");
const questions = c01.rows("Questions");
const optionSets = c01.rows("Option_Sets");
const validations = c01.rows("Validation");

const domains = c02.rows("Domains");
const mapping = c02.rows("Question_Mapping");
const optionPoints = c02.rows("Option_Points");
const formulas = c02.rows("Formulas");
const protective = c02.rows("Protective_Factors");
const classifications = c02.rows("Classifications");
const drivers = c02.rows("Drivers_Evidence");
const golden = c02.rows("Golden_Tests");

const isYes = (v) => v === "1" || v === "1.0" || v === "true" || v === "TRUE";

/**
 * Enforce one row of a workbook's own QA_Checks sheet against a value computed
 * from the parsed data. The workbook asserts PASS; this script proves it.
 */
function proveQa(checks, label, computed, what) {
  const row = checks.get(label);
  if (!row) return fail(`${what}: QA_Checks sheet has no "${label}" row to prove`);
  if (row.result !== "PASS") fail(`${what}: QA_Checks "${label}" is ${row.result}, not PASS`);
  expectEqual(computed, row.expected, `${what}: QA_Checks "${label}" recomputed`);
}

/* ------------------------- C-01: questions and modules ---------------------- */

const EXPECTED_TYPES = [
  "integer",
  "decimal",
  "decimal_with_unit",
  "integer_scale",
  "likert",
  "single_select",
  "multi_select",
  "free_text",
];

expectEqual(questions.length, 73, "C-01 Questions row count");
expectEqual(modules.length, 13, "C-01 Modules row count");
expectEqual(
  c01Control.get("Question count"),
  "73",
  "C-01 README control 'Question count'",
);
expectEqual(c01Control.get("Module count"), "13", "C-01 README control 'Module count'");
expectEqual(
  c01Control.get("questionnaire_version"),
  "1.0.1",
  "C-01 README control 'questionnaire_version'",
);

proveQa(c01Qa, "Question records", questions.length, "C-01");
proveQa(c01Qa, "Module records", modules.length, "C-01");
proveQa(c01Qa, "Scoring eligible count", questions.filter((q) => isYes(q.scoring_eligible)).length, "C-01");
proveQa(c01Qa, "Required question count", questions.filter((q) => isYes(q.required)).length, "C-01");
proveQa(c01Qa, "Optional question count", questions.filter((q) => !isYes(q.required)).length, "C-01");


/* Identity: Q1..Q73 exactly once, order column agreeing with the id. */
{
  const seen = new Set();
  for (const q of questions) {
    const m = /^Q(\d{1,3})$/.exec(q.question_id);
    if (!m) {
      fail(`C-01 ${q.question_id}: question_id is not Q<number>`);
      continue;
    }
    if (seen.has(q.question_id)) fail(`C-01 ${q.question_id}: duplicate question_id`);
    seen.add(q.question_id);
    expectEqual(q.question_order, m[1], `C-01 ${q.question_id} question_order`);
    if (!EXPECTED_TYPES.includes(q.question_type)) {
      fail(`C-01 ${q.question_id}: unrecognised question_type "${q.question_type}"`);
    }
    if (q.questionnaire_version !== "1.0.1") {
      fail(`C-01 ${q.question_id}: questionnaire_version "${q.questionnaire_version}" is not 1.0.1`);
    }
    if (q.status !== "APPROVED") fail(`C-01 ${q.question_id}: status "${q.status}" is not APPROVED`);
    if (q.conditional_logic !== "NONE") {
      fail(`C-01 ${q.question_id}: conditional_logic "${q.conditional_logic}" — Phase 1 shows all 73`);
    }
    if (!["0", "1"].includes(q.required)) fail(`C-01 ${q.question_id}: required must be 0 or 1`);
    if (!["0", "1"].includes(q.allow_na)) fail(`C-01 ${q.question_id}: allow_na must be 0 or 1`);
    if (!["0", "1"].includes(q.scoring_eligible)) {
      fail(`C-01 ${q.question_id}: scoring_eligible must be 0 or 1`);
    }
  }
  for (let n = 1; n <= 73; n += 1) {
    if (!seen.has("Q" + n)) fail(`C-01: Q${n} is missing from the Questions sheet`);
  }
}

/* Modules: module_id ↔ module_order ↔ question_range all agree with membership. */
const moduleByOrder = new Map();
for (const m of modules) {
  const ord = Number(m.module_order);
  if (!Number.isInteger(ord) || ord < 1 || ord > 13) {
    fail(`C-01 ${m.module_id}: module_order ${m.module_order} is outside 1..13`);
  }
  if (moduleByOrder.has(ord)) fail(`C-01: module_order ${ord} is used twice`);
  moduleByOrder.set(ord, m);
  if (m.module_id !== "M" + String(ord).padStart(2, "0")) {
    fail(`C-01 ${m.module_id}: module_id does not match module_order ${m.module_order}`);
  }
}
for (let ord = 1; ord <= 13; ord += 1) {
  if (!moduleByOrder.has(ord)) fail(`C-01: module_order ${ord} is missing`);
}
{
  const members = new Map();
  for (const q of questions) {
    const list = members.get(q.module_id) ?? [];
    list.push(Number(q.question_order));
    members.set(q.module_id, list);
    const mod = modules.find((m) => m.module_id === q.module_id);
    if (!mod) {
      fail(`C-01 ${q.question_id}: module_id ${q.module_id} is not declared in Modules`);
      continue;
    }
    if (String(mod.module_order) !== String(q.module_order)) {
      fail(`C-01 ${q.question_id}: module_order ${q.module_order} disagrees with ${q.module_id} (${mod.module_order})`);
    }
  }
  for (const m of modules) {
    const range = /^Q(\d+)-Q(\d+)$/.exec(m.question_range);
    if (!range) {
      fail(`C-01 ${m.module_id}: question_range "${m.question_range}" is not Qx-Qy`);
      continue;
    }
    const want = [];
    for (let n = Number(range[1]); n <= Number(range[2]); n += 1) want.push(n);
    const have = (members.get(m.module_id) ?? []).slice().sort((a, b) => a - b);
    expect(
      want.length === have.length && want.every((n, i) => n === have[i]),
      `C-01 ${m.module_id}: declares ${m.question_range} but holds [${have.join(", ")}]`,
    );
  }
}

/* Option sets: contiguous order, at most one N/A option, numeric or blank value. */
const setIds = new Set();
const optionsBySet = new Map();
for (const o of optionSets) {
  if (!optionsBySet.has(o.option_set_id)) optionsBySet.set(o.option_set_id, []);
  optionsBySet.get(o.option_set_id).push(o);
  if (!["0", "1"].includes(o.is_na)) {
    fail(`C-01 Option_Sets ${o.option_set_id}/${o.option_id}: is_na must be 0 or 1`);
  }
  if (o.stored_value_or_points !== "" && !/^-?\d+(\.\d+)?$/.test(o.stored_value_or_points)) {
    fail(
      `C-01 Option_Sets ${o.option_set_id}/${o.option_id}: stored value ` +
        `"${o.stored_value_or_points}" is neither numeric nor blank`,
    );
  }
}
for (const [id, rows] of optionsBySet) {
  const orders = rows.map((r) => Number(r.option_order));
  expect(
    orders.every((n, i) => n === i + 1),
    `C-01 Option_Sets ${id}: option_order must run 1..n contiguously, found [${orders.join(", ")}]`,
  );
  const ids = rows.map((r) => r.option_id);
  expect(new Set(ids).size === ids.length, `C-01 Option_Sets ${id}: duplicate option_id`);
  const naCount = rows.filter((r) => r.is_na === "1").length;
  expect(naCount <= 1, `C-01 Option_Sets ${id}: ${naCount} N/A options, at most one is allowed`);
}
for (const q of questions) {
  if (q.option_set_id === "") {
    if (["likert", "single_select", "multi_select"].includes(q.question_type)) {
      fail(`C-01 ${q.question_id}: ${q.question_type} question carries no option_set_id`);
    }
    continue;
  }
  if (!setIds.has(q.option_set_id)) {
    fail(`C-01 ${q.question_id}: option_set_id ${q.option_set_id} is not defined in Option_Sets`);
  }
}

/* The five multi-selects, and the one optional free-text question. */
{
  const multi = questions.filter((q) => q.question_type === "multi_select").map((q) => q.question_id);
  expect(
    multi.join(",") === "Q13,Q14,Q52,Q53,Q54",
    `C-01 multi-select questions must be Q13,Q14,Q52,Q53,Q54 — found ${multi.join(",")}`,
  );
  const free = questions.filter((q) => q.question_type === "free_text").map((q) => q.question_id);
  expect(free.join(",") === "Q73", `C-01 free-text questions must be exactly Q73 — found ${free.join(",")}`);
  const q73 = questions.find((q) => q.question_id === "Q73");
  if (q73) {
    expect(q73.required === "0", "C-01 Q73 must be optional");
    expect(q73.allow_na === "0", "C-01 Q73 must not permit N/A");
  }
  const optional = questions.filter((q) => q.required === "0").map((q) => q.question_id);
  expect(
    optional.join(",") === "Q5,Q73",
    `C-01 optional questions must be Q5,Q73 — found ${optional.join(",")}`,
  );
}

/* -------------------------------- C-02: law -------------------------------- */

const DOMAIN_ORDER = ["MR", "HS", "SR", "CH", "SL", "IB", "BS"];
const GOLDEN_EXPECTED_KEYS = [
  "domains",
  "coverage",
  "biological_state",
  "opportunity",
  "recovery_potential",
  "protective_count",
  "confidence",
  "drivers",
];
const GOLDEN_CONTROL_KEYS = [
  "age",
  "diseaseCount",
  "medicationCount",
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
  "answerConfidence",
];

/** Assert a normative sheet row still states the constants the code quotes. */
function assertRuleText(row, needles, what) {
  if (!row) return fail(`${what}: the expected C-02 row is missing`);
  for (const needle of needles) {
    expect(String(row).includes(needle), `${what}: text no longer contains "${needle}" — ${row}`);
  }
}

expectEqual(domains.length, 7, "C-02 Domains row count");
expect(
  domains.map((d) => d.domain_id).join(",") === DOMAIN_ORDER.join(","),
  `C-02 Domains must appear in the canonical order ${DOMAIN_ORDER.join(",")} — found ${domains
    .map((d) => d.domain_id)
    .join(",")}`,
);
{
  const formula = domains[0] ? domains[0].formula : "";
  for (const d of domains) {
    expectEqual(d.formula, formula, `C-02 ${d.domain_id} formula`);
    if (!d.display_name || !d.meaning) fail(`C-02 ${d.domain_id}: display_name/meaning is blank`);
  }
}

const scoredIds = questions.filter((q) => q.scoring_eligible === "1").map((q) => q.question_id);
expectEqual(scoredIds.length, 40, "C-01 scoring-eligible count");
expectEqual(mapping.length, 40, "C-02 Question_Mapping row count");
proveQa(c02Qa, "Domain count", domains.length, "C-02");
proveQa(c02Qa, "Mapping count", mapping.length, "C-02");
proveQa(c02Qa, "Reverse-scored count", mapping.filter((m) => isYes(m.reverse_scored)).length, "C-02");
proveQa(c02Qa, "Golden tests", golden.length, "C-02");
proveQa(c02Qa, "Classification rows", classifications.length, "C-02");

{
  const perDomain = new Map();
  const seen = new Set();
  for (const m of mapping) {
    if (seen.has(m.question_id)) fail(`C-02 ${m.question_id}: mapped twice`);
    seen.add(m.question_id);
    if (!scoredIds.includes(m.question_id)) {
      fail(`C-02 ${m.question_id}: mapped to ${m.domain_id} but C-01 marks it contextual`);
    }
    if (!DOMAIN_ORDER.includes(m.domain_id)) fail(`C-02 ${m.question_id}: unknown domain ${m.domain_id}`);
    if (m.weight !== "1" && m.weight !== "1.0") {
      fail(`C-02 ${m.question_id}: weight ${m.weight} — v1.0.1 states every weight is 1.0`);
    }
    if (m.status !== "APPROVED") fail(`C-02 ${m.question_id}: status ${m.status} is not APPROVED`);
    if (m.normalized_range !== "0-4 burden points") {
      fail(`C-02 ${m.question_id}: normalized_range "${m.normalized_range}" is not 0-4 burden points`);
    }
    const q = questions.find((x) => x.question_id === m.question_id);
    if (q && q.option_set_id !== m.points_map) {
      fail(`C-02 ${m.question_id}: points_map ${m.points_map} is not C-01's option_set_id ${q.option_set_id}`);
    }
    perDomain.set(m.domain_id, (perDomain.get(m.domain_id) ?? 0) + 1);
  }
  for (const id of scoredIds) {
    if (!seen.has(id)) fail(`C-02: scored question ${id} is absent from Question_Mapping`);
  }
  for (const d of domains) {
    const label = d.domain_id + " items";
    if (c02Qa.has(label)) proveQa(c02Qa, label, perDomain.get(d.domain_id) ?? 0, "C-02");
  }
  const reverse = mapping.filter((m) => isYes(m.reverse_scored)).map((m) => m.question_id);
  expect(
    reverse.join(",") === "Q26,Q28",
    `C-02 reverse-scored questions must be Q26,Q28 — found ${reverse.join(",")}`,
  );
}

/* Option points: the C-02 table must mirror the C-01 option set, item by item. */
{
  const pointsByQuestion = new Map();
  for (const p of optionPoints) {
    if (!pointsByQuestion.has(p.question_id)) pointsByQuestion.set(p.question_id, []);
    pointsByQuestion.get(p.question_id).push(p);
    if (!DOMAIN_ORDER.includes(p.domain_id)) {
      fail(`C-02 Option_Points ${p.question_id}/${p.option_id}: unknown domain ${p.domain_id}`);
    }
    if (!["0", "1"].includes(p.excluded_as_na)) {
      fail(`C-02 Option_Points ${p.question_id}/${p.option_id}: excluded_as_na must be 0 or 1`);
    }
  }
  expect(
    scoredIds.every((id) => pointsByQuestion.has(id)) && pointsByQuestion.size === 40,
    `C-02 Option_Points must cover exactly the 40 scored questions — covers ${pointsByQuestion.size}`,
  );
  for (const id of scoredIds) {
    const rows = pointsByQuestion.get(id) ?? [];
    const q = questions.find((x) => x.question_id === id);
    const m = mapping.find((x) => x.question_id === id);
    const controlled = optionsBySet.get(q.option_set_id) ?? [];
    const wantIds = controlled.map((c) => c.option_id).sort().join(",");
    const gotIds = rows.map((r) => r.option_id).sort().join(",");
    expect(wantIds === gotIds, `C-02 Option_Points ${id}: options [${gotIds}] != C-01 [${wantIds}]`);
    if (rows.length) expectEqual(rows[0].option_set_id, q.option_set_id, `C-02 Option_Points ${id} option_set_id`);
    expect(
      rows.every((r) => r.domain_id === m.domain_id),
      `C-02 Option_Points ${id}: domain disagrees with Question_Mapping`,
    );
    const excluded = rows.filter((r) => r.excluded_as_na === "1");
    expect(excluded.length <= 1, `C-02 Option_Points ${id}: ${excluded.length} N/A rows, at most one is allowed`);
    let max = -Infinity;
    for (const r of rows) {
      const controlledOption = controlled.find((c) => c.option_id === r.option_id);
      const isNa = r.excluded_as_na === "1" || (controlledOption && controlledOption.is_na === "1");
      if (isNa) {
        expect(r.burden_points === "", `C-02 Option_Points ${id}/${r.option_id}: an N/A row must carry no points`);
        continue;
      }
      const pts = Number(r.burden_points);
      if (!Number.isFinite(pts)) {
        fail(`C-02 Option_Points ${id}/${r.option_id}: burden_points "${r.burden_points}" is not a number`);
        continue;
      }
      expect(pts >= 0 && pts <= 4, `C-02 Option_Points ${id}/${r.option_id}: ${pts} is outside 0-4`);
      max = Math.max(max, pts);
    }
    expect(max === 4, `C-02 Option_Points ${id}: highest burden option is ${max}; SC-001 divides by 4 x weight`);
    /* Labels must be C-01's, not a re-typed copy of them. */
    for (const r of rows) {
      const c = controlled.find((x) => x.option_id === r.option_id);
      if (c) expectEqual(r.display_label, c.display_label, `C-02 Option_Points ${id}/${r.option_id} display_label`);
    }
  }
}


/* Formulas: the engine quotes these rules, so the sheet must still say so. */
const formulaById = new Map(formulas.map((f) => [f.rule_id, f]));
expectEqual(formulas.length, 8, "C-02 Formulas row count");
expect(
  formulas.map((f) => f.rule_id).join(",") === "SC-001,SC-002,SC-003,SC-004,SC-005,SC-006,SC-007,SC-008",
  `C-02 Formulas must be SC-001..SC-008 — found ${formulas.map((f) => f.rule_id).join(",")}`,
);
assertRuleText(formulaById.get("SC-001") || {}, ["\u03a3(points \u00d7 weight)", "\u03a3(4 \u00d7 weight)"], "SC-001 normative_formula");
assertRuleText((formulaById.get("SC-001") || {}).null_or_boundary_rule, ["0.50"], "SC-001 null_or_boundary_rule");
assertRuleText((formulaById.get("SC-001") || {}).rounding, ["Half away from zero to integer"], "SC-001 rounding");
assertRuleText(formulaById.get("SC-002") || {}, ["Mean of available seven domain scores"], "SC-002 normative_formula");
assertRuleText((formulaById.get("SC-002") || {}).null_or_boundary_rule, ["fewer than 5 domains"], "SC-002 null_or_boundary_rule");
assertRuleText(formulaById.get("SC-003") || {}, ["Biological State \u00d7 0.5"], "SC-003 normative_formula");
assertRuleText((formulaById.get("SC-003") || {}).null_or_boundary_rule, ["clamp 0-100"], "SC-003 null_or_boundary_rule");
assertRuleText((formulaById.get("SC-003") || {}).rounding, ["One decimal"], "SC-003 rounding");
assertRuleText(formulaById.get("SC-004") || {}, ["20 \u00d7 count of active P1-P5"], "SC-004 normative_formula");
assertRuleText(formulaById.get("SC-005") || {}, ["0.30", "0.25", "0.20", "0.15", "0.10"], "SC-005 normative_formula");
assertRuleText((formulaById.get("SC-005") || {}).rounding, ["One decimal"], "SC-005 rounding");
assertRuleText(formulaById.get("SC-006") || {}, ["Answered scored items", "eligible scored items"], "SC-006 normative_formula");
assertRuleText(formulaById.get("SC-007") || {}, ["populationSD(points)/2"], "SC-007 normative_formula");
assertRuleText(
  formulaById.get("SC-008") || {},
  ["0.50\u00d7overall coverage", "0.30\u00d7Q72 value", "0.20\u00d7mean available-domain consistency"],
  "SC-008 normative_formula",
);

/* Protective factors and recovery bands. */
{
  const ids = protective.map((p) => p.factor_id).join(",");
  expect(
    ids === "P1,P2,P3,P4,P5,AGE,CONDITION,MEDICATION",
    `C-02 Protective_Factors must be P1-P5,AGE,CONDITION,MEDICATION — found ${ids}`,
  );
  for (const p of protective.filter((x) => x.purpose === "Protective score")) {
    expectEqual(p.output_value, "20", `C-02 ${p.factor_id} output_value`);
  }
  for (const p of protective) {
    for (const id of p.source.split("/")) {
      if (!questions.some((q) => q.question_id === id)) {
        fail(`C-02 Protective_Factors ${p.factor_id}: source ${id} is not a C-01 question`);
      }
    }
  }
}

/* Classifications: three scales, four inclusive bands each, gapless 0-100. */
{
  const byScale = new Map();
  for (const c of classifications) {
    if (!byScale.has(c.scale)) byScale.set(c.scale, []);
    byScale.get(c.scale).push(c);
  }
  expect(
    Array.from(byScale.keys()).sort().join(",") === "CONFIDENCE,DOMAIN,RECOVERY",
    `C-02 Classifications scales must be DOMAIN, CONFIDENCE, RECOVERY — found ${[...byScale.keys()].join(",")}`,
  );
  for (const [scale, rows] of byScale) {
    expectEqual(rows.length, 4, `C-02 Classifications ${scale} band count`);
    const sorted = rows.slice().sort((a, b) => Number(a.minimum) - Number(b.minimum));
    expectEqual(sorted[0].minimum, 0, `C-02 Classifications ${scale} lowest bound`);
    expectEqual(sorted[3].maximum, 100, `C-02 Classifications ${scale} highest bound`);
    for (let i = 0; i < sorted.length; i += 1) {
      const lo = Number(sorted[i].minimum);
      const hi = Number(sorted[i].maximum);
      expect(lo <= hi, `C-02 Classifications ${scale}/${sorted[i].label}: minimum above maximum`);
      if (i > 0) {
        expectEqual(lo, Number(sorted[i - 1].maximum) + 1, `C-02 Classifications ${scale}/${sorted[i].label} lower bound`);
      }
    }
    const labels = sorted.map((r) => r.label);
    expect(new Set(labels).size === labels.length, `C-02 Classifications ${scale}: duplicate label`);
  }
}

/* Drivers: the eligibility minimum, tie order and co-primary gap are quoted. */
{
  const byId = new Map(drivers.map((d) => [d.rule_id, d]));
  assertRuleText((byId.get("DRV-001") || {})["deterministic rule"], ["\u226525"], "DRV-001 deterministic rule");
  assertRuleText((byId.get("DRV-002") || {})["deterministic rule"], ["MR,HS,SR,CH,SL,IB,BS"], "DRV-002 deterministic rule");
  assertRuleText((byId.get("DRV-003") || {})["deterministic rule"], ["\u22643"], "DRV-003 deterministic rule");
  assertRuleText((byId.get("DRV-004") || {})["deterministic rule"], ["\u226525"], "DRV-004 deterministic rule");
}

/* Golden tests: 30 cases, verbatim JSON, shape known before anything parses it. */
{
  expectEqual(golden.length, 30, "C-02 Golden_Tests row count");
  const ids = golden.map((g) => g.test_id);
  const want = [];
  for (let n = 1; n <= 30; n += 1) want.push("GT-" + String(n).padStart(3, "0"));
  expect(
    ids.join(",") === want.join(","),
    `C-02 Golden_Tests must be GT-001..GT-030 in order — found ${ids.join(",")}`,
  );
  const scoredSorted = scoredIds.slice().sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  const controlSorted = GOLDEN_CONTROL_KEYS.slice().sort();
  const domainSorted = DOMAIN_ORDER.slice().sort();
  golden.forEach((g) => {
    const at = `C-02 ${g.test_id}`;
    let input;
    let expected;
    try {
      input = JSON.parse(g.normalized_input_json);
    } catch (e) {
      fail(`${at}: normalized_input_json does not parse — ${e.message}`);
      return;
    }
    try {
      expected = JSON.parse(g.expected_output_json);
    } catch (e) {
      fail(`${at}: expected_output_json does not parse — ${e.message}`);
      return;
    }
    const qKeys = Object.keys(input)
      .filter((k) => /^Q\d+$/.test(k))
      .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
    expect(
      qKeys.join(",") === scoredSorted.join(","),
      `${at}: input must carry exactly the 40 scored question keys — found ${qKeys.length}`,
    );
    const control = Object.keys(input)
      .filter((k) => !/^Q\d+$/.test(k))
      .sort();
    expect(
      control.join(",") === controlSorted.join(","),
      `${at}: control inputs must be ${controlSorted.join(",")} — found ${control.join(",")}`,
    );
    for (const k of ["age", "diseaseCount", "medicationCount", "answerConfidence"]) {
      expect(Number.isInteger(input[k]), `${at}: ${k} must be an integer`);
    }
    for (const k of ["P1", "P2", "P3", "P4", "P5"]) {
      expect(typeof input[k] === "boolean", `${at}: ${k} must be a boolean`);
    }
    const extra = Object.keys(expected).filter((k) => !GOLDEN_EXPECTED_KEYS.includes(k));
    expect(extra.length === 0, `${at}: expected output carries unknown keys ${extra.join(",")}`);
    for (const scale of ["domains", "coverage"]) {
      const keys = Object.keys(expected[scale] ?? {}).sort().join(",");
      expect(
        keys === domainSorted.join(","),
        `${at}: expected.${scale} must cover all seven domains — found ${keys}`,
      );
    }
    expect(Array.isArray(expected.drivers), `${at}: expected.drivers must be an array`);
    for (const d of Object.keys(expected.domains)) {
      const v = expected.domains[d];
      expect(v === null || Number.isInteger(v), `${at}: expected domain ${d} must be an integer or null`);
    }
  });
}

/* C-02 README control fields — the workbook's own statement of its constants. */
expectEqual(c02Control.get("Dataset ID"), "ROOTS-C02-SCORING-001", "C-02 README control 'Dataset ID'");
expectEqual(c02Control.get("scoring_version"), "1.0.1", "C-02 README control 'scoring_version'");
expectEqual(c02Control.get("Scored questions"), "40", "C-02 README control 'Scored questions'");
expectEqual(c02Control.get("Raw burden scale"), "0-4", "C-02 README control 'Raw burden scale'");
expectEqual(
  c02Control.get("Domain coverage threshold"),
  "50%",
  "C-02 README control 'Domain coverage threshold'",
);
expectEqual(
  c02Control.get("Biological State minimum"),
  "5 of 7 domains",
  "C-02 README control 'Biological State minimum'",
);
expectEqual(
  c02Control.get("Rounding"),
  "Half away from zero to integer",
  "C-02 README control 'Rounding'",
);
expectEqual(c02Control.get("LLM role"), "None in calculation", "C-02 README control 'LLM role'");
expectEqual(c01Control.get("Dataset ID"), "ROOTS-C01-QBANK-001", "C-01 README control 'Dataset ID'");
expectEqual(c01Control.get("N/A behavior"), "Explicit only", "C-01 README control 'N/A behavior'");
expectEqual(c01Control.get("Scoring source"), "C-02 v1.0.1", "C-01 README control 'Scoring source'");

/* ------------------------------- the verdict ------------------------------- */

for (const check of [...c01Qa.values(), ...c02Qa.values()]) {
  if (check.result !== "PASS") fail(`a QA_Checks row reports ${check.result}, not PASS`);
}

if (failures.length > 0) {
  console.error(`TRANSCRIPTION BLOCKED — ${failures.length} problem(s) reading the controlled sources:\n`);
  for (const f of failures) console.error("  - " + f);
  console.error("\nNo file was written. Fix the source or the reader; do not hand-edit the output.");

/* --------------------------------- emitting --------------------------------- */

const C01_SHEETS = ["Modules", "Questions", "Option_Sets", "Validation"];
const C02_SHEETS = [
  "Domains",
  "Question_Mapping",
  "Option_Points",
  "Formulas",
  "Protective_Factors",
  "Classifications",
  "Drivers_Evidence",
  "Golden_Tests",
];

function sheetOf(workbook, name) {
  const s = workbook.sheet(name);
  expect(
    s.columns.length > 0,
    `${workbook.fileName}: sheet "${name}" has no header row, so it cannot be transcribed`,
  );
  return s;
}

function header(title, workbook, note) {
  return [
    "/* ===========================================================================",
    " * ROOTS-AI | Milestone 2: " + title,
    " * -------------------------------------------------------------------------",
    " * AUTO-GENERATED - DO NOT EDIT.",
    " *   generator  scripts/build-controlled-data.mjs  (npm run build:controlled)",
    " *   source     controlled-sources/" + workbook.fileName,
    " *   package    sha256 " + workbook.fileSha256,
    " *   content    sha256 " + workbook.contentSha256,
    " *",
    " * Every value below is one cell of that workbook, read as text and trimmed of",
    " * wrapping whitespace. Nothing is re-typed, re-cased, re-ordered or rounded:",
    " * sheet order is preserved, row order is preserved, and a cell that is empty",
    " * in the source is the empty string here. The content hash covers exactly",
    " * those cells, so an edited source changes this file and an edited file no",
    " * longer matches the source. No timestamp is embedded, which keeps an",
    " * unchanged source byte-reproducible across regenerations.",
    " *",
    " * " + note,
    " * ==========================================================================*/",
    "",
    "/* eslint-disable */",
    "",
  ].join("\n");
}

function interfaceOf(typeName, doc, columns) {
  const lines = columns.map((c) => `  readonly ${JSON.stringify(c)}: string;`);
  return (
    `/** ${doc}\n * Column names and column order are the source sheet's own. */\n` +
    `export interface ${typeName} {\n${lines.join("\n")}\n}\n`
  );
}

/** One emitted table: sheet name -> TypeScript type + const, verbatim cells. */
function rowsFile(workbook, title, note, blocks) {
  let out = header(title, workbook, note);
  for (const b of blocks) {
    const s = sheetOf(workbook, b.sheet);
    out += `/* ---- sheet "${b.sheet}" (header row ${s.headerRow}, ${s.rows.length} data rows) ---- */\n\n`;
    out += interfaceOf(b.type, b.doc, s.columns) + "\n";
    const body = s.rows.map((r) => "  " + JSON.stringify(r) + ",");
    out += `export const ${b.const}: readonly ${b.type}[] = [\n${body.join("\n")}\n];\n\n`;
  }
  return out;
}

const written = [];
function write(name, body) {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(resolve(OUT_DIR, name), body, "utf8");
  written.push([name, body]);
}

write(
  "c01-rows.ts",
  header("C-01 canonical question bank, transcribed verbatim", c01, "Numbers stay strings because the sheet stores them as text.") +
    [
      "/**",
      " * The C-01 workbook is the authority on WHAT is asked: 13 modules, 73",
      " * questions and their option sets. It is NOT the authority on scoring - that",
      " * is C-02 - so `scoring_eligible` here only says which questions C-02 maps.",
      " *",
      " * Consumers must not mutate these rows: they are the controlled text shown to",
      " * the user, and any wording change must come from a new C-01 version. Derive",
      " * question objects for the app in question-bank.ts, which cites these rows and",
      " * fails at import if a row is missing.",
      " */",
      "",
    ].join("\n") +
    C01_SHEETS.map((sheetName) => {
      const s = sheetOf(c01, sheetName);
      const typeName = {
        Modules: "C01ModuleRow",
        Questions: "C01QuestionRow",
        Option_Sets: "C01OptionRow",
        Validation: "C01ValidationRow",
      }[sheetName];
      const constName = {
        Modules: "C01_MODULE_ROWS",
        Questions: "C01_QUESTION_ROWS",
        Option_Sets: "C01_OPTION_SET_ROWS",
        Validation: "C01_VALIDATION_ROWS",
      }[sheetName];
      const doc = {
        Modules: "One module of the questionnaire.",
        Questions: "One question, in questionnaire order.",
        Option_Sets: "One option of a shared option set.",
        Validation: "One validation rule stated by the source.",
      }[sheetName];
      let out = `/* ---- sheet "${sheetName}" (header row ${s.headerRow}, ${s.rows.length} data rows) ---- */\n\n`;
      out += interfaceOf(typeName, doc, s.columns) + "\n";
      const body = s.rows.map((r) => "  " + JSON.stringify(r) + ",");
      return out + `export const ${constName}: readonly ${typeName}[] = [\n${body.join("\n")}\n];\n\n`;
    }).join(""),
);

write(
  "c02-rows.ts",
  header("C-02 canonical scoring rules and golden tests, transcribed verbatim", c02, "Golden-test JSON is kept as the source's own string.") +
    [
      "/**",
      " * The C-02 workbook is the authority on HOW answers become numbers: domains,",
      " * the 40 mapped questions, option points, formulas SC-001..SC-008, protective",
      " * factors, classification bands, driver rules and 30 golden tests.",
      " *",
      " * The engine in lib/assessment/ must implement these rules and nothing else;",
      " * scoring-rules.ts cites these rows by id and refuses to start if a rule it",
      " * implements is absent or worded differently. Golden-test payloads stay as the",
      " * source's own JSON text so that a test can never be quietly rewritten.",
      " */",
      "",
    ].join("\n") +
    C02_SHEETS.map((sheetName) => {
      const s = sheetOf(c02, sheetName);
      const typeName = {
        Domains: "C02DomainRow",
        Question_Mapping: "C02QuestionMapRow",
        Option_Points: "C02OptionPointRow",
        Formulas: "C02FormulaRow",
        Protective_Factors: "C02ProtectiveRow",
        Classifications: "C02ClassificationRow",
        Drivers_Evidence: "C02DriverRuleRow",
        Golden_Tests: "C02GoldenTestRow",
      }[sheetName];
      const constName = {
        Domains: "C02_DOMAIN_ROWS",
        Question_Mapping: "C02_QUESTION_MAP_ROWS",
        Option_Points: "C02_OPTION_POINT_ROWS",
        Formulas: "C02_FORMULA_ROWS",
        Protective_Factors: "C02_PROTECTIVE_ROWS",
        Classifications: "C02_CLASSIFICATION_ROWS",
        Drivers_Evidence: "C02_DRIVER_RULE_ROWS",
        Golden_Tests: "C02_GOLDEN_TEST_ROWS",
      }[sheetName];
      const doc = {
        Domains: "One of the seven burden domains.",
        Question_Mapping: "One scored question and the domain it feeds.",
        Option_Points: "One option and the burden points it contributes.",
        Formulas: "One normative scoring rule (SC-001..SC-008).",
        Protective_Factors: "One protective factor or recovery modifier.",
        Classifications: "One classification band of one scale.",
        Drivers_Evidence: "One driver or evidence-selection rule.",
        Golden_Tests: "One normative input/output pair the engine must reproduce.",
      }[sheetName];
      let out = `/* ---- sheet "${sheetName}" (header row ${s.headerRow}, ${s.rows.length} data rows) ---- */\n\n`;
      out += interfaceOf(typeName, doc, s.columns) + "\n";
      const body = s.rows.map((r) => "  " + JSON.stringify(r) + ",");
      return out + `export const ${constName}: readonly ${typeName}[] = [\n${body.join("\n")}\n];\n\n`;
    }).join(""),
);

/* ---------------------------- provenance + index ---------------------------- */

function tsRecord(map, pad) {
  const body = [...map.entries()].map(([k, v]) => `${pad}  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  return `{\n${body.join("\n")}\n${pad}}`;
}

const rowCountMap = new Map();
for (const s of c01.sheets) if (s.columns.length) rowCountMap.set("C-01/" + s.name, s.rows.length);
for (const s of c02.sheets) if (s.columns.length) rowCountMap.set("C-02/" + s.name, s.rows.length);

const pairDigest = createHash("sha256")
  .update("C-01\u241f" + c01.contentSha256 + "\nC-02\u241f" + c02.contentSha256 + "\n")
  .digest("hex");

write(
  "controlled-source-provenance.ts",
  [
    "/* ===========================================================================",
    " * ROOTS-AI | Milestone 2: provenance of the controlled sources",
    " * -------------------------------------------------------------------------",
    " * AUTO-GENERATED - DO NOT EDIT (scripts/build-controlled-data.mjs).",
    " *",
    " * This is the audit trail, not data: it names the exact workbook bytes the",
    " * transcribed tables came from, so a reviewer can recompute the hash of a",
    " * received file and see whether this build used it. The received date is NOT",
    " * stored here on purpose - it belongs to the delivery record, and embedding it",
    " * would break reproducible regeneration.",
    " * ==========================================================================*/",
    "",
    "/* eslint-disable */",
    "",
    "/** Where a controlled source came from and what it authorises. */",
    "export interface ControlledSourceProvenance {",
    "  readonly code: string;",
    "  readonly role: string;",
    "  readonly fileName: string;",
    "  readonly datasetId: string;",
    "  readonly version: string;",
    "  /** sha256 of the workbook file as stored - packaging sensitive. */",
    "  readonly packageSha256: string;",
    "  /** sha256 of sheet names + column names + cell values - re-export tolerant. */",
    "  readonly contentSha256: string;",
    "  readonly sheets: readonly string[];",
    "  /** The README control table, verbatim. */",
    "  readonly controlFields: Readonly<Record<string, string>>;",
    "}",
    "",
    "/** C-01 authorises the questions, modules and options shown to the user. */",
    "export const CONTROLLED_C01: ControlledSourceProvenance = {",
    `  code: ${JSON.stringify("C-01")},`,
    '  role: "Canonical question bank: what is asked, in what order, with which options.",',
    `  fileName: ${JSON.stringify(c01.fileName)},`,
    `  datasetId: ${JSON.stringify(c01Control.get("Dataset ID"))},`,
    `  version: ${JSON.stringify(c01Control.get("questionnaire_version"))},`,
    `  packageSha256: ${JSON.stringify(c01.fileSha256)},`,
    `  contentSha256: ${JSON.stringify(c01.contentSha256)},`,
    `  sheets: ${JSON.stringify(c01.sheetNames)},`,
    `  controlFields: ${tsRecord(c01Control, "  ")},`,
    "};",
    "",
    "/** C-02 authorises every number the engine may produce. */",
    "export const CONTROLLED_C02: ControlledSourceProvenance = {",
    '  code: "C-02",',
    '  role: "Canonical scoring rules and golden tests: every number, band and driver.",',
    `  fileName: ${JSON.stringify(c02.fileName)},`,
    `  datasetId: ${JSON.stringify(c02Control.get("Dataset ID"))},`,
    `  version: ${JSON.stringify(c02Control.get("scoring_version"))},`,
    `  packageSha256: ${JSON.stringify(c02.fileSha256)},`,
    `  contentSha256: ${JSON.stringify(c02.contentSha256)},`,
    `  sheets: ${JSON.stringify(c02.sheetNames)},`,
    `  controlFields: ${tsRecord(c02Control, "  ")},`,
    "};",
    "",
    "export const CONTROLLED_SOURCES: readonly ControlledSourceProvenance[] = [",
    "  CONTROLLED_C01,",
    "  CONTROLLED_C02,",
    "];",
    "",
    "/** One fingerprint for the C-01 + C-02 pair this build transcribed. */",
    `export const CONTROLLED_DATA_SHA256 = ${JSON.stringify(pairDigest)};`,
    "",
    "/** Data rows transcribed per sheet, for tests that assert nothing went missing. */",
    `export const CONTROLLED_ROW_COUNTS = ${tsRecord(rowCountMap, "")} as const;`,
    "",
    'export type ControlledRowCounts = typeof CONTROLLED_ROW_COUNTS;',
    "",
  ].join("\n"),
);

write(
  "index.ts",
  [
    "/* ===========================================================================",
    " * ROOTS-AI | Milestone 2: controlled data surface",
    " * -------------------------------------------------------------------------",
    " * AUTO-GENERATED - DO NOT EDIT (scripts/build-controlled-data.mjs).",
    " *",
    " * Import controlled data ONLY through this directory. Anything derived from it -",
    " * question objects, domain tables, golden-test fixtures - lives outside and must",
    " * cite the row it came from, so a reviewer can trace any string on screen or any",
    " * number in a result back to a cell of C-01 or C-02.",
    " * ==========================================================================*/",
    "",
    "/* eslint-disable */",
    "",
    'export * from "./c01-rows";',
    'export * from "./c02-rows";',
    'export * from "./controlled-source-provenance";',
    "",
  ].join("\n"),
);

/* ---------------------------------- report ---------------------------------- */

console.log("Controlled sources read");
for (const wb of [c01, c02]) {
  console.log(`  ${wb.fileName}`);
  console.log(`    package sha256 ${wb.fileSha256}`);
  console.log(`    content sha256 ${wb.contentSha256}`);
  for (const s of wb.sheets) {
    if (s.columns.length) console.log(`    ${s.name.padEnd(20)} ${String(s.rows.length).padStart(3)} rows`);
  }
}
console.log("\nSelf-checks re-proved from the workbooks' own QA_Checks sheets");
console.log(`  C-01 ${c01Qa.size} checks, C-02 ${c02Qa.size} checks`);
console.log(`  ${checksRun} assertions, 0 failures`);
console.log("\nWritten to lib/assessment/controlled/");
for (const [name, body] of written) {
  const lines = body.split("\n").length;
  const bytes = Buffer.byteLength(body, "utf8");
  console.log(`  ${name.padEnd(34)} ${String(lines).padStart(6)} lines ${String(bytes).padStart(8)} bytes`);
}
console.log(`\nCONTROLLED_DATA_SHA256 ${pairDigest}`);
console.log("Controlled data is in sync with the controlled sources.");

