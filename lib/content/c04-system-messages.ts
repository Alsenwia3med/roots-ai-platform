/**
 * C-04 controlled copy: consent and system messages.
 *
 * These strings are quoted verbatim from the C-04 Website Content & Legal Copy
 * Pack v1.0.0 (ROOTS-C04-WEB-001, APPROVED EXECUTABLE CONTENT RELEASE) section
 * 9, "Consent and System Messages". C-05 §1 binds their wording: the UI shows
 * the approved sentence and never paraphrases it, because a reviewer compares
 * these strings against the pack.
 *
 * Kept in lib/ so both the client screens and the server route render from one
 * definition rather than from two drifting copies.
 */

/** ASM-04 — mandatory service consent. Unchecked by default. */
export const CONSENT_SERVICE =
  "I agree to the Terms of Service and acknowledge the Privacy Notice and Medical and AI Disclaimers. I understand that ROOTS-AI™ is educational and not a diagnosis or medical service.";

/**
 * ASM-04 — optional research consent. Separate, unchecked by default, and
 * declining it carries no service penalty (C-04: "Service access is not
 * conditioned on research consent").
 */
export const CONSENT_RESEARCH =
  "Optional: I consent to the use of approved, minimized and pseudonymized assessment data for the research purpose described in the Pilot Information Sheet. I understand that I may decline without losing service access and may withdraw according to the Privacy Notice.";

/** ASM-06 — debounced autosave succeeded. */
export const SAVE_OK = "Saved";

/** ASM-06 autosave failed. Must not discard what the participant typed. */
export const SAVE_FAIL =
  "We could not save this answer. Check your connection and try again. Your current entry remains on this device until you leave or refresh.";

/** ASM-03 — the generic expired/invalid secure-link message. */
export const SESSION_EXPIRED =
  "For your security, this session has expired. Request a new secure link to continue.";

/** ASM-10 — report pipeline in progress. */
export const REPORT_GENERATING =
  "Your report is being prepared. Scores are calculated first; governed explanatory content follows.";

/** ASM-11 — answers are safe, report failed. Never ask for re-entry. */
export const REPORT_FAIL =
  "Your answers were submitted safely, but the report could not be completed. Try again later or contact support through the Contact page.";

/** C-03 domain-level null state. Never rendered as 0/100. */
export const NULL_DOMAIN =
  "Not enough information was available to calculate this domain. No missing answer was replaced or guessed.";

/** ASM-08 — restarting a saved run is destructive and must be confirmed. */
export const DELETE_CONFIRM =
  "This request may permanently remove eligible service data after identity verification and applicable retention checks. Historical audit records may be retained where legally required.";

/** Brand + product statement, quoted by C-04 §1 Global Content Rules. */
export const PRODUCT_STATEMENT = "Medicine Before Symptoms™";

/** C-04 §1 — future capabilities are labelled, never presented as available. */
export const COMING_SOON_LABEL = "Coming Soon";

/** C-04 §1 footer boundary line, used on every legal screen. */
export const FOOTER_BOUNDARY =
  "ROOTS-AI™ provides educational wellness information and does not diagnose or treat medical conditions.";