-- ====================================================
-- Migration 047: myeonddara_yearly_limit 정책 보정
--
-- [변경 이유]
--   premium: migration 008에서 child_limit=3 기준으로 yearly_limit=9 설정.
--            그러나 premium은 "자녀 1명 집중" 플랜이며,
--            정책은 "자녀당 연 3회"이므로 yearly_limit=3이 정확함.
--
--   family_plus: migration 019에서 plan_name 컬럼 constraint만 추가.
--                myeonddara_yearly_limit 값을 설정한 migration이 없어
--                기본값 0(또는 NULL)이 유지되고 있음. 정책상 9로 보정.
--
-- [변경 대상]
--   premium     : 9 → 3
--   family_plus : 0 → 9
--   나머지 (free/basic/family)는 이미 정책과 일치하므로 SET로 재확인만 함
--
-- [보호 범위]
--   - child_limit 변경 없음
--   - 테이블/컬럼 추가·삭제 없음
--   - RLS 변경 없음
--   - auth 변경 없음
--   - usage 테이블 변경 없음
--   - plan_name 구조 변경 없음
--
-- [멱등성]
--   같은 migration을 여러 번 실행해도 결과가 동일함.
--   WHERE IN + CASE 구조로 보장.
-- ====================================================

UPDATE public.subscription_plan
SET myeonddara_yearly_limit = CASE plan_name
  WHEN 'free'        THEN 0
  WHEN 'basic'       THEN 3
  WHEN 'premium'     THEN 3
  WHEN 'family'      THEN 6
  WHEN 'family_plus' THEN 9
  ELSE myeonddara_yearly_limit
END
WHERE plan_name IN ('free', 'basic', 'premium', 'family', 'family_plus');
