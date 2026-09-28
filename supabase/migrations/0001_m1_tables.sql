-- ============================================================================
-- ROOTS-AI Phase 1 MVP · M1 Migration 0001
-- Scope: 8 mandatory logical application tables + identity plumbing.
-- Spec:  Master Requirements v3.3, C-01..C-05.
-- Rules: C-01/C-02 canonical question IDs and scoring formulas are FROZEN —
--        nothing in this file defines or alters a question ID or a formula.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles — participant identity, auth mapping, timestamps
--    PK doubles as auth.users.id (1:1 identity mapping). Created by trigger so
--    a profile always exists the moment a magic-link identity is created.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  email             text not null,
  display_name      text,
  role              text not null default 'participant'
                    constraint profiles_role_check
                    check (role in ('participant', 'staff', 'admin')),
  region_code       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.profiles is
  'Participant identity mapped 1:1 to auth.users. Never stores health data.';

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. assessments — questionnaire version, status, started/completed, metadata
-- ---------------------------------------------------------------------------
create table if not exists public.assessments (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles (user_id) on delete cascade,
  status              text not null default 'in_progress'
                      constraint assessments_status_check
                      check (status in ('in_progress', 'completed', 'abandoned')),
  questionnaire_version text not null,
  question_set_version  text not null,
  scoring_config_version text not null,
  current_question_index integer not null default 0
                        constraint assessments_index_non_negative check (current_question_index >= 0),
  started_at          timestamptz not null default now(),
  last_activity_at    timestamptz not null default now(),
  completed_at        timestamptz,
  metadata            jsonb not null default '{}'::jsonb,
  constraint assessments_completion_consistency check (
    (status = 'completed') = (completed_at is not null)
  )
);

comment on table public.assessments is
  'One row per participant assessment run. Version pins guarantee reproducibility.';

create index if not exists assessments_user_started_idx
  on public.assessments (user_id, started_at desc);
create index if not exists assessments_active_idx
  on public.assessments (user_id, status)
  where status = 'in_progress';

