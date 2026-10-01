-- ============================================================================
-- ROOTS-AI™ · M2 SECURITY AND NEGATIVE TESTS (item 9) — database / Row Level Security
--
-- For ROOTS to run independently in: Supabase dashboard > SQL Editor > Run.
-- Run AFTER supabase/roots_ai_complete.sql.
--
-- SELF-CONTAINED — no set-up and no editing needed:
--   1. creates four temporary test accounts (participant A, participant B, an Admin and an
--      Admin whose access has expired) with data of their own: an in-progress assessment with
--      an answer, and a submitted assessment with answers, a score row and a report;
--   2. runs every probe AS that role, the same way the Supabase API does (SET ROLE plus the
--      JWT claims), so what is tested is the database itself, not the application;
--   3. rolls back every probe — a write that is wrongly allowed is undone too;
--   4. removes the test accounts and all their data;
--   5. prints one row per test. Every row must read PASS.
--
-- It leaves no data behind. Real participants' data is never read or changed: every probe is
-- scoped to the test accounts, whose IDs start with 0000000e-.
--
-- Coverage (C-06 §1 "RLS policies + negative tests — cross-user and cross-role access is
-- blocked"; C-06 §3 "browser roles cannot create scores, reports or audit records"):
--   XU  cross-user: participant B against participant A's data
--   AN  anonymous (not signed in)
--   BR  browser role against the server-only records (scores, reports, audit, roles, submit)
--   PV  privacy: answer-bearing columns hidden, even from their owner through the API
--   CR  cross-role: Admin / expired Admin
--   IN  integrity rules that hold for every role, including the server itself
--   PC  positive controls — the access that must work, so no PASS can come from an empty table
-- ============================================================================

-- ---- 0. clean up any leftovers from an interrupted earlier run ----------------------------
DELETE FROM auth.users WHERE id IN ('0000000e-0000-4000-8000-00000000000a', '0000000e-0000-4000-8000-00000000000b',
                                    '0000000e-0000-4000-8000-00000000000c', '0000000e-0000-4000-8000-00000000000d');

-- ---- 1. test accounts and their data (as the table owner) -------------------------------
INSERT INTO auth.users (id, email, aud, role) VALUES
  ('0000000e-0000-4000-8000-00000000000a', 'm2-test-participant-a@roots-ai.invalid', 'authenticated', 'authenticated'),
  ('0000000e-0000-4000-8000-00000000000b', 'm2-test-participant-b@roots-ai.invalid', 'authenticated', 'authenticated'),
  ('0000000e-0000-4000-8000-00000000000c', 'm2-test-admin@roots-ai.invalid',         'authenticated', 'authenticated'),
  ('0000000e-0000-4000-8000-00000000000d', 'm2-test-expired-admin@roots-ai.invalid', 'authenticated', 'authenticated');

INSERT INTO public.profiles (id, email) VALUES
  ('0000000e-0000-4000-8000-00000000000a', 'm2-test-participant-a@roots-ai.invalid'),
  ('0000000e-0000-4000-8000-00000000000b', 'm2-test-participant-b@roots-ai.invalid'),
  ('0000000e-0000-4000-8000-00000000000c', 'm2-test-admin@roots-ai.invalid'),
  ('0000000e-0000-4000-8000-00000000000d', 'm2-test-expired-admin@roots-ai.invalid')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.role_assignments (profile_id, role, note, expires_at) VALUES
  ('0000000e-0000-4000-8000-00000000000c', 'admin', 'M2 security test', NULL),
  ('0000000e-0000-4000-8000-00000000000d', 'admin', 'M2 security test (expired)', now() - interval '1 day');

-- A: one submitted assessment with answers, score and report, then one in progress with an answer
-- (a participant can have only one assessment in progress at a time).
INSERT INTO public.assessments (id, profile_id) VALUES ('0000000e-0000-4000-8000-0000000000a2', '0000000e-0000-4000-8000-00000000000a');
INSERT INTO public.responses (assessment_id, question_id, raw_value) VALUES
  ('0000000e-0000-4000-8000-0000000000a2', 'Q1', '40'),
  ('0000000e-0000-4000-8000-0000000000a2', 'Q10', '"SMT"');
UPDATE public.assessments
   SET status = 'submitted', submitted_at = now(), submission_reference = 'RS-M2TEST-A2'
 WHERE id = '0000000e-0000-4000-8000-0000000000a2';
INSERT INTO public.assessments (id, profile_id) VALUES ('0000000e-0000-4000-8000-0000000000a1', '0000000e-0000-4000-8000-00000000000a');
INSERT INTO public.responses (assessment_id, question_id, raw_value) VALUES ('0000000e-0000-4000-8000-0000000000a1', 'Q1', '40');
INSERT INTO public.scores (assessment_id, mr_score, biological_state, confidence_label, scoring_version, calculation_trace)
  VALUES ('0000000e-0000-4000-8000-0000000000a2', 50, 50, 'High', '1.0.1', '{"probe":"trace"}');
INSERT INTO public.reports (assessment_id, status, report_reference, canonical_json, generation_metadata)
  VALUES ('0000000e-0000-4000-8000-0000000000a2', 'completed', 'RPT-M2TEST-A2', '{"probe":"report"}', '{"probe":"meta"}');
INSERT INTO public.consents (profile_id, consent_type, granted) VALUES
  ('0000000e-0000-4000-8000-00000000000a', 'service', true);

-- ---- 2. the probe ---------------------------------------------------------------------------
DROP TABLE IF EXISTS m2_security_results;
CREATE TEMP TABLE m2_security_results (
  seq SERIAL PRIMARY KEY, test_id TEXT, area TEXT, test TEXT, expected TEXT, actual TEXT, outcome TEXT
);

-- Runs p_sql as p_role (with the JWT subject p_sub) inside a sub-transaction that is always
-- rolled back, and records the outcome.
--   p_expect 'none'    read: 0 rows, or refused                  (isolation)
--   p_expect 'denied'  must be refused outright                   (column / table privilege)
--   p_expect 'blocked' write: refused, or 0 rows affected         (write isolation)
--   p_expect 'some'    read: at least 1 row                       (positive control)
--   p_expect 'allowed' write: at least 1 row affected             (positive control)
CREATE OR REPLACE FUNCTION pg_temp.probe(p_id TEXT, p_area TEXT, p_test TEXT, p_role TEXT, p_sub UUID, p_sql TEXT, p_expect TEXT)
RETURNS void LANGUAGE plpgsql AS $probe$
DECLARE
  n BIGINT := NULL;
  refused TEXT := NULL;
  missing TEXT := NULL;
  pass BOOLEAN;
BEGIN
  BEGIN
    IF p_role IS NOT NULL THEN
      EXECUTE format('SET LOCAL ROLE %I', p_role);
      PERFORM set_config('request.jwt.claims',
        CASE WHEN p_sub IS NULL THEN json_build_object('role', p_role)::TEXT
             ELSE json_build_object('role', p_role, 'sub', p_sub)::TEXT END, true);
    END IF;
    IF p_expect IN ('none', 'some', 'denied') AND p_sql ~* '^\s*select' THEN
      EXECUTE 'SELECT count(*) FROM (' || p_sql || ') q' INTO n;
    ELSE
      EXECUTE p_sql;
      GET DIAGNOSTICS n = ROW_COUNT;
    END IF;
    RAISE EXCEPTION 'm2_probe_rollback';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'm2_probe_rollback' THEN
      n := NULL;
      -- A missing table / column / function is a broken install, never a security refusal.
      IF SQLSTATE IN ('42P01', '42703', '42883') THEN missing := SQLERRM; ELSE refused := SQLERRM; END IF;
    END IF;
  END;

  pass := missing IS NULL AND CASE p_expect
    WHEN 'none'    THEN refused IS NOT NULL OR n = 0
    WHEN 'denied'  THEN refused IS NOT NULL
    WHEN 'blocked' THEN refused IS NOT NULL OR n = 0
    WHEN 'some'    THEN refused IS NULL AND n >= 1
    WHEN 'allowed' THEN refused IS NULL AND n >= 1
  END;

  INSERT INTO m2_security_results (test_id, area, test, expected, actual, outcome) VALUES (
    p_id, p_area, p_test,
    CASE p_expect WHEN 'none' THEN '0 rows (or refused)' WHEN 'denied' THEN 'refused'
                  WHEN 'blocked' THEN 'refused (or 0 rows)' WHEN 'some' THEN 'at least 1 row'
                  ELSE 'at least 1 row changed (rolled back)' END,
    COALESCE('SCHEMA MISSING — run roots_ai_complete.sql first: ' || missing, 'refused: ' || refused, n::TEXT || CASE WHEN p_sql ~* '^\s*select' THEN ' rows' ELSE ' rows changed (rolled back)' END),
    CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END);
END
$probe$;

-- ---- 3. the tests ---------------------------------------------------------------------------
DO $tests$
DECLARE
  a  CONSTANT UUID := '0000000e-0000-4000-8000-00000000000a';
  b  CONSTANT UUID := '0000000e-0000-4000-8000-00000000000b';
  s  CONSTANT UUID := '0000000e-0000-4000-8000-00000000000c';
  e  CONSTANT UUID := '0000000e-0000-4000-8000-00000000000d';
  a_open CONSTANT TEXT := '''0000000e-0000-4000-8000-0000000000a1''';
  a_done CONSTANT TEXT := '''0000000e-0000-4000-8000-0000000000a2''';
  a_q    CONSTANT TEXT := '''0000000e-0000-4000-8000-00000000000a''';
  a_ids  CONSTANT TEXT := '(''0000000e-0000-4000-8000-0000000000a1'',''0000000e-0000-4000-8000-0000000000a2'')';
BEGIN
  -- PC — positive controls
  PERFORM pg_temp.probe('PC-01', 'Positive control', 'A reads own assessments', 'authenticated', a, 'SELECT id FROM public.assessments WHERE profile_id = ' || a_q, 'some');
  PERFORM pg_temp.probe('PC-02', 'Positive control', 'A reads own answers', 'authenticated', a, 'SELECT id FROM public.responses WHERE assessment_id IN ' || a_ids, 'some');
  PERFORM pg_temp.probe('PC-03', 'Positive control', 'A reads own score values', 'authenticated', a, 'SELECT mr_score, biological_state FROM public.scores WHERE assessment_id = ' || a_done, 'some');
  PERFORM pg_temp.probe('PC-04', 'Positive control', 'A reads own report status', 'authenticated', a, 'SELECT status FROM public.reports WHERE assessment_id = ' || a_done, 'some');
  PERFORM pg_temp.probe('PC-05', 'Positive control', 'A autosaves an answer on own in-progress assessment', 'authenticated', a,
    'UPDATE public.responses SET raw_value = ''41'' WHERE assessment_id = ' || a_open, 'allowed');
  PERFORM pg_temp.probe('PC-06', 'Positive control', 'Admin reads assessment status (staff policy)', 'authenticated', s, 'SELECT id FROM public.assessments WHERE profile_id = ' || a_q, 'some');

  -- AN — anonymous
  PERFORM pg_temp.probe('AN-01', 'Anonymous', 'reads assessments', 'anon', NULL, 'SELECT id FROM public.assessments WHERE profile_id = ' || a_q, 'none');
  PERFORM pg_temp.probe('AN-02', 'Anonymous', 'reads answers', 'anon', NULL, 'SELECT id FROM public.responses WHERE assessment_id IN ' || a_ids, 'none');
  PERFORM pg_temp.probe('AN-03', 'Anonymous', 'reads scores', 'anon', NULL, 'SELECT id FROM public.scores WHERE assessment_id = ' || a_done, 'none');
  PERFORM pg_temp.probe('AN-04', 'Anonymous', 'reads reports', 'anon', NULL, 'SELECT id FROM public.reports WHERE assessment_id = ' || a_done, 'none');
  PERFORM pg_temp.probe('AN-05', 'Anonymous', 'creates an assessment', 'anon', NULL, 'INSERT INTO public.assessments (profile_id) VALUES (' || a_q || ')', 'blocked');

  -- XU — cross-user (B against A)
  PERFORM pg_temp.probe('XU-01', 'Cross-user', 'B reads A''s assessments', 'authenticated', b, 'SELECT id FROM public.assessments WHERE profile_id = ' || a_q, 'none');
  PERFORM pg_temp.probe('XU-02', 'Cross-user', 'B reads A''s answers', 'authenticated', b, 'SELECT id FROM public.responses WHERE assessment_id IN ' || a_ids, 'none');
  PERFORM pg_temp.probe('XU-03', 'Cross-user', 'B reads A''s scores', 'authenticated', b, 'SELECT mr_score FROM public.scores WHERE assessment_id = ' || a_done, 'none');
  PERFORM pg_temp.probe('XU-04', 'Cross-user', 'B reads A''s report', 'authenticated', b, 'SELECT status FROM public.reports WHERE assessment_id = ' || a_done, 'none');
  PERFORM pg_temp.probe('XU-05', 'Cross-user', 'B reads A''s consents', 'authenticated', b, 'SELECT id FROM public.consents WHERE profile_id = ' || a_q, 'none');
  PERFORM pg_temp.probe('XU-06', 'Cross-user', 'B reads A''s profile', 'authenticated', b, 'SELECT id FROM public.profiles WHERE id = ' || a_q, 'none');
  PERFORM pg_temp.probe('XU-07', 'Cross-user', 'B changes A''s in-progress assessment', 'authenticated', b, 'UPDATE public.assessments SET progress_percent = 99 WHERE id = ' || a_open, 'blocked');
  PERFORM pg_temp.probe('XU-08', 'Cross-user', 'B changes A''s answer', 'authenticated', b, 'UPDATE public.responses SET raw_value = ''99'' WHERE assessment_id = ' || a_open, 'blocked');
  PERFORM pg_temp.probe('XU-09', 'Cross-user', 'B writes an answer into A''s assessment', 'authenticated', b,
    'INSERT INTO public.responses (assessment_id, question_id, raw_value) VALUES (' || a_open || ', ''Q2'', ''"FEMALE"'')', 'blocked');
  PERFORM pg_temp.probe('XU-10', 'Cross-user', 'B deletes A''s answer', 'authenticated', b, 'DELETE FROM public.responses WHERE assessment_id = ' || a_open, 'blocked');
  PERFORM pg_temp.probe('XU-11', 'Cross-user', 'B creates an assessment owned by A', 'authenticated', b, 'INSERT INTO public.assessments (profile_id) VALUES (' || a_q || ')', 'blocked');
  PERFORM pg_temp.probe('XU-12', 'Cross-user', 'B changes A''s display name', 'authenticated', b, 'UPDATE public.profiles SET display_name = ''X'' WHERE id = ' || a_q, 'blocked');

  -- BR — browser role against server-only records (C-06 §3)
  PERFORM pg_temp.probe('BR-01', 'Browser role', 'A creates a score row for own submitted assessment', 'authenticated', a,
    'INSERT INTO public.scores (assessment_id, mr_score) VALUES (' || a_open || ', 0)', 'blocked');
  PERFORM pg_temp.probe('BR-02', 'Browser role', 'A changes own score', 'authenticated', a, 'UPDATE public.scores SET mr_score = 0 WHERE assessment_id = ' || a_done, 'blocked');
  PERFORM pg_temp.probe('BR-03', 'Browser role', 'A deletes own score', 'authenticated', a, 'DELETE FROM public.scores WHERE assessment_id = ' || a_done, 'blocked');
  PERFORM pg_temp.probe('BR-04', 'Browser role', 'A creates a report', 'authenticated', a,
    'INSERT INTO public.reports (assessment_id, status) VALUES (' || a_open || ', ''completed'')', 'blocked');
  PERFORM pg_temp.probe('BR-05', 'Browser role', 'A changes own report', 'authenticated', a, 'UPDATE public.reports SET status = ''failed'' WHERE assessment_id = ' || a_done, 'blocked');
  PERFORM pg_temp.probe('BR-06', 'Browser role', 'A writes an audit record', 'authenticated', a, 'INSERT INTO public.audit_logs (action, result) VALUES (''m2.probe'', ''success'')', 'blocked');
  PERFORM pg_temp.probe('BR-07', 'Browser role', 'A reads the audit trail', 'authenticated', a, 'SELECT id FROM public.audit_logs', 'none');
  PERFORM pg_temp.probe('BR-08', 'Browser role', 'A grants themselves Super Admin', 'authenticated', a,
    'INSERT INTO public.role_assignments (profile_id, role) VALUES (' || a_q || ', ''super_admin'')', 'blocked');
  PERFORM pg_temp.probe('BR-09', 'Browser role', 'A marks own assessment submitted directly', 'authenticated', a, 'UPDATE public.assessments SET status = ''submitted'' WHERE id = ' || a_open, 'blocked');
  PERFORM pg_temp.probe('BR-10', 'Browser role', 'A changes an answer after submission', 'authenticated', a, 'UPDATE public.responses SET raw_value = ''99'' WHERE assessment_id = ' || a_done, 'blocked');
  PERFORM pg_temp.probe('BR-11', 'Browser role', 'A adds an answer after submission', 'authenticated', a,
    'INSERT INTO public.responses (assessment_id, question_id, raw_value) VALUES (' || a_done || ', ''Q2'', ''"FEMALE"'')', 'blocked');
  PERFORM pg_temp.probe('BR-12', 'Browser role', 'A re-opens own submitted assessment', 'authenticated', a, 'UPDATE public.assessments SET status = ''in_progress'' WHERE id = ' || a_done, 'blocked');
  PERFORM pg_temp.probe('BR-13', 'Browser role', 'A changes the questionnaire version of own assessment', 'authenticated', a,
    'UPDATE public.assessments SET questionnaire_version = ''9.9.9'' WHERE id = ' || a_open, 'denied');
  PERFORM pg_temp.probe('BR-14', 'Browser role', 'A sets the recorded source version (M2 item 7)', 'authenticated', a,
    'UPDATE public.assessments SET source_versions = ''{"c01":{"label":"FORGED"}}'' WHERE id = ' || a_open, 'denied');
  PERFORM pg_temp.probe('BR-15', 'Browser role', 'A changes own profile email or status', 'authenticated', a, 'UPDATE public.profiles SET email = ''x@example.com'' WHERE id = ' || a_q, 'denied');
  PERFORM pg_temp.probe('BR-16', 'Browser role', 'A deletes own assessment', 'authenticated', a, 'DELETE FROM public.assessments WHERE id = ' || a_open, 'blocked');

  -- PV — answer-bearing columns are not readable through the API, even by their owner
  PERFORM pg_temp.probe('PV-01', 'Privacy', 'A reads own scores.calculation_trace', 'authenticated', a, 'SELECT calculation_trace FROM public.scores WHERE assessment_id = ' || a_done, 'denied');
  PERFORM pg_temp.probe('PV-02', 'Privacy', 'A reads own reports.canonical_json', 'authenticated', a, 'SELECT canonical_json FROM public.reports WHERE assessment_id = ' || a_done, 'denied');
  PERFORM pg_temp.probe('PV-03', 'Privacy', 'A reads own reports.generation_metadata', 'authenticated', a, 'SELECT generation_metadata FROM public.reports WHERE assessment_id = ' || a_done, 'denied');

  -- CR — cross-role
  PERFORM pg_temp.probe('CR-01', 'Cross-role', 'Admin reads participants'' raw answers', 'authenticated', s, 'SELECT id FROM public.responses WHERE assessment_id IN ' || a_ids, 'none');
  PERFORM pg_temp.probe('CR-02', 'Cross-role', 'Admin reads scores.calculation_trace', 'authenticated', s, 'SELECT calculation_trace FROM public.scores WHERE assessment_id = ' || a_done, 'denied');
  PERFORM pg_temp.probe('CR-03', 'Cross-role', 'Admin reads reports.canonical_json', 'authenticated', s, 'SELECT canonical_json FROM public.reports WHERE assessment_id = ' || a_done, 'denied');
  PERFORM pg_temp.probe('CR-04', 'Cross-role', 'Admin changes a score', 'authenticated', s, 'UPDATE public.scores SET mr_score = 0 WHERE assessment_id = ' || a_done, 'blocked');
  PERFORM pg_temp.probe('CR-05', 'Cross-role', 'Admin changes a participant''s assessment', 'authenticated', s, 'UPDATE public.assessments SET progress_percent = 1 WHERE id = ' || a_open, 'blocked');
  PERFORM pg_temp.probe('CR-06', 'Cross-role', 'Admin grants a role through the API', 'authenticated', s,
    'INSERT INTO public.role_assignments (profile_id, role) VALUES (' || a_q || ', ''admin'')', 'blocked');
  PERFORM pg_temp.probe('CR-07', 'Cross-role', 'Admin reads research exports', 'authenticated', s, 'SELECT id FROM public.research_exports', 'denied');
  PERFORM pg_temp.probe('CR-08', 'Cross-role', 'Admin reads deletion requests', 'authenticated', s, 'SELECT id FROM public.data_requests', 'denied');
  PERFORM pg_temp.probe('CR-09', 'Cross-role', 'Expired Admin reads participants'' assessments', 'authenticated', e, 'SELECT id FROM public.assessments WHERE profile_id = ' || a_q, 'none');
  PERFORM pg_temp.probe('CR-10', 'Cross-role', 'Expired Admin reads participants'' scores', 'authenticated', e, 'SELECT mr_score FROM public.scores WHERE assessment_id = ' || a_done, 'none');

  -- IN — integrity rules that hold for every role, including the server (run as table owner)
  PERFORM pg_temp.probe('IN-01', 'Integrity', 'Change a stored score (any role)', NULL, NULL, 'UPDATE public.scores SET mr_score = 0 WHERE assessment_id = ' || a_done, 'denied');
  PERFORM pg_temp.probe('IN-02', 'Integrity', 'Change a submitted answer (any role)', NULL, NULL, 'UPDATE public.responses SET raw_value = ''99'' WHERE assessment_id = ' || a_done, 'denied');
  PERFORM pg_temp.probe('IN-03', 'Integrity', 'Re-open a submitted assessment (any role)', NULL, NULL, 'UPDATE public.assessments SET status = ''in_progress'' WHERE id = ' || a_done, 'denied');
  PERFORM pg_temp.probe('IN-04', 'Integrity', 'Rewrite a generated report (any role)', NULL, NULL, 'UPDATE public.reports SET canonical_json = ''{}'' WHERE assessment_id = ' || a_done, 'denied');
  PERFORM pg_temp.probe('IN-06', 'Integrity', 'Delete a submitted assessment (any role)', NULL, NULL, 'DELETE FROM public.assessments WHERE id = ' || a_done, 'denied');
END
$tests$;

-- IN-05 — audit records are append-only for every role (a probe row is written, then deletion is
-- attempted; both are rolled back).
DO $in05$
DECLARE refused TEXT; missing TEXT;
BEGIN
  BEGIN
    INSERT INTO public.audit_logs (id, action, result, actor_type)
      VALUES ('0000000e-0000-4000-8000-0000000000f5', 'm2.security_test.probe', 'success', 'system');
    DELETE FROM public.audit_logs WHERE id = '0000000e-0000-4000-8000-0000000000f5';
    RAISE EXCEPTION 'm2_probe_rollback';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'm2_probe_rollback' THEN
      IF SQLSTATE IN ('42P01', '42703', '42883') THEN missing := SQLERRM; ELSE refused := SQLERRM; END IF;
    END IF;
  END;
  INSERT INTO m2_security_results (test_id, area, test, expected, actual, outcome) VALUES
    ('IN-05', 'Integrity', 'Delete an audit record (any role)', 'refused', COALESCE('SCHEMA MISSING: ' || missing, 'refused: ' || refused, 'deleted'),
     CASE WHEN refused IS NOT NULL AND missing IS NULL THEN 'PASS' ELSE 'FAIL' END);
END
$in05$;

-- IN-07 — a source version stamped by the server can never be changed afterwards.
DO $in07$
DECLARE refused TEXT; missing TEXT;
BEGIN
  BEGIN
    UPDATE public.assessments SET source_versions = '{"c01":{"label":"C-01 v1.0.1 CORRECTED"}}' WHERE id = '0000000e-0000-4000-8000-0000000000a1';
    UPDATE public.assessments SET source_versions = '{"c01":{"label":"CHANGED"}}' WHERE id = '0000000e-0000-4000-8000-0000000000a1';
    RAISE EXCEPTION 'm2_probe_rollback';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'm2_probe_rollback' THEN
      IF SQLSTATE IN ('42P01', '42703', '42883') THEN missing := SQLERRM; ELSE refused := SQLERRM; END IF;
    END IF;
  END;
  INSERT INTO m2_security_results (test_id, area, test, expected, actual, outcome) VALUES
    ('IN-07', 'Integrity', 'Change a recorded source version (any role)', 'refused', COALESCE('SCHEMA MISSING: ' || missing, 'refused: ' || refused, 'changed'),
     CASE WHEN refused IS NOT NULL AND missing IS NULL THEN 'PASS' ELSE 'FAIL' END);
END
$in07$;

-- SCH-xx — the schema under test is the current one (otherwise the results above do not count)
INSERT INTO m2_security_results (test_id, area, test, expected, actual, outcome)
SELECT 'SCH-01', 'Schema', 'assessments.source_versions and scores.source_versions exist (M2 item 7)', '2 columns',
       count(*)::TEXT || ' columns', CASE WHEN count(*) = 2 THEN 'PASS' ELSE 'FAIL — run roots_ai_complete.sql' END
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'source_versions' AND table_name IN ('assessments', 'scores');

INSERT INTO m2_security_results (test_id, area, test, expected, actual, outcome)
SELECT 'SCH-02', 'Schema', 'signed-in users hold no write privilege on scores, reports, audit_logs, role_assignments', 'none',
       COALESCE(string_agg(table_name || ':' || privilege_type, ', '), 'none'),
       CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL — run roots_ai_complete.sql' END
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
  AND table_name IN ('scores', 'reports', 'audit_logs', 'role_assignments')
  AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE');

-- RLS-xx — Row Level Security is enabled on every application table
INSERT INTO m2_security_results (test_id, area, test, expected, actual, outcome)
SELECT 'RLS-' || lpad(row_number() OVER (ORDER BY c.relname)::TEXT, 2, '0'), 'RLS enabled', c.relname, 'true',
       c.relrowsecurity::TEXT, CASE WHEN c.relrowsecurity THEN 'PASS' ELSE 'FAIL' END
FROM pg_class c
WHERE c.relnamespace = 'public'::regnamespace
  AND c.relname IN ('profiles', 'role_assignments', 'assessments', 'responses', 'consents', 'scores', 'reports',
                    'scoring_config', 'audit_logs', 'research_exports', 'data_requests');

-- ---- 4. remove the test accounts and all their data -------------------------------------------
-- Deleting the accounts cascades to their profiles, roles, consents, assessments, answers, scores
-- and reports (the integrity rules allow a delete only once the account itself is gone).
DELETE FROM auth.users WHERE id IN ('0000000e-0000-4000-8000-00000000000a', '0000000e-0000-4000-8000-00000000000b',
                                    '0000000e-0000-4000-8000-00000000000c', '0000000e-0000-4000-8000-00000000000d');

INSERT INTO m2_security_results (test_id, area, test, expected, actual, outcome)
SELECT 'CLEANUP', 'Housekeeping', 'test accounts and their data removed', '0 rows left',
       (SELECT count(*) FROM public.assessments WHERE profile_id::TEXT LIKE '0000000e-%')::TEXT || ' rows left',
       CASE WHEN NOT EXISTS (SELECT 1 FROM public.assessments WHERE profile_id::TEXT LIKE '0000000e-%') THEN 'PASS' ELSE 'FAIL' END;

-- ---- 5. RESULT — every row must read PASS ------------------------------------------------------
SELECT test_id, area, test, expected, actual, outcome,
       (SELECT count(*) FILTER (WHERE outcome = 'PASS') || ' / ' || count(*) FROM m2_security_results) AS summary
FROM m2_security_results
ORDER BY seq;
