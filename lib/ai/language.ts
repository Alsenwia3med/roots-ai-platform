import type { NarrativeProjection } from "./schema";

export const deterministicFallback = (projection: NarrativeProjection): string => {
  const available = Object.entries(projection.classifications).filter(([, value]) => value !== null);
  if (available.length === 0) return "Not enough information is available to provide a governed narrative.";
  return `This educational view reflects ${available.length} classified domain${available.length === 1 ? "" : "s"} from the deterministic assessment engine.`;
};
