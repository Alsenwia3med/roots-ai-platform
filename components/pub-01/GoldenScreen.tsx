import Image from "next/image";
import React from "react";
import { PublicFooter } from "../../components/PublicFooter";

const domains = [
  ["HU", "Hunger & Appetite", "Signals · Reward · Eating behaviour", "#D97706"],
  ["SL", "Sleep & Recovery", "Rhythms · Hormones · Restoration", "#2563EB"],
  ["ME", "Metabolism", "Energy · Insulin · Storage", "#0D9488"],
  ["CI", "Circadian Timing", "Biological Clock · Hormonal Rhythm", "#EF4444"],
  ["SA", "Safety & Immunity", "Inflammation · Defense · Repair", "#10B981"],
  ["ST", "Stress Response", "HPA Axis · Resilience · Adaptation", "#F97316"],
  ["IN", "Inflammation", "Microbiome · Gut Barrier · Systemic Signals", "#8B5CF6"],
];

const cards = [
  ["Beyond a number on the scale", "See the pattern behind the struggle."],
  ["Seven biological domains", "One connected view."],
  ["Deterministic scores", "AI assists with explanation, not calculation."],
  ["Your report", "19 transparent sections with your answers and limitations."],
  ["Private by design", "Controlled access, versioning and audit."],
  ["Educational, not diagnostic", "Designed to support informed conversations and realistic next steps."],
];

