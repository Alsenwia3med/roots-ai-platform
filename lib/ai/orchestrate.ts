import { deterministicFallback } from "./language";
import { callProvider, type AiProvider } from "./provider";
import type { GovernedNarrative, NarrativeProjection } from "./schema";

export async function orchestrateNarrative(
  projection: NarrativeProjection,
  provider?: AiProvider,
): Promise<GovernedNarrative> {
  if (!provider) return { narrative: deterministicFallback(projection), provenance: "deterministic_fallback" };
  try {
    const result = await callProvider(provider, projection);
    return { narrative: result.narrative, provenance: "provider" };
  } catch {
    return { narrative: deterministicFallback(projection), provenance: "deterministic_fallback" };
  }
}
