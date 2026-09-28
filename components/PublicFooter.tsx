import Image from "next/image";
import React from "react";

const columns = [
  { title: "Product", links: [["Assessment", "/assessment"], ["Example Report", "/example-report"], ["How It Works", "/how-it-works"], ["Platform", "/platform"]] },
  { title: "Company", links: [["About", "/about"], ["Research", "/research"], ["Healthcare Professionals", "/healthcare-professionals"], ["Pilot Program", "/pilot"], ["Contact", "/contact"], ["Blog", "/blog"]] },
  { title: "Legal", links: [["Privacy", "/privacy"], ["Terms", "/terms"], ["Cookies", "/cookies"], ["Medical Disclaimer", "/medical-disclaimer"], ["AI Disclaimer", "/ai-disclaimer"]] },
];

export function PublicFooter() {
  return <footer className="bg-[#1A2A4A] px-5 py-14 text-white sm:px-8"><div className="mx-auto max-w-[1280px]"><div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1.5fr_1.2fr]"><div><Image src="/assets/branding/logo.png" alt="ROOTS-AI" width={126} height={30} className="h-8 w-auto object-contain" /></div>{columns.map((column) => <div key={column.title}><h2 className="font-bold">{column.title}</h2><div className="mt-3">{column.links.map(([label, href]) => <a key={href} href={href} className="block min-h-11 pt-2 text-sm hover:underline">{label}</a>)}</div></div>)}</div><div className="mt-10 border-t border-white/20 pt-6 text-sm leading-6 text-[#E5E7EB]">ROOTS-AI™ provides educational wellness information and does not diagnose or treat medical conditions.<br /><span className="text-[#C7CDD6]">Educational — Not a Diagnosis · Version 1.0.0 · © {new Date().getFullYear()} ROOTS AI HEALTH SYSTEMS, Inc.</span></div></div></footer>;
}
