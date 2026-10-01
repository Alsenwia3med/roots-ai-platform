"use client";

import React, { useState } from "react";

import { AssessmentShell } from "./AssessmentShell";
import {
  CONSENT_RESEARCH,
  CONSENT_SERVICE,
} from "../../lib/content/c04-system-messages";

/**
 * ASM-04 — Consent, /assessment/consent.
 *
 * C-05 zone contract:
 *   1 Identity — masked email / session status
 *   2 Service consent — unchecked REQUIRED checkbox; links to Terms, Privacy,
 *     Medical, AI
 *   3 Research consent — separate unchecked OPTIONAL checkbox, no service penalty
 *   4 Records — version / effective date displayed
 *   5 CTA — Agree and Continue; Decline / Exit
 *
 * The two consents are deliberately independent checkboxes rather than one form
 * with a single "accept everything". C-04 is explicit: "Service access is not
 * conditioned on research consent", so the research box starts unchecked, can be
 * declined, and declining it never blocks the Agree and Continue action.
 *
 * Both strings are the approved C-04 §9 copy, not paraphrases.
 */

const LEGAL_LINKS = [
  ["Terms of Service", "/terms"],
  ["Privacy Notice", "/privacy"],
  ["Medical Disclaimer", "/medical-disclaimer"],
  ["AI Disclaimer", "/ai-disclaimer"],
] as const;

function maskEmail(email?: string): string {
  if (!email) return "Signed in";
  const at = email.indexOf("@");
  if (at <= 1) return "Signed in";
  const local = email.slice(0, 2);
  const domain = email.slice(at);
  return `${local}${"•".repeat(Math.max(1, at - 2))}${domain}`;
}

export function ConsentScreen({ email }: { email?: string }) {
  const [service, setService] = useState(false);
  const [research, setResearch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AssessmentShell>
      <section className="rounded-2xl border border-[#D8DEE8] bg-white p-6 shadow-sm sm:p-8">
        {/* C-05 zone 1 — masked identity, never a full address on a shared screen. */}
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#437971]">Consent</p>
        <h1 className="mt-2 text-2xl font-bold text-[#1A2A4A]">Before you begin</h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          Signed in as {maskEmail(email)}
        </p>

        {/* C-05 zone 2 — required service consent. */}
        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-[#AAB4C3] bg-[#F3F4F6] p-4">
          <input
            type="checkbox"
            checked={service}
            onChange={(event) => {
              setService(event.target.checked);
              if (event.target.checked) setError(null);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "consent-error" : undefined}
            className="mt-1 h-5 w-5 shrink-0 accent-[#437971]"
          />
          <span className="text-sm leading-6 text-[#1A1A1A]">{CONSENT_SERVICE}</span>
        </label>
        {error ? (
          <p id="consent-error" role="alert" className="mt-2 text-sm font-semibold text-[#B91C1C]">
            {error}
          </p>
        ) : null}

        <nav aria-label="Consent documents" className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {LEGAL_LINKS.map(([label, href]) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center text-[#1A2A4A] underline underline-offset-4"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* C-05 zone 3 — optional research consent, separate and unpoliced. */}
        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-[#D8DEE8] p-4">
          <input
            type="checkbox"
            checked={research}
            onChange={(event) => setResearch(event.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-[#437971]"
          />
          <span className="text-sm leading-6 text-[#4B5563]">{CONSENT_RESEARCH}</span>
        </label>

        {/* C-05 zone 4 — records version and effective date. */}
        <dl className="mt-6 grid gap-1 border-t border-[#D8DEE8] pt-4 text-xs text-[#6B7280] sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="font-semibold">Consent records version</dt>
            <dd>1.0.1</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">Effective date</dt>
            <dd>21 July 2026</dd>
          </div>
        </dl>

        {/* C-05 zone 5 — Agree and Continue, and Decline / Exit. */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              // The service consent is mandatory. Research consent is NOT gated
              // here — that is the whole point of keeping them separate.
              if (!service) {
                setError("Please accept the service consent to continue.");
                return;
              }
              const params = new URLSearchParams({ service: "1" });
              if (research) params.set("research", "1");
              window.location.assign(`/assessment/start?${params.toString()}`);
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1A2A4A] px-6 text-sm font-semibold text-white hover:bg-[#24365C]"
          >
            Agree and Continue
          </button>
          <a
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D8DEE8] bg-[#F3F4F6] px-6 text-sm font-semibold text-[#1A2A4A] hover:bg-[#E5E7EB]"
          >
            Decline and exit
          </a>
        </div>
      </section>
    </AssessmentShell>
  );
}