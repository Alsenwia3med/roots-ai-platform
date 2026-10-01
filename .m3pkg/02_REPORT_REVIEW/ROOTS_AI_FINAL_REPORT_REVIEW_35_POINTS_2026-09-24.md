I have now completed a detailed page-by-page review of the current **ROOTS Biological Intelligence Report™**.

The overall report architecture is strong and should **not be redesigned or conceptually rewritten from scratch**. The purpose of the instructions below is to bring the report to the final controlled standard by correcting specific content, governance, explainability, data-quality and presentation issues while preserving the approved scientific engine.

**Please proceed with all directly actionable corrections below. Where an item explicitly requires verification against the controlled source, verify it first and implement only what the controlled source supports. If the controlled source does not resolve it, flag that specific item to ROOTS before changing it. You do not need to wait for separate approval on the directly actionable corrections.**

---

### 1. Correct and clarify questionnaire/scoring/report versioning — HIGH PRIORITY

The current report displays **Questionnaire 1.0.0** in multiple places, while the implemented canonical assessment source is **C-01 v1.0.1 CORRECTED**.

Please verify the actual persisted questionnaire version used for this assessment.

If `1.0.0` is an internal application/schema version and `C-01 v1.0.1 CORRECTED` is the controlled source version, do **not** present them as though they are the same thing. Label them separately and unambiguously.

The report must always display the exact questionnaire, scoring and report versions that actually generated that report.

Apply the correction consistently everywhere, including the cover metadata, Participant Answers section, Biological Card, audit/version information and canonical report object.

**Do not hard-code a version merely to match a document name.**

---

### 2. Recovery Potential — do not render a pseudo-score when unavailable

Where Recovery Potential is not calculable under the canonical rules, do not display:

**— /100**

Display:

**Not enough information**

A numeric denominator should not be shown when no valid score exists.

This must remain governed by the canonical null/eligibility rules. Do not impute, estimate or manufacture a Recovery Potential score.

---

### 3. Clarify the meaning of Confidence

Add concise explanatory copy making clear that Confidence is **not diagnostic or clinical certainty**.

Use:

**“Confidence reflects data completeness, self-reported answer confidence and internal response consistency—not diagnostic certainty.”**

Where the component scores are shown, add a short explanation that the composite Confidence score is calculated according to the controlled confidence model and should not be assumed to be a simple arithmetic average, **provided this is consistent with the canonical calculation**.

Also verify that **68/100 = Moderate-High** is the exact controlled classification.

Do not use a manually selected confidence label.

---

### 4. Clarify score direction in the Seven-Domain Score Breakdown

The user must not have to guess whether a higher score means better health or greater burden.

Add prominently near the Seven-Domain Score Breakdown:

**“Higher scores indicate greater reported burden within this assessment.”**

Use this only if it precisely reflects the canonical scoring semantics across the displayed domains. If the controlled specification defines the direction differently for any domain, follow the controlled specification and flag the conflict before implementation.

Do not rely on colour alone to communicate state or severity. Preserve visible numeric scores and state labels.

---

### 5. Strengthen the Key Drivers explanation

Keep the existing deterministic Primary / Secondary / Tertiary driver logic.

Add:

**“Drivers identify the highest-ranked eligible questionnaire domains; they do not establish biological causation.”**

Driver order, eligibility, tie order and co-primary behavior must remain entirely deterministic and unchanged.

---

### 6. Refine the Executive Summary wording

Where the report refers to the drivers as the participant’s **“strongest areas,”** replace that wording because it can be interpreted as the participant’s healthiest areas.

Use:

**“most influential reported areas”**

or, where referring specifically to deterministic driver ranking:

**“highest-ranked drivers in this assessment.”**

Do not change the underlying driver selection.

---

### 7. Preserve the Biological State philosophy and boundary

Keep the **Optimized / Compensating / Strained / Dysregulated** framework exactly as controlled.

Preserve the distinction that Biological State is a proprietary questionnaire-derived state and **not a diagnosis or medical-risk probability**.

Do not replace “Compensating” with generic wellness language such as “fair,” “moderate health,” “at risk,” or similar labels.

