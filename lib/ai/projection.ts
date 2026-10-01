import { CONTENT_LIBRARY_VERSION, PROMPT_VERSION, SCHEMA_VERSION } from "./config";
import type { NarrativeProjection } from "./schema";

export interface ProjectionScoreInput {
  readonly scores: Readonly<Record<string, number | null>>;
  readonly classifications: Readonly<Record<string, string | null>>;
}

/** Builds the only object permitted to cross the AI boundary. */
export function buildNarrativeProjection(input: ProjectionScoreInput): NarrativeProjection {
  return {
    schema_version: SCHEMA_VERSION,
    prompt_version: PROMPT_VERSION,
    content_library_version: CONTENT_LIBRARY_VERSION,
    scores: { ...input.scores },
    classifications: { ...input.classifications },
  };
}
