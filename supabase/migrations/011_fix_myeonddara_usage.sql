-- ====================================================
-- 011_fix_myeonddara_usage.sql
-- 명따라 사용량 구조 보정 + basic 플랜 보호자 초대 활성화
--
-- [변경 목적]
--   1. myeonddara_usage: parent 기준 → child 기준으로 변경
--      기존: (parent_id, used_year) unique
--      변경: (child_id, used_year) unique
--      → 자녀별 연 3회 정확한 관리
--
--   2. basic 플랜 max_guardians 보정
--      기존: 0 (초대 불가)
--      변경: 1 (보호자 1명 초대 가능)
--      → free만 보호자 초대 불가 (확정 요금제)
--
-- [마이그레이션 안전 원칙]
--   - child_id nullable로 추가 (기존 데이터 보호)
--   - 기존 unique constraint 제거 후 partial index로 교체
--   - parent_id 유지 (RLS 및 조회 성능)
-- ====================================================

-- ============================================================
-- [1] myeonddara_usage — child_id 컬럼 추가
-- ============================================================
alter table public.myeonddara_usage
  add column if not exists child_id uuid
    references public.child(id) on delete cascade;

comment on column public.myeonddara_usage.child_id is
  '명따라 분석 대상 자녀 UUID. child 기준 연 3회 관리. NULL = 기존 데이터 (parent 기준).';

-- ============================================================
-- [2] 기존 unique constraint 제거
--     (parent_id, used_year) → (child_id, used_year) 로 교체
-- ============================================================
alter table public.myeonddara_usage
  drop constraint if exists myeonddara_usage_parent_id_used_year_key;

-- ============================================================
-- [3] 신규 unique index: (child_id, used_year)
--     child_id NOT NULL인 경우에만 적용 (기존 데이터 안전)
-- ============================================================
create unique index if not exists myeonddara_usage_child_year_key
  on public.myeonddara_usage(child_id, used_year)
  where child_id is not null;

-- 조회 성능용 인덱스
create index if not exists idx_myeonddara_usage_child_year
  on public.myeonddara_usage(child_id, used_year)
  where child_id is not null;

-- ============================================================
-- [4] basic 플랜 max_guardians 보정: 0 → 1
--     확정 요금제: free=불가, basic/family/premium=가능
-- ============================================================
update public.subscription_plan
  set max_guardians = 1
  where plan_name = 'basic';

do $$ begin
  raise notice '✅ 011: myeonddara_usage child_id 추가 완료';
  raise notice '   - (child_id, used_year) unique index 생성';
  raise notice '   - 기존 (parent_id, used_year) unique 제거';
  raise notice '✅ 011: basic 플랜 max_guardians 0 → 1 완료';
  raise notice '   - 보호자 초대 가능: basic / family / premium';
  raise notice '   - 보호자 초대 불가: free';
end; $$;
