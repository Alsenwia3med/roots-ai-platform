import Image from "next/image";
import React from "react";
import { PublicFooter } from "../PublicFooter";

const links = [["How It Works", "/how-it-works"], ["Platform", "/platform"], ["Example Report", "/example-report"], ["Research", "/research"], ["About", "/about"]];

export function LegalDisclaimerScreen() {
  return (
    <div className="legal-screen min-h-screen bg-[#FAFAF8] text-[#1A1A1A]">
      <header className="bg-[#1A2A4A]">
        <nav className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Public navigation">
          <a href="/" aria-label="ROOTS-AI home" className="inline-flex min-h-11 items-center"><Image src="/assets/branding/logo.png" alt="ROOTS-AI" width={126} height={30} className="h-[30px] w-auto object-contain" /></a>
          <div className="hidden items-center gap-7 text-sm text-white md:flex">{links.map(([label, href]) => <a key={href} href={href} className="min-h-11 inline-flex items-center hover:underline">{label}</a>)}</div>
          <a href="/assessment" className="inline-flex min-h-11 items-center rounded-lg bg-white px-4 text-sm font-semibold text-[#1A2A4A] hover:bg-[#F3F4F6]">Start Assessment</a>
        </nav>
      </header>
      <main id="main">
        <section className="border-b border-[#D8DEE8] bg-[#F3F4F6] px-4 py-8 text-center sm:py-10"><h1 className="text-[34px] font-bold leading-tight text-[#1A2A4A] sm:text-[40px]">Medical Disclaimer</h1><p className="mt-3 text-sm text-[#6B7280]">Effective date: 21 July 2026 · C-04 Version: 1.0.0</p></section>
        <div className="mx-auto max-w-[944px] px-4 py-10 sm:px-8 lg:py-14"><section className="rounded-xl border border-[#D8DEE8] bg-[#F3F4F6] p-6 sm:p-8"><p className="max-w-3xl text-base leading-7">ROOTS-AI™ provides educational wellness information based primarily on self-reported answers. It is not a medical device, doctor, healthcare provider, diagnostic test, clinical risk assessment, prognosis or treatment service.</p></section><section className="mt-10 space-y-8"><h2 className="text-lg font-bold text-[#1A2A4A]">Medical Disclaimer</h2><p>ROOTS-AI™ provides educational wellness information based primarily on self-reported answers. It is not a medical device, doctor, healthcare provider, diagnostic test, clinical risk assessment, prognosis or treatment service.</p><p>It does not establish a clinician-patient relationship and does not replace medical history, examination, laboratory testing or professional judgment.</p><p>Do not start, stop or change medication, supplements, diet, exercise or treatment because of a ROOTS-AI™ report without appropriate professional advice.</p><p>Questionnaire scores are proprietary indicators and are not validated probabilities of disease or future outcomes.</p><p>Persistent, severe, sudden or worsening symptoms require appropriate professional evaluation.</p><p>If you believe you may be in immediate danger, contact local emergency services.</p></section><section className="mt-10 rounded-xl border border-[#AAB4C3] bg-white p-6 sm:p-8"><h2 className="text-lg font-bold text-[#1A2A4A]">Emergency direction</h2><p className="mt-4">If you believe you may be in immediate danger, contact local emergency services.</p></section><section className="mt-10"><h2 className="text-lg font-bold text-[#1A2A4A]">Related</h2><div className="mt-4 flex flex-col gap-3 sm:flex-row"><a href="/terms" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D8DEE8] bg-[#F3F4F6] px-5 text-sm font-semibold text-[#1A2A4A]">Terms</a><a href="/ai-disclaimer" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D8DEE8] bg-[#F3F4F6] px-5 text-sm font-semibold text-[#1A2A4A]">AI Disclaimer</a></div></section></div>
      </main>
        <PublicFooter />
    </div>
  );
}

