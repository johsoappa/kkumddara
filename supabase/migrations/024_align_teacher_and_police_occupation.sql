-- ====================================================
-- 024_align_teacher_and_police_occupation.sql
-- 교사 직업명 정합화 및 경찰관 관심 분야 수정
--
-- [변경 목적]
--   1. occupation_master.name_ko "교사" → "중·고등학교 교사"
--      goyo24 jobNm="중·고등학교교사" 기준과 일치, 학원·온라인 강사 혼동 방지
--   2. occupation_summary.easy_description (교사)
--      학원 강사·온라인 강사 언급 제거 → 중·고등학교 교사 기준 설명
--   3. occupation_summary.why_this_job (교사)
--      "교사" 참조 → "중·고등학교 교사"로 수정
--   4. occupation_master.interest_fields (경찰관)
--      ["education"] → ["public_safety"] (실제 직업 특성 반영)
--
-- [대상 레코드]
--   교사:   id = '78616092-8993-4aad-9ce5-f62d6988b55d'
--   경찰관: id = 'cb790f47-4a48-4544-bba8-968dd0fd4114'
--
-- [주의]
--   occupation_master.slug / legacy_occupation_id 변경 없음 (라우팅 유지)
--   occupation_goyo24_profile 변경 없음 (goyo24_occupation_id 유지)
-- ====================================================

-- 1. 교사 name_ko 변경
UPDATE public.occupation_master
SET    name_ko = '중·고등학교 교사'
WHERE  id = '78616092-8993-4aad-9ce5-f62d6988b55d';

-- 2. 교사 easy_description 변경
UPDATE public.occupation_summary
SET    content = '중학교와 고등학교에서 학생들에게 과목을 가르치고, 학교생활과 성장을 함께 돕는 선생님이에요. 특정 과목을 깊이 있게 가르치는 데 보람을 느끼고, 학생들과 소통하는 것이 즐거운 사람에게 잘 맞아요.'
WHERE  occupation_id  = '78616092-8993-4aad-9ce5-f62d6988b55d'
  AND  content_type   = 'easy_description';

-- 3. 교사 why_this_job 변경
UPDATE public.occupation_summary
SET    content = '교육·사회에 관심 있는 학생이 가장 직관적으로 연결할 수 있는 직업이에요. 특히 좋아하는 과목을 남에게 설명하는 걸 즐긴다면 중·고등학교 교사는 훌륭한 선택지예요.'
WHERE  occupation_id  = '78616092-8993-4aad-9ce5-f62d6988b55d'
  AND  content_type   = 'why_this_job';

-- 4. 경찰관 interest_fields 변경
UPDATE public.occupation_master
SET    interest_fields = ARRAY['public_safety']::text[]
WHERE  id = 'cb790f47-4a48-4544-bba8-968dd0fd4114';

-- ── 검증 로그 ─────────────────────────────────────────────────
DO $$ BEGIN
  RAISE NOTICE '✅ 024: 교사 / 경찰관 직업 데이터 보정 완료';
  RAISE NOTICE '   - 교사 name_ko: 교사 → 중·고등학교 교사';
  RAISE NOTICE '   - 교사 easy_description: 학원·온라인 강사 언급 제거';
  RAISE NOTICE '   - 교사 why_this_job: 교사 → 중·고등학교 교사';
  RAISE NOTICE '   - 경찰관 interest_fields: [education] → [public_safety]';
END; $$;
