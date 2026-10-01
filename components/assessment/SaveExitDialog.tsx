"use client";

import React, { useEffect, useRef } from "react";

/**
 * ASM-07 — Save and Exit modal.
 *
 * C-05 zone contract:
 *   1 Status — last saved timestamp
 *   2 Body — explain secure-link resume
 *   3 Actions — Save & Exit (primary); Continue Assessment (secondary)
 *
 * Focus is moved into the dialog on open and Escape closes it, so the modal is
 * operable by keyboard rather than trapping focus behind the page behind it.
 */
export function SaveExitDialog({
  onContinue,
  onExit,
  session,
  savedLabel,
}: {
  onContinue: () => void;
  onExit?: () => void;
  session: string;
  savedLabel?: string | null;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onContinue();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus();
    };
  }, [onContinue]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1A2A4A]/45 p-4 sm:items-center">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-exit-title"
        className="w-full max-w-md rounded-2xl border border-[#D8DEE8] bg-white p-6 shadow-2xl outline-none"
      >
        {/* Zone 1 — status. */}
        <h2 id="save-exit-title" className="text-xl font-bold text-[#1A2A4A]">
          {savedLabel ? `Saved — ${savedLabel}` : "Save your progress and exit"}
        </h2>
        {/* Zone 2 — secure-link resume explanation. */}
        <p className="mt-3 text-sm leading-6 text-[#4B5563]">
          Your answers up to this point are stored. You can close this page and return later using
          the secure link sent to your email — there is no need to start again.
        </p>
        {/* Zone 3 — actions. */}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D8DEE8] bg-[#F3F4F6] px-5 text-sm font-semibold text-[#1A2A4A] hover:bg-[#E5E7EB]"
          >
            Continue Assessment
          </button>
          <a
            href={`/assessment/${session}/resume`}
            onClick={onExit}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1A2A4A] px-5 text-sm font-semibold text-white hover:bg-[#24365C]"
          >
            Save &amp; Exit
          </a>
        </div>
      </div>
    </div>
  );
}