export const Pub01GoldenScreen: React.FC = () => (
  <div className="min-h-screen bg-[#FAFAF8] font-sans text-[#1A1A1A]" style={{ fontFamily: "Inter, Arial, sans-serif" }}>
    <header className="sticky top-0 z-50 h-[72px] bg-[#1A2A4A] text-white shadow-sm">
      <nav className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-5 lg:px-8" aria-label="Public navigation">
        <a href="/" aria-label="ROOTS-AI home"><Image src="/assets/branding/logo.png" alt="ROOTS-AI" width={126} height={30} className="h-8 w-auto object-contain" priority /></a>
        <div className="hidden items-center gap-8 text-sm font-medium md:flex"><a href="/how-it-works" className="min-h-11 inline-flex items-center hover:underline">How It Works</a><a href="/platform" className="min-h-11 inline-flex items-center hover:underline">Platform</a><a href="/example-report" className="min-h-11 inline-flex items-center hover:underline">Example Report</a><a href="/research" className="min-h-11 inline-flex items-center hover:underline">Research</a><a href="/pilot" className="min-h-11 inline-flex items-center hover:underline">About</a><button type="button" className="min-h-11">More</button></div>
        <a href="/assessment" className="inline-flex min-h-11 items-center rounded-lg bg-white px-5 text-sm font-bold text-[#1A2A4A] hover:bg-[#F3F4F6]">Start Your Assessment</a>
      </nav>
    </header>

    <main>
      <section className="bg-[#1A2A4A] px-5 pb-20 pt-24 text-white sm:px-8 lg:pb-24 lg:pt-28"><div className="mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]"><div><p className="text-sm font-bold uppercase tracking-wide text-[#D4AD55]">Biological Intelligence Platform</p><h1 className="mt-6 max-w-3xl text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-[54px]">Decode the Biology<br />Before You Fight the Weight</h1><p className="mt-8 max-w-[580px] text-lg leading-7 text-white/90">ROOTS-AI™ turns a structured assessment into a governed biological intelligence report—helping you understand patterns in metabolism, hunger, sleep, circadian timing, stress, inflammation-related signals and perceived biological resistance.</p><div className="mt-10 flex flex-col gap-3 sm:flex-row"><a href="/assessment" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#D4AD55] px-6 text-sm font-bold text-[#1A2A4A] hover:bg-[#e2c478]">Start Your Assessment</a><a href="/example-report" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white px-6 text-sm font-bold text-white hover:bg-white/10">View Example Report</a></div></div><BiologicalNetwork /></div></section>

      <section className="border-b border-[#E5E7EB] bg-white px-5 py-6 sm:px-8"><div className="mx-auto grid max-w-[1280px] gap-5 text-center text-lg font-semibold text-[#1A2A4A] sm:grid-cols-4"><span>Educational, not diagnostic</span><span>Deterministic scoring</span><span>Governed AI explanation</span><span>Private by design</span></div></section>

      <section className="px-5 py-24 sm:px-8 lg:py-28"><div className="mx-auto max-w-[1280px]"><p className="text-sm font-bold uppercase tracking-wide text-[#2A4060]">What changes</p><h2 className="mt-5 max-w-4xl text-4xl font-bold leading-tight text-[#1A2A4A] sm:text-5xl">A connected view of the patterns behind the struggle</h2><div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{cards.map(([title, copy]) => <article key={title} className="min-h-[134px] rounded-xl border border-[#D8DEE8] bg-white p-6 shadow-sm"><h3 className="text-lg font-bold text-[#1A2A4A]">{title}</h3><p className="mt-3 text-lg leading-7 text-[#6B7280]">{copy}</p></article>)}</div></div></section>

      <section id="framework" className="border-y border-[#E5E7EB] bg-white px-5 py-16 sm:px-8 lg:py-24"><div className="mx-auto max-w-[1280px]"><h2 className="text-4xl font-bold text-[#1A2A4A] sm:text-5xl">One biological intelligence framework</h2><div className="mt-10 rounded-2xl bg-[#1A2A4A] p-4 shadow-sm sm:p-6 lg:p-8"><div className="relative aspect-[957/658] w-full overflow-hidden rounded-xl"><Image src="/assets/icons/Screenshot 2026-09-11 174308.png" alt="ROOTS-AI biological intelligence framework and seven health domains" fill sizes="(max-width: 1280px) 100vw, 1280px" className="object-contain" /></div></div></div></section>

      <section id="how-it-works" className="px-5 py-24 sm:px-8 lg:py-28"><div className="mx-auto max-w-[1280px]"><p className="text-sm font-bold uppercase tracking-wide text-[#2A4060]">How it works</p><h2 className="mt-5 text-4xl font-bold text-[#1A2A4A] sm:text-5xl">From structured answers to governed explanation</h2><div className="mt-12 grid gap-10 lg:grid-cols-4">{[["01", "Assess", "Complete the structured 73-question assessment."], ["02", "Validate", "Approved responses are normalized and Not Applicable answers remain preserved."], ["03", "Analyse", "Deterministic rules calculate seven domains and derived indicators, then select drivers, confidence and eligible content."], ["04", "Explain & Render", "Governed AI turns approved explanation objects into clear language; web and PDF reports are produced from the same immutable report."]].map(([number, title, copy]) => <article key={number} className="relative"><span className="text-sm font-bold text-[#2A4060]">{number}</span><h3 className="mt-5 text-2xl font-bold text-[#1A2A4A]">{title}</h3><p className="mt-3 text-lg leading-7 text-[#6B7280]">{copy}</p></article>)}</div></div></section>

      <section id="report" className="border-y border-[#E5E7EB] bg-[#FAFAF8] px-5 py-24 sm:px-8 lg:py-28"><div className="mx-auto max-w-[1280px]"><p className="text-sm font-bold uppercase tracking-wide text-[#2A4060]">Example report</p><h2 className="mt-5 text-4xl font-bold text-[#1A2A4A] sm:text-5xl">See the state, drivers and boundaries clearly</h2><p className="mt-5 max-w-3xl text-lg leading-7 text-[#6B7280]">The preview uses approved sample values and demonstrates the required loaded, loading and error states.</p><a href="/example-report" className="mt-8 inline-flex min-h-11 items-center rounded-lg bg-[#1A2A4A] px-6 text-sm font-bold text-white">View Example Report</a><div className="mt-12 grid gap-8 rounded-2xl bg-[#1A2A4A] p-8 text-white lg:grid-cols-[0.8fr_1fr_1fr_1fr]"><div><p className="text-sm font-bold text-[#D4AD55]">Biological State</p><strong className="mt-5 block text-7xl">61<small className="text-2xl">/100</small></strong><span className="font-bold text-[#F97316]">STRAINED</span></div>{[["Stress Load", "75", "#F97316"], ["Sleep Recovery", "68", "#58A89A"], ["Metabolic Resistance", "62", "#D4AD55"]].map(([label, value, color]) => <div key={label} className="pt-3"><p className="font-bold">{label}</p><strong className="mt-5 block text-5xl" style={{ color }}>{value}</strong><div className="mt-4 h-2 rounded-full bg-[#2A4060]"><div className="h-2 w-2/3 rounded-full" style={{ backgroundColor: color }} /></div></div>)}</div></div></section>

      <section id="pilot" className="px-5 py-24 sm:px-8 lg:py-28"><div className="mx-auto max-w-[1280px] rounded-xl border border-[#D8DEE8] bg-white p-8 sm:p-12"><p className="text-sm font-bold uppercase tracking-wide text-[#2A4060]">Pilot program</p><h2 className="mt-5 text-4xl font-bold text-[#1A2A4A] sm:text-5xl">Join the ROOTS-AI™ Free Beta</h2><p className="mt-6 max-w-2xl text-lg leading-7 text-[#6B7280]">The beta explores whether a structured, non-diagnostic assessment can help people understand self-reported patterns involving weight resistance, energy, sleep, stress and appetite.</p><ul className="mt-8 max-w-2xl list-disc space-y-2 pl-5 text-lg text-[#6B7280]"><li>Adults aged 18 and over.</li><li>Participation is voluntary and withdrawal is permitted.</li><li>The experience is educational and does not provide medical care.</li><li>Usability feedback and research participation require separate consent.</li><li>No payment is required for the approved beta cohort.</li></ul><a href="/pilot" className="mt-10 inline-flex min-h-11 items-center rounded-lg bg-[#1A2A4A] px-6 text-sm font-bold text-white">Check Eligibility</a></div></section>

      <section className="bg-[#1A2A4A] px-5 py-24 text-white sm:px-8 lg:py-28"><div className="mx-auto max-w-[1280px]"><p className="text-sm font-bold uppercase tracking-wide text-[#D4AD55]">A clearer start</p><h2 className="mt-5 max-w-3xl text-5xl font-bold leading-tight sm:text-6xl">Understand your signals.<br />Choose your next step.</h2><a href="/assessment" className="mt-10 inline-flex min-h-11 items-center rounded-lg bg-[#D4AD55] px-6 text-sm font-bold text-[#1A2A4A]">Start Your Assessment</a></div></section>
    </main>

    <PublicFooter />
  </div>
);

