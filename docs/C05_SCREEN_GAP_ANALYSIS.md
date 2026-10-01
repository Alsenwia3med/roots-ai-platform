# C-05 Screen Implementation Specification — gap analysis

**Source:** `07_ROOTS_AI_C05_UI_UX_Screen_Implementation_Specification_v1.0.0.pdf`
(ROOTS-C05-UIUX-001, status APPROVED EXECUTABLE UI/UX RELEASE, effective 21 July 2026).
Text extracted to `extracted/07_ROOTS_AI_...txt`.

This is a **build specification**, not a mood board. It fixes navigation, page
inventory, role visibility, layout zones, component behavior, states and
responsive rules for every Phase 1 screen.

## Authority order (C-05 §1)

1 Master Requirements v3.3
2 **C-01** question wording, type, options, required/N/A rules, module order
3 **C-02** scores, calculations, classifications, drivers
4 **C-03** report copy contract, 19 sections, disclaimers, visual tokens
5 **C-04** website, legal, consent, system and error copy
6 **C-05** screen composition, navigation, components, states, responsiveness

Binding constraints taken directly from the spec:

- A screen may not omit a mandatory function because a design library lacks a
  matching component.
- No implementation may change question order, scoring behaviour, legal text or
  report meaning **for visual convenience**.
- Where a literal sentence is not repeated in C-05, the exact approved sentence
  comes from C-03 or C-04.
- Any material screen, route, modal, permission, navigation item or user-visible
  state **not specified here requires a ROOTS Change Record**.

## Assessment screens required by C-05

| ID | Route | Access | Purpose | Status |
|----|-------|--------|---------|--------|
| ASM-01 | `/assessment` | Public | Request a secure session (email) | **partial** |
| ASM-02 | `/assessment/check-email` | Public | Confirm link request | **missing** |
| ASM-03 | `/assessment/link-error` | Public | Recover from bad token | **missing** |
| ASM-04 | `/assessment/consent` | Authorized | Service + research consent, separately | **missing** |
| ASM-05 | `/assessment/start` | Consented | Introduction, no scores shown | **missing** |
| ASM-06 | `/assessment/[session]/module/[1..13]` | Authorized | Capture C-01 answers exactly | **partial** |
| ASM-07 | Modal on module shell | Authorized | Save & Exit confirm | **missing** |
| ASM-08 | `/assessment/[session]/resume` | Authorized | Resume point, no answer preview | **missing** |
| ASM-09 | `/assessment/[session]/review` | Authorized | Completeness + submit | **missing** |
| ASM-10 | `/assessment/[session]/submitted` | Authorized | Confirm + pipeline status | **missing** |
| ASM-11 | Same route, error state | Authorized | Recovery, no duplicate submit | **missing** |

Module order is fixed by C-01 and must not be reordered:

```
1 Body Foundations Q1–Q8      8 Biological Safety Signals Q49–Q51
2 Weight & Metabolic Q9–Q15   9 Root Cause Discovery Q52–Q55
3 Sleep Recovery Q16–Q22     10 Hormonal/Reproductive Q56–Q60
4 Hunger & Satiety Q23–Q30   11 Lifestyle & Environment Q61–Q66
5 Stress & Inflammation Q31–Q40  12 Goals & Readiness Q67–Q71
6 Circadian Health Q41–Q45   13 Confidence & Context Q72–Q73
7 Physical Activity Q46–Q48
```

### ASM-06 zone contract (the screen that exists)

1. Top bar — module n of 13, percentage, Save & Exit
2. Module intro — module title and one-sentence purpose
3. Question region — prompt, help/units, approved control, **N/A only when C-01 allows**
4. Validation — inline after blur/Next; summary at region start
5. Navigation — Back and Next; **Submit only after Review**
6. Autosave — debounced status: Saving / Saved / Failed
7. Session warning — expiry countdown with extend action

Every ASM screen shares the same responsive rule: *mobile shows one primary
question region at a time; desktop question column max 760 px; progress and
navigation remain reachable.* And the same acceptance clause: *question IDs and
order match C-01; 71 required and 2 optional rules pass; all 13 modules, keyboard
flow, save/resume and recovery pass E2E.*

## Legal screens

LEG-01 `/privacy`, LEG-02 `/terms`, LEG-03 `/cookies`, LEG-04
`/medical-disclaimer` exist. **LEG-05 `/ai-disclaimer` is missing** and is
required by C-05, by the C-04 footer legal list (Privacy • Terms • Cookies •
Medical Disclaimer • AI Disclaimer) and by ASM-04/ASM-01 link lists.

## C-04 copy that must not be paraphrased

- Brand: ROOTS-AI™. Product statement: "Medicine Before Symptoms™."
- Primary CTA: "Start Your Assessment". Secondary CTA: "View Example Report".
- Public future capabilities are labelled "Coming Soon".
- Footer line: © 2026 ROOTS AI HEALTH SYSTEMS, Inc. All rights reserved.
- Never claim diagnosis, disease prevention, cure, guaranteed weight loss,
  clinical validation or medical-device status.
- Protected routes contain no marketing analytics, session replay or advertising
  pixels.

## Implementation order

1. `/ai-disclaimer` (LEG-05) — small, independent, unblocks the footer contract.
2. ASM-01 entry (email + eligibility) and ASM-02/ASM-03 link states.
3. ASM-04 consent and ASM-05 introduction.
4. ASM-06 module shell brought up to the C-05 zone contract, incl. autosave and
   the Save & Exit modal (ASM-07).
5. ASM-08 resume, ASM-09 review/submit, ASM-10/ASM-11 submitted + recovery.
6. Wire the existing `lib/assessment/validation.ts` gate into every screen.