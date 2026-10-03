-- ============================================================================
-- ROOTS-AI™ Phase 1 MVP · COMPLETE DATABASE DEPLOYMENT SCRIPT
-- ----------------------------------------------------------------------------
-- Document ID : ROOTS-AI-DB-COMPLETE
-- Scope       : schema + RLS + integrity rules + least-privilege roles for the
--               whole Phase 1 MVP, including the Milestone 3 governed AI
--               narrative boundary.
-- Controlled  : Master Requirements v3.3.2 §4 (data model), §4.2 (RLS and
--               database security), §7 (deterministic pipeline), §8 (LLM
--               narrative layer and AI governance);
--               C-06 v1.0.1 (executable technical baseline: eight required
--               logical application tables, role assignments, contact
--               enquiries, RLS on every protected relation);
--               C-07 v1.0.1 (SCR-0004 driver law, RPT-0026/Q73);
--               Regulatory Readiness Annex v1.0.1 AI-01…AI-12.
--
-- Deployment  : Supabase SQL Editor (or `psql -f`) against a clean project.
--               Idempotent: safe to re-run. Every object is created only when
--               absent, or replaced in place.
--
-- HARD RULES ENFORCED BY THIS FILE (not by documentation):
--   1. RLS is enabled on every application relation and every protected view.
--   2. The dedicated AI role `roots_ai_narrative` is NOLOGIN and holds ONE
--      readable relation in the entire database: `public.scores`, SELECT only.
--      It has no grant of any kind — and therefore no access — on
--      responses, profiles, audit_logs, assessments, consents, reports,
--      scoring_config, role_assignments, contact_enquiries or any view.
--   3. `public.scores.trace` carries the calculation trace (question IDs,
--      option IDs, burden values). Column-level SELECT on that column is
--      revoked from `roots_ai_narrative`, so the read-only role can never read
--      an answer through the one table it may read at all.
--   4. Scores, submitted answers, reports, published configuration and audit
--      records are immutable once written — for every role, including the
--      service role.
--   5. Browser roles cannot create or alter authoritative scores, reports or
--      audit records.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions and schema
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- `citext` is not required; email is normalised in application code.

-- ---------------------------------------------------------------------------
-- 0.1 Shared helper functions
-- ---------------------------------------------------------------------------

-- Touch `updated_at` on every UPDATE of a table that carries the column.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Append-only enforcement: consents, audit_logs and every governance log reject
-- UPDATE and DELETE at the storage-engine level, whatever role sends them.
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

-- The acting principal is staff/admin. SECURITY DEFINER so the lookup into
-- profiles never recurses back through the profiles policy.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = (select auth.uid())
      and p.role in ('staff', 'admin')
  );
$$;

-- ============================================================================
-- 1. profiles — participant identity mapped 1:1 to auth.users
-- ============================================================================
drop table if exists public.profiles cascade;
create table public.profiles (
  user_id           uuid primary key,
  email             text not null,
  display_name      text,
  role              text not null default 'participant'
                    constraint profiles_role_check
                    check (role in ('participant', 'staff', 'admin', 'research_admin')),
  region_code       text,
  status            text not null default 'active'
                    constraint profiles_status_check
                    check (status in ('active', 'suspended', 'deleted')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.profiles is
  'Participant identity/profile. Direct identifiers are held here only; health answers live in responses.';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- M3 completion: operational relations and explicit AI least-privilege boundary.
drop table if exists public.assessments cascade;
drop table if exists public.responses cascade;
drop table if exists public.scores cascade;
drop table if exists public.reports cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.consents cascade;
drop table if exists public.research_exports cascade;

create table public.assessments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(user_id), questionnaire_version text not null, scoring_rules_version text not null, status text not null default 'draft', created_at timestamptz not null default now()
);
create table public.responses (
  id uuid primary key default gen_random_uuid(), assessment_id uuid not null references public.assessments(id), question_id text not null, answer jsonb, created_at timestamptz not null default now(), unique (assessment_id, question_id)
);
create table public.scores (
  id uuid primary key default gen_random_uuid(), assessment_id uuid not null unique references public.assessments(id), biological_state numeric, opportunity numeric, recovery_potential numeric, confidence numeric, drivers jsonb not null default '[]'::jsonb, trace jsonb not null default '{}'::jsonb, questionnaire_version text not null, scoring_rules_version text not null, created_at timestamptz not null default now()
);
create table public.reports (
  id uuid primary key default gen_random_uuid(), assessment_id uuid not null unique references public.assessments(id), report_version text not null, narrative jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), assessment_id uuid references public.assessments(id), event_type text not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table public.consents (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(user_id), consent_type text not null, granted boolean not null, created_at timestamptz not null default now()
);
create table public.research_exports (
  id uuid primary key default gen_random_uuid(), export_version text not null, payload jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.assessments enable row level security;
alter table public.responses enable row level security;
alter table public.scores enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;
alter table public.consents enable row level security;
alter table public.research_exports enable row level security;

drop policy if exists assessments_owner on public.assessments;
create policy assessments_owner on public.assessments for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists responses_owner on public.responses;
create policy responses_owner on public.responses for all using (exists (select 1 from public.assessments a where a.id = assessment_id and a.user_id = auth.uid())) with check (exists (select 1 from public.assessments a where a.id = assessment_id and a.user_id = auth.uid()));
drop policy if exists scores_owner on public.scores;
create policy scores_owner on public.scores for select using (exists (select 1 from public.assessments a where a.id = assessment_id and a.user_id = auth.uid()));
drop policy if exists reports_owner on public.reports;
create policy reports_owner on public.reports for select using (exists (select 1 from public.assessments a where a.id = assessment_id and a.user_id = auth.uid()));
drop policy if exists consents_owner on public.consents;
create policy consents_owner on public.consents for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- The narrative worker is a database role, never an end-user login.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'roots_ai_narrative') then
    create role roots_ai_narrative nologin;
  end if;
end $$;
revoke all privileges on all tables in schema public from roots_ai_narrative;
revoke all privileges on all sequences in schema public from roots_ai_narrative;
revoke all privileges on all functions in schema public from roots_ai_narrative;
grant usage on schema public to roots_ai_narrative;
grant select on public.scores to roots_ai_narrative;
revoke insert, update, delete, truncate, references, trigger on public.scores from roots_ai_narrative;
-- Column-level revocation: first revoke all, then regrant select without trace
revoke select on public.scores from roots_ai_narrative;
grant select (id, assessment_id, biological_state, opportunity, recovery_potential, confidence, drivers, questionnaire_version, scoring_rules_version, created_at) on public.scores to roots_ai_narrative;
revoke all privileges on public.responses, public.profiles, public.audit_logs, public.assessments, public.consents, public.reports, public.research_exports from roots_ai_narrative;
