-- ====================================================
-- 005_add_grade_level.sql
-- child 테이블에 grade_level 컬럼 추가
--
-- 목적:
--   - school_grade는 elementary3~high3 (초3~고3) 범위
--   - grade_level은 elem_1~high_3 (초1~고3) 전체 커버
--   - 기존 school_grade는 하위호환 유지, grade_level을 신규 기준으로 사용
--
-- 주의:
--   - school_grade는 DROP하지 않음 (기존 코드 호환 유지)
--   - 기존 데이터 null 허용 (ALTER COLUMN 불필요, 신규 컬럼 nullable 추가)
-- ====================================================

alter table public.child
  add column if not exists grade_level text
    check (grade_level in (
      'elem_1', 'elem_2', 'elem_3', 'elem_4', 'elem_5', 'elem_6',
      'middle_1', 'middle_2', 'middle_3',
      'high_1', 'high_2', 'high_3'
    ));

comment on column public.child.grade_level is
  '학년 (elem_1~elem_6 / middle_1~middle_3 / high_1~high_3). school_grade 하위호환 병행 저장.';
