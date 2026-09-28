"use client";

import React from "react";
import { SystemCard, SystemShell, systemButton } from "./SystemShell";

type AvailabilityKind = "not-found" | "service-error" | "maintenance";

const content = {
  "not-found": { title: "Page not found", body: "The page may have moved or the address may be incorrect.", primary: "Home" },
  "service-error": { title: "Unable to complete request", body: "Something went wrong. Please try again or contact support if the problem continues.", primary: "Retry" },
  maintenance: { title: "We are making improvements", body: "This service is temporarily unavailable. Please return shortly.", primary: "Refresh" },
} as const;

export function AvailabilityState({ kind, onRetry, maintenanceMessage, statusHref }: { kind: AvailabilityKind; onRetry?: () => void; maintenanceMessage?: string; statusHref?: string }) {
  const item = content[kind];
  const primaryAction = kind === "service-error" ? onRetry : () => window.location.reload();
  return <SystemShell title={item.title}><div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center px-4 py-12 sm:px-8"><SystemCard className="w-full text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F4F6] text-2xl font-bold text-[#1A2A4A]" aria-hidden="true">{kind === "not-found" ? "?" : kind === "maintenance" ? "·" : "!"}</div><p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#6B7280]">ROOTS-AI system notice</p><h2 className="mt-3 text-3xl font-bold text-[#1A2A4A] sm:text-4xl">{item.title}</h2><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#6B7280]">{kind === "maintenance" && maintenanceMessage ? maintenanceMessage : item.body}</p>{kind === "service-error" ? <p className="mt-4 text-xs text-[#6B7280]">Reference: {"{{incident_reference}}"}</p> : null}<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"><button type="button" onClick={primaryAction} className={`${systemButton} bg-[#1A2A4A] text-white hover:bg-[#2A4060]`}>{item.primary}</button>{kind === "not-found" ? <a href="/assessment" className={`${systemButton} border border-[#1A2A4A] text-[#1A2A4A] hover:bg-[#F3F4F6]`}>Start Assessment</a> : null}{kind === "maintenance" && statusHref ? <a href={statusHref} className={`${systemButton} border border-[#1A2A4A] text-[#1A2A4A] hover:bg-[#F3F4F6]`}>Public status</a> : null}<a href="/contact" className={`${systemButton} border border-[#1A2A4A] text-[#1A2A4A] hover:bg-[#F3F4F6]`}>Contact</a></div></SystemCard></div></SystemShell>;
}

export function SafeErrorFallback({ reset }: { reset: () => void }) {
  return <AvailabilityState kind="service-error" onRetry={reset} />;
}
