-- ====================================================
-- 025_prepare_occupation_expansion_interest_fields.sql
-- 영상콘텐츠 제작자 interest_fields 정합화
--
-- [목적]
--   영상콘텐츠 제작자 interest_fields = ["art"] → ["media"]
--   category = "콘텐츠·미디어"와 일치시킴
--   상세 페이지 INTEREST_LABELS에 media 코드 추가와 함께 적용
--
-- [영향 범위]
--   occupation_master 테이블 1행 (name_ko = '영상콘텐츠 제작자')
--
-- [idempotent]
--   WHERE 조건으로 동일 적용 시 변경 없음
-- ====================================================

UPDATE public.occupation_master
SET    interest_fields = ARRAY['media']::text[]
WHERE  name_ko = '영상콘텐츠 제작자';

-- ── 검증 로그 ─────────────────────────────────────────────────
DO $$ BEGIN
  RAISE NOTICE '✅ 025: 영상콘텐츠 제작자 interest_fields [art] → [media] 완료';
END; $$;
