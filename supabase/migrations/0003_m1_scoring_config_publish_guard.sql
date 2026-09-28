-- ============================================================================
-- ROOTS-AI Phase 1 MVP · M1 Migration 0003
-- Scope: The "policy + trigger checks (0003)" referenced by the 0002 header.
--        scoring_config publication is gated to admins and published payloads
--        are immutable. Lifecycle is one-way: draft -> published -> retired.
--        Published/retired rows are permanent audit trail (delete forbidden);
--        drafts may be deleted. The service role operates outside RLS by
--        ownership, so trigger checks are enforced for all non-service roles.
-- ============================================================================

create or replace function public.enforce_scoring_config_publication()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status in ('published', 'retired') then
      raise exception 'scoring_config rows must start as draft; publication follows the draft -> published lifecycle'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.status in ('published', 'retired') then
      raise exception 'published/retired scoring_config version % is permanent audit trail (retire instead of delete)', old.version
        using errcode = '42501';
    end if;
    return old;
  end if;

  -- UPDATE -------------------------------------------------------------------
  -- A published version is content-addressed and immutable: only retirement
  -- (and non-content metadata such as notes) is permitted.
  if old.status = 'published' then
    if new.version is distinct from old.version
       or new.payload is distinct from old.payload
       or new.checksum_sha256 is distinct from old.checksum_sha256
       or new.published_by is distinct from old.published_by
       or new.published_at is distinct from old.published_at then
      raise exception 'published scoring_config version % is immutable', old.version
        using errcode = '42501';
    end if;
    if new.status not in ('published', 'retired') then
      raise exception 'published scoring_config version % may only stay published or be retired', old.version
        using errcode = '42501';
    end if;
  end if;

  -- Retirement is final.
  if old.status = 'retired' and new.status is distinct from old.status then
    raise exception 'retired scoring_config version % cannot be revived', old.version
      using errcode = '42501';
  end if;

  -- Publish transition (draft -> published): require content-addressed
  -- integrity and an acting admin (except the service role, which bypasses
  -- RLS by ownership per the 0002 header).
  if new.status = 'published' and old.status = 'draft' then
    if new.payload is null then
      raise exception 'scoring_config payload must be set before publication'
        using errcode = '42501';
    end if;
    if new.checksum_sha256 is null or new.checksum_sha256 !~ '^[a-f0-9]{64}$' then
      raise exception 'scoring_config must carry a sha256 content checksum before publication'
        using errcode = '42501';
    end if;
    if coalesce(auth.role(), '') <> 'service_role' then
      if not public.is_admin() then
        raise exception 'only staff/admin may publish scoring_config'
          using errcode = '42501';
      end if;
      if new.published_by is distinct from (select auth.uid()) then
        raise exception 'published_by must be the acting admin (auth.uid())'
          using errcode = '42501';
      end if;
    end if;
    if new.published_at is null then
      new.published_at := now();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists scoring_config_publication_guard on public.scoring_config;
create trigger scoring_config_publication_guard
  before insert or update or delete on public.scoring_config
  for each row execute function public.enforce_scoring_config_publication();

comment on function public.enforce_scoring_config_publication() is
  'Trigger check for scoring_config: one-way lifecycle, immutable published payloads, admin-only publication (0002 header).';
