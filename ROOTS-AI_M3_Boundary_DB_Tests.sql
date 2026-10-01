-- ROOTS-AI M3 database boundary probes. Execute against the deployed Supabase project.
-- Every assertion must return PASS; this file contains no data or secrets.
select 'PASS' as result, rolname = 'roots_ai_narrative' and not rolcanlogin as role_boundary from pg_roles where rolname = 'roots_ai_narrative';
select 'PASS' as result where has_table_privilege('roots_ai_narrative', 'public.scores', 'SELECT');
select 'PASS' as result where not has_table_privilege('roots_ai_narrative', 'public.responses', 'SELECT');
select 'PASS' as result where not has_table_privilege('roots_ai_narrative', 'public.profiles', 'SELECT');
select 'PASS' as result where not has_table_privilege('roots_ai_narrative', 'public.audit_logs', 'SELECT');
select 'PASS' as result where not has_table_privilege('roots_ai_narrative', 'public.assessments', 'SELECT');
select 'PASS' as result where not has_table_privilege('roots_ai_narrative', 'public.consents', 'SELECT');
select 'PASS' as result where not has_table_privilege('roots_ai_narrative', 'public.scores', 'INSERT');
select 'PASS' as result where not has_table_privilege('roots_ai_narrative', 'public.scores', 'UPDATE');
select 'PASS' as result where not has_table_privilege('roots_ai_narrative', 'public.scores', 'DELETE');
select 'PASS' as result where not has_column_privilege('roots_ai_narrative', 'public.scores', 'trace', 'SELECT');
