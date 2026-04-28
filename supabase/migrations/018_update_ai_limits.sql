-- ====================================================
-- 018_update_ai_limits.sql
-- AI 코치 메시지 한도 1차 최신화
--
-- [변경 내용]
--   free:    1  → 3   (기존 009 보정값 1 → 신규 정책 3)
--   basic:   5  → 30
--   family:  10 → 60
--   premium: 15 → 100
--
-- [실행 환경]
--   Supabase SQL Editor — service_role 키 (RLS 우회 필요)
--
-- [재실행 안전성]
--   SET은 멱등성 보장 (같은 값으로 재실행해도 부작용 없음)
-- ====================================================

update public.subscription_plan
set ai_consult_monthly_limit = 3
where plan_name = 'free';

update public.subscription_plan
set ai_consult_monthly_limit = 30
where plan_name = 'basic';

update public.subscription_plan
set ai_consult_monthly_limit = 60
where plan_name = 'family';

update public.subscription_plan
set ai_consult_monthly_limit = 100
where plan_name = 'premium';


-- ── 확인 쿼리 ──────────────────────────────────────────
select plan_name, ai_consult_monthly_limit
from public.subscription_plan
order by
  case plan_name
    when 'free'    then 1
    when 'basic'   then 2
    when 'family'  then 3
    when 'premium' then 4
    else 9
  end;
