"use client";

import { useEffect, useState } from "react";
import { systemButton } from "./SystemShell";

export type OfflineMode = "assessment" | "submitted" | "admin";

export function useOfflineMemoryHolding(unsentInputPresent: boolean) {
  const [online, setOnline] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  useEffect(() => {
    if (!unsentInputPresent) return;
    const warnBeforeExit = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warnBeforeExit);
    return () => window.removeEventListener("beforeunload", warnBeforeExit);
  }, [unsentInputPresent]);

  const retry = async (save: () => Promise<boolean>) => {
    setRetrying(true);
    try { return await save(); } finally { setRetrying(false); }
  };

  return { online, retrying, retry };
}

export function OfflineMemoryHolding({ mode, unsentInputPresent = false, lastConfirmedSavedAt, onRetrySave }: { mode: OfflineMode; unsentInputPresent?: boolean; lastConfirmedSavedAt?: string; onRetrySave?: () => Promise<boolean> }) {
  const { online, retrying, retry } = useOfflineMemoryHolding(unsentInputPresent);
  if (online && !unsentInputPresent) return null;
  const assessment = mode === "assessment";
  const message = assessment && unsentInputPresent ? "We could not save this answer. Check your connection and try again. Your current entry remains on this device until you leave or refresh." : mode === "admin" ? "You are offline. Writes are disabled until a fresh connection and authorization state are confirmed." : "Your connection is unavailable. We will not claim a submission or report is complete until the service confirms it.";
  return <aside role="status" aria-live="polite" className="fixed inset-x-0 bottom-0 z-50 border-t border-[#D8DEE8] bg-white px-4 py-4 shadow-[0_-12px_35px_rgba(26,42,74,0.12)] sm:px-8"><div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-[#1A2A4A]">{online ? "Unsaved changes" : "You are offline"}</p><p className="mt-1 max-w-2xl text-sm leading-6 text-[#6B7280]">{message}</p>{lastConfirmedSavedAt ? <p className="mt-1 text-xs text-[#6B7280]">Last confirmed saved: {lastConfirmedSavedAt}</p> : null}</div>{assessment && onRetrySave ? <button type="button" disabled={!online || retrying} onClick={() => void retry(onRetrySave)} className={`${systemButton} shrink-0 bg-[#1A2A4A] text-white hover:bg-[#2A4060] disabled:cursor-not-allowed disabled:opacity-50`}>{retrying ? "Retrying save…" : "Retry save"}</button> : null}</div></aside>;
}
