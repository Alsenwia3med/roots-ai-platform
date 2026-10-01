export interface NarrativeProjection {
  readonly schema_version: string;
  readonly prompt_version: string;
  readonly content_library_version: string;
  readonly scores: Readonly<Record<string, number | null>>;
  readonly classifications: Readonly<Record<string, string | null>>;
}

export interface GovernedNarrative {
  readonly narrative: string;
  readonly provenance: "provider" | "deterministic_fallback";
}

export function parseNarrative(value: unknown): GovernedNarrative {
  if (!value || typeof value !== "object") throw new Error("Narrative response must be an object");
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.narrative !== "string" || candidate.narrative.trim() === "") {
    throw new Error("Narrative response has no narrative text");
  }
  return {
    narrative: candidate.narrative,
    provenance: candidate.provenance === "provider" ? "provider" : "deterministic_fallback",
  };
}
