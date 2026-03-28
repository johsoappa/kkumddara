-- ====================================================
-- 꿈따라 Supabase 초기 스키마
-- 파일: supabase/migrations/001_init_schema.sql
-- 실행 위치: Supabase Dashboard → SQL Editor
-- ====================================================

-- ============================================================
-- [0] 확장 기능
-- ============================================================

-- UUID 자동 생성용 (Supabase 기본 제공, 확인 차 포함)
create extension if not exists "uuid-ossp";


-- ============================================================
-- [1] users — 공개 프로필 테이블
-- auth.users와 1:1 연결 (이메일 등 개인정보는 auth.users에서만 관리)
-- ============================================================

create table if not exists public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text        not null default '부모님',
  avatar_url      text,
  subscription_status text    not null default 'free'
                              check (subscription_status in ('free', 'premium', 'trial')),
  subscription_plan   text    not null default 'free'
                              check (subscription_plan in ('free', 'basic', 'pro')),
  subscription_expires_at timestamptz,
  created_at      timestamptz not null default now()
);

comment on table public.users is '공개 사용자 프로필. auth.users와 1:1 연결.';

-- 신규 회원가입 시 자동으로 users 행 생성하는 트리거
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', '부모님')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- [2] families — 가족 그룹 루트 테이블
-- ============================================================

create table if not exists public.families (
  id            uuid primary key default uuid_generate_v4(),
  name          text,                          -- 예: "김씨 가족" (선택)
  main_user_id  uuid not null references public.users(id) on delete restrict,
  created_at    timestamptz not null default now()
);

comment on table public.families is '가족 그룹. 한 가족당 하나의 families 행.';


-- ============================================================
-- [3] family_members — 가족 구성원 (메인 + 공동양육자)
-- ============================================================

create table if not exists public.family_members (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references public.families(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  role        text not null check (role in ('main', 'co-parent')),
  invited_by  uuid references public.users(id),
  status      text not null default 'accepted'
              check (status in ('pending', 'accepted', 'rejected')),
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  unique (family_id, user_id)
);

comment on table public.family_members is '가족 구성원 매핑. 한 user_id가 여러 가족에 속할 수 없음.';


-- ============================================================
-- [4] invitations — 공동 양육자 초대 링크
-- ============================================================

create table if not exists public.invitations (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references public.families(id) on delete cascade,
  invited_by  uuid not null references public.users(id),
  invite_code text not null unique default substr(md5(random()::text), 1, 12),
  invited_email text not null,              -- 암호화 권장 (정식 버전)
  status      text not null default 'pending'
              check (status in ('pending', 'accepted', 'rejected')),
  expires_at  timestamptz not null default now() + interval '7 days',
  created_at  timestamptz not null default now()
);

comment on table public.invitations is '공동 양육자 초대 링크/코드. 7일 후 만료.';


-- ============================================================
-- [5] children — 자녀 프로필
-- ============================================================

create table if not exists public.children (
  id            uuid primary key default uuid_generate_v4(),
  family_id     uuid not null references public.families(id) on delete cascade,
  created_by    uuid not null references public.users(id),
  name          text not null,
  grade         text not null
                check (grade in ('elementary5', 'elementary6', 'middle1', 'middle2', 'middle3')),
  interests     jsonb not null default '[]',   -- InterestField[] 배열
  avatar_emoji  text not null default '🌟',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.children is '자녀 프로필. 가족(family)에 귀속.';

-- updated_at 자동 갱신 트리거
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_children_updated_at on public.children;
create trigger set_children_updated_at
  before update on public.children
  for each row execute procedure public.set_updated_at();


-- ============================================================
-- [6] roadmap_progress — 로드맵 미션 진행 상태
-- 자녀별 직업별 미션 체크 상태 저장
-- ============================================================

create table if not exists public.roadmap_progress (
  id              uuid primary key default uuid_generate_v4(),
  child_id        uuid not null references public.children(id) on delete cascade,
  occupation_id   text not null,              -- 예: "ux-designer", "data-analyst"
  checked_missions jsonb not null default '{}', -- Record<missionId, boolean>
  chosen          boolean not null default false, -- 이 직업을 로드맵으로 선택했는지
  last_visited_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (child_id, occupation_id)
);

comment on table public.roadmap_progress is '자녀별 직업별 로드맵 미션 진행 상태.';

drop trigger if exists set_roadmap_progress_updated_at on public.roadmap_progress;
create trigger set_roadmap_progress_updated_at
  before update on public.roadmap_progress
  for each row execute procedure public.set_updated_at();

-- 선택된 로드맵은 한 자녀당 하나만 (chosen=true)
-- 애플리케이션 레벨에서 제어 (다른 occupation을 chosen=true로 바꾸면 기존 건 false로 변경)


-- ============================================================
-- [7] liked_occupations — 좋아요한 직업 목록
-- ============================================================

create table if not exists public.liked_occupations (
  id            uuid primary key default uuid_generate_v4(),
  child_id      uuid not null references public.children(id) on delete cascade,
  occupation_id text not null,
  liked_at      timestamptz not null default now(),
  unique (child_id, occupation_id)
);

comment on table public.liked_occupations is '자녀별 좋아요한 직업 목록.';


-- ============================================================
-- [8] myeonddara_sessions — 명따라 사주 분석 세션
-- ============================================================

create table if not exists public.myeonddara_sessions (
  id              uuid primary key default uuid_generate_v4(),
  child_id        uuid references public.children(id) on delete set null,
  user_id         uuid not null references public.users(id) on delete cascade,
  -- 입력 데이터
  child_name      text not null,
  birth_date      date not null,
  birth_time      text not null
                  check (birth_time in ('ja','chuk','in','myo','jin','sa','o','mi','sin','yu','sul','hae','unknown')),
  calendar_type   text not null default '양력'
                  check (calendar_type in ('양력', '음력', '윤달')),
  gender          text not null
                  check (gender in ('male', 'female')),
  -- 분석 결과 (현재는 더미, 추후 AI 결과로 교체)
  result_snapshot jsonb,                      -- 분석 결과 JSON 스냅샷
  created_at      timestamptz not null default now()
);

comment on table public.myeonddara_sessions is '명따라 사주 분석 입력/결과 이력.';


-- ============================================================
-- [9] RLS (Row Level Security) 정책
-- ============================================================

-- 모든 테이블 RLS 활성화
alter table public.users              enable row level security;
alter table public.families           enable row level security;
alter table public.family_members     enable row level security;
alter table public.invitations        enable row level security;
alter table public.children           enable row level security;
alter table public.roadmap_progress   enable row level security;
alter table public.liked_occupations  enable row level security;
alter table public.myeonddara_sessions enable row level security;


-- ── users ──────────────────────────────────────────────────
-- 본인 프로필만 조회/수정 가능
create policy "users: 본인 조회"
  on public.users for select
  using (auth.uid() = id);

create policy "users: 본인 수정"
  on public.users for update
  using (auth.uid() = id);


-- ── families ───────────────────────────────────────────────
-- 내 가족 그룹만 접근
create policy "families: 구성원만 조회"
  on public.families for select
  using (
    exists (
      select 1 from public.family_members
      where family_members.family_id = families.id
        and family_members.user_id = auth.uid()
        and family_members.status = 'accepted'
    )
  );

create policy "families: 메인 계정만 수정"
  on public.families for update
  using (main_user_id = auth.uid());

create policy "families: 인증된 사용자 생성"
  on public.families for insert
  with check (main_user_id = auth.uid());


-- ── family_members ─────────────────────────────────────────
create policy "family_members: 같은 가족만 조회"
  on public.family_members for select
  using (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = family_members.family_id
        and fm.user_id = auth.uid()
        and fm.status = 'accepted'
    )
  );


-- ── children ───────────────────────────────────────────────
-- 같은 가족 구성원(수락 상태)만 자녀 프로필 조회
create policy "children: 가족 구성원 조회"
  on public.children for select
  using (
    exists (
      select 1 from public.family_members
      where family_members.family_id = children.family_id
        and family_members.user_id = auth.uid()
        and family_members.status = 'accepted'
    )
  );

-- 메인 계정만 자녀 프로필 생성/수정/삭제
create policy "children: 메인 계정 생성"
  on public.children for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.families
      where families.id = children.family_id
        and families.main_user_id = auth.uid()
    )
  );

