# ROOTS-AI™ — M2 open items, conflicts and data request

Status register for the M2 data structures. Companion to
`ROOTS-AI_M2_Strict_Implementation_Blueprint.md`, which remains the controlling
document. Nothing here is resolved by assumption: each item needs a decision or a
controlled source before the affected code is written.

---

## 1. BLOCKING — the controlled C-01 and C-02 data are not in this repository

The M2 structures are built and type-checking, but they are **empty by design**.
No question, option label, burden value, weight, band boundary or expected Golden
Test output has been written, because none of it exists in the repository to copy
from. Inventing it would produce a questionnaire that looks canonical and scores
wrong, and Golden Tests written against our own guesses would pass 30/30 while
proving nothing.

**Please provide the raw controlled sources**, in whichever form is easiest:

| Item | Needed | Any of these forms |
|---|---|---|
| **C-01 v1.0.1 CORRECTED** — Canonical Question Bank | all 73 questions, their placement in the 13 modules, prompts, option labels and order, burden values on the 0.0–4.0 scale, required/optional marking, scoring-eligible marking, N/A permission, and the multi-select / NONE-option rules for Q13, Q14, Q52, Q53, Q54 | `.xlsx` (preferred), PDF, CSV, or pasted tables |
| **C-02 v1.0.1 CORRECTED** — Scoring Rules & Golden Tests | the formulas sheet, the question→domain map with weights and direction, classification bands with their inclusive/exclusive rule, driver eligibility and output count, rounding per scale, and all 30 Golden Tests with their expected outputs | `.xlsx` (preferred), PDF, CSV, or pasted tables |

Preferred: the two `.xlsx` workbooks plus the SHA-256 of each as received, so
`C01_SOURCE` / `C02_SOURCE` carry real provenance and a later re-export can be
proven content-equivalent instead of re-typed by hand.

**Once received, the work is mechanical**: transcribe, flip `populated` to `true`,
run `validateCanonicalStructure()`. It must report **0 violations** before any
scoring code or Golden Test run is accepted.

---

## 2. Conflict — the domain code sets do not match (needs a decision)

| Source | Domain codes |
|---|---|
| Blueprint §3–§4 (C-02 driver logic) | `MR, HS, SR, CH, SL, IB, BS` — 7, `BS = Biological Safety Signals™` |
| M1 migration `0001` + generated `DomainCode` | `HU, SL, ME, CI, SA, ST, IN` — 7 |
| `design_tokens.json` → `color.domains` | `HU, SL, ME, CI, SA, ST, IN` — 7 |

All three hold exactly seven codes and all three support a "5 of 7" BIO_STATE rule,
but only `SL` appears in both sets. So this is not one set renamed into the other,
and **no mapping has been invented** — inventing one would silently re-route every
domain score into the wrong domain.

The M2 types are currently built on the **Blueprint §4 set**, because §4 states it
as the fixed tie-break order and the Agent Directive makes the Blueprint
controlling for M2. That choice is recorded here rather than buried in code.

`responses.domain_code` and the `scores` columns (`hu, sl, me, ci, sa, st, ins`)
carry CHECK constraints from M1, so persisting M2 results using the Blueprint codes
would be rejected by the database as it stands.

**Decision needed:** are `MR/HS/SR/CH/SL/IB/BS` canonical and M1's a placeholder
(→ a migration plus a token rename is required), or do the C-01/C-02 sheets use
M1's codes and the Blueprint's abbreviations are informal (→ the M2 types switch)?
The C-01/C-02 sheets settle this; please point at the sheet and column.

---

## 3. Conflict — `null` scores versus NOT NULL columns (needs a decision)

Blueprint §3 requires a domain below the 50% coverage threshold to return `null`,
and BIO_STATE to return `null` below 5 valid domains. M1 `0001` declares all seven
domain columns `numeric NOT NULL` and `biological_state text NOT NULL`.

As written, the first low-coverage assessment cannot be persisted. **No migration
has been written** to relax those constraints: relaxing an M1 data-integrity rule is
a ROOTS decision, not an implementation detail.

---

## 4. Open items the C-01 / C-02 sheets answer directly

