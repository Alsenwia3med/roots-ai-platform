-- ============================================================================
-- ROOTS-AI Phase 1 MVP · M1 Migration 0002
-- Scope: Row Level Security on EVERY application table + guarded view.
-- Model: participants read/write ONLY rows keyed by their own auth.uid().
--        Admins (profiles.role in ('staff','admin')) may read operational data.
--        Service role bypasses RLS by ownership; scoring_config publication is
--        gated to admins through policy + trigger checks (0003).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper: current principal is an admin/staff member.
-- SECURITY DEFINER so the lookup into profiles never recurses into RLS.
-- ---------------------------------------------------------------------------
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

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and role = 'participant');

drop policy if exists "profiles_admin_update_role" on public.profiles;
create policy "profiles_admin_update_role" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No DELETE policy: participants cannot delete their own identity row;
-- account deletion is a service-role (GDPR workflow) operation.

-- ---------------------------------------------------------------------------
-- assessments
-- ---------------------------------------------------------------------------
alter table public.assessments enable row level security;

drop policy if exists "assessments_select_own_or_admin" on public.assessments;
create policy "assessments_select_own_or_admin" on public.assessments
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "assessments_insert_own" on public.assessments;
create policy "assessments_insert_own" on public.assessments
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "assessments_update_own" on public.assessments;
create policy "assessments_update_own" on public.assessments
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- responses
-- ---------------------------------------------------------------------------
alter table public.responses enable row level security;

drop policy if exists "responses_select_own_or_admin" on public.responses;
create policy "responses_select_own_or_admin" on public.responses
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "responses_insert_own" on public.responses;
create policy "responses_insert_own" on public.responses
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "responses_update_own" on public.responses;
create policy "responses_update_own" on public.responses
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "responses_delete_own" on public.responses;
create policy "responses_delete_own" on public.responses
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- scores — immutable to clients: service role writes, owner reads.
-- ---------------------------------------------------------------------------
alter table public.scores enable row level security;

drop policy if exists "scores_select_own_or_admin" on public.scores;
create policy "scores_select_own_or_admin" on public.scores
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- No insert/update/delete policies for authenticated: score integrity (C-02).

-- ---------------------------------------------------------------------------
-- reports — owner reads their own report pointers; service role writes.
-- ---------------------------------------------------------------------------
alter table public.reports enable row level security;

drop policy if exists "reports_select_own_or_admin" on public.reports;
create policy "reports_select_own_or_admin" on public.reports
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- No client insert/update/delete: report issuance is service-role only.

-- ---------------------------------------------------------------------------
-- scoring_config — no client DML whatsoever. Reads of PUBLISHED versions only,
-- via the guarded view below; admins read all versions on the base table.
-- ---------------------------------------------------------------------------
alter table public.scoring_config enable row level security;

drop policy if exists "scoring_config_admin_all" on public.scoring_config;
create policy "scoring_config_admin_all" on public.scoring_config
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- consents — append-only ledger: participants insert + read their own rows.
-- No UPDATE/DELETE policies; UPDATE/DELETE additionally blocked by trigger.
-- ---------------------------------------------------------------------------
alter table public.consents enable row level security;

drop policy if exists "consents_select_own_or_admin" on public.consents;
create policy "consents_select_own_or_admin" on public.consents
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists "consents_insert_own" on public.consents;
create policy "consents_insert_own" on public.consents
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- audit_logs — participants never read/write through the API (service role +
-- admin reads only). Hardens C-05 security-event isolation.
-- ---------------------------------------------------------------------------
alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_admin_select" on public.audit_logs;
create policy "audit_logs_admin_select" on public.audit_logs
  for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Protected view: published scoring rules for the (future) client-side score
-- preview and QA tooling. Exposes ONLY published versions, never drafts.
-- RLS on the base table applies through the security-invoker view; the extra
-- predicate guarantees drafts/retired rows are invisible to every role that
-- can see the view at all.
-- ---------------------------------------------------------------------------
create or replace view public.published_scoring_config as
  select id, version, payload, checksum_sha256, published_at
  from public.scoring_config
  where status = 'published';

comment on view public.published_scoring_config is
  'Read-only window onto published scoring rules. Never exposes drafts or audit columns.';

alter view public.published_scoring_config enable row level security;

drop policy if exists "published_scoring_config_select_authenticated" on public.published_scoring_config;
create policy "published_scoring_config_select_authenticated"
  on public.published_scoring_config
  for select to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Belt-and-braces: with RLS enabled and no policy granting access, anon has
-- zero rows on every table. Explicitly revoke table-wide grants so even a
-- misconfigured future policy cannot silently widen the anon surface.
-- ---------------------------------------------------------------------------
revoke all on public.profiles            from anon;
revoke all on public.assessments         from anon;
revoke all on public.responses           from anon;
revoke all on public.scores              from anon;
revoke all on public.reports             from anon;
revoke all on public.scoring_config      from anon;
revoke all on public.consents            from anon;
revoke all on public.audit_logs          from anon;
revoke all on public.published_scoring_config from anon;

