-- ====================================================
-- 052_move_rail_jobs_to_transport_category.sql
-- 철도 직업 2개 카테고리 보정: 공공·안전 → 항공·운송
--
-- [목적]
--   항공·운송 카테고리가 9번째 정식 카테고리로 확정됨에 따라,
--   운송·이동 성격의 철도 직업 2개를 공공·안전에서 항공·운송으로 이동한다.
--
-- [대상]
--   train-driver  (철도 기관사) — 대표 직업 (is_representative=true)
--   train-controller (열차 관제사) — 세부 직업 (is_representative=false)
--
-- [변경 필드]
--   category: '공공·안전' → '항공·운송'
--
-- [변경하지 않는 필드]
--   is_active, is_representative, parent_occupation_id,
--   legacy_occupation_id, name_ko, interest_fields, emoji,
--   occupation_summary, occupation_preparations, occupation_goyo24_profile
--
-- [보정 후 예상 상태]
--   공공·안전: 대표 4개, 세부 8개 (총 12개)
--   항공·운송: 대표 2개, 세부 1개 (총 3개)
--
-- [재실행 안전성]
--   WHERE category = '공공·안전' 조건으로 멱등성 보장.
--   이미 '항공·운송'으로 변경된 row는 영향 없음.
--
-- [Production 적용]
--   Supabase SQL Editor (service_role 키)에서 OZ가 직접 실행.
--   Claude Code는 Production DB에 직접 실행하지 않음.
-- ====================================================

UPDATE public.occupation_master
SET
  category   = '항공·운송',
  updated_at = now()
WHERE slug IN ('train-driver', 'train-controller')
  AND category = '공공·안전';


-- ============================================================
-- [적용 후 검증 쿼리 1] 대상 직업 category 확인
-- ============================================================
-- SELECT
--   slug,
--   legacy_occupation_id,
--   name_ko,
--   category,
--   is_active,
--   is_representative,
--   parent_occupation_id
-- FROM public.occupation_master
-- WHERE slug IN ('train-driver', 'train-controller')
-- ORDER BY slug;
--
-- 기대값:
--   train-controller | train-controller | 열차 관제사   | 항공·운송 | true | false | (train-driver UUID)
--   train-driver     | train-driver     | 철도 기관사   | 항공·운송 | true | true  | NULL


-- ============================================================
-- [적용 후 검증 쿼리 2] 카테고리별 집계 재확인
-- ============================================================
-- SELECT
--   category,
--   COUNT(*) AS total,
--   COUNT(*) FILTER (WHERE is_representative = true  AND is_active = true) AS representative_active,
--   COUNT(*) FILTER (WHERE is_representative = false)                       AS sub_occupation,
--   COUNT(*) FILTER (WHERE is_active = true)                                AS active_total,
--   COUNT(*) FILTER (WHERE is_active = false)                               AS inactive_total
-- FROM public.occupation_master
-- GROUP BY category
-- ORDER BY category;
--
-- 기대값 (일부):
--   공공·안전  | 12 | 4  | 8 | 12 | 0
--   항공·운송  |  3 | 2  | 1 |  3 | 0
