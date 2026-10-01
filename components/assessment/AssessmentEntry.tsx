import React from "react";

import { AssessmentShell } from "./AssessmentShell";
import { CONSENT_SERVICE } from "../../lib/content/c04-system-messages";

/**
 * ASM-01 — Assessment Entry.
 *
 * C-05 zone contract:
 *   1 Minimal brand header            (AssessmentShell)
 *   2 Intro — purpose, estimated time, educational boundary
 *   3 Email — email field and privacy note
 *   4 Eligibility/age — launch acknowledgement if configured
 *   5 CTA Send Secure Link
 *   6 Links — Privacy, Terms, Medical and AI disclaimers
 *
 * Zone 4 is included because C-04 states "Production launch is intended for
 * adults aged 18 or older", and `lib/assessment/validation.ts` blocks
 * submission below 18. Acknowledging that up front is better than letting a
 * participant complete 73 questions and only then refusing to submit.
 *
 * The form posts to the real magic-link endpoint. It is NOT wired to a
 * placeholder: with Supabase unconfigured the route fails closed and says so,
 * which is the correct behaviour rather than a fake success.
 */

const LEGAL_LINKS = [
  ["Privacy Notice", "/privacy"],
  ["Terms", "/terms"],
  ["Medical Disclaimer", "/medical-disclaimer"],
  ["AI Disclaimer", "/ai-disclaimer"],
] as const;

export function AssessmentEntry() {
  return (
    <AssessmentShell>
      <section className="rounded-2xl border border-[#D8DEE8] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#437971]">
          ROOTS Biological Assessment™
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-[#1A2A4A]">
          Begin your assessment
        </h1>
        <p className="mt-4 text-base leading-7 text-[#4B5563]">
          73 questions across 13 modules, covering sleep, hunger and satiety, metabolic history,
          circadian timing, stress, activity and lifestyle context. Most people finish in about 20
          minutes.
        </p>
        <p className="mt-3 text-sm leading-6 text-[#6B7280]">
          Your answers are saved as you go, so you can pause and resume using a secure link. This
          is an educational assessment. It does not diagnose a condition and it is not a medical
          service.
        </p>

        <form
          className="mt-8"
          action="/api/auth/magic-link"
          method="post"
          noValidate={false}
        >
          {/* C-05 zone 3 — email field and privacy note. */}
          <label htmlFor="email" className="block text-sm font-semibold text-[#1A2A4A]">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            aria-describedby="email-note"
            className="mt-2 min-h-11 w-full rounded-lg border border-[#D8DEE8] bg-white px-4 py-3 text-base text-[#1A1A1A] focus:border-[#437971] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          />
          <p id="email-note" className="mt-2 text-xs leading-5 text-[#6B7280]">
            Used to send your secure access link and to deliver your report. Your answers are not
            sent to analytics, advertising or session-replay tools.
          </p>

          {/* C-05 zone 4 — launch eligibility acknowledgement. */}
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-[#D8DEE8] p-4">
            <input
              type="checkbox"
              name="eligibility"
              required
              className="mt-1 h-5 w-5 shrink-0 accent-[#437971]"
            />
            <span className="text-sm leading-6 text-[#4B5563]">
              I confirm I am 18 or older. This version is intended for adults aged 18 and above.
            </span>
          </label>
          <p className="mt-2 text-xs leading-5 text-[#6B7280]">{CONSENT_SERVICE}</p>

          {/* C-05 zone 5 — CTA. */}
          <button
            type="submit"
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#1A2A4A] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#24365C] sm:w-auto"
          >
            Send Secure Link
          </button>
        </form>
      </section>

      {/* C-05 zone 6 — legal links. */}
      <nav aria-label="Legal" className="mt-8">
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {LEGAL_LINKS.map(([label, href]) => (
            <li key={href}>
              <a href={href} className="inline-flex min-h-11 items-center text-[#1A2A4A] underline underline-offset-4">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </AssessmentShell>
  );
}