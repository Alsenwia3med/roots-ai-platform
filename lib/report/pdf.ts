import type { CanonicalReport } from "./canonical";

/** PDF adapters consume the same canonical object as the web renderer. */
export function buildPdfModel(report: CanonicalReport): CanonicalReport {
  return report;
}