---

### 8. Refine Opportunity Score language

Avoid wording that could imply that ROOTS has directly measured a proven quantity of biological “modifiable capacity.”

Where appropriate, use:

**“a proprietary educational indicator of where the current questionnaire pattern suggests potentially modifiable opportunity.”**

Preserve the existing statement that Opportunity Score is **not a forecast or clinical-outcome probability**.

---

### 9. Biological Safety Signals™ — verify the definition

The current explanatory wording does not fully explain the meaning of the proprietary name **Biological Safety Signals™**.

Please check the controlled C-03/content definition and use the approved definition.

Do **not** invent a new physiological definition and do not imply that this questionnaire domain directly measures physiological “safety.”

If the controlled material does not provide sufficient approved explanatory copy, flag this item for ROOTS rather than creating new wording.

---

### 10. Biological Triad™ — distinguish domains from contextual/protective factors

The current Biological Triad brings together Inflammation Burden Index™, Hunger & Satiety Signals™ and no current nicotine use.

Do not visually or linguistically imply that these are three equivalent biological constructs.

Make clear that the Triad is bringing together relevant **biological domains and contextual/protective factor(s)**.

Replace wording such as **“connects”** with:

**“brings together”**

where appropriate.

Preserve prominently:

**“The diagram shows possible relationships between these areas, not causes.”**

Do not infer causation.

---

### 11. Preserve the inflammation boundary

Keep the explicit clarification for **Inflammation Burden Index™** that it is:

**not a laboratory or clinical inflammation measure.**

This scientific boundary must remain visible in the final report and must not be removed during visual redesign.

---

### 12. Refine “Future Projection”

The current content itself is appropriately cautious, but the heading **Future Projection** can imply predictive capability stronger than the actual report.

Preferred heading:

**Pattern Outlook**

If “Future Projection” is a controlled/canonical section title that cannot be changed, retain it but place a clear qualifier immediately with it:

**“This is an educational pattern outlook, not a clinical prediction.”**

Preserve probabilistic language such as **may**. Do not introduce deterministic future claims.

---

### 13. Refine the 90-Day Roadmap framing

The section must not read as an individualized medical treatment plan.

Preferred consumer-facing title:

**90-Day Educational Action Framework**

If **90-Day Roadmap** is a controlled section title, retain it and add a concise statement that it provides general educational/self-observation actions rather than individualized treatment.

Do not introduce medication, supplement, diagnosis or individualized treatment recommendations.

---

### 14. Keep recommendations low-risk and governed

Every action/recommendation shown in the report must originate from an approved deterministic rule/content library or approved governed narrative source.

Internally, each action should be traceable to its applicable:

**trigger/rule → content ID/version → rendered recommendation**

AI must not freely invent new health actions.

Preserve relevant safety qualifiers for allergies, kidney disease, clinician-directed diets, unsafe/painful exercise, persistent snoring/gasping and mental-health care.

---

### 15. Refine selected action wording

Where applicable:

Replace:

**“Supports a consistent recovery schedule.”**

with:

**“Supports a more consistent sleep–wake routine.”**

Replace:

**“Creates a repeatable recovery cue.”**

with:

**“Creates a repeatable pause and relaxation cue.”**

For post-meal walking, use consumer-facing wording such as:

**“Adds a small, repeatable period of movement after meals.”**

Do not place internal governance language such as “without promising weight loss” in the main consumer recommendation unless required by the controlled copy.

---

### 16. Nutrition language

Keep nutrition guidance educational and non-prescriptive.

Avoid implying individualized protein/fibre requirements where these have not been clinically calculated.

Do not add calorie targets, macro prescriptions, therapeutic diets or supplement recommendations.

Preserve appropriate safety qualifiers.

---

### 17. Rename Suggested Laboratory Discussion

The current section includes both clinical evaluation and possible laboratory discussion, so **Suggested Laboratory Discussion** is narrower than its actual content.

Preferred title:

**Clinical & Laboratory Discussion**

or, if more consistent with the controlled content:

**Questions to Discuss With a Healthcare Professional**

