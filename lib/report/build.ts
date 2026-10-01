import type { CanonicalReport } from "./canonical";

export function buildCanonicalReport(input: CanonicalReport): CanonicalReport {
  return { ...input, sections: [...input.sections] };
}
