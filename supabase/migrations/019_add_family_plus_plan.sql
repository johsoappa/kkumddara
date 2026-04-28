-- ====================================================
-- 019_add_family_plus_plan.sql
-- family_plus 플랜 추가
--
-- [변경 내용]
--   1. plan_name check constraint 교체
--      기존: ('free', 'basic', 'family', 'premium')
--      변경: ('free', 'basic', 'family', 'premium', 'family_plus')
--
-- [설계 원칙]
--   - subscription_plan은 parent_id 기준 사용자별 row 구조
--   - 공통 seed INSERT 없음 (사용자가 결제 시 plan_name 변경)
--   - 기존 free/basic/family/premium row 영향 없음
--   - family child_limit 보정 없음 (별도 데이터 점검 후 진행)
--   - child_limit = 3 (int not null 구조 유지)
--     → "3명 이상" 의미는 UI 문구로 처리
--     → 4명 이상 지원은 child_limit null 구조로 전환 시 별도 작업 필요
--
-- [실행 환경]
--   Supabase SQL Editor — service_role 키
--
-- [재실행 안전성]
--   DROP CONSTRAINT IF EXISTS 사용 → 멱등 처리
-- ====================================================

-- ============================================================
-- [1] 기존 check constraint 제거
-- ============================================================
alter table public.subscription_plan
  drop constraint if exists subscription_plan_plan_name_check;

-- ============================================================
-- [2] 신규 check constraint 추가 (5종)
-- ============================================================
alter table public.subscription_plan
  add constraint subscription_plan_plan_name_check
    check (plan_name in ('free', 'basic', 'family', 'premium', 'family_plus'));

-- ============================================================
-- [3] 확인 쿼리
-- ============================================================
do $$ begin
  raise notice '✅ 019: family_plus plan_name constraint 추가 완료';
  raise notice '   허용 plan_name: free / basic / family / premium / family_plus';
  raise notice '   기존 row 영향 없음';
  raise notice '   family child_limit 보정: 별도 작업 예정';
  raise notice '   family_plus child_limit 기준: 3 (int not null 구조 유지)';
  raise notice '   4명 이상 지원: child_limit null 구조 전환 시 별도 migration 필요';
end; $$;
