import { buildNarrativeProjection, type ProjectionScoreInput } from "./projection";
import { orchestrateNarrative } from "./orchestrate";
import type { AiProvider } from "./provider";

export async function applyGovernedNarrative(input: ProjectionScoreInput, provider?: AiProvider) {
  return orchestrateNarrative(buildNarrativeProjection(input), provider);
}
