# ROOTS-AI™ — M3 decision log

Decisions issued by ROOTS and how each is implemented. Items requiring controlled-source
verification remain explicitly open until that verification is complete.

| # | Subject | Issued | State |
|---|---|---|---|
| D-01 | Cookie table columns (LEG-03) | 25 Sep 2026 | Applied; inventory below **open for ROOTS confirmation** |
| D-02 | Effective dates and versions (LEG-03/04/05) | 25 Sep 2026 | Applied; controlling provision identified |
| D-03 | Footer version line | 25 Sep 2026 | Applied and confirmed |
| D-04 | Driver and Triad wording | 25 Sep 2026 | Applied; **open** pending C-03 state verification |
| D-05 | Anonymous visitor consent (OPS-03) | 25 Sep 2026 | Structure and mapping below; **open** with gaps identified |

---

## D-01 — Cookie table (LEG-03)

**Decision.** Retain C-04 §6 content and its three columns. Do not invent provider or duration
values. Remove the added statement that no third-party provider or storage duration exists —
that conclusion does not follow merely from C-04 not listing those values. Provide the actual
Phase 1 cookie and browser-storage inventory for confirmation against the controlled legal copy.
Publish nothing unsupported in the meantime.

**Applied.** The statement is removed from `lib/content/c04-legal.ts`. The published table shows
only C-04's three columns. Nothing about providers or durations is published.

**The point was well made.** The removed statement would have been false. The inventory below
shows a third-party technology in use — a Cloudflare cookie — that the earlier wording would
have denied.

### Phase 1 cookie inventory

Observed from the implementation and from live requests to `roots-ai.health`.

| Name | Purpose | Provider | Duration | C-04 §6 category |
|---|---|---|---|---|
| `sb-<project-ref>-auth-token` (chunked `.0`, `.1` when large) | Authenticated session for a signed-in participant or administrator | Supabase (`@supabase/ssr`), set first-party on our domain | Governed by the Supabase project's JWT expiry and refresh-token lifetime; not set by application code | Strictly necessary |
| `roots_oauth_next` | Remembers the intended destination across the Google sign-in redirect | ROOTS-AI, first-party | 600 seconds, `httpOnly`, `SameSite=Lax`, `Path=/auth/callback`; cleared on return | Strictly necessary |
| `cf_clearance` | Cloudflare bot-management / challenge clearance | **Cloudflare** (third party, as hosting processor) | Set by Cloudflare, not by application code | Strictly necessary |

### Phase 1 browser-storage inventory

| Key | Store | Purpose | Provider | Duration |
|---|---|---|---|---|
| `roots-ai.cookie-consent` | localStorage | Records the analytics consent decision (see D-05) | ROOTS-AI, first-party | Until cleared by the visitor, or until `CONSENT_VERSION` changes |
| `roots-secure-link-email` | sessionStorage | Shows which address a secure link was sent to on the check-email screen | ROOTS-AI, first-party | The browser tab session |
| `roots-submit-key-<assessmentId>` | sessionStorage | Idempotency key, so a repeated submission cannot create a duplicate | ROOTS-AI, first-party | The browser tab session |

**Analytics:** no analytics provider is enabled in Phase 1, so no analytics cookie or storage
exists to inventory. This is a statement about the current configuration, not a claim about
what C-04 does or does not list.

**Open for ROOTS.** Two questions follow from the inventory:

1. `cf_clearance` is set by Cloudflare rather than by ROOTS-AI. Should it be disclosed in the
   Cookie Notice, and if so in what controlled wording?
2. The Supabase session cookie's lifetime is a project setting rather than an application
   constant. Should the notice state a duration, and if so should the project setting be fixed
   to a stated value first?

Nothing is published on either point until ROOTS confirms.

---

## D-02 — Effective dates and versions (LEG-03, LEG-04, LEG-05)

**Decision.** Do not assign a separate date or version to these notices unless the controlled
source specifies one. The shared line may be used across the five notices only where C-04
expressly establishes that metadata for the complete legal pack. Identify the controlling
provision.

**Controlling provision.** C-04 document header, page 1:

> ROOTS-AI™ C-04 Website Content & Legal Copy Pack — **Version 1.0.1 CORRECTED**
> Document ID: ROOTS-C04-WEB-001
> Status: APPROVED EXECUTABLE CONTENT RELEASE — CONTROLLED CORRECTION
> **Effective date: 21 July 2026**

The header states one version and one effective date for the pack as a whole. The five notices
are sections of that pack (C-04 §§4–8), so the line describes them without a separate date or
version being assigned to any of them.

**Applied.** `Effective date: 21 July 2026 • Version: 1.0.1.` appears on all five notices. The
provision is recorded in `lib/content/c04-legal.ts` beside the constant, so the basis travels
with the code.

---

## D-03 — Footer

**Decision.** Confirmed. Keep `Educational — Not a Diagnosis · Version 1.0.0` removed. Retain
the approved C-04 footer, copyright and educational/medical boundary statement. Do not replace
the obsolete version with another unreferenced version.

**Applied.** The line is removed from `components/Footer.tsx`. The C-04 §2 boundary statement
and copyright remain. **No version number is displayed in the footer.**

---

## D-04 — Driver and Triad wording