Preserve the current principle that testing should be discussed with a qualified healthcare professional and that the report does not automatically recommend broad laboratory testing.

---

### 18. Review Specific Concerns and safety escalation

Verify the participant’s responses against the controlled safety/escalation rules, particularly responses such as short sleep and frequent snoring/gasping.

If C-03/the approved safety library requires an escalation or professional-assessment message, it must appear.

Do **not** diagnose sleep apnea or any other condition.

Do not create new safety rules. Apply only the approved controlled rules and identify any missing rule to ROOTS.

---

### 19. Add non-destructive data-quality/plausibility handling

The current participant data includes a waist circumference of **44 cm**, which may be genuine but is sufficiently unusual to illustrate the need for data-quality handling.

The system must never silently convert, correct or reinterpret participant-entered measurements.

Where a value falls outside a controlled plausibility range, prompt the participant to verify the value/unit before final submission, for example:

**“This value appears unusual. Please verify the value and unit.”**

The participant must remain able to confirm a valid unusual value.

Store and display units explicitly.

Never automatically infer cm vs inches, kg vs lb, or alter the original response.

This item should only be implemented using controlled validation/plausibility ranges. If such ranges are not currently defined in the baseline, flag this for ROOTS rather than inventing thresholds.

---

### 20. Preserve participant answers verbatim

The Participant Answers section is important for transparency and traceability and should remain.

Free-text participant answers, including grammar/spelling, must remain **verbatim** and must not be silently corrected by AI.

Where appropriate, visually identify free-text content as **Participant response** so it is clear that it is user-supplied language.

If supported by the controlled report specification, distinguish **Scoring input** from **Context only** without exposing unnecessary proprietary algorithm detail.

---

### 21. Reduce repetitive templated interpretation language

Several domain interpretations currently use very similar phrasing.

Please use the approved domain-specific interpretation library so that each domain has genuinely relevant explanatory language while retaining the same scientific/governance boundaries.

Do not solve repetition by allowing unrestricted AI rewriting.

If domain-specific approved copy is not available, flag the gap to ROOTS.

---

### 22. Preserve “What Is Going Well”

Keep this section.

It is important that the report identifies relevant protective/positive context rather than presenting only burden and problems.

However, do not manufacture positive findings simply to populate the section. Display only findings supported by controlled rules and participant data.

---

### 23. Improve explainability

For major scores and drivers, provide concise **“Why this appeared”** explainability where supported by the controlled rules/content.

The explanation should trace the interpretation to relevant questionnaire patterns without unnecessarily exposing proprietary scoring logic.

No explanation may imply causality when the underlying system establishes only an association or pattern.

---

### 24. Biological Card

Preserve the Biological Card as a compact summary of:

**Biological State**
**Opportunity**
**Recovery Potential**
**Confidence**
**Drivers**
**applicable version/audit information**

Correct the questionnaire-version issue described above.

Technical strings such as `deterministic-fallback` may remain in an Audit/Technical Details area rather than competing with primary consumer information.

---

### 25. Preserve the Final Word

Please preserve:

**“Your answers are a starting point, not a verdict.”**

This is aligned with the intended ROOTS-AI philosophy.

Preserve the concept of choosing a realistic action and observing the response rather than presenting the report as a fixed judgment.

---

### 26. Medical and AI governance

Preserve the core boundaries that:

- the report is educational and not diagnostic;
- scores are proprietary questionnaire indicators;
- scores are not probabilities of disease or future outcomes;
- AI cannot calculate or alter authoritative scores, classifications or drivers;
- AI may assist only with governed narrative wording from approved inputs, where enabled;
- urgent, severe or worsening symptoms require appropriate professional/urgent care according to the approved safety copy.

Please ensure the final AI wording reflects the actual architecture:

**“AI may assist with governed narrative wording from approved inputs; all authoritative scores, classifications and drivers are produced by the deterministic engine.”**

Do not introduce diagnostic, prescriptive, causal or certainty language.

---

### 27. Make the disclaimer easier to read without weakening it

The current Medical and AI Disclaimer contains important content but is visually dense.

Without changing approved legal meaning, structure it clearly into:

