-- 034_fix_basic_ai_consult_monthly_limit.sql
-- Purpose:
-- Normalize existing basic/free subscription_plan AI consultation monthly limits.
--
-- Context:
-- Some existing users were created with plan_name='basic' and
-- ai_consult_monthly_limit defaulting to 1 (DB default at the time).
-- Current beta policy treats free/basic starter users as having 3 AI consultations per month.
-- auth/callback now explicitly inserts ai_consult_monthly_limit=3 for new users,
-- but existing rows created before that fix need to be corrected.
--
-- Scope:
-- - Data correction only
-- - No schema changes
-- - No RLS changes
-- - No code changes
-- - Only affects plan_name in ('free', 'basic') with limit < 3 or null
-- - Does NOT touch family, premium, family_plus plans
-- - Does NOT change plan_name, child_limit, parent_id, or created_at

begin;

update public.subscription_plan
set
  ai_consult_monthly_limit = 3,
  updated_at = now()
where plan_name in ('free', 'basic')
  and (
    ai_consult_monthly_limit is null
    or ai_consult_monthly_limit < 3
  );

commit;
