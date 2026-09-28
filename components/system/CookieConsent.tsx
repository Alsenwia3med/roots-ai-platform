"use client";

import React, { useEffect, useRef, useState } from "react";
import { CONSENT_STORAGE_KEY, CURRENT_CONSENT_VERSION, CookieConsentRecord } from "../../lib/content/cookie-consent";
import { systemButton } from "./SystemShell";

type ConsentView = "banner" | "preferences";

function readConsent(): CookieConsentRecord | null {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value ? (JSON.parse(value) as CookieConsentRecord) : null;
  } catch {
    return null;
  }
}

export function CookieConsent({ forceOpen = false }: { forceOpen?: boolean }) {
  const [view, setView] = useState<ConsentView | null>(null);
  const [analytics, setAnalytics] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (forceOpen) setView("preferences");
    else if (!readConsent()) setView("banner");
  }, [forceOpen]);

  useEffect(() => {
    if (!view) return;
    previousFocus.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setView(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus();
    };
  }, [view]);

  const save = (allowAnalytics: boolean) => {
    const record: CookieConsentRecord = {
      version: CURRENT_CONSENT_VERSION,
      analytics: allowAnalytics,
      decidedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Consent remains essential-only when browser storage is unavailable.
    }
    setView(null);
  };

  if (!view) return null;
  const preferences = view === "preferences";
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#1A2A4A]/45 p-3 sm:items-center sm:p-6" role="presentation">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="cookie-title" aria-describedby="cookie-description" className="w-full max-w-xl rounded-2xl border border-[#D8DEE8] bg-white p-5 text-[#1A1A1A] shadow-2xl outline-none sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6B7280]">Privacy choices</p><h2 id="cookie-title" className="mt-2 text-xl font-bold text-[#1A2A4A]">Cookies and optional analytics</h2></div><button type="button" onClick={() => setView(null)} aria-label="Close cookie preferences" className={`${systemButton} w-11 p-0 text-2xl text-[#1A2A4A] hover:bg-[#F3F4F6]`}>×</button></div>
        <p id="cookie-description" className="mt-5 text-sm leading-6 text-[#4B5563]">Essential cookies keep the public site working. Optional analytics are off until you choose otherwise. Health data, answers, scores, and report content are never sent to analytics, advertising, or replay tools.</p>
        {preferences ? <div className="mt-6 space-y-3"><div className="rounded-xl border border-[#D8DEE8] p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold text-[#1A2A4A]">Essential</h3><p className="mt-1 text-xs leading-5 text-[#6B7280]">Required for session and security functions.</p></div><span className="text-xs font-semibold text-[#6B7280]">Always on</span></div></div><label className="flex min-h-16 cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#D8DEE8] p-4"><span><span className="block font-semibold text-[#1A2A4A]">Optional analytics</span><span className="mt-1 block text-xs leading-5 text-[#6B7280]">Purpose: public-site usage. Provider: {"{{analytics_provider}}"}.</span></span><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="h-5 w-5 accent-[#1A2A4A]" /></label></div> : null}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => save(false)} className={`${systemButton} border border-[#1A2A4A] text-[#1A2A4A] hover:bg-[#F3F4F6]`}>Reject optional analytics</button>{preferences ? <button type="button" onClick={() => save(analytics)} className={`${systemButton} bg-[#1A2A4A] text-white hover:bg-[#2A4060]`}>Save preferences</button> : <button type="button" onClick={() => setView("preferences")} className={`${systemButton} border border-[#1A2A4A] text-[#1A2A4A] hover:bg-[#F3F4F6]`}>Manage choices</button>} {!preferences ? <button type="button" onClick={() => save(true)} className={`${systemButton} bg-[#1A2A4A] text-white hover:bg-[#2A4060]`}>Accept optional analytics</button> : null}</div>
      </div>
    </div>
  );
}

export function CookieSettingsButton() {
  const [open, setOpen] = useState(false);
  return <><button type="button" onClick={() => setOpen(true)} className="min-h-11 text-sm underline underline-offset-4 hover:text-[#00E5FF]">Cookies</button>{open ? <CookieConsent forceOpen /> : null}</>;
}