-- ---------------------------------------------------------------------------
-- 3. responses — assessment link, question_id, raw_value, normalized_value,
--                 is_na, timestamps. One current answer per question per run;
--                 superseded answers are retained in responses_history (M2).
-- ---------------------------------------------------------------------------
create table if not exists public.responses (
  id               uuid primary key default gen_random_uuid(),
  assessment_id    uuid not null references public.assessments (id) on delete cascade,
  user_id          uuid not null references public.profiles (user_id) on delete cascade,
  question_id      text not null constraint responses_question_id_not_blank check (question_id <> ''),
  question_number  integer constraint responses_question_number_positive check (question_number > 0),
  domain_code      text constraint responses_domain_code_check
                   check (domain_code in ('HU','SL','ME','CI','SA','ST','IN')),
  raw_value        text,
  normalized_value numeric,
  is_na            boolean not null default false,
  source           text not null default 'client'
                   constraint responses_source_check check (source in ('client', 'migrated', 'imported')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint responses_one_row_per_question
    unique (assessment_id, question_id),
  constraint responses_answer_present
    check (is_na or raw_value is not null or normalized_value is not null)
);

comment on table public.responses is
  'Autosaved participant answers. raw_value is exactly what the participant last saved.';

create index if not exists responses_assessment_idx on public.responses (assessment_id);
create index if not exists responses_user_idx on public.responses (user_id);

drop trigger if exists responses_set_updated_at on public.responses;
create trigger responses_set_updated_at
  before update on public.responses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. scores — 7 domain scores + biological state, opportunity, recovery
--             potential, confidence, drivers, trace. One score per assessment.
--    NOTE (C-02): score columns store values COMPUTED by the canonical scoring
--    engine from published scoring_config. This table never defines a formula.
-- ---------------------------------------------------------------------------
create table if not exists public.scores (
  id                      uuid primary key default gen_random_uuid(),
  assessment_id           uuid not null references public.assessments (id) on delete cascade,
  user_id                 uuid not null references public.profiles (user_id) on delete cascade,
  scoring_config_version  text not null,
  hu                      numeric not null constraint scores_range_hu check (hu between 0 and 100),
  sl                      numeric not null constraint scores_range_sl check (sl between 0 and 100),
  me                      numeric not null constraint scores_range_me check (me between 0 and 100),
  ci                      numeric not null constraint scores_range_ci check (ci between 0 and 100),
  sa                      numeric not null constraint scores_range_sa check (sa between 0 and 100),
  st                      numeric not null constraint scores_range_st check (st between 0 and 100),
  ins                     numeric not null constraint scores_range_ins check (ins between 0 and 100),
  biological_state        text not null constraint biological_state_allowed
                          check (biological_state in ('optimal', 'balanced', 'strained', 'depleted')),
  opportunity             numeric not null constraint opportunity_range check (opportunity between 0 and 100),
  recovery_potential      numeric not null constraint recovery_potential_range check (recovery_potential between 0 and 100),
  confidence              numeric not null constraint confidence_range check (confidence between 0 and 1),
  drivers                 jsonb not null default '[]'::jsonb,
  trace                   jsonb not null default '{}'::jsonb,
  computed_at             timestamptz not null default now(),
  created_at              timestamptz not null default now(),
  constraint scores_one_per_assessment unique (assessment_id)
);

comment on table public.scores is
  'Immutable score snapshot per assessment. IN domain column is "ins" (IN is a reserved word).';

create index if not exists scores_user_idx on public.scores (user_id);

-- ---------------------------------------------------------------------------
-- 5. reports — assessment link, report version, storage reference, checksum
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id             uuid primary key default gen_random_uuid(),
  assessment_id  uuid not null references public.assessments (id) on delete cascade,
  user_id        uuid not null references public.profiles (user_id) on delete cascade,
  report_version text not null,
  storage_bucket text not null default 'participant-reports',
  storage_path   text not null,
  checksum_sha256 text not null constraint reports_checksum_format
                 check (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  size_bytes     bigint constraint reports_size_positive check (size_bytes is null or size_bytes > 0),
  created_at     timestamptz not null default now(),
  constraint reports_one_per_assessment_version unique (assessment_id, report_version)
);

comment on table public.reports is
  'Pointer + integrity record for generated PDF reports stored in Supabase Storage.';

create index if not exists reports_user_idx on public.reports (user_id);

-- ---------------------------------------------------------------------------
-- 6. scoring_config — versioned rules, draft/published/retired lifecycle
--    Published payloads are content-addressed (sha256) and immutable.
-- ---------------------------------------------------------------------------
create table if not exists public.scoring_config (
  id          uuid primary key default gen_random_uuid(),
  version     text not null unique constraint scoring_config_version_not_blank check (version <> ''),
  status      text not null default 'draft'
              constraint scoring_config_status_check
              check (status in ('draft', 'published', 'retired')),
  payload     jsonb not null,
  checksum_sha256 text constraint scoring_config_checksum_format
                  check (checksum_sha256 is null or checksum_sha256 ~ '^[a-f0-9]{64}$'),
  notes       text,
  published_by uuid references auth.users (id),
  published_at timestamptz,
  created_by  uuid references auth.users (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.scoring_config is
  'Versioned scoring rule sets. Published versions are immutable and auditable.';

drop trigger if exists scoring_config_set_updated_at on public.scoring_config;
create trigger scoring_config_set_updated_at
  before update on public.scoring_config
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. consents — append-only service / privacy / research consent records
-- ---------------------------------------------------------------------------
create table if not exists public.consents (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (user_id) on delete cascade,
  consent_type   text not null constraint consent_type_allowed
                 check (consent_type in ('service', 'privacy', 'research')),
  version        text not null constraint consents_version_not_blank check (version <> ''),
  decision       text not null constraint consent_decision_allowed
                 check (decision in ('granted', 'declined', 'withdrawn')),
  granted_at     timestamptz not null default now(),
  withdrawn_at   timestamptz,
  locale         text,
  user_agent     text,
  evidence       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  constraint consents_withdrawal_consistency check (
    (decision = 'withdrawn') = (withdrawn_at is not null)
  )
);

comment on table public.consents is
  'Append-only consent ledger. Corrections are new rows; rows are never updated or deleted.';

create index if not exists consents_user_type_idx on public.consents (user_id, consent_type, granted_at desc);

-- ---------------------------------------------------------------------------
-- 8. audit_logs — append-only security / auth / admin events
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id             bigint generated always as identity primary key,
  occurred_at    timestamptz not null default now(),
  actor_id       uuid references auth.users (id) on delete set null,
  actor_kind     text not null default 'anonymous'
                 constraint audit_actor_kind_check
                 check (actor_kind in ('participant', 'staff', 'admin', 'system', 'anonymous')),
  event_type     text not null constraint audit_event_type_not_blank check (event_type <> ''),
  target_type    text,
  target_id      text,
  ip_address     inet,
  user_agent     text,
  metadata       jsonb not null default '{}'::jsonb
);

comment on table public.audit_logs is
  'Append-only security/auth/admin event ledger. PII minimised — never store secrets or answers.';

create index if not exists audit_logs_occurred_idx on public.audit_logs (occurred_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, occurred_at desc);
create index if not exists audit_logs_event_idx on public.audit_logs (event_type, occurred_at desc);

-- ---------------------------------------------------------------------------
-- Append-only enforcement: consents and audit_logs reject UPDATE/DELETE at the
-- storage-engine level regardless of caller role (negative tests NT-CONS-01,
-- NT-AUD-01 in M1 acceptance).
-- ---------------------------------------------------------------------------
create or replace function public.forbid_append_only_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'table %.% is append-only: % is forbidden',
    tg_table_schema, tg_table_name, tg_op
    using errcode = '42501';
end;
$$;

drop trigger if exists consents_append_only on public.consents;
create trigger consents_append_only
  before update or delete on public.consents
  for each row execute function public.forbid_append_only_mutation();

drop trigger if exists audit_logs_append_only on public.audit_logs;
create trigger audit_logs_append_only
  before update or delete on public.audit_logs
  for each row execute function public.forbid_append_only_mutation();

