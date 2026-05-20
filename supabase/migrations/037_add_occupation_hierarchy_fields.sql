-- ====================================================
-- 037_add_occupation_hierarchy_fields.sql
-- occupation_master 세부 직업 계층화 컬럼 추가
--
-- [목적]
--   대표 직업 아래에 세부 직업을 추가할 수 있는 구조 기반 마련.
--   이번 migration은 컬럼/인덱스 추가만 수행하며,
--   실제 세부 직업 데이터는 별도 migration에서 추가한다.
--
-- [추가 컬럼]
--   parent_occupation_id  : 세부 직업이 참조하는 대표 직업 ID (self-FK). 대표는 null.
--   occupation_level      : 1=대표, 2=세부 (기본값 1)
--   display_group         : 화면 그룹 레이블 (예: '의사', '경찰')
--   is_representative     : /explore 목록 노출 기준 (기본값 true)
--   group_display_order   : 대표 직업 아래 세부 직업 정렬 순서 (기본값 0)
--
-- [기존 데이터 영향]
--   기존 active 직업 전체: DEFAULT 값으로 occupation_level=1, is_representative=true
--   → /explore 목록, /explore/[id] 상세 페이지 화면 변화 없음
--
-- [변경하지 않는 것]
--   기존 컬럼 / RLS / 기존 직업 데이터 / 기존 인덱스 / TypeScript 코드
--
-- [재실행 안전성]
--   ALTER TABLE ... ADD COLUMN IF NOT EXISTS → 중복 실행 안전
--   FK constraint → DO $$ exception when duplicate_object → 중복 실행 안전
--   CREATE INDEX IF NOT EXISTS → 중복 실행 안전
-- ====================================================

begin;

-- ============================================================
-- [1] 계층화 컬럼 추가
-- ============================================================
alter table public.occupation_master
  add column if not exists parent_occupation_id uuid null,
  add column if not exists occupation_level     integer not null default 1,
  add column if not exists display_group        text null,
  add column if not exists is_representative    boolean not null default true,
  add column if not exists group_display_order  integer not null default 0;

-- ============================================================
-- [2] self-FK 제약 추가 (이미 존재하면 무시)
-- ============================================================
do $$ begin
  alter table public.occupation_master
    add constraint occupation_master_parent_occupation_id_fkey
    foreign key (parent_occupation_id)
    references public.occupation_master(id)
    on delete set null;
exception when duplicate_object then null;
end $$;

-- ============================================================
-- [3] 인덱스 추가
-- ============================================================
-- 세부 직업 조회 (parent_occupation_id 기준)
create index if not exists idx_om_parent_occupation_id
  on public.occupation_master(parent_occupation_id);

-- /explore 목록 쿼리 최적화 (is_active + is_representative + priority)
create index if not exists idx_om_representative_active
  on public.occupation_master(is_active, is_representative, priority desc);

-- 세부 직업 정렬 (parent 아래 group_display_order)
create index if not exists idx_om_group_order
  on public.occupation_master(parent_occupation_id, group_display_order);

commit;
