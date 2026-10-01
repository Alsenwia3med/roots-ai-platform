import type { Metadata } from "next";
import Image from "next/image";
import React from "react";

import { PublicFooter } from "../PublicFooter";
import { FOOTER_BOUNDARY, PRODUCT_STATEMENT } from "../../lib/content/c04-system-messages";

const links = [
  ["How It Works", "/how-it-works"],
  ["Platform", "/platform"],
  ["Example Report", "/example-report"],
  ["Research", "/research"],
  ["About", "/about"],
];

/**
 * LEG-05 — AI Disclaimer, route /ai-disclaimer.
 *
 * C-05 §2 requires this screen, and the C-04 footer legal list already links to
 * it, so it must exist: the footer rendered a link that resolved to a 404 before
 * this component existed.
 *
 * Every paragraph below is quoted verbatim from C-04 §8, "AI Disclaimer". C-05 §1
 * forbids paraphrasing approved sentences, so the text is held here as literal
 * copy rather than assembled or summarised — the AI boundary is the most
 * load-bearing sentence in the product and must not drift.
 */
export function AiDisclaimerScreen() {
  return (
    <div className="legal-screen min-h-screen bg-[#FAFAF8] text-[#1A1A1A]">
      <header className="bg-[#1A2A4A]">
        <nav
          className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8"
          aria-label="Public navigation"
        >
          <a href="/" aria-label="ROOTS-AI home" className="inline-flex min-h-11 items-center">
            <Image
              src="/assets/branding/logo.png"
              alt="ROOTS-AI"
              width={126}
              height={30}
              className="h-[30px] w-auto object-contain"
            />
          </a>
          <div className="hidden items-center gap-7 text-sm text-white md:flex">
            {links.map(([label, href]) => (
              <a key={href} href={href} className="inline-flex min-h-11 items-center hover:underline">
                {label}
              </a>
            ))}
          </div>
          <a
            href="/assessment"
            className="inline-flex min-h-11 items-center rounded-lg bg-white px-4 text-sm font-semibold text-[#1A2A4A] hover:bg-[#F3F4F6]"
          >
            Start Your Assessment
          </a>
        </nav>
      </header>

      <main id="main">
        <section className="border-b border-[#D8DEE8] bg-[#F3F4F6] px-4 py-8 text-center sm:py-10">
          <h1 className="text-[34px] font-bold leading-tight text-[#1A2A4A] sm:text-[40px]">
            AI Disclaimer
          </h1>
          <p className="mt-3 text-sm text-[#6B7280]">
            Effective date: 21 July 2026 · C-04 Version: 1.0.0 · {PRODUCT_STATEMENT}
          </p>
        </section>

        <div className="mx-auto max-w-[944px] px-4 py-10 sm:px-8 lg:py-14">
          <section className="rounded-xl border border-[#D8DEE8] bg-[#F3F4F6] p-6 sm:p-8">
            <p className="max-w-3xl text-base leading-7">
              Scores are calculated by fixed, deterministic rules. Where an AI language model is
              used, it assists with approved explanatory wording only.
            </p>
          </section>

          {/* C-04 section 8, verbatim. */}
          <section className="mt-10 space-y-8">
            <h2 className="text-lg font-bold text-[#1A2A4A]">AI Disclaimer</h2>
            <p>
              ROOTS-AI™ uses deterministic rules to calculate questionnaire scores, classifications,
              drivers, data-quality indicators and eligible content.
            </p>
            <p>
              An AI language model may assist in expressing approved information clearly. The model
              is not permitted to calculate or change scores, diagnose disease, prescribe treatment,
              interpret laboratory results or invent participant facts.
            </p>
            <p>
              AI-assisted text can be incomplete or imperfect; fixed validation, logging and fallback
              rules are applied.
            </p>
            <p>
              Review the underlying answers and limitations, and consult a qualified professional for
              medical decisions.
            </p>
          </section>
          <section className="mt-10 rounded-xl border border-[#AAB4C3] bg-white p-6 sm:p-8">
            <h2 className="text-lg font-bold text-[#1A2A4A]">What the model never does</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[#1A1A1A]">
              <li>Calculate or alter any score, classification or driver.</li>
              <li>Diagnose a disease or condition.</li>
              <li>Prescribe, suggest or change treatment or medication.</li>
              <li>Interpret laboratory results.</li>
              <li>Invent facts about a participant that they did not report.</li>
            </ul>
          </section>

          <section className="mt-10 rounded-xl border border-[#D8DEE8] bg-white p-6 sm:p-8">
            <p className="text-[#1A1A1A]">{FOOTER_BOUNDARY}</p>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-bold text-[#1A2A4A]">Related</h2>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              {[
                ["Medical Disclaimer", "/medical-disclaimer"],
                ["Privacy", "/privacy"],
                ["Terms", "/terms"],
                ["Cookies", "/cookies"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D8DEE8] bg-[#F3F4F6] px-5 text-sm font-semibold text-[#1A2A4A]"
                >
                  {label}
                </a>
              ))}
            </div>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

export const aiDisclaimerMetadata: Metadata = {
  title: "AI Disclaimer — ROOTS-AI™",
  description:
    "How AI is and is not used in the ROOTS-AI assessment: deterministic scoring, approved language assistance, and the limits of the model.",
};