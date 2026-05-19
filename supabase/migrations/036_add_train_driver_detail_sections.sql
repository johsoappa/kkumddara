-- ====================================================
-- 036_add_train_driver_detail_sections.sql
-- 철도 기관사 (train-driver) 상세 페이지 확장 섹션 데이터 보강
--
-- [목적]
--   035에서 추가된 철도 기관사 직업의 상세 페이지 하단 섹션이
--   기존 직업들과 달리 표시되지 않는 문제 해결.
--
-- [누락 원인]
--   1. occupation_goyo24_profile 테이블에 train-driver row 없음
--      → "미래를 그리는 참고 지표" 섹션이 null 반환으로 숨김 처리
--   2. src/data/quizData.ts에 train-driver 엔트리 없음
--      → "이 직업 더 알아보기 / 퀴즈 도전" 섹션이 undefined로 숨김 처리
--      (quizData.ts는 별도 코드 파일 수정으로 처리)
--
-- [변경 범위]
--   occupation_goyo24_profile: INSERT 1행 (train-driver 미래 지표)
--
-- [변경하지 않는 것]
--   DB schema / RLS / 기존 직업 데이터 / AI 상담 / 요금제
--
-- [재실행 안전성]
--   ON CONFLICT (occupation_id) DO UPDATE → 중복 실행 안전
--
-- [데이터 출처]
--   한국 철도기관사 평균 임금·전망을 공개 참고 정보 기준으로 작성.
--   고용24 실제 API 코드 매핑 전 수동 입력 (source='manual').
-- ====================================================

begin;

-- ============================================================
-- 철도 기관사 occupation_goyo24_profile 추가
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'train-driver'),
  null,                              -- 고용24 코드 매핑 전 (향후 sync 시 갱신)
  '철도기관사',
  '조사년도:2023년, 임금 하위(25%) 4500만원, 중위(50%) 6100만원, 상위(25%) 7800만원',
  4500,                              -- 하위 25% (만원)
  6100,                              -- 중위 50% (만원)
  7800,                              -- 상위 25% (만원)
  2023,
  72.0,                              -- 직업만족도
  '철도 교통망 확대와 수도권 광역철도 확충에 따라 철도기관사 수요는 당분간 유지될 전망입니다.',
  '유지',
  ARRAY[
    '철도운전학과',
    '기계공학과',
    '전기공학과',
    '교통공학과',
    '전기기관차학과'
  ],
  'manual',                          -- goyo24 API sync 전 수동 입력
  now()
)
on conflict (occupation_id) do update set
  goyo24_job_name    = excluded.goyo24_job_name,
  salary_raw         = excluded.salary_raw,
  salary_lower       = excluded.salary_lower,
  salary_median      = excluded.salary_median,
  salary_upper       = excluded.salary_upper,
  salary_survey_year = excluded.salary_survey_year,
  job_satisfaction   = excluded.job_satisfaction,
  prospect_raw       = excluded.prospect_raw,
  prospect_label     = excluded.prospect_label,
  related_majors     = excluded.related_majors,
  updated_at         = now();


-- ============================================================
-- [검증] 실행 후 결과 확인
-- ============================================================
select
  om.slug,
  om.name_ko,
  ogp.goyo24_job_name,
  ogp.salary_median,
  ogp.prospect_label,
  ogp.related_majors,
  ogp.source
from public.occupation_master om
join public.occupation_goyo24_profile ogp on ogp.occupation_id = om.id
where om.slug = 'train-driver';

-- 기대 결과:
-- slug         | name_ko     | goyo24_job_name | salary_median | prospect_label | source
-- train-driver | 철도 기관사  | 철도기관사        | 6100          | 유지            | manual

commit;
