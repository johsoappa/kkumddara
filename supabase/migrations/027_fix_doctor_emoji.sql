-- ====================================================
-- 027_fix_doctor_emoji.sql
-- 의사 emoji 보정: 💀 → 🩺
--
-- [목적]
--   026 seed 실행 후 의사 화면에서 해골(💀)이 표시되는
--   시각 품질 문제를 즉시 수정한다.
--
-- [영향 범위]
--   occupation_master 테이블 1행 (slug = 'doctor')
--   occupation_summary / occupation_preparations 변경 없음
--
-- [idempotent]
--   동일 적용 시 emoji가 이미 🩺이면 updated_at만 갱신됨
-- ====================================================

UPDATE public.occupation_master
SET
  emoji      = '🩺',
  updated_at = now()
WHERE slug = 'doctor';

-- ── 검증 로그 ─────────────────────────────────────────────────
DO $$ BEGIN
  RAISE NOTICE '✅ 027: 의사 emoji 💀 → 🩺 보정 완료';
END; $$;
