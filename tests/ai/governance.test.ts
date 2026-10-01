import { describe, expect, it } from "vitest";
import { applyGovernedNarrative } from "../../lib/ai/apply";
import { buildNarrativeProjection } from "../../lib/ai/projection";

describe("M3 governed AI boundary", () => {
  const input = {
    scores: { MR: 72, HS: null },
    classifications: { MR: "High", HS: null },
  };

  it("projects scores and classifications only", () => {
    const projection = buildNarrativeProjection(input);
    expect(JSON.stringify(projection)).not.toMatch(/answer|identity|free.?text/i);
    expect(projection.scores.MR).toBe(72);
  });
  it("falls back when no provider key/provider exists", async () => {
    await expect(applyGovernedNarrative(input)).resolves.toMatchObject({ provenance: "deterministic_fallback" });
  });
  it("falls back on invalid provider JSON", async () => {
    await expect(applyGovernedNarrative(input, { complete: async () => ({ invalid: true }) })).resolves.toMatchObject({ provenance: "deterministic_fallback" });
  });
  it("falls back on provider timeout/error", async () => {
    await expect(applyGovernedNarrative(input, { complete: async () => { throw new Error("timeout"); } })).resolves.toMatchObject({ provenance: "deterministic_fallback" });
  });
  it("accepts governed provider output", async () => {
    await expect(applyGovernedNarrative(input, { complete: async () => ({ narrative: "Approved wording", provenance: "provider" }) })).resolves.toEqual({ narrative: "Approved wording", provenance: "provider" });
  });
});
