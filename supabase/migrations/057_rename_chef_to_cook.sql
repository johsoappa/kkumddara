-- ====================================================
-- 057_rename_chef_to_cook.sql
-- 요리사 명칭 통일: 셰프 → 요리사
--
-- [목적]
--   서비스 대표 직업명을 "요리사"로 통일한다.
--   slug / legacy_occupation_id = 'chef'는 변경하지 않는다 (URL·참조 유지).
--   - 표시 명칭(name_ko): 셰프 → 요리사
--   - 검색 별칭(name_aliases): '셰프', 'Chef' 추가
--     (현재 검색 로직은 name_aliases 미참조 — 값만 저장)
--   - 본문 표기 보정: occupation_summary의 easy_description / why_this_job
--     내 "셰프" → "요리사"
--
-- [영향 범위]
--   occupation_master 1행 (slug = 'chef')
--   occupation_summary 2행 (chef의 easy_description / why_this_job)
--   occupation_student_actions 변경 없음
--     ("국내 유명 셰프 1명을 찾아…"는 일반명사 용법이므로 유지)
--
-- [실행 환경]
--   Claude Code는 Production DB에 직접 실행하지 않음.
--   OZ가 Supabase SQL Editor (service_role 키)에서 직접 실행.
--
-- [idempotent]
--   재실행 시 name_ko는 동일값 UPDATE, 별칭은 DISTINCT로 중복 방지,
--   REPLACE는 대상 문자열이 없으면 no-op.
-- ====================================================

-- ── 1) 표시 명칭 변경 ─────────────────────────────────────────
UPDATE public.occupation_master
SET
  name_ko    = '요리사',
  updated_at = now()
WHERE slug = 'chef';

-- ── 2) 검색 별칭 추가 (기존 값 보존 + 중복 없이 추가) ─────────
UPDATE public.occupation_master
SET
  name_aliases = (
    SELECT ARRAY(
      SELECT DISTINCT unnest(
        COALESCE(name_aliases, '{}') || ARRAY['셰프', 'Chef']
      )
    )
  ),
  updated_at = now()
WHERE slug = 'chef';

-- ── 3) 본문 표기 보정 (occupation_summary) ────────────────────
--   easy_description / why_this_job의 "셰프"만 보정.
--   updated_at은 trg_osumm_updated_at 트리거가 자동 갱신.
UPDATE public.occupation_summary
SET content = REPLACE(content, '셰프', '요리사')
WHERE occupation_id = (
        SELECT id FROM public.occupation_master WHERE slug = 'chef'
      )
  AND layer = 'service'
  AND content_type IN ('easy_description', 'why_this_job');

-- ── 검증 로그 ─────────────────────────────────────────────────
DO $$ BEGIN
  RAISE NOTICE '✅ 057: chef 명칭 통일 완료 (name_ko=요리사, 별칭 셰프/Chef, 본문 2건 보정)';
END; $$;
