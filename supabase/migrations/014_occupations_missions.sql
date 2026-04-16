-- ====================================================
-- 014_occupations_missions.sql
-- 커리어넷 직업 목록 + 기본 미션 자동 매핑 테이블
--
-- [배경]
--   기존 OCCUPATIONS 더미 데이터(static TS)를
--   Supabase DB 기반으로 전환하기 위한 스키마.
--   커리어넷 API (svcCode=JOB) 응답을 upsert 저장.
--
-- [실행 순서]
--   Supabase Dashboard → SQL Editor → 이 파일 전체 실행
-- ====================================================

-- ============================================================
-- [1] occupations — 직업 정보 테이블
-- ============================================================
create table if not exists public.occupations (
  id            text        primary key,           -- 커리어넷 jobCd 또는 슬러그
  name          text        not null,              -- 직업명 (jobNm)
  career_code   text        unique,               -- 커리어넷 원본 jobCd
  category      text,                             -- 직업 대분류 (jobGbn)
  description   text,                             -- 직업 소개
  emoji         text        default '💼',         -- UI 표시용 이모지
  source        text        not null default 'careerapi',  -- 'careerapi' | 'manual'
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.occupations is '커리어넷 직업 목록 + 수동 추가 직업 통합 테이블';

create index if not exists idx_occupations_career_code on public.occupations(career_code);
create index if not exists idx_occupations_category    on public.occupations(category);
create index if not exists idx_occupations_source      on public.occupations(source);

create or replace trigger trg_occupations_updated_at
  before update on public.occupations
  for each row execute procedure public.set_updated_at();

-- RLS
alter table public.occupations enable row level security;

-- 직업 목록은 누구나 읽기 가능 (공개 데이터)
create policy "occupations: 전체 공개 조회"
  on public.occupations for select
  using (is_active = true);

-- ============================================================
-- [2] missions — 직업별 기본 미션 테이블
-- ============================================================
create table if not exists public.missions (
  id            uuid        primary key default gen_random_uuid(),
  occupation_id text        not null references public.occupations(id) on delete cascade,
  stage         text        not null default 'current'
                            check (stage in ('current', 'next', 'future')),
  mission_type  text        not null default 'activity'
                            check (mission_type in ('activity', 'study', 'experience', 'challenge')),
  title         text        not null,              -- 미션 제목 (부모·학생이 읽는 한국어)
  description   text,                             -- 미션 상세 설명
  difficulty    integer     not null default 1
                            check (difficulty between 1 and 3),  -- 1=쉬움 2=보통 3=도전
  source        text        not null default 'careerapi',  -- 'careerapi' | 'manual' | 'ai'
  sort_order    integer     not null default 0,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.missions is '직업별 기본 미션. source=careerapi는 자동 생성, manual은 수동 추가.';

create index if not exists idx_missions_occupation_id on public.missions(occupation_id);
create index if not exists idx_missions_stage         on public.missions(stage);
create index if not exists idx_missions_source        on public.missions(source);

create or replace trigger trg_missions_updated_at
  before update on public.missions
  for each row execute procedure public.set_updated_at();

-- RLS
alter table public.missions enable row level security;

create policy "missions: 전체 공개 조회"
  on public.missions for select
  using (is_active = true);

-- ============================================================
-- [3] 완료 확인 로그
-- ============================================================
do $$ begin
  raise notice '✅ 014: occupations / missions 테이블 생성 완료';
  raise notice '   - occupations: career_code 인덱스, RLS 공개 조회 정책';
  raise notice '   - missions: occupation_id FK, stage/type 체크 제약';
  raise notice '   ⚠ 다음 단계: NEXT_PUBLIC_CAREER_API_KEY 환경변수 등록 후 sync 실행';
end; $$;
