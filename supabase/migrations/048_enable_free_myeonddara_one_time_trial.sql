-- ====================================================
-- Migration 048: free 플랜 명따라 1회 체험 활성화
--
-- [변경 이유]
--   명따라는 꿈따라의 차별화 핵심 기능이므로,
--   무료 사용자도 1회 체험할 수 있게 하는 편이 전환 구조상 더 적합하다.
--   기존 free.myeonddara_yearly_limit=0 (차단) → 1 (1회 체험)으로 보정.
--
-- [변경 대상]
--   plan_name = 'free' 인 모든 subscription_plan row
--   myeonddara_yearly_limit: 0 → 1
--
-- [변경하지 않는 항목]
--   - child_limit
--   - plan_name 구조
--   - basic/premium/family/family_plus 값
--   - 테이블/컬럼 추가·삭제 없음
--   - RLS 변경 없음
--   - auth 변경 없음
--   - myeonddara_usage 구조 변경 없음
--   - 결제 관련 필드 변경 없음
--
-- [멱등성]
--   동일 migration 재실행 시 결과 동일.
--   이미 1이면 SET 1 → 변화 없음.
-- ====================================================

UPDATE public.subscription_plan
SET myeonddara_yearly_limit = 1
WHERE plan_name = 'free';

-- ====================================================
-- 검증 쿼리 (Supabase SQL Editor에서 확인)
-- ====================================================
-- SELECT
--   plan_name,
--   count(*) AS row_count,
--   min(child_limit)              AS min_child_limit,
--   max(child_limit)              AS max_child_limit,
--   min(myeonddara_yearly_limit)  AS min_myeonddara_limit,
--   max(myeonddara_yearly_limit)  AS max_myeonddara_limit
-- FROM public.subscription_plan
-- WHERE plan_name = 'free'
-- GROUP BY plan_name;
--
-- 기대값:
--   plan_name | row_count | min_child_limit | max_child_limit | min_myeonddara_limit | max_myeonddara_limit
--   free      | (가입자수) | 1               | 1               | 1                    | 1
-- ====================================================
