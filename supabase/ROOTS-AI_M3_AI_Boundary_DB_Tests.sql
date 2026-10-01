-- Execute after roots_ai_complete.sql in Supabase SQL Editor.
select case when exists (select 1 from pg_roles where rolname = 'roots_ai_narrative' and rolcanlogin = false) then 'PASS' else 'FAIL' end as role_nologin;
select case when has_table_privilege('roots_ai_narrative', 'public.scores', 'SELECT') then 'PASS' else 'FAIL' end as scores_select;
select case when not has_table_privilege('roots_ai_narrative', 'public.responses', 'SELECT') then 'PASS' else 'FAIL' end as responses_denied;
select case when not has_table_privilege('roots_ai_narrative', 'public.profiles', 'SELECT') then 'PASS' else 'FAIL' end as profiles_denied;
select case when not has_table_privilege('roots_ai_narrative', 'public.audit_logs', 'SELECT') then 'PASS' else 'FAIL' end as audit_logs_denied;
select case when not has_table_privilege('roots_ai_narrative', 'public.assessments', 'SELECT') then 'PASS' else 'FAIL' end as assessments_denied;
select case when not has_table_privilege('roots_ai_narrative', 'public.consents', 'SELECT') then 'PASS' else 'FAIL' end as consents_denied;
select case when not has_table_privilege('roots_ai_narrative', 'public.scores', 'INSERT') then 'PASS' else 'FAIL' end as scores_insert_denied;
select case when not has_table_privilege('roots_ai_narrative', 'public.scores', 'UPDATE') then 'PASS' else 'FAIL' end as scores_update_denied;
select case when not has_table_privilege('roots_ai_narrative', 'public.scores', 'DELETE') then 'PASS' else 'FAIL' end as scores_delete_denied;
select case when not has_column_privilege('roots_ai_narrative', 'public.scores', 'trace', 'SELECT') then 'PASS' else 'FAIL' end as trace_denied;
