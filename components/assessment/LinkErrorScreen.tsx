import React from "react";

import { AssessmentShell } from "./AssessmentShell";
import { SESSION_EXPIRED } from "../../lib/content/c04-system-messages";

/**
 * ASM-03 — Invalid or Expired Link, /assessment/link-error.
 *
 * C-05 zone contract:
 *   1 Error — expired/invalid generic explanation
 *   2 Action — request a new secure link
 *   3 Support — contact link
 *
 * The explanation is generic on purpose. C-05 says "recover without exposing
 * token details", so the page never echoes a token, a reason code, or whether a
 * session ever existed — an attacker must not learn which guess was close.
 */
export function LinkErrorScreen() {
  return (
    <AssessmentShell>
      <section className="rounded-2xl border border-[#D8DEE8] bg-white p-6 text-center shadow-sm sm:p-8">
        <div
          aria-hidden="true"
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F3F4F6] text-xl font-bold text-[#1A2A4A]"
        >
          !
        </div>
        <h1 className="mt-5 text-2xl font-bold text-[#1A2A4A]">
          This link is no longer valid
        </h1>
        {/* C-04 SESSION-EXPIRED, verbatim. */}
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-[#4B5563]">
          {SESSION_EXPIRED}
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6B7280]">
          For your security, links expire and can be used only once. Requesting a new link takes a
          moment and does not affect any answers you have already saved.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {/* C-05 zone 2. */}
          <a
            href="/assessment"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#1A2A4A] px-6 text-sm font-semibold text-white hover:bg-[#24365C] sm:w-auto"
          >
            Request a new secure link
          </a>
          {/* C-05 zone 3. */}
          <a
            href="/contact"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#D8DEE8] bg-[#F3F4F6] px-6 text-sm font-semibold text-[#1A2A4A] hover:bg-[#E5E7EB] sm:w-auto"
          >
            Contact support
          </a>
        </div>
      </section>
    </AssessmentShell>
  );
}