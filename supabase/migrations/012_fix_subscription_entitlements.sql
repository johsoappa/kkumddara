-- ====================================================
-- 012_fix_subscription_entitlements.sql
-- 구독 플랜 entitlement 화면 기준으로 재정비
--
-- [변경 목적]
--   실제 구독 플랜 UI 화면과 DB/코드 값의 불일치 해소
--
-- [확정 요금제 기준]
--   무료    : AI 상담 월 1회,  max_guardians=0 (보호자 1=부모만)
--   베이직  : AI 상담 월 5회,  max_guardians=1 (보호자 2명=부모+1)
--   패밀리  : AI 상담 월 10회, max_guardians=1 (보호자 2명)
--   프리미엄: AI 상담 월 15회, max_guardians=1 (보호자 2명)
--
-- [max_guardians 의미 확정]
--   "추가 초대 가능한 공동양육자 수" (부모 본인 미포함)
--   0 = 초대 불가 (보호자 1명 = 부모만)
--   1 = 1명 초대 가능 (보호자 2명 = 부모+공동양육자)
--
-- [이번 변경]
--   basic   : ai_consult_monthly_limit 3 → 5
--   premium : ai_consult_monthly_limit 20 → 15
--   나머지  : 변경 없음 (이미 정합)
-- ====================================================

update public.subscription_plan
set ai_consult_monthly_limit = 5
where plan_name = 'basic';

update public.subscription_plan
set ai_consult_monthly_limit = 15
where plan_name = 'premium';

do $$ begin
  raise notice '✅ 012: subscription_plan entitlement 재정비 완료';
  raise notice '   basic   ai_consult_monthly_limit: 3 → 5';
  raise notice '   premium ai_consult_monthly_limit: 20 → 15';
  raise notice '   max_guardians 의미: 추가 초대 가능 공동양육자 수 (부모 미포함)';
  raise notice '     free=0 (보호자1=부모만) / basic,family,premium=1 (보호자2명)';
end; $$;
