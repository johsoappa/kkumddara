-- ====================================================
-- 046_add_weekly_activity_completions.sql
-- 주간 리포트 추천 활동 완료 저장 테이블 신규 추가
--
-- [목적]
--   /report 추천 활동 체크박스 완료 상태를 DB에 영구 저장하고,
--   이번 주 / 지난주 완료 수 비교 그래프를 계산하기 위해
--   weekly_activity_completions 테이블을 신규 생성한다.
--
-- [roadmap_progress 재사용 불가 이유]
--   - occupation_id 컬럼이 TEXT (legacy_id/slug) → action_id 매핑 불명확
--   - week_start_date 컬럼 없음 → 주차별 구분 불가
--   - checked_missions가 JSONB 로드맵 전용 blob → 의미 오염 위험
--   - 기존 로드맵 기능과 충돌 가능성
--
-- [핵심 정책]
--   - child_id + action_id + week_start_date: UNIQUE (중복 저장 방지)
--   - action_id: NOT NULL (fallback 활동은 저장 안 함)
--   - occupation_id: NOT NULL (어떤 직업 기반 활동인지 추적)
--   - week_start_date: date (월요일 기준 YYYY-MM-DD)
--   - RLS: parent/student 동일 패턴 (liked_occupations 기준)
--
-- [변경하지 않는 것]
--   roadmap_progress / liked_occupations / occupation_student_actions /
--   occupation_master / auth / AI 상담 / 명따라 / 요금제
--
-- [재실행 안전성]
--   create table if not exists / create index if not exists
--   policy는 BEGIN 안에서 idempotent 처리
-- ====================================================

begin;

-- ============================================================
-- [1] weekly_activity_completions 테이블 생성
-- ============================================================
create table if not exists public.weekly_activity_completions (
  id              uuid        primary key default gen_random_uuid(),
  child_id        uuid        not null references public.child(id) on delete cascade,
  occupation_id   uuid        not null references public.occupation_master(id) on delete cascade,
  action_id       uuid        not null references public.occupation_student_actions(id) on delete cascade,
  week_start_date date        not null,   -- 해당 주 월요일 (YYYY-MM-DD)
  is_completed    boolean     not null default false,
  completed_at    timestamptz,            -- 완료 시 now(), 해제 시 null
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- 같은 자녀가 같은 주에 같은 활동을 중복 저장하지 않도록
  unique (child_id, action_id, week_start_date)
);

comment on table public.weekly_activity_completions is
  '주간 리포트 추천 활동 완료 저장. 자녀별·주차별·액션별로 1개 row.';

-- ============================================================
-- [2] updated_at 자동 갱신 트리거 (set_updated_at 재사용)
-- ============================================================
create trigger trg_weekly_activity_updated_at
  before update on public.weekly_activity_completions
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- [3] 인덱스
-- ============================================================

-- child_id + week_start_date: 이번 주/지난주 완료 수 조회
create index if not exists idx_weekly_activity_child_week
  on public.weekly_activity_completions (child_id, week_start_date);

-- action_id + week_start_date: 특정 액션 완료 여부 조회
create index if not exists idx_weekly_activity_action_week
  on public.weekly_activity_completions (action_id, week_start_date);

-- child_id + is_completed: 완료된 활동만 필터링
create index if not exists idx_weekly_activity_child_completed
  on public.weekly_activity_completions (child_id, is_completed);

-- ============================================================
-- [4] RLS 활성화
-- ============================================================
alter table public.weekly_activity_completions enable row level security;

-- ============================================================
-- [5] RLS 정책 — liked_occupations / roadmap_progress 동일 패턴
-- ============================================================

-- parent: 본인의 child에 해당하는 완료 기록만 접근
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'weekly_activity_completions'
      and policyname = 'weekly_activity: parent 전체 권한'
  ) then
    create policy "weekly_activity: parent 전체 권한"
      on public.weekly_activity_completions for all
      using (child_id in (
        select c.id from public.child c
        join public.parent p on p.id = c.parent_id
        where p.user_id = auth.uid()
      ));
  end if;
end $$;

-- student: 본인 child_id에 해당하는 완료 기록 접근
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'weekly_activity_completions'
      and policyname = 'weekly_activity: student 전체 권한'
  ) then
    create policy "weekly_activity: student 전체 권한"
      on public.weekly_activity_completions for all
      using (child_id in (
        select child_id from public.student
        where user_id = auth.uid() and child_id is not null
      ));
  end if;
end $$;

-- ============================================================
-- [검증] 실행 후 결과 확인
-- ============================================================
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name   = 'weekly_activity_completions';

-- 기대: weekly_activity_completions 1 row

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'weekly_activity_completions'
order by ordinal_position;

-- 기대: id, child_id, occupation_id, action_id, week_start_date,
--       is_completed, completed_at, created_at, updated_at

select
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename  = 'weekly_activity_completions'
order by policyname;

-- 기대: parent 전체 권한, student 전체 권한

commit;
