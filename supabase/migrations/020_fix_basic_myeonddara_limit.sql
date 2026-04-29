-- ====================================================
-- 020_fix_basic_myeonddara_limit.sql
-- basic 플랜 myeonddara_yearly_limit 보정 이력
--
-- [배경]
--   008_update_myeonddara.sql에서 basic myeonddara_yearly_limit = 3으로
--   설정하는 UPDATE가 포함되어 있었으나, 일부 기존 row (myeonddara_yearly_limit = 0)에
--   반영되지 않은 상태로 운영 DB에 잔존하고 있었다.
--
-- [운영 DB 보정 내역]
--   보정 전: basic active row 중 myeonddara_yearly_limit = 0 이 2건 존재
--   보정 후: basic active row 3건 모두 myeonddara_yearly_limit = 3 으로 통일
--
--   운영 DB에는 아래 SQL을 수동으로 직접 실행하여 이미 보정 완료됨.
--   이 migration은 신규 환경 / 로컬 DB / 재구성 환경에서
--   동일 보정이 누락되지 않도록 이력을 남기는 목적으로 작성한다.
--
-- [영향 범위]
--   - plan_name = 'basic', status = 'active', myeonddara_yearly_limit = 0 인 row만 보정
--   - 다른 플랜(free, family, family_plus, premium) 영향 없음
--   - inactive row 영향 없음
--   - family child_limit 수정 없음 (008에서 이미 2로 보정 완료)
--   - RLS, auth, 결제, AI 기능 변경 없음
--
-- [idempotent]
--   운영 DB 기준으로 재실행 시 영향 row = 0건 (WHERE 조건 myeonddara_yearly_limit = 0 불충족)
--   신규 환경에서는 해당 row가 있을 경우에만 보정됨
-- ====================================================

-- ============================================================
-- [1] 사전 진단
-- ============================================================
do $$
declare
  v_row record;
begin
  raise notice '── 020 사전 진단 ──────────────────────────────';
  for v_row in
    select
      plan_name,
      status,
      myeonddara_yearly_limit,
      count(*) as cnt
    from public.subscription_plan
    where plan_name = 'basic'
    group by plan_name, status, myeonddara_yearly_limit
    order by status, myeonddara_yearly_limit
  loop
    raise notice 'plan=% | status=% | myeonddara_yearly_limit=% | rows=%',
      v_row.plan_name, v_row.status, v_row.myeonddara_yearly_limit, v_row.cnt;
  end loop;
end;
$$;

-- ============================================================
-- [2] basic active row 중 myeonddara_yearly_limit = 0 보정
-- ============================================================
update public.subscription_plan
set
  myeonddara_yearly_limit = 3,
  updated_at              = now()
where plan_name              = 'basic'
  and status                 = 'active'
  and myeonddara_yearly_limit = 0;

-- ============================================================
-- 완료
-- ============================================================
do $$ begin
  raise notice '✅ 020_fix_basic_myeonddara_limit 완료';
  raise notice '   basic active myeonddara_yearly_limit = 0 → 3 보정';
  raise notice '   운영 DB 기준 재실행 시 영향 row = 0건 (idempotent)';
  raise notice '   family child_limit 변경 없음 (008에서 2로 보정 완료)';
end; $$;
