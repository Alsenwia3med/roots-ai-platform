export interface CanonicalReport {
  readonly reportId: string;
  readonly questionnaireVersion: string;
  readonly scoringVersion: string;
  readonly reportVersion: string;
  readonly sections: readonly string[];
  readonly narrativeProvenance: "provider" | "deterministic_fallback";
}
