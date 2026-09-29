# ROOTS-AI™ - Milestone 2 (M2) Strict Implementation Blueprint

## ⚠️ AGENT DIRECTIVE
**CRITICAL:** You are the Lead AI Engineer executing Milestone 2 (M2) of the ROOTS-AI platform. You MUST adhere 100% to this document. 
* DO NOT implement any M3 features (No AI narrative generation, no 19-section PDF reports, no external API calls for interpretation).
* Everything must be deterministic, server-side validated, and strictly follow the v1.0.1 CORRECTED baseline.

---

## 1. Assessment Flow & Architecture (C-01 v1.0.1 CORRECTED)
The `/assessment` route must implement the canonical questionnaire exactly as defined:
* **Total Questions:** Exactly 73 canonical questions.
* **Structure:** Exactly 13 ordered modules.
* **Requirements:** 71 questions are REQUIRED; 2 questions are OPTIONAL.
* **Scoring Eligibility:** Exactly 40 questions are used for scoring. The remaining 33 are contextual only and MUST NOT affect calculations.
* **State Management:** Progress must be tracked across all 13 modules. It MUST integrate flawlessly with the M1 Autosave/Resume foundation. Refreshing or signing back in must restore exact progress without data corruption.

## 2. Strict Validation Rules (C-01)
Client and Server-side validation MUST strictly enforce the following:
* **Required Questions:** Must have a valid response defined by its type, or an explicit approved `N/A` (if permitted by C-01).
* **Missing Data:** Missing data MUST NOT automatically be interpreted as `N/A`.
* **Multi-select Questions (Q13, Q14, Q52, Q53, Q54):** 
  * At least ONE approved option must be selected.
  * An empty array `[]` is INVALID and must block progression.
  * If a `"NONE / N/A"` option is selected, it MUST be mutually exclusive (clearing/disabling other selections).
* **Q73 (Free Text):** This is OPTIONAL. Do not invent or force an `N/A` response for it.

## 3. Deterministic Scoring Engine (C-02 v1.0.1 CORRECTED)
The calculation engine must be 100% deterministic and execute on the Server (Supabase Edge Function or Next.js Server Action). **AI/LLMs have ZERO calculation authority.**
* **Scale:** The canonical raw burden scale is `0.0` to `4.0`.
* **Domain Coverage Threshold:** A domain must have at least **50%** of its scoring-eligible questions answered. If below 50%, the domain score returns `null`.
* **Biological State (BIO_STATE):** Requires valid scores in at least **5 out of 7** domains. If < 5 domains are valid, BIO_STATE returns `null`.
* **Rounding Rules:** 
  * Integer rounding is strictly **half-away-from-zero**.
  * `Opportunity` and `Recovery` values retain exactly ONE decimal place.

## 4. Driver Logic & Co-Primary Handling (C-02 / C-06)
Drivers define the highest burden areas. The logic must be exact:
* **Ranking:** Use eligible domains only, ranked in **descending** score order.
* **Fixed Tie Order:** If scores are mathematically equal, break ties using this exact priority:
  `MR → HS → SR → CH → SL → IB → BS` *(Note: BS = Biological Safety Signals™).*
* **Co-Primary Definition:** Applies ONLY when the top two eligible scores differ by **no more than 3 points** (<= 3).
* **Co-Primary Rendering:** A co-primary pair MUST be rendered as **ONE output entry**. Do not split it, do not duplicate it, and do not fall back to an ineligible domain to fill a slot.
* **Terminology:** Always use the exact string `"highest-ranked driver(s) in this assessment"` (replacing the legacy "strongest area(s)").

## 5. Persistence, Security, and Versioning
* **Database Integration:** Responses and scores must be saved to the M1 Supabase tables (`responses`, `scores`, `assessments`).
* **RLS (Row Level Security):** Must respect the participant isolation established in M1. Users can only write/read their own data. Server-side validation must reject bypassed payloads.
* **Strict Versioning:** The exact canonical source versions MUST be persisted with the assessment and score records:
  * Questionnaire Version: `"C-01 v1.0.1 CORRECTED"`
  * Scoring Version: `"C-02 v1.0.1 CORRECTED"`

## 6. UI, Accessibility & Visual Tokens (C-05)
The interface must adhere to the M1 design system while meeting strict accessibility rules:
* **Contrast (C-05 §13):** Normal text must meet a `4.5:1` contrast ratio.
  * Use the approved text-safe variant `--zd-teal-ink` (`#437971`) on light surfaces.
  * Use the approved text-safe variant `--zd-gold-ink` (`#886b2e`) on light surfaces.
  * Original `--zd-teal` and `--zd-gold` remain for borders, icons, and large display text.
  * Color alone MUST NEVER communicate state or meaning.
* **Touch Targets (C-05 §5):** Interactive elements within the assessment UI MUST have a minimum hit area of `44 × 44 px`. (The shared header/footer may use WCAG 2.2 AA 24x24px, but the assessment form itself must be 44x44px).

## 7. The 30 Golden Tests Requirement
The scoring engine MUST be covered by an automated test suite verifying the 30 canonical Golden Tests from C-02.
* **Pass Rate:** Must achieve exactly **30/30 PASS**.
* **Output:** The tests must log an exact matrix proving compliance: `Test ID → Input → Expected Output → Actual Output → PASS/FAIL`.
* **Fidelity:** Test outputs must perfectly match the canonical expected outputs, including driver behavior, classifications, nulls, ties, and rounding.