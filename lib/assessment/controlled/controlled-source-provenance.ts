/* ===========================================================================
 * ROOTS-AI | Milestone 2: provenance of the controlled sources
 * -------------------------------------------------------------------------
 * AUTO-GENERATED - DO NOT EDIT (scripts/build-controlled-data.mjs).
 *
 * This is the audit trail, not data: it names the exact workbook bytes the
 * transcribed tables came from, so a reviewer can recompute the hash of a
 * received file and see whether this build used it. The received date is NOT
 * stored here on purpose - it belongs to the delivery record, and embedding it
 * would break reproducible regeneration.
 * ==========================================================================*/

/* eslint-disable */

/** Where a controlled source came from and what it authorises. */
export interface ControlledSourceProvenance {
  readonly code: string;
  readonly role: string;
  readonly fileName: string;
  readonly datasetId: string;
  readonly version: string;
  /** sha256 of the workbook file as stored - packaging sensitive. */
  readonly packageSha256: string;
  /** sha256 of sheet names + column names + cell values - re-export tolerant. */
  readonly contentSha256: string;
  readonly sheets: readonly string[];
  /** The README control table, verbatim. */
  readonly controlFields: Readonly<Record<string, string>>;
}

/** C-01 authorises the questions, modules and options shown to the user. */
export const CONTROLLED_C01: ControlledSourceProvenance = {
  code: "C-01",
  role: "Canonical question bank: what is asked, in what order, with which options.",
  fileName: "02_ROOTS_AI_C01_Canonical_Question_Bank_v1.0.1_CORRECTED.xlsx",
  datasetId: "ROOTS-C01-QBANK-001",
  version: "1.0.1",
  packageSha256: "b5bb50ded8a21ec957d17f55c9b2b03c4845ad56d850549cb997bff4bfdd354b",
  contentSha256: "ff03e73ad3b93ee040711bd8d78cc5005a397fe02aa403f0af0dc2fb089b44e2",
  sheets: ["README","Modules","Questions","Option_Sets","Validation","QA_Checks"],
  controlFields: {
    "Dataset ID": "ROOTS-C01-QBANK-001",
    "questionnaire_version": "1.0.1",
    "Question count": "73",
    "Module count": "13",
    "Language": "English",
    "Scoring source": "C-02 v1.0.1",
    "N/A behavior": "Explicit only",
    "Clinical boundary": "Educational wellness",
    "Required-response rule": "Required = valid response or explicit approved N/A",
    "Implementation sequence: validate workbook checksum → import Modules → import Option_Sets → import Questions → apply Validation → run QA_Checks → publish version 1.0.1.": "",
  },
};

/** C-02 authorises every number the engine may produce. */
export const CONTROLLED_C02: ControlledSourceProvenance = {
  code: "C-02",
  role: "Canonical scoring rules and golden tests: every number, band and driver.",
  fileName: "03_ROOTS_AI_C02_Canonical_Scoring_Rules_and_Golden_Tests_v1.0.1_CORRECTED.xlsx",
  datasetId: "ROOTS-C02-SCORING-001",
  version: "1.0.1",
  packageSha256: "14bf61735d0abe42da7ea87c5dd988dcceecdd648b94a68137b18a65f978989e",
  contentSha256: "1bbba3e209b8285349c2b39f419f3b19a89e2b521b4ca51e64769fcf18530243",
  sheets: ["README","Domains","Question_Mapping","Option_Points","Formulas","Protective_Factors","Classifications","Drivers_Evidence","Golden_Tests","QA_Checks"],
  controlFields: {
    "Dataset ID": "ROOTS-C02-SCORING-001",
    "scoring_version": "1.0.1",
    "Scored questions": "40",
    "Raw burden scale": "0-4",
    "Domain coverage threshold": "50%",
    "Biological State minimum": "5 of 7 domains",
    "Rounding": "Half away from zero to integer",
    "LLM role": "None in calculation",
  },
};

export const CONTROLLED_SOURCES: readonly ControlledSourceProvenance[] = [
  CONTROLLED_C01,
  CONTROLLED_C02,
];

/** One fingerprint for the C-01 + C-02 pair this build transcribed. */
export const CONTROLLED_DATA_SHA256 = "8cfa8af59631b7ec3235ec305d65ffdc7deb91d5deb0e90e4584c7d9dff0883b";

/** Data rows transcribed per sheet, for tests that assert nothing went missing. */
export const CONTROLLED_ROW_COUNTS = {
  "C-01/README": 10,
  "C-01/Modules": 13,
  "C-01/Questions": 73,
  "C-01/Option_Sets": 171,
  "C-01/Validation": 11,
  "C-01/QA_Checks": 7,
  "C-02/README": 8,
  "C-02/Domains": 7,
  "C-02/Question_Mapping": 40,
  "C-02/Option_Points": 238,
  "C-02/Formulas": 8,
  "C-02/Protective_Factors": 8,
  "C-02/Classifications": 12,
  "C-02/Drivers_Evidence": 7,
  "C-02/Golden_Tests": 30,
  "C-02/QA_Checks": 11,
} as const;

export type ControlledRowCounts = typeof CONTROLLED_ROW_COUNTS;
