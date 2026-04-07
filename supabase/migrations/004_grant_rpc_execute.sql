-- ====================================================
-- 꿈따라 004: RPC 함수 EXECUTE 권한 부여
--
-- [배경]
--   PostgreSQL은 CREATE FUNCTION 시 PUBLIC에 EXECUTE를 기본 부여하나,
--   Supabase PostgREST가 authenticated/anon 롤로 함수를 호출할 때
--   명시적 GRANT가 없으면 권한 거부(42501)가 발생할 수 있다.
--   SQL 에디터(postgres 롤)에서는 성공하지만 프론트에서만 실패하는
--   "유효하지 않은 코드" 오류의 원인이 이것이다.
--
-- [실행 방법]
--   Supabase Dashboard > SQL Editor > 새 쿼리에 붙여넣기 후 실행
-- ====================================================

-- verify_child_invite_code: 학생 초대 코드 검증
-- authenticated 롤(로그인 학생)과 anon 롤(비로그인) 모두 허용
grant execute
  on function public.verify_child_invite_code(text)
  to authenticated, anon;

-- ============================================================
do $$ begin
  raise notice '✅ 004_grant_rpc_execute 완료: verify_child_invite_code EXECUTE 권한 부여';
end; $$;
