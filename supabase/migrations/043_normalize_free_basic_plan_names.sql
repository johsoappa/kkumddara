-- 꿈따라 Migration 043: Free/Basic 플랜 명칭 정규화
-- =======================================================
-- 배경:
--   Migration 003에서 plan_name='free' → 'basic' 일괄 변환 후
--   auth/callback이 신규 가입자를 plan_name='basic'으로 계속 생성해왔음.
--   이로 인해 ALL 사용자가 plan_name='basic'인 상태가 됨.
--
-- 전제 (2026-05-21 기준):
--   결제 기능 미연동 상태 → plan_name='basic'인 row는
--   실제 유료 베이직 결제자가 아닌 무료 체험 사용자로 간주.
--
-- 목적:
--   free = 무료 체험 (현재 신규 가입자 기본값)
--   basic = 유료 베이직 (향후 결제 연동 시 사용)
--   두 명칭을 명확히 분리하여 결제 연동 전 기준을 확립한다.
--
-- 변경 내용:
--   subscription_plan 테이블에서 plan_name='basic'인 모든 row를
--   plan_name='free'로 보정하고, 무료 플랜 한도 값도 정규화한다.
--
-- 영향 범위:
--   - subscription_plan 테이블만 변경 (schema/RLS/auth 변경 없음)
--   - 코드에서 FREE_PLAN_NAMES=["free","basic"] 혼용 → "free" 단일로 정리됨
--
-- 롤백 시 참고:
--   현재 all rows가 'basic'이므로 롤백 시 free→basic으로 UPDATE 가능.
--   단, auth/callback도 함께 롤백(plan_name="basic")해야 일관성 유지.
-- =======================================================

DO $$
DECLARE
  v_basic_count integer;
  v_free_count  integer;
  v_final_free  integer;
BEGIN
  -- 보정 전 현황 확인
  SELECT count(*) INTO v_basic_count FROM public.subscription_plan WHERE plan_name = 'basic';
  SELECT count(*) INTO v_free_count  FROM public.subscription_plan WHERE plan_name = 'free';

  RAISE NOTICE '043: 보정 전 — basic: %건, free: %건', v_basic_count, v_free_count;

  -- plan_name='basic'인 모든 row를 'free'로 보정
  -- 동시에 무료 플랜 기준 한도로 정규화:
  --   ai_consult_monthly_limit = 3  (MVP 무료 상담 한도)
  --   child_limit              = 1  (무료 1자녀)
  --   myeonddara_yearly_limit  = 0  (무료 면따라 사용 불가)
  UPDATE public.subscription_plan
  SET
    plan_name                = 'free',
    ai_consult_monthly_limit = 3,
    child_limit              = 1,
    myeonddara_yearly_limit  = 0
  WHERE plan_name = 'basic';

  RAISE NOTICE '043: basic → free 보정 완료 (대상: %건)', v_basic_count;

  -- 보정 후 현황 확인
  SELECT count(*) INTO v_final_free FROM public.subscription_plan WHERE plan_name = 'free';
  RAISE NOTICE '043: 보정 후 — free: %건 (이전 free: %건 + 전환: %건)', v_final_free, v_free_count, v_basic_count;

  -- 혹시 남은 basic row 경고 (정상이면 0건)
  SELECT count(*) INTO v_basic_count FROM public.subscription_plan WHERE plan_name = 'basic';
  IF v_basic_count > 0 THEN
    RAISE WARNING '043: 보정 후에도 basic row %건 남음 — 수동 확인 필요', v_basic_count;
  END IF;
END;
$$;
