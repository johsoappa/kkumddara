-- ====================================================
-- 007_ai_consult.sql
-- AI 진로 상담 기능 테이블
--
-- 설계 원칙:
--   - families 참조 없음
--   - parent_id: 플랜/한도 체크 기준
--   - child_id:  자녀 프로필 → system prompt 연동 기준
--
-- 무료 플랜 (ai_consult_monthly_limit = 0):
--   - 월 1회 허용, 세션 저장 없음, usage만 기록
-- 유료 플랜 (ai_consult_monthly_limit > 0):
--   - DB 한도 적용, 세션 저장 + 이전 대화 이어가기
--
-- 테이블:
--   ai_consult_sessions — 유료 유저 대화 이력
--   ai_consult_usage    — 월 사용량 추적 (무료/유료 공통)
-- ====================================================

-- ============================================================
-- [1] ai_consult_sessions — 유료 플랜 대화 이력
-- ============================================================
create table if not exists public.ai_consult_sessions (
  id         uuid        primary key default gen_random_uuid(),
  parent_id  uuid        not null references public.parent(id) on delete cascade,
  child_id   uuid        references public.child(id) on delete set null,
  title      text,                            -- 대화 제목 (첫 메시지 기반 자동 생성 또는 null)
  messages   jsonb       not null default '[]', -- [{role, content}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ai_consult_sessions is
  'AI 진로 상담 대화 이력. 유료 플랜만 저장. parent_id 기준, child_id로 자녀 프로필 연동.';
comment on column public.ai_consult_sessions.messages is
  'JSONB 배열. [{role: "user"|"assistant", content: string}] 형식. 순서 보장.';

create trigger trg_ai_consult_sessions_updated_at
  before update on public.ai_consult_sessions
  for each row execute procedure public.set_updated_at();

create index idx_ai_consult_sessions_parent on public.ai_consult_sessions(parent_id);
create index idx_ai_consult_sessions_child  on public.ai_consult_sessions(child_id);

-- ============================================================
-- [2] ai_consult_usage — 월 사용량 추적 (무료/유료 공통)
-- ============================================================
create table if not exists public.ai_consult_usage (
  id         uuid        primary key default gen_random_uuid(),
  parent_id  uuid        not null references public.parent(id) on delete cascade,
  used_month text        not null,              -- 'YYYY-MM' 형식
  count      int         not null default 0
                         check (count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_id, used_month)
);

comment on table public.ai_consult_usage is
  '월별 AI 상담 사용량. parent_id + used_month 기준 unique. 무료/유료 공통 추적.';
comment on column public.ai_consult_usage.used_month is
  'YYYY-MM 형식. 예: 2026-04';

create trigger trg_ai_consult_usage_updated_at
  before update on public.ai_consult_usage
  for each row execute procedure public.set_updated_at();

create index idx_ai_consult_usage_parent_month
  on public.ai_consult_usage(parent_id, used_month);

-- ============================================================
-- [3] RLS
-- ============================================================
alter table public.ai_consult_sessions enable row level security;
alter table public.ai_consult_usage    enable row level security;

-- ai_consult_sessions: 해당 parent만 전체 권한
create policy "ai_sessions: parent 전체 권한"
  on public.ai_consult_sessions for all
  using (parent_id in (
    select id from public.parent where user_id = auth.uid()
  ));

-- ai_consult_usage: 해당 parent 조회 + 수정
--   INSERT/UPDATE는 API route (service_role 또는 parent 본인) 에서 수행
create policy "ai_usage: parent 조회"
  on public.ai_consult_usage for select
  using (parent_id in (
    select id from public.parent where user_id = auth.uid()
  ));

create policy "ai_usage: parent 수정"
  on public.ai_consult_usage for all
  using (parent_id in (
    select id from public.parent where user_id = auth.uid()
  ));

-- ============================================================
do $$ begin
  raise notice '✅ 007_ai_consult 완료: ai_consult_sessions, ai_consult_usage';
end; $$;
