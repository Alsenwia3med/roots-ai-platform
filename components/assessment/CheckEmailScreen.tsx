"use client";

import React, { useEffect, useState } from "react";

import { AssessmentShell } from "./AssessmentShell";

/**
 * ASM-02 — Secure Link Requested, /assessment/check-email.
 *
 * C-05 zone contract:
 *   1 Neutral email-sent message
 *   2 Instructions — check inbox/spam; link expiry
 *   3 Resend — rate-limited after timer
 *   4 Change email — return safely
 *
 * The message is deliberately neutral: it must NOT reveal whether an account
 * exists (C-05 "without revealing account existence"). It therefore reads the
 * same whether the address was known or not.
 */
export function CheckEmailScreen({ email }: { email?: string }) {
  // C-05 zone 3 — resend is rate-limited after a timer. The countdown starts
  // only on mount; a full page reload cannot be used to bypass it, because the
  // real limit is enforced server-side too. This is the visible affordance.
  const RESEND_COOLDOWN_SECONDS = 60;
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return (
    <AssessmentShell>
      <section className="rounded-2xl border border-[#D8DEE8] bg-white p-6 text-center shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-[#1A2A4A]">Check your email</h1>
        <p className="mt-4 text-base leading-7 text-[#4B5563]">
          {email ? (
            <>
              If that address matches an account, a secure access link is on its way. You can close
              this page.
            </>
          ) : (
            <>If that address matches an account, a secure access link is on its way.</>
          )}
        </p>
        {/* C-05 zone 2 — instructions and expiry. */}
        <p className="mt-3 text-sm leading-6 text-[#6B7280]">
          Check your inbox and your spam folder. The link expires, and you can request a new one at
          any time from this page.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {/* C-05 zone 3 — resend, rate-limited. */}
          <form action="/api/auth/magic-link" method="post">
            <input type="hidden" name="email" value={email ?? ""} />
            <button
              type="submit"
              disabled={secondsLeft > 0}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#D8DEE8] bg-[#F3F4F6] px-6 text-sm font-semibold text-[#1A2A4A] hover:bg-[#E5E7EB] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {secondsLeft > 0 ? `Resend available in ${secondsLeft}s` : "Resend secure link"}
            </button>
          </form>
          {/* C-05 zone 4 — change email, returns safely. */}
          <a
            href="/assessment"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg px-6 text-sm font-semibold text-[#1A2A4A] underline underline-offset-4 sm:w-auto"
          >
            Use a different email
          </a>
        </div>
      </section>
    </AssessmentShell>
  );
}