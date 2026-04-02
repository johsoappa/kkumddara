-- ====================================================
-- 꿈따라 003: RLS INSERT 정책 + plan_name enum 보정
--
-- [배경]
--   002_mvp_refactor.sql에서 RLS는 활성화했으나
--   INSERT 정책이 없어 아래 케이스에서 저장 실패:
--     1. 회원가입 트리거(handle_new_user)가 security definer로
--        실행되므로 INSERT는 OK이지만,
--     2. 카카오 OAuth 콜백(/auth/callback route)에서
--        anon 세션으로 parent/student INSERT 시 RLS 차단됨
--     3. subscription_plan INSERT도 동일 문제
--
-- [추가 작업]
--   plan_name CHECK 제약: 'free'|'basic'|'pro' → 확정 요금제로 교체
--   TypeScript PlanName 타입과 동기화 (PR: refactor plan_name)
--
-- [실행 방법]
--   Supabase Dashboard > SQL Editor > 새 쿼리에 붙여넣기 후 실행
-- ====================================================

-- ============================================================
-- [1] INSERT 정책 추가
--     본인(auth.uid())이 직접 자신의 레코드를 생성할 수 있도록 허용
-- ============================================================

-- parent: 본인 레코드 생성 (OAuth 콜백 + 이메일 가입 트리거 보완)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'parent' and policyname = 'parent: 본인 생성'
  ) then
    execute $policy$
      create policy "parent: 본인 생성" on public.parent for insert
        with check (user_id = auth.uid())
    $policy$;
  end if;
end; $$;

-- student: 본인 레코드 생성
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'student' and policyname = 'student: 본인 생성'
  ) then
    execute $policy$
      create policy "student: 본인 생성" on public.student for insert
        with check (user_id = auth.uid())
    $policy$;
  end if;
end; $$;

-- subscription_plan: 자신의 parent 하위에만 생성
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'subscription_plan' and policyname = 'subscription: parent 생성'
  ) then
    execute $policy$
      create policy "subscription: parent 생성" on public.subscription_plan for insert
        with check (
          parent_id in (select id from public.parent where user_id = auth.uid())
        )
    $policy$;
  end if;
end; $$;

-- child: parent가 자녀 생성 (이미 002에 all 정책 있으나 명시적 INSERT도 추가)
-- 002의 "child: parent 전체 권한" FOR ALL이 INSERT를 커버하므로 생략

-- ============================================================
-- [2] plan_name CHECK 제약 보정
--     'free'|'basic'|'pro' → 실제 요금제 기준으로 교체
--     TypeScript PlanName: "basic"|"premium"|"family"|"family_plus"
-- ============================================================

-- 기존 CHECK 제약 제거 후 재설정
alter table public.subscription_plan
  drop constraint if exists subscription_plan_plan_name_check;

alter table public.subscription_plan
  add constraint subscription_plan_plan_name_check
  check (plan_name in ('basic', 'premium', 'family', 'family_plus'));

-- 기존 'free'/'pro' 데이터 → 'basic' 으로 정규화
update public.subscription_plan
  set plan_name = 'basic'
  where plan_name in ('free', 'pro');

-- ============================================================
-- [3] handle_new_user 트리거 업데이트
--     plan_name 기본값: 'free' → 'basic'
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role      text;
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

    -- plan_name 기본값 'basic' (구 'free' 대체)
    insert into public.subscription_plan (parent_id, plan_name, child_limit)
    values (v_parent_id, 'basic', 1);

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

-- ============================================================
-- [4] 현재 정책 확인용 조회 (실행 후 결과 확인)
-- ============================================================
select
  tablename,
  policyname,
  cmd,
  permissive
from pg_policies
where tablename in ('parent', 'child', 'student', 'subscription_plan', 'caregiver_invite',
                    'roadmap_progress', 'liked_occupations', 'myeonddara_sessions')
order by tablename, cmd;

-- ============================================================
do $$ begin
  raise notice '✅ 003_rls_insert_policies 완료: INSERT 정책 + plan_name enum 보정';
end; $$;
