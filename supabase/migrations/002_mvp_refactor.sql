-- ====================================================
-- 꿈따라 MVP 스키마 리팩터
-- 파일: supabase/migrations/002_mvp_refactor.sql
-- 기존 family 기반 구조 → parent/child/student 분리 구조
-- 실행 전: 실운영 데이터 없음 확인 완료
-- ====================================================

-- ============================================================
-- [0] 기존 테이블 DROP (역순 — FK 의존성 고려)
-- ============================================================
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;

drop table if exists public.myeonddara_sessions cascade;
drop table if exists public.liked_occupations cascade;
drop table if exists public.roadmap_progress cascade;
drop table if exists public.children cascade;
drop table if exists public.invitations cascade;
drop table if exists public.family_members cascade;
drop table if exists public.families cascade;
drop table if exists public.users cascade;

-- ============================================================
-- [1] 공통 updated_at 트리거 함수
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- [2] parent — 학부모 프로필
-- auth.users 1:1, 결제·자녀 생성·초대의 주체
-- ============================================================
create table public.parent (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null unique references auth.users(id) on delete cascade,
  display_name      text,
  phone_number      text,
  onboarding_status text        not null default 'pending'
                                check (onboarding_status in ('pending', 'child_creation', 'completed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.parent is '학부모 프로필. auth.users 1:1 연결. 결제·자녀 관리의 주체.';

create trigger trg_parent_updated_at
  before update on public.parent
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- [3] child — 자녀 도메인 프로필
-- parent에 귀속. student 계정 없이도 생성 가능.
-- invite_code: 학생이 계정 연결 시 사용 (8자리 대문자)
-- ============================================================
create table public.child (
  id             uuid        primary key default gen_random_uuid(),
  parent_id      uuid        not null references public.parent(id) on delete cascade,
  name           text        not null,
  birth_year     int         check (birth_year between 2005 and 2020),
  school_grade   text        check (school_grade in (
                               'elementary3', 'elementary4', 'elementary5', 'elementary6',
                               'middle1', 'middle2', 'middle3',
                               'high1', 'high2', 'high3'
                             )),
  interests      jsonb       not null default '[]',
  avatar_emoji   text        not null default '🌱',
  profile_status text        not null default 'active'
                             check (profile_status in ('active', 'inactive')),
  invite_code    text        unique default upper(substr(md5(random()::text), 1, 8)),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.child is '자녀 도메인 프로필. parent에 귀속. invite_code로 student 계정과 연결.';

create trigger trg_child_updated_at
  before update on public.child
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- [4] student — 학생 계정 프로필
-- auth.users 1:1, child와 1:1 연결 (child 없이 생성 가능)
-- ============================================================
create table public.student (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null unique references auth.users(id) on delete cascade,
  child_id          uuid        unique references public.child(id) on delete set null,
  nickname          text,
  onboarding_status text        not null default 'pending'
                                check (onboarding_status in ('pending', 'child_linking', 'completed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.student is '학생 계정 프로필. auth.users 1:1. child와 1:1 연결.';

create trigger trg_student_updated_at
  before update on public.student
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- [5] subscription_plan — 구독 플랜 (parent 단위)
-- ============================================================
create table public.subscription_plan (
  id          uuid        primary key default gen_random_uuid(),
  parent_id   uuid        not null unique references public.parent(id) on delete cascade,
  plan_name   text        not null default 'free'
              check (plan_name in ('free', 'basic', 'pro')),
  child_limit int         not null default 1,
  status      text        not null default 'active'
              check (status in ('active', 'expired', 'cancelled')),
  expires_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.subscription_plan is '구독 플랜. parent 단위 관리. 자녀 수 기준 과금 구조.';

create trigger trg_subscription_updated_at
  before update on public.subscription_plan
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- [6] caregiver_invite — 공동양육자 초대 (v1.1 대비 구조 포함)
-- 권한 소유 아님. child별 접근 요청 상태만 관리.
-- ============================================================
create table public.caregiver_invite (
  id             uuid        primary key default gen_random_uuid(),
  parent_id      uuid        not null references public.parent(id) on delete cascade,
  child_id       uuid        not null references public.child(id) on delete cascade,
  invited_email  text,
  invited_phone  text,
  invite_code    text        unique default upper(substr(md5(random()::text), 1, 8)),
  invite_status  text        not null default 'pending'
                             check (invite_status in ('pending', 'accepted', 'rejected', 'expired')),
  accepted_by    uuid        references auth.users(id),
  expires_at     timestamptz default now() + interval '7 days',
  created_at     timestamptz not null default now()
);

comment on table public.caregiver_invite is '공동양육자 초대. 소유권 아님, 특정 child 접근 요청 상태만 표현.';

-- ============================================================
-- [7] roadmap_progress — 직업별 미션 진행 (child 기준)
-- ============================================================
create table public.roadmap_progress (
  id               uuid        primary key default gen_random_uuid(),
  child_id         uuid        not null references public.child(id) on delete cascade,
  occupation_id    text        not null,
  checked_missions jsonb       not null default '{}',
  chosen           boolean     not null default false,
  last_visited_at  timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (child_id, occupation_id)
);

create trigger trg_roadmap_updated_at
  before update on public.roadmap_progress
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- [8] liked_occupations — 좋아요 직업 (child 기준)
-- ============================================================
create table public.liked_occupations (
  id            uuid        primary key default gen_random_uuid(),
  child_id      uuid        not null references public.child(id) on delete cascade,
  occupation_id text        not null,
  liked_at      timestamptz not null default now(),
  unique (child_id, occupation_id)
);

-- ============================================================
-- [9] myeonddara_sessions — 명따라 사주 분석 (parent 기준)
-- ============================================================
create table public.myeonddara_sessions (
  id              uuid        primary key default gen_random_uuid(),
  parent_id       uuid        not null references public.parent(id) on delete cascade,
  child_id        uuid        references public.child(id) on delete set null,
  child_name      text        not null,
  birth_date      date        not null,
  birth_time      text        not null
                  check (birth_time in ('ja','chuk','in','myo','jin','sa','o','mi','sin','yu','sul','hae','unknown')),
  calendar_type   text        not null default '양력'
                  check (calendar_type in ('양력', '음력', '윤달')),
  gender          text        not null check (gender in ('male', 'female')),
  result_snapshot jsonb,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- [10] 회원가입 트리거 — role 기준 parent/student 자동 생성
--
-- 사용법:
--   학부모: signUp({ data: { role: 'parent', display_name: '...' } })
--   학생:   signUp({ data: { role: 'student', nickname: '...' } })
--
-- 트리거 후 처리:
--   학부모: parent + subscription_plan(free) 자동 생성
--   학생:   student 생성 (child_id는 onboarding/student 페이지에서 연결)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role   text;
  v_parent_id uuid;
begin
  v_role := new.raw_user_meta_data->>'role';

  if v_role = 'parent' then
    insert into public.parent (user_id, display_name)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'display_name', '')
    )
    returning id into v_parent_id;

    insert into public.subscription_plan (parent_id, plan_name, child_limit)
    values (v_parent_id, 'free', 1);

  elsif v_role = 'student' then
    insert into public.student (user_id, nickname)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'nickname', '')
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- [11] RPC — invite_code로 child 조회 (비인증 사용자도 가능)
-- onboarding/student 페이지에서 코드 유효성 검증에 사용
-- ============================================================
create or replace function public.verify_child_invite_code(p_code text)
returns table (
  child_id     uuid,
  child_name   text,
  school_grade text
)
language plpgsql security definer set search_path = public as $$
begin
  return query
  select id, name, school_grade
  from public.child
  where upper(invite_code) = upper(p_code)
    and profile_status = 'active';
end;
$$;

-- ============================================================
-- [12] RLS
-- ============================================================
alter table public.parent              enable row level security;
alter table public.child               enable row level security;
alter table public.student             enable row level security;
alter table public.subscription_plan   enable row level security;
alter table public.caregiver_invite    enable row level security;
alter table public.roadmap_progress    enable row level security;
alter table public.liked_occupations   enable row level security;
alter table public.myeonddara_sessions enable row level security;

-- parent: 본인만 조회·수정
create policy "parent: 본인 조회"  on public.parent for select using (user_id = auth.uid());
create policy "parent: 본인 수정"  on public.parent for update using (user_id = auth.uid());

-- child: 해당 parent가 전체 권한
create policy "child: parent 전체 권한" on public.child for all
  using (parent_id in (select id from public.parent where user_id = auth.uid()));

-- child: 연결된 student는 SELECT만
create policy "child: student 조회" on public.child for select
  using (id in (select child_id from public.student where user_id = auth.uid() and child_id is not null));

-- student: 본인만
create policy "student: 본인 조회" on public.student for select using (user_id = auth.uid());
create policy "student: 본인 수정" on public.student for update using (user_id = auth.uid());

-- subscription_plan: 해당 parent만
create policy "subscription: parent 조회" on public.subscription_plan for select
  using (parent_id in (select id from public.parent where user_id = auth.uid()));
create policy "subscription: parent 수정" on public.subscription_plan for update
  using (parent_id in (select id from public.parent where user_id = auth.uid()));

-- caregiver_invite: 해당 parent만
create policy "caregiver_invite: parent 전체 권한" on public.caregiver_invite for all
  using (parent_id in (select id from public.parent where user_id = auth.uid()));

-- roadmap_progress: parent(자녀 소유) + student(해당 child)
create policy "roadmap: parent 전체 권한" on public.roadmap_progress for all
  using (child_id in (
    select c.id from public.child c
    join public.parent p on p.id = c.parent_id
    where p.user_id = auth.uid()
  ));
create policy "roadmap: student 전체 권한" on public.roadmap_progress for all
  using (child_id in (
    select child_id from public.student
    where user_id = auth.uid() and child_id is not null
  ));

-- liked_occupations: 동일 패턴
create policy "liked: parent 전체 권한" on public.liked_occupations for all
  using (child_id in (
    select c.id from public.child c
    join public.parent p on p.id = c.parent_id
    where p.user_id = auth.uid()
  ));
create policy "liked: student 전체 권한" on public.liked_occupations for all
  using (child_id in (
    select child_id from public.student
    where user_id = auth.uid() and child_id is not null
  ));

-- myeonddara: parent만
create policy "myeonddara: parent 전체 권한" on public.myeonddara_sessions for all
  using (parent_id in (select id from public.parent where user_id = auth.uid()));

-- ============================================================
-- [13] 인덱스
-- ============================================================
create index idx_parent_user_id       on public.parent(user_id);
create index idx_child_parent_id      on public.child(parent_id);
create index idx_child_invite_code    on public.child(invite_code);
create index idx_student_user_id      on public.student(user_id);
create index idx_student_child_id     on public.student(child_id);
create index idx_roadmap_child        on public.roadmap_progress(child_id);
create index idx_liked_child          on public.liked_occupations(child_id);
create index idx_myeonddara_parent    on public.myeonddara_sessions(parent_id);

-- ============================================================
do $$ begin
  raise notice '✅ 002_mvp_refactor 완료: parent, child, student, subscription_plan, caregiver_invite';
end; $$;
