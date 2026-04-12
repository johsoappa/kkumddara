-- ====================================================
-- 013_fix_myeonddara_usage_rls.sql
-- myeonddara_usage RLS 정책 명시적 보강
--
-- [배경]
--   008에서 "for all + using" 정책이 설정되었으나
--   INSERT의 경우 with check 절이 명시되어야 확실한 허용이 됨.
--   PostgREST에서 anon key + RLS 환경에서 INSERT 실패 방어.
--
-- [변경]
--   1. 기존 "for all" 정책 → SELECT/UPDATE/DELETE 전용으로 교체
--   2. INSERT 전용 정책 (with check) 명시적 추가
--   3. UPDATE 전용 정책도 분리 (명시적 보장)
--
-- [참고]
--   route.ts에서 upsert → select/update/insert 2단계로 변경 (013 이전)
--   따라서 partial index 충돌은 이미 우회된 상태.
--   이 migration은 RLS 측의 방어적 보강.
-- ====================================================

-- ============================================================
-- [1] 기존 "for all" 정책 제거 후 분리된 정책으로 교체
-- ============================================================

-- 기존 통합 정책 제거
drop policy if exists "myeonddara_usage: parent 전체 권한" on public.myeonddara_usage;

-- SELECT: 본인 parent_id 행만 조회 가능
create policy "myeonddara_usage: parent 조회"
  on public.myeonddara_usage for select
  using (
    parent_id in (
      select id from public.parent where user_id = auth.uid()
    )
  );

-- INSERT: 본인 parent_id로만 삽입 가능
create policy "myeonddara_usage: parent 삽입"
  on public.myeonddara_usage for insert
  with check (
    parent_id in (
      select id from public.parent where user_id = auth.uid()
    )
  );

-- UPDATE: 본인 parent_id 행만 수정 가능
create policy "myeonddara_usage: parent 수정"
  on public.myeonddara_usage for update
  using (
    parent_id in (
      select id from public.parent where user_id = auth.uid()
    )
  )
  with check (
    parent_id in (
      select id from public.parent where user_id = auth.uid()
    )
  );

-- ============================================================
-- [2] 현재 정책 확인용 조회
-- ============================================================
select
  policyname,
  cmd,
  permissive,
  roles,
  qual
from pg_policies
where tablename = 'myeonddara_usage'
order by cmd;

-- ============================================================
do $$ begin
  raise notice '✅ 013: myeonddara_usage RLS 정책 분리 완료';
  raise notice '   - SELECT / INSERT / UPDATE 개별 정책으로 교체';
  raise notice '   - INSERT with check 명시 추가';
end; $$;
