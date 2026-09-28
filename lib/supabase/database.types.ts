/**
 * Hand-written database types mirroring `supabase/migrations/0001..0003`
 * EXACTLY (8 mandatory M1 tables + the guarded `published_scoring_config`
 * view). Keep in sync with the migrations: if a migration changes a column,
 * constraint or enum, this file must change in the same commit.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProfileRole = "participant" | "staff" | "admin";
export type AssessmentStatus = "in_progress" | "completed" | "abandoned";
export type DomainCode = "HU" | "SL" | "ME" | "CI" | "SA" | "ST" | "IN";
export type ResponseSource = "client" | "migrated" | "imported";
export type BiologicalState = "optimal" | "balanced" | "strained" | "depleted";
export type ScoringConfigStatus = "draft" | "published" | "retired";
export type ConsentType = "service" | "privacy" | "research";
export type ConsentDecision = "granted" | "declined" | "withdrawn";
export type AuditActorKind =
  | "participant"
  | "staff"
  | "admin"
  | "system"
  | "anonymous";

export type Profile = {
  user_id: string;
  email: string;
  display_name: string | null;
  role: ProfileRole;
  region_code: string | null;
  created_at: string;
  updated_at: string;
};

export type Assessment = {
  id: string;
  user_id: string;
  status: AssessmentStatus;
  questionnaire_version: string;
  question_set_version: string;
  scoring_config_version: string;
  current_question_index: number;
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
  metadata: Json;
};

export type Response = {
  id: string;
  assessment_id: string;
  user_id: string;
  question_id: string;
  question_number: number | null;
  domain_code: DomainCode | null;
  raw_value: string | null;
  normalized_value: number | null;
  is_na: boolean;
  source: ResponseSource;
  created_at: string;
  updated_at: string;
};

export type Score = {
  id: string;
  assessment_id: string;
  user_id: string;
  scoring_config_version: string;
  /** IN domain column is `ins` — `in` is a reserved word (0001). */
  hu: number;
  sl: number;
  me: number;
  ci: number;
  sa: number;
  st: number;
  ins: number;
  biological_state: BiologicalState;
  opportunity: number;
  recovery_potential: number;
  confidence: number;
  drivers: Json;
  trace: Json;
  computed_at: string;
  created_at: string;
};

export type Report = {
  id: string;
  assessment_id: string;
  user_id: string;
  report_version: string;
  storage_bucket: string;
  storage_path: string;
  checksum_sha256: string;
  size_bytes: number | null;
  created_at: string;
};

export type ScoringConfig = {
  id: string;
  version: string;
  status: ScoringConfigStatus;
  payload: Json;
  checksum_sha256: string | null;
  notes: string | null;
  published_by: string | null;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Consent = {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  version: string;
  decision: ConsentDecision;
  granted_at: string;
  withdrawn_at: string | null;
  locale: string | null;
  user_agent: string | null;
  evidence: Json;
  created_at: string;
};

export type AuditLog = {
  id: number;
  occurred_at: string;
  actor_id: string | null;
  actor_kind: AuditActorKind;
  event_type: string;
  target_type: string | null;
  target_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Json;
};

type Table<TInsert, TRow> = {
  Row: TRow;
  Insert: TInsert;
  Update: Partial<TRow>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        Partial<Omit<Profile, "user_id" | "email">> & Pick<Profile, "user_id" | "email">,
        Profile
      >;
      assessments: Table<
        Partial<
          Omit<
            Assessment,
            "user_id" | "questionnaire_version" | "question_set_version" | "scoring_config_version"
          >
        > &
          Pick<
            Assessment,
            "user_id" | "questionnaire_version" | "question_set_version" | "scoring_config_version"
          >,
        Assessment
      >;
      responses: Table<
        Partial<Omit<Response, "assessment_id" | "user_id" | "question_id">> &
          Pick<Response, "assessment_id" | "user_id" | "question_id">,
        Response
      >;
      // scores/reports are service-role writes only (0002); client inserts are
      // typed for completeness but RLS rejects them at runtime.
      scores: Table<
        Partial<
          Omit<
            Score,
            "assessment_id" | "user_id" | "scoring_config_version" | "hu" | "sl" | "me" | "ci" | "sa" | "st" | "ins"
          >
        > &
          Pick<
            Score,
            "assessment_id" | "user_id" | "scoring_config_version" | "hu" | "sl" | "me" | "ci" | "sa" | "st" | "ins"
          >,
        Score
      >;
      reports: Table<
        Partial<Omit<Report, "assessment_id" | "user_id" | "report_version" | "storage_path" | "checksum_sha256">> &
          Pick<Report, "assessment_id" | "user_id" | "report_version" | "storage_path" | "checksum_sha256">,
        Report
      >;
      scoring_config: Table<
        Partial<Omit<ScoringConfig, "version" | "payload">> & Pick<ScoringConfig, "version" | "payload">,
        ScoringConfig
      >;
      consents: Table<
        Partial<Omit<Consent, "user_id" | "consent_type" | "version" | "decision">> &
          Pick<Consent, "user_id" | "consent_type" | "version" | "decision">,
        Consent
      >;
      audit_logs: Table<Partial<AuditLog>, AuditLog>;
    };
    Views: {
      published_scoring_config: {
        Row: {
          id: string;
          version: string;
          payload: Json;
          checksum_sha256: string | null;
          published_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type PublishedScoringConfigRow =
  Database["public"]["Views"]["published_scoring_config"]["Row"];