**Decision.** "Strongest area(s)" is not approved: it may suggest the participant's healthiest
areas. Use the supplied wording. Preserve the actual deterministic driver outputs, including
eligibility, ranking, ties and co-primary behaviour. Do not assume a co-primary pair represents
two separate output entries. Follow the controlled null-state rules where no driver is eligible.
Reduced Triad states must reflect only available elements, must not imply causation, and must
not treat biological domains and contextual or protective factors as equivalent.

**Applied** in `lib/report/c03-content.ts`:

| State | Approved wording |
|---|---|
| One driver | "The highest-ranked driver in this assessment is {primary_driver}." |
| Two or three | "The highest-ranked drivers in this assessment are {driver_list}." |
| Triad, two elements | "The available information brings together {first} and {second}." |
| Triad, one element | "Only {first} is available for this view." |
| Triad, none | "Not enough information is available to display this view." |

**Co-primary correction.** The Triad previously expanded a co-primary pair into two separate
elements. It no longer does: each C-02 driver **output entry** contributes one element, so a
co-primary pair appears once, naming both domains. A test asserts this across every golden case
that produces a co-primary output (18 of the 30).

**Unchanged:** eligibility ≥ 25, ranking, the fixed tie order, the no-driver null state, and the
approved relationship note "The diagram shows possible relationships between these areas, not
causes."

**Open.** These strings remain marked for controlled-copy verification until their applicable
C-03 states and content rules have been checked.

---

## D-05 — Anonymous visitor consent (OPS-03)

**Decision.** Do not introduce a persistent identifier or server-side visitor tracking solely to
record an anonymous analytics preference. Before browser-only storage is approved as compliant,
provide the exact consent-record structure and requirement mapping, covering consent version,
categories, timestamp and region, as well as withdrawal, changes to consent, and what happens
when browser storage is cleared. Identify any gap rather than omitting it silently or creating a
new tracking mechanism.

**No identifier has been introduced.** Nothing was added in response to OPS-03.

### Consent-record structure

Stored at `localStorage` key `roots-ai.cookie-consent`, defined in
`lib/content/cookie-consent.ts`:

```json
{
  "version": "1.0.1",
  "analytics": false,
  "decidedAt": "2026-09-25T06:53:58.319Z"
}
```

Three fields, and no others. No identifier, no address, no device or network attribute.

### Requirement mapping

| OPS-03 requirement | How it is satisfied | State |
|---|---|---|
| Consent **version** | `version`, compared on every read; a decision recorded against an older notice is discarded and the choice asked again | Satisfied |
| **Categories** | `analytics` — the only optional category in Phase 1. Strictly necessary technologies are not consent-based; advertising and session replay are not used | Satisfied for the optional category |
| **Timestamp** | `decidedAt`, ISO 8601 UTC | Satisfied |
| **Region** | Not captured | **Gap — see (a)** |
| **Withdrawal** | Re-saving with the box cleared writes `analytics: false` with a new timestamp; `analyticsAllowed()` returns false immediately | Satisfied |
| **Changes to consent** | Each decision overwrites the previous one | **Gap — see (b)** |
| **Storage cleared** | The record is gone. The visitor is treated as undecided: the banner is shown again and analytics stay blocked | Conservative, but **gap (c)** |

### Gaps identified

**(a) Region is not captured.** The controlled baseline does not specify how a visitor's region
is to be determined for this purpose, nor which regional distinctions change the consent
requirement. Determining it would mean deriving a location from the request — which is closer to
the tracking the decision prohibits. **ROOTS direction requested:** should region be recorded,
and if so from what source and at what granularity?

**(b) No consent history.** Only the current decision is kept; an earlier acceptance that was
later withdrawn leaves no record. Retaining a history in browser storage would not be reliable
evidence anyway, since the visitor can clear it. **ROOTS direction requested:** is a history
required for anonymous visitors, and if so where can it live without an identifier?

**(c) No durable evidence.** Because the record is in the visitor's own browser, ROOTS cannot
produce evidence that a particular anonymous visitor consented. The conservative failure mode is
implemented — no record means no consent — but the evidential obligation is not met by browser
storage alone. **ROOTS direction requested:** is the conservative failure mode sufficient for
Phase 1, given that no analytics provider is enabled?

**Relevant context.** No analytics provider is enabled in Phase 1, so no consent is currently
acted upon: `analyticsAllowed()` gates a path that nothing uses yet. The gaps become material
when a provider is enabled, which OPS-06 requires ROOTS to approve separately.

### Evidence

`tests/content/cookieConsent.test.ts` — 8 automated tests: blocked before consent, blocked after
refusal, allowed only after explicit acceptance, the three recorded fields, no identifier stored,
a stale consent version discarded, unreadable storage treated as undecided, and analytics as the
only optional category.

---

## Verification state

| Item | Verified | Open |
|---|---|---|
| D-01 inventory | Cookies and storage keys audited from the implementation and live requests | ROOTS confirmation of `cf_clearance` and session-cookie duration disclosure |
| D-02 provision | C-04 header quoted verbatim | — |
| D-03 footer | Line removed; C-04 footer intact | — |
| D-04 wording | Applied; co-primary corrected; 80 report tests pass | C-03 state and content-rule verification |
| D-05 consent | Structure and mapping recorded; 8 tests pass | Region, history and evidential gaps (a)–(c) |
