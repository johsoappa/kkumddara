-- ====================================================
-- 009_fix_free_ai_limit.sql
-- 선행 보정: 무료 플랜 AI 상담 한도 명시
--
-- [변경 목적]
--   기존: free.ai_consult_monthly_limit = 0
--         → 코드에서 "0이면 무료"라는 암묵 규칙으로 분기
--   변경: free.ai_consult_monthly_limit = 1
--         → 한도값을 DB에 명시, 코드는 plan_name 기준으로 판별
--
-- [원칙]
--   - 무료 여부 판단: plan_name = 'free'
--   - 상담 한도:      ai_consult_monthly_limit 값을 그대로 사용
--   - 0을 "무료 플랜"으로 해석하는 로직 금지
-- ====================================================

update public.subscription_plan
set ai_consult_monthly_limit = 1
where plan_name = 'free';

do $$ begin
  raise notice '✅ 009: free plan ai_consult_monthly_limit 0 → 1 완료';
  raise notice '   무료 여부 판단은 plan_name = ''free'' 기준으로 통일';
end; $$;