create policy "children: 메인 계정 수정"
  on public.children for update
  using (
    exists (
      select 1 from public.families
      where families.id = children.family_id
        and families.main_user_id = auth.uid()
    )
  );

create policy "children: 메인 계정 삭제"
  on public.children for delete
  using (
    exists (
      select 1 from public.families
      where families.id = children.family_id
        and families.main_user_id = auth.uid()
    )
  );


-- ── roadmap_progress ───────────────────────────────────────
create policy "roadmap_progress: 가족 구성원 조회"
  on public.roadmap_progress for select
  using (
    exists (
      select 1 from public.children c
      join public.family_members fm on fm.family_id = c.family_id
      where c.id = roadmap_progress.child_id
        and fm.user_id = auth.uid()
        and fm.status = 'accepted'
    )
  );

create policy "roadmap_progress: 메인 계정 관리"
  on public.roadmap_progress for all
  using (
    exists (
      select 1 from public.children c
      join public.families f on f.id = c.family_id
      where c.id = roadmap_progress.child_id
        and f.main_user_id = auth.uid()
    )
  );


-- ── liked_occupations ──────────────────────────────────────
create policy "liked_occupations: 가족 구성원 조회"
  on public.liked_occupations for select
  using (
    exists (
      select 1 from public.children c
      join public.family_members fm on fm.family_id = c.family_id
      where c.id = liked_occupations.child_id
        and fm.user_id = auth.uid()
        and fm.status = 'accepted'
    )
  );

create policy "liked_occupations: 메인 계정 관리"
  on public.liked_occupations for all
  using (
    exists (
      select 1 from public.children c
      join public.families f on f.id = c.family_id
      where c.id = liked_occupations.child_id
        and f.main_user_id = auth.uid()
    )
  );


-- ── myeonddara_sessions ────────────────────────────────────
create policy "myeonddara: 본인만 조회"
  on public.myeonddara_sessions for select
  using (user_id = auth.uid());

create policy "myeonddara: 본인만 생성"
  on public.myeonddara_sessions for insert
  with check (user_id = auth.uid());


-- ============================================================
-- [10] 인덱스 (성능 최적화)
-- ============================================================

create index if not exists idx_family_members_user_id   on public.family_members(user_id);
create index if not exists idx_family_members_family_id on public.family_members(family_id);
create index if not exists idx_children_family_id        on public.children(family_id);
create index if not exists idx_roadmap_progress_child    on public.roadmap_progress(child_id);
create index if not exists idx_liked_occupations_child   on public.liked_occupations(child_id);
create index if not exists idx_myeonddara_user           on public.myeonddara_sessions(user_id);
create index if not exists idx_myeonddara_child          on public.myeonddara_sessions(child_id);


-- ============================================================
-- 완료 메시지
-- ============================================================
do $$
begin
  raise notice '✅ 꿈따라 스키마 생성 완료!';
  raise notice '테이블: users, families, family_members, invitations, children, roadmap_progress, liked_occupations, myeonddara_sessions';
end;
$$;
