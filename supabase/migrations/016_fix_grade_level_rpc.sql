-- ====================================================
-- 016_fix_grade_level_rpc.sql
-- verify_child_invite_code RPC에 grade_level 컬럼 추가
--
-- 문제:
--   기존 RPC는 school_grade(초3~고3)만 반환.
--   초1~초2 자녀는 school_grade=null → 초대코드 연결 미리보기 카드에
--   학년이 빈칸으로 표시되는 버그.
--
-- 수정:
--   grade_level(elem_1~high_3) 컬럼을 함께 반환.
--   클라이언트에서 grade_level 우선 → school_grade fallback으로 표시.
--
-- 주의:
--   이 함수는 security definer이며 authenticated/anon 롤에
--   EXECUTE 권한이 부여되어 있다 (004_grant_rpc_execute.sql).
--   함수 시그니처(반환 타입) 변경 시 GRANT는 자동 유지되지 않으므로
--   아래 GRANT 구문을 함께 실행한다.
-- ====================================================

create or replace function public.verify_child_invite_code(p_code text)
returns table (
  child_id     uuid,
  child_name   text,
  school_grade text,
  grade_level  text
)
language plpgsql security definer set search_path = public as $$
begin
  return query
  select
    c.id,
    c.name,
    c.school_grade,
    c.grade_level
  from public.child c
  where upper(c.invite_code) = upper(p_code);
end;
$$;

-- 반환 타입 변경 후 GRANT 재부여 (기존 004 유지)
grant execute
  on function public.verify_child_invite_code(text)
  to authenticated, anon;

do $$ begin
  raise notice '✅ 016_fix_grade_level_rpc 완료: verify_child_invite_code에 grade_level 반환 추가';
end; $$;
