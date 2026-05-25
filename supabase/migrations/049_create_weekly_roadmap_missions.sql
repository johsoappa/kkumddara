-- ====================================================
-- 049_create_weekly_roadmap_missions.sql
-- 직업 주간 AI 미션 저장 테이블 신규 추가
--
-- [목적]
--   자녀별·직업별·단계별·주차별로 AI가 생성한 주간 미션 묶음을 저장한다.
--   같은 주에는 같은 미션을 재사용하고, 다음 주에 새 미션을 생성한다.
--
-- [핵심 정책]
--   unique(child_id, occupation_slug, stage, week_start)
--   — 한 자녀 + 직업 + 단계 + 주차당 미션 묶음은 하나만 존재
--   source: 'ai' | 'fallback' | 'static'
--   — AI 생성 / OpenAI 실패 시 정적 fallback / 정적 미션 직접 사용
--
-- [변경하지 않는 것]
--   roadmap_progress / liked_occupations / occupation_student_actions /
--   occupation_master / weekly_activity_completions / auth / 명따라 / 요금제
--
-- [재실행 안전성]
--   create table if not exists / create index if not exists
--   policy는 do $$ begin ... end $$ idempotent 처리
-- ====================================================

begin;

-- ============================================================
-- [1] weekly_roadmap_missions 테이블 생성
-- ============================================================
create table if not exists public.weekly_roadmap_missions (
  id              uuid        primary key default gen_random_uuid(),
  child_id        uuid        not null references public.child(id) on delete cascade,
  occupation_slug text        not null,               -- legacy_occupation_id / slug (예: ai-service-planner)
  stage           text        not null
                              check (stage in ('current', 'next', 'future')),
  week_start      date        not null,               -- 해당 주 월요일 (KST 기준, YYYY-MM-DD)
  missions        jsonb       not null default '[]',  -- [{id, title, description, checklist, parentGuide, estimatedMinutes, difficulty}]
  source          text        not null default 'ai'
                              check (source in ('ai', 'fallback', 'static')),
  ai_model        text,                              -- 생성에 사용한 OpenAI 모델명
  prompt_version  text,                              -- 프롬프트 버전 (v1, v2, ...)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- 한 자녀 + 직업 + 단계 + 주차당 미션 묶음은 하나만 허용
  unique (child_id, occupation_slug, stage, week_start)
);

comment on table public.weekly_roadmap_missions is
  '자녀별·직업별·단계별·주차별 AI 주간 미션 묶음. 같은 주에는 저장된 미션을 재사용.';

comment on column public.weekly_roadmap_missions.week_start is
  'KST 기준 해당 주 월요일 날짜 (YYYY-MM-DD). 서버에서 계산하여 삽입.';

comment on column public.weekly_roadmap_missions.missions is
  '주간 미션 배열. [{id, title, description, checklist, parentGuide, estimatedMinutes, difficulty}]';

-- ============================================================
-- [2] updated_at 자동 갱신 트리거 (set_updated_at 함수 재사용)
-- ============================================================
create trigger trg_weekly_roadmap_missions_updated_at
  before update on public.weekly_roadmap_missions
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- [3] 인덱스
-- ============================================================

-- child_id + week_start: 이번 주 전체 미션 조회
create index if not exists idx_wrm_child_week
  on public.weekly_roadmap_missions (child_id, week_start);

-- 핵심 조회 패턴: child + slug + stage + week
create index if not exists idx_wrm_child_slug_stage_week
  on public.weekly_roadmap_missions (child_id, occupation_slug, stage, week_start);

-- ============================================================
-- [4] RLS 활성화
-- ============================================================
alter table public.weekly_roadmap_missions enable row level security;

-- ============================================================
-- [5] RLS 정책 — roadmap_progress 동일 패턴
-- ============================================================

-- parent: 본인의 child에 해당하는 주간 미션만 접근
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'weekly_roadmap_missions'
      and policyname = 'weekly_roadmap_missions: parent 전체 권한'
  ) then
    create policy "weekly_roadmap_missions: parent 전체 권한"
      on public.weekly_roadmap_missions for all
      using (child_id in (
        select c.id from public.child c
        join public.parent p on p.id = c.parent_id
        where p.user_id = auth.uid()
      ));
  end if;
end $$;

-- student: 본인 child_id에 해당하는 주간 미션 접근
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'weekly_roadmap_missions'
      and policyname = 'weekly_roadmap_missions: student 전체 권한'
  ) then
    create policy "weekly_roadmap_missions: student 전체 권한"
      on public.weekly_roadmap_missions for all
      using (child_id in (
        select child_id from public.student
        where user_id = auth.uid() and child_id is not null
      ));
  end if;
end $$;

-- ============================================================
-- [6] 검증 쿼리 (실행 후 결과 확인)
-- ============================================================
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name   = 'weekly_roadmap_missions';
-- 기대: 1 row

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'weekly_roadmap_missions'
order by ordinal_position;
-- 기대: id, child_id, occupation_slug, stage, week_start, missions,
--       source, ai_model, prompt_version, created_at, updated_at

select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename  = 'weekly_roadmap_missions'
order by policyname;
-- 기대: parent 전체 권한, student 전체 권한

do $$ begin
  raise notice '✅ 049: weekly_roadmap_missions 생성 완료';
  raise notice '   unique(child_id, occupation_slug, stage, week_start)';
  raise notice '   RLS: parent / student 전체 권한';
  raise notice '   ⚠ Supabase SQL Editor에서 실행 필요 (로컬 생성 전용)';
end $$;

commit;
