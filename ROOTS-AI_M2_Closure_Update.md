# ROOTS-AI™ — M2 Final Closure Update

**Milestone:** M2 — Assessment & Scoring  
**Accepted implementation:** `ROOTS-AI-Health-Systems/demo-repository` · branch `main` · commit `4056363`  
**Date:** 22 September 2026

This update closes the three provenance / confirmation items raised in ROOTS' M2 review. No scoring logic, rules or generated data have been changed.

---

## 1. Controlled XLSX source provenance

### Where the files came from

The two workbooks used by the final M2 implementation are the files ROOTS sent to us as message attachments (the C-01 and C-02 v1.0.1 CORRECTED PDF and XLSX files). They were used exactly as received, without being opened, edited or re-saved.

| Workbook | File SHA-256 (as received and used) |
|---|---|
| `02_ROOTS_AI_C01_Canonical_Question_Bank_v1.0.1_CORRECTED.xlsx` | `8c9c9e601d882e0f694c43a6c5d6cc5be5c8007f870283da7804ce3d32b7444c` |
| `03_ROOTS_AI_C02_Canonical_Scoring_Rules_and_Golden_Tests_v1.0.1_CORRECTED.xlsx` | `12dc3a66a68c4afa9497101959408984ba653b3bb6a099624502429f1e66a028` |

The received workbooks carry no document-property metadata (author, application) and internal package timestamps of 15 September 2026, which is consistent with a generated export rather than a hand-saved Excel file.

### Why package-level fingerprints can differ with no content difference

An `.xlsx` file is a zip package. Its file-level SHA-256 changes whenever the workbook is re-saved, re-exported or re-packaged: compression, internal timestamps, document properties, style tables and the cached results of formulas all change, even when no cell is edited. We tested this directly: re-saving the C-02 workbook with a different tool changed its file SHA-256 and dropped the cached results of the `QA_Checks` formulas, while every data cell and every formula stayed identical.

### Content-equivalence evidence (attached: `content_fingerprint.py`)

To separate content from packaging, we fingerprint only the canonical content: for every sheet, every non-empty cell's address and either its value or, for a formula cell, its formula text. Formatting, styles, file metadata and cached formula results are excluded.

**Content fingerprints of the workbooks used by the M2 implementation:**

| Workbook | Content SHA-256 |
|---|---|
| C-01 v1.0.1 CORRECTED | `763d34209bad0900150654897a3bceea8045a32b918fc3e3df84a4c21fa66dbd` |
| C-02 v1.0.1 CORRECTED | `4409a18593e0e65e2f6d2de724851b595ebc2e77988a19b916d420b5c0c08e23` |

Per-sheet fingerprints for all 16 sheets are in the attached `xlsx-content-fingerprint.json`.

**The method was validated before use:**
- a re-saved copy with a different file SHA-256 → `CONTENT IDENTICAL`;
- a copy with a single cell changed → `CONTENT DIFFERS`, naming the exact sheet and cell.

### Confirming equivalence with the ROOTS register copies

```
pip install openpyxl
python content_fingerprint.py <register C-01 .xlsx> <register C-02 .xlsx>
```

- If the register copies give the **same content SHA-256** values as above, the difference is packaging/serialisation only and the canonical content is identical.
- To compare cell by cell against the copies we used:
  `python content_fingerprint.py --compare <register .xlsx> <our .xlsx>`
  This lists every differing sheet and cell, if any.

We do not hold the ROOTS register copies, so this comparison is the one step that needs to run on ROOTS' side. Alternatively, send us the register files and we will run it and report the result. If any substantive difference appears, we will identify it precisely before any change is made.

---

## 2. Final commit provenance for the Golden Test evidence

The Golden Test report submitted with the package was generated from our development workspace rather than from a checkout of the ROOTS repository, so its commit field was not filled in.

**We have now regenerated the Golden evidence directly from the accepted commit `4056363`** (attached: `golden-tests-commit-4056363.pdf`, with `.html`, `.csv` and `.json`). The report's provenance now records:

> **Commit `4056363f2283ffa51b5f28862cda2646dd7654d4`** — "milestone 2 production code"

**Result:**
- **30/30 PASS** (canonical Golden Tests);
- **30/30 PASS** (supplementary classification check);
- all 30 actual outputs are **identical** to those in the submitted report.

This confirms that the tested engine and artifacts are those of the accepted M2 implementation at commit `4056363`.

**A note on one field.** The report's "engine fingerprint" value differs from the one in the originally submitted report. This is caused only by line-ending conversion (Windows vs Unix line breaks) when the repository was checked out. With line endings normalised, the engine and rule files are identical.

No scoring changes have been made.

---

## 3. Recovery Potential classification boundary — flagged to ROOTS

We checked this directly against the controlled C-02 v1.0.1 CORRECTED source (workbook and PDF). **The controlled source does not unambiguously resolve it.**

**What the source says:**
- *Classifications* sheet, scale RECOVERY: **High 75–100 · Moderate 50–74 · Limited 25–49 · Low 0–24**, with the note *"Bounds are inclusive."* All bounds are whole numbers.
- *Formulas* SC-005 (Recovery Potential™): rounding **"One decimal"**. README: *"Opportunity/Recovery retain one decimal."*

**The exact ambiguity.** A one-decimal Recovery Potential in **24.1–24.9, 49.1–49.9 or 74.1–74.9** falls between two inclusive whole-number bands and is covered by neither. The source does not state whether classification uses the one-decimal value or a rounded value.

**Scope of impact.**
- It affects only the Recovery Potential classification label.
- The numeric score is unaffected, as are domain classifications (integers), Confidence (integer), Biological State, Opportunity (not classified) and drivers.
- No canonical Golden Test falls in a gap (the Golden Recovery values are 96, 91.8, 88.5, 87.3, 85, 82.2, 81.9, 81.3, 81, 80.7, 80.1, 79.8, 73.5, 66 and 27.8).

**Current implementation behaviour (unchanged).** A value takes the highest band whose minimum it has reached (74.5 → Moderate, 75.0 → High). We are not presenting this as a controlled rule.

**ROOTS decision requested.** Please confirm which rule applies:
- **(a)** classify the one-decimal value: a value takes the band whose minimum it has reached (current behaviour; 74.5 → Moderate);
- **(b)** classify the value after rounding half-away-from-zero to an integer (74.5 → High, 74.4 → Moderate);
- **(c)** another rule specified by ROOTS.

We will implement exactly the rule ROOTS confirms, with a test at each boundary.

---

## ROOTS confirmations noted

- **A. Questionnaire versioning.** Noted and accepted: `C-01 v1.0.1 CORRECTED` (controlled source identity) and `questionnaire_version = 1.0.0` (the version stored by that source) remain persistently recorded side by side, without conflation.
- **B. C-06 security requirement.** Noted: no further security implementation is requested. The 73 database/RLS, 50 live API negative and 23 bypass/security results are preserved with the M2 record.

## Attachments

| File | Purpose |
|---|---|
| `ROOTS-AI_M2_Closure_Update.pdf` | This document |
| `content_fingerprint.py` | Content-equivalence tool for the XLSX workbooks (item 1) |
| `xlsx-content-fingerprint.json` | Per-sheet content fingerprints of the workbooks used (item 1) |
| `golden-tests-commit-4056363.pdf` (+ `.html`, `.csv`, `.json`) | Golden Test evidence regenerated from commit `4056363` (item 2) |
