import Image from "next/image";
import React from "react";

export const systemButton = "inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E5FF]";

export function SystemShell({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]">
      <header className="bg-[#1A2A4A]">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <a href="/" aria-label="ROOTS-AI home" className="inline-flex min-h-11 items-center">
            <Image src="/assets/branding/logo.png" alt="ROOTS-AI" width={126} height={30} className="h-7 w-auto object-contain" priority />
          </a>
          <a href="/contact" className={`${systemButton} border border-white/30 text-white hover:bg-white/10`}>Contact</a>
        </div>
      </header>
      <main>{title ? <h1 className="sr-only">{title}</h1> : null}{children}</main>
    </div>
  );
}

export function SystemCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#D8DEE8] bg-white p-6 shadow-sm sm:p-8 ${className}`}>{children}</section>;
}
