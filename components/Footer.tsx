import React from "react";
import { LEGAL_METADATA } from "../lib/content/c04-legal";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950 text-slate-400 py-8 px-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm">
          © {new Date().getFullYear()} ROOTS-AI™. Educational — Not Medical Advice.
        </p>
        <p className="text-xs text-slate-500">
          Effective Date: {LEGAL_METADATA.effectiveDate} | C-04 Release
        </p>
      </div>
    </footer>
  );
};
