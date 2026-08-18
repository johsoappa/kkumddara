-- ====================================================
-- 058_admin_access_control.sql
-- 관리자/운영자 권한 원천 기반 마련 (admin_users 테이블 + is_admin() 통일)
--
-- [배경]
--   G1.9-A1 정적 감사에서 확인된 P0/P1:
--     - admin_users 테이블·requireAdmin()/requireOperator() 전무
--     - 기존 public.is_admin()이 app_metadata.role='admin' 클레임에 의존
--       (015_occupation_master_v2.sql / 015_occupation_master_bootstrap.sql)
--   설계 근거: docs/admin-access-control-design.md (B안 — 별도 admin_users 테이블)
--
-- [이번 migration이 하는 일]
--   1. public.admin_users 테이블 생성 + RLS(본인 행 SELECT만)
--   2. public.is_admin()을 admin_users 기반으로 재정의
--      (app_metadata / user_metadata 참조 완전 제거, service_role 분기는 유지)
--
-- [이번 migration이 하지 않는 일]
--   - 015/022 migration 파일 수정 — is_admin()을 호출하는 기존 정책은
--     함수 재정의만으로 자동 반영되므로 정책 자체는 손대지 않는다.
--   - 최초 관리자 계정 INSERT, seed, RPC, 트리거 — 전부 생성하지 않는다.
--   - admin_users에 대한 INSERT/UPDATE/DELETE 정책 — 의도적으로 만들지 않는다.
--     (부여/회수는 Supabase SQL Editor에서 service_role로만 수행)
--
-- [실행 환경]
--   Claude Code는 이 migration을 QA/PROD Supabase에 직접 적용(Apply)하지 않는다.
--   OZ가 별도 GOAL에서 Supabase CLI 또는 SQL Editor로 직접 실행한다.
-- ====================================================


-- ============================================================
-- [1] admin_users — 관리자/운영자 권한 원천 (단일 테이블)
-- ============================================================
create table if not exists public.admin_users (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null unique references auth.users(id) on delete cascade,
  role        text        not null check (role in ('operator', 'admin')),
  is_active   boolean     not null default true,
  memo        text,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id)
);

comment on table public.admin_users is
  '관리자/운영자 권한 원천 (단일 테이블). user_metadata/app_metadata의 role은 참조하지 않는다. '
  'INSERT/UPDATE/DELETE 클라이언트 정책 없음 — 권한 부여/회수는 Supabase SQL Editor(service_role)에서만 수행.';

comment on column public.admin_users.role is
  'operator 또는 admin만 허용 (CHECK 제약). super_admin 등 추가 등급은 이번 단계에서 도입하지 않는다.';

comment on column public.admin_users.is_active is
  'false면 role 값과 무관하게 모든 requireOperator()/requireAdmin() 판정에서 미부여로 취급한다.';

-- 권한 판정 조회 패턴(user_id + is_active=true)에 맞춘 부분 인덱스
create index if not exists admin_users_active_idx
  on public.admin_users (user_id)
  where is_active = true;


-- ============================================================
-- [2] RLS — 본인 행 SELECT만 허용
-- ============================================================
alter table public.admin_users enable row level security;

drop policy if exists "admin_users_select_self" on public.admin_users;

create policy "admin_users_select_self"
  on public.admin_users for select
  using (auth.uid() = user_id);

-- INSERT / UPDATE / DELETE 정책은 의도적으로 생성하지 않는다.
-- → anon/authenticated 세션으로는 admin_users 행을 생성·수정·삭제할 방법이
--   애플리케이션 코드 어디에도 존재하지 않는다 (오부여 구조적 차단).


-- ============================================================
-- [3] is_admin() 권한 원천 통일 — app_metadata/user_metadata 참조 제거
-- ============================================================
-- [변경 전] service_role 키 또는 app_metadata.role='admin' 클레임 시 true
--           (015_occupation_master_v2.sql / 015_occupation_master_bootstrap.sql 원본)
-- [변경 후] service_role 키 또는 admin_users(role='admin', is_active=true) 보유 시 true
--
-- occupation_master 계열 기존 admin write 정책(예: "om: 관리자 수정" 등)은
-- public.is_admin() 호출만 하고 있으므로, 정책 본문을 손대지 않아도
-- 이 함수 재정의만으로 권한 원천이 자동으로 admin_users 기준으로 바뀐다.
--
-- security definer + 고정 search_path: 호출부(RLS 정책)의 search_path에
-- 영향받지 않도록 하고, 함수 본문에서 스키마를 전부 명시(public.admin_users)해
-- search_path 하이재킹을 차단한다. security definer로 실행되므로 테이블 소유자
-- 권한으로 admin_users를 조회하며, 이는 자기 자신을 호출하는 재귀가 아니라
-- 별도 테이블(admin_users)에 대한 단순 EXISTS 조회다.
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.admin_users au
      where au.user_id = auth.uid()
        and au.role = 'admin'
        and au.is_active = true
    )
$$;

comment on function public.is_admin is
  'service_role 키 또는 public.admin_users(role=admin, is_active=true) 보유 시 true. '
  'app_metadata/user_metadata는 참조하지 않는다 (058 migration 기준, G1.9-A2).';