function BiologicalNetwork() {
  return <div className="relative mx-auto aspect-square w-full max-w-[560px] overflow-hidden rounded-2xl border border-[#2A4060] bg-[#1A2A4A] p-5" role="img" aria-label="Interconnected biological intelligence network"><div className="absolute inset-[14%] rounded-full border border-[#58A89A]/60" /><div className="absolute inset-[25%] rounded-full border border-[#D4AD55]/60" /><div className="absolute inset-[37%] rounded-full border border-[#F97316]/70" /><div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#D4AD55] bg-[#1A2A4A] text-center shadow-[0_0_45px_rgba(212,173,85,0.35)]"><span><small className="block text-xs font-bold">BIOLOGICAL</small><strong className="block text-2xl">STATE</strong><small className="block text-[#D4AD55]">61 / 100<br />STRAINED</small></span></div>{domains.map(([code, name, note, color], index) => { const angle = (index / domains.length) * Math.PI * 2 - Math.PI / 2; const left = 50 + Math.cos(angle) * 40; const top = 50 + Math.sin(angle) * 40; return <div key={code} className="absolute w-28 -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${left}%`, top: `${top}%` }}><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#1A2A4A] bg-white text-sm font-bold text-[#1A2A4A]" style={{ boxShadow: `0 0 0 3px ${color}` }}>{code}</span><strong className="mt-2 block text-xs text-white">{name.split(" ")[0]}</strong></div>; })}<div className="absolute inset-x-0 bottom-0 h-1/4 opacity-30 [background:linear-gradient(transparent_49%,#54708f_50%,transparent_51%)] [background-size:100%_28px]" /></div>;
}

