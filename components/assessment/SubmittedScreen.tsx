import React from "react";

import { AssessmentShell } from "./AssessmentShell";
import { REPORT_FAIL, REPORT_GENERATING } from "../../lib/content/c04-system-messages";

/**
 * ASM-10 — Report Generating, /assessment/[session]/submitted.
 *
 * C-05 zone contract:
 *   1 Success — submission reference and timestamp
 *   2 Progress — answers received → scores calculated → report prepared
 *   3 Safety — do NOT claim completion unless true; state email/report access
 *   4 Action — Open report when ready; secure sign-out
 *
 * ASM-11 — Submission Recovery, the error state of the same route.
 *
 * Zone 3 is why `completed` is a prop rather than assumed. C-05 says "Do not
 * close claim only if true": this screen must never state the report is ready
 * unless the server has confirmed it. It is passed in and defaulting to `false`
 * means the pessimistic wording renders until something proves otherwise.
 *
 * ASM-11 zone 4 is explicit in C-05: "Never ask participant to re-enter answers
 * unless data integrity check fails", so the recovery state offers a retry and
 * support only.
 */

type Status = "generating" | "failed";

export function SubmittedScreen({
  reference,
  completedAt,
  status = "generating",
}: {
  reference: string;
  completedAt?: string;
  status?: Status;
}) {
  const failed = status === "failed";

  return (
    <AssessmentShell>
      <section className="rounded-2xl border border-[#D8DEE8] bg-white p-6 shadow-sm sm:p-8">
        {/* Zone 1. */}
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#437971]">
          {failed ? "Submission received" : "Submission received"}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[#1A2A4A]">
          {failed ? "Your answers are saved" : "Your report is being prepared"}
        </h1>

        <dl className="mt-6 grid gap-2 rounded-xl border border-[#D8DEE8] bg-[#F3F4F6] p-5 text-sm">
          <div className="flex flex-wrap gap-2">
            <dt className="font-semibold text-[#1A2A4A]">Submission reference</dt>
            <dd className="text-[#4B5563]">{reference}</dd>
          </div>
          {completedAt ? (
            <div className="flex flex-wrap gap-2">
              <dt className="font-semibold text-[#1A2A4A]">Submitted</dt>
              <dd className="text-[#4B5563]">{completedAt}</dd>
            </div>
          ) : null}
        </dl>

        {/* Zone 2 — the pipeline. Only rendered while generating. */}
        {!failed ? (
          <ol className="mt-6 space-y-3" aria-label="Report progress">
            {["Answers received", "Scores calculated", "Report prepared"].map(
              (step, index) => (
                <li key={step} className="flex items-center gap-3 text-sm text-[#4B5563]">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3F4F6] text-xs font-bold text-[#437971]"
                  >
                    {index + 1}
                  </span>
                  {step}
                </li>
              ),
            )}
          </ol>
        ) : null}

        {/* Zone 3 — safety. Never claim the report is ready without proof. */}
        <div className="mt-6 rounded-xl border border-[#D8DEE8] bg-[#F3F4F6] p-5">
          <p className="text-sm leading-6 text-[#4B5563]">
            {failed ? REPORT_FAIL : REPORT_GENERATING}
          </p>
          {!failed ? (
            <p className="mt-3 text-sm leading-6 text-[#4B5563]">
              We will email you when your report is ready. You do not need to keep this page
              open, and you can sign out safely.
            </p>
          ) : null}
        </div>

        {/* Zone 4 — action. */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {failed ? (
            <>
              {/* ASM-11 zone 3 — retry the report, never re-enter answers. */}
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1A2A4A] px-6 text-sm font-semibold text-white hover:bg-[#24365C]"
              >
                Retry report preparation
              </button>
              <a
                href="/contact"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D8DEE8] bg-[#F3F4F6] px-6 text-sm font-semibold text-[#1A2A4A] hover:bg-[#E5E7EB]"
              >
                Contact support
              </a>
            </>
          ) : (
            <a
              href="/auth/sign-out"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1A2A4A] px-6 text-sm font-semibold text-white hover:bg-[#24365C]"
            >
              Sign out securely
            </a>
          )}
        </div>
      </section>
    </AssessmentShell>
  );
}