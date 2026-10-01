import type { ScoringResult } from "../assessment/scoring-types";

export function toScoresRow(result: ScoringResult) {
  return {
    biological_state: result.biologicalState.value,
    opportunity: result.opportunity,
    recovery_potential: result.recoveryPotential,
    confidence: result.confidence,
    drivers: result.drivers,
    trace: result.trace,
    questionnaire_version: result.questionnaireVersion,
    scoring_rules_version: result.scoringRulesVersion,
  };
}