| # | Item | Where it is blocked |
|---|---|---|
| 4.1 | Canonical `question_id` format — the Blueprint writes `Q13`, `Q73`; C-01 may use a different scheme. The five multi-select IDs and optional free-text Q73 are pinned to the Blueprint's shorthand meanwhile. | `MULTIPLE_SELECT_QUESTION_IDS` |
| 4.2 | The definitive set of response types. The current union is a superset covering what §2 names plus the shapes a 0.0–4.0 scale implies; unused members should be deleted once C-01 is read. | `QuestionResponseKind` |
| 4.3 | Driver eligibility minimum score, and how many driver entries are produced. Left `null` / `0`; `validateC02()` reports both as `RULE_VALUE_MISSING` rather than assuming the legacy value. | `SCORING_RULES.driverEligibility` |
| 4.4 | Which scales are reported as integers versus one decimal. | `RoundingRule.integerScales` |
| 4.5 | **Recovery Potential classification boundary.** One-decimal values such as `74.5` fall between whole-number inclusive bands (`Moderate 50–74`, `High 75–100`) and are covered by neither. Already raised in the M2 closure record and still unresolved, so **no band logic is encoded** and `classifications` is empty. | `ClassificationSet` |
| 4.6 | Per-question weight and keying direction. | `DomainQuestionMapping` |

---

## 5. Items needed for Blueprint §6 and §7 (outside this step)

- **Design tokens:** `--zd-teal-ink` (`#437971`) and `--zd-gold-ink` (`#886b2e`) do
  not exist anywhere in `design_tokens.json` or `app/globals.css`. The current token
  file is a JSON object (`color.primary/accent/surface/background/text/domains`) and
  contains no `--zd-*` custom property, and no teal or gold value at all. §6's
  text-safe 4.5:1 variants cannot be applied until the approved C-05/C-08 token set
  is supplied or these two values are approved as an addition.
- **44 × 44 px targets (§5 of C-05):** to be enforced when the assessment UI is
  built; no assessment form component exists yet.
- **Golden Test harness (§7):** `package.json` declares `"test": "jest"` and
  `ts-jest` is a devDependency, but there is **no jest config and no test file under
  `tests/`**. The `Test ID → Input → Expected → Actual → PASS/FAIL` matrix needs that
  harness, and it can only be built once the 30 canonical cases exist to run.
- **Terminology:** `lib/report/c03-content.ts` renders singular and plural driver
  sentences. Blueprint §4 requires the exact string
  `"highest-ranked driver(s) in this assessment"`; whether the parenthetical form
  replaces the existing singular/plural pair is a C-03 wording question, so both are
  preserved for now and the required string is recorded as `DRIVER_TERMINOLOGY`.

---

## 6. Explicitly not implemented — the M3 boundary

Held back per the Agent Directive: no AI/LLM narrative generation, no 19-section
PDF report assembly, no external API calls for interpretation, and **no scoring
arithmetic at all** — an engine with no rules to run would be unverifiable, and
fabricating the rules is the one error this milestone must not make. AI has zero
calculation authority under §3, and it will have none over the rules either.

---

## 7. Verification state

`npx tsc --noEmit` over the whole project (M1 included) exits **0**.

`validateCanonicalStructure()` currently reports exactly **two violations**, both
the intended ones:

```
canonical structure: 2 VIOLATION(S)
  [SOURCE_UNPOPULATED] C-01 question bank: C-01 Canonical Question Bank (C-01 v1.0.1
    CORRECTED) is not present in this repository: 0 of 73 questions and 0 of 13
    modules are transcribed. Populate from the controlled source; do not author
    content here.
  [SOURCE_UNPOPULATED] C-02 scoring rules: C-02 Canonical Scoring Rules and Golden
    Tests (C-02 v1.0.1 CORRECTED) is not present in this repository: 0
    domain-question mappings, 0 classification sets and 0 of 30 Golden Tests are
    transcribed. Populate from the controlled source; do not author formulas, bands
    or expected outputs here.
```

`canonicalStructureIsReady()` returns `false`. That is the correct state: an empty
bank is structurally well-formed, so without this gate a validator would call zero
questions "valid" and M2 would appear to pass while containing no assessment.

To re-run the gate before a test harness exists:

```powershell
npx tsc lib/assessment/index.ts --outDir .m2check --module commonjs --target es2019 --strict
node -e "const m=require('./.m2check/index.js'); console.log(m.formatViolations(m.validateCanonicalStructure()))"
```

## 8. Files added in this step

| File | Role |
|---|---|
| `lib/assessment/canonical-constants.ts` | Blueprint-stated counts, versions, thresholds, tie order, terminology |
| `lib/assessment/types.ts` | C-01 question / module / option / multi-select / N-A shapes |
| `lib/assessment/answer-types.ts` | Answer states, §2 validation failure codes, progress & submission shapes |
| `lib/assessment/scoring-types.ts` | C-02 rule shapes, driver output contract, Golden Test shapes |
| `lib/assessment/question-bank.ts` | **Empty** C-01 template + readiness gate + lookups |
| `lib/assessment/scoring-rules.ts` | **Empty** C-02 template + Golden Test suite shell |
| `lib/assessment/invariants.ts` | Executable checks for every count and relationship in §1–§4 |
| `lib/assessment/index.ts` | M2 public surface (M3 concerns deliberately absent) |
| `M2_OPEN_ITEMS.md` | This register |