**What this report is**
**What this report is not**
**How AI is used**
**When professional or urgent care is appropriate**

Any substantive legal wording change must remain consistent with the controlled legal copy.

---

### 28. Auditability

Preserve the report ID, questionnaire version, scoring version, report version and narrative/audit references.

Audit references must correspond to the actual immutable report/scoring/narrative artifacts and must not be decorative identifiers.

The final report must be reproducible from the same canonical report object and controlled versions.

---

### 29. 19-section completeness

The current report contains the required **19 sections**, even though multiple sections share pages.

Please maintain an internal acceptance matrix:

**Section ID → canonical data/source → rendering/template → web location → PDF location → verification/test**

Acceptance requires **19/19 sections** to be present and correctly rendered.

Do not equate “19 sections” with “19 pages.”

---

### 30. Web/PDF parity

The final interactive web report and PDF must be generated from the **same canonical report object/source** as required by the controlled baseline.

Verify every one of the 19 sections for web/PDF parity, including:

- values;
- states/classifications;
- drivers;
- null/Not enough information behavior;
- interpretation;
- safety copy;
- participant answers;
- versions/audit information.

A visual screenshot comparison alone is not sufficient where canonical data can be compared programmatically.

---

### 31. Accessibility

The final report must not communicate meaning through colour alone.

Ensure appropriate:

- readable contrast;
- logical reading order;
- headings;
- selectable/accessible text where applicable;
- textual/numeric equivalents for charts;
- accessible description of relationship diagrams such as the Biological Triad.

---

### 32. Final visual hierarchy

Preserve the content architecture but refine the final visual design according to the approved ROOTS-AI Golden Screen/design system.

Prioritize visually:

**State → Opportunity → Recovery Potential → Confidence → Drivers → Seven Domains → Interpretation/Actions → Evidence/Answers → Audit/Governance**

Avoid both excessive empty space and overly dense legal/audit pages.

The final report should feel **calm, premium, scientific and distinctly ROOTS-AI**, rather than like a generic wellness PDF.

---

### 33. Trademark presentation

Please keep the required trademark identification, but avoid unnecessary visual repetition of `™` after every repeated occurrence where the approved ROOTS trademark/brand rules allow first-prominent-use treatment.

Do not remove trademark protection where it is required.

---

### 34. Global-ready presentation

Keep canonical stored values independent from display formatting.

The report architecture should allow locale-aware presentation of dates and measurement units without changing the underlying canonical data.

Do not implement uncontrolled AI translation of scientific or governed report content.

---

### 35. Do not change the scientific engine while making these report corrections

These corrections must **not** alter:

- canonical C-01 responses;
- C-02 scoring;
- seven-domain calculations;
- Biological State logic;
- Opportunity/Recovery calculations;
- Confidence calculation;
- driver ranking/tie/co-primary rules;
- Golden Test expected outputs;
- canonical null/missing/N/A behavior.

If any requested presentation/content correction appears to require changing canonical scientific logic, **stop and identify the exact conflict to ROOTS before changing the engine**.

---

## Final verification required

After implementing the above, please provide **one consolidated final report verification package** showing:

**1.** 19/19 canonical sections present
**2.** All displayed scores recalculated and verified against C-02
**3.** All displayed drivers verified against deterministic driver logic
**4.** Questionnaire/scoring/report versions verified against the actual persisted versions
**5.** Null/Not enough information behavior verified
**6.** Controlled interpretation/action/safety content sources verified
**7.** AI has no calculation or classification authority
**8.** The same canonical report object produces the web and PDF outputs
**9.** Web/PDF values and governed content match
**10.** Accessibility and visual-regression verification completed

Please submit the corrected report and verification evidence **together in one consolidated delivery**, rather than sending incremental report revisions for separate review.

Please do not make additional scientific, scoring, medical, legal or narrative assumptions beyond the controlled package while implementing these corrections.

If any item is not supported by the existing controlled source, identify the exact item and source gap to ROOTS rather than inventing a solution.

The objective is to preserve the strong current report architecture while making the final report **scientifically precise, human-readable, explainable, governed, reproducible, globally ready and distinctly ROOTS-AI**.