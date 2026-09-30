# ROOTS-AI™ — M2 implementation and open items

**Updated:** 30 September 2026
**Controlled baseline:** C-01 v1.0.1 CORRECTED · C-02 v1.0.1 CORRECTED

This register supersedes the earlier “sources absent / scoring not implemented” status. The generated C-01/C-02 tables are now present under `lib/assessment/controlled/`; the scoring rule loader, deterministic engine, answer adapter and local Golden Test suite are implemented in this checkout.

## Implemented and verified

- `npm run build:controlled` transcribed the controlled workbooks and re-proved **1,631 assertions with 0 failures**. Current package hashes: C-01 `b5bb50ded8a21ec957d17f55c9b2b03c4845ad56d850549cb997bff4bfdd354b`; C-02 `14bf61735d0abe42da7ea87c5dd988dcceecdd648b94a68137b18a65f978989e`.
- C-02 `SC-001`–`SC-008`, option points, protective/recovery factors, classifications and driver rules are parsed from controlled rows. The scorer implements weighted domain scores, coverage, null states, half-away-from-zero rounding, Biological State, Opportunity, Recovery Potential, Confidence, consistency/evidence audit components and driver ranking/co-primary rules.
- `scoringInputFromAnswers()` maps canonical C-01 option IDs to C-02 burden points; Q26/Q28 use C-02’s already direction-adjusted points exactly once. Unanswered/N/A are excluded, and contextual questions never enter the score.
- ROOTS decision (a), supplied 30 September 2026: classify the unrounded one-decimal Recovery Potential by the highest inclusive band minimum reached. Thus **74.5 → Moderate; 75.0 → High**. Boundary tests also cover 24.9/25 and 49.9/50.
- `npx tsc --noEmit` passes.
- `npm test -- --runInBand` passes **10 tests**. This includes the exact `Test ID → Input → Expected → Actual → PASS/FAIL` matrix and **30/30 canonical C-02 Golden Tests**, plus classification, null-state, reverse-scoring, answer-adapter and boundary checks.
- `validateCanonicalStructure()` reports **0 violations**.

## Remaining M2 integration / acceptance items

1. **Persistence integration:** no assessment submission route currently calls `scoreAnswerRecords()`. The public app tree contains no assessment flow. Persisting results remains blocked by the recorded M1 schema conflicts below; this engine work does not silently migrate M1.
2. **M1 domain codes:** C-02/Blueprint uses `MR, HS, SR, CH, SL, IB, BS`; M1 schema constraints use `HU, SL, ME, CI, SA, ST, IN`. No unsupported mapping was invented. A ROOTS-approved schema/domain decision and migration are still required before persistence.
3. **Nullable score columns:** C-02 requires null for domain coverage below 50% and Biological State with fewer than 5 valid domains, while the M1 migration defines relevant columns as NOT NULL. Persistence needs a schema decision/migration.
4. **Environment provenance:** accepted commit `4056363` is not present in this local Git object database. The historical package under `m2/` describes prior 252-test, database and hosted API results, but those historic suites and external checks are not part of this checkout and were not rerun here. The current reproducible result is the 10-test suite above.
5. **Other historical acceptance:** the prior package notes that the original C-06 “12 negative tests” bundle was not supplied. Live database/API evidence remains historical evidence, not a current local rerun.

The scoring engine and its 30 Golden Tests are now reproducibly verified. Full milestone closure still depends on the persistence/schema integration decisions and any remaining acceptance evidence required by ROOTS.
