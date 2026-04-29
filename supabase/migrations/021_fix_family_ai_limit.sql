-- ====================================================
-- 021_fix_family_ai_limit.sql
-- family 플랜 AI 상담 한도 보정 (60 → 120)
--
-- [배경]
--   현재 ai_consult_usage는 parent_id + used_month 기준 가구 단위 집계.
--   family 플랜은 자녀 2명 기준이므로 "자녀당 월 60회"를
--   가구 월 120회 (2명 × 60회) 로 환산해 적용한다.
--   018_update_ai_limits.sql에서 family = 60으로 설정된 값을 보정.
--
-- [영향 범위]
--   - plan_name = 'family' AND ai_consult_monthly_limit = 60 인 row만 보정
--   - family_plus (200) 영향 없음
--   - basic(30) / premium(100) / free(3) 영향 없음
--   - child_limit 변경 없음
--   - ai_consult_usage 구조 변경 없음
--   - RLS / auth / 결제 / AI 기능 변경 없음
--
-- [idempotent]
--   WHERE ai_consult_monthly_limit = 60 조건으로
--   이미 120인 row는 재실행해도 영향 없음.
--   현재 운영 DB에 family row가 없어도 정상 실행됨 (0건 UPDATE).
-- ====================================================

-- ============================================================
-- [1] 사전 진단
-- ============================================================
do $$
declare
  v_row record;
begin
  raise notice '── 021 사전 진단 ──────────────────────────────';
  for v_row in
    select
      plan_name,
      ai_consult_monthly_limit,
      child_limit,
      status,
      count(*) as cnt
    from public.subscription_plan
    where plan_name in ('family', 'family_plus')
    group by plan_name, ai_consult_monthly_limit, child_limit, status
    order by plan_name, status
  loop
    raise notice 'plan=% | ai_limit=% | child_limit=% | status=% | rows=%',
      v_row.plan_name, v_row.ai_consult_monthly_limit,
      v_row.child_limit, v_row.status, v_row.cnt;
  end loop;
end;
$$;

-- ============================================================
-- [2] family ai_consult_monthly_limit 60 → 120 보정
--     family_plus / 다른 플랜 영향 없음
--     child_limit 변경 없음
-- ============================================================
update public.subscription_plan
set
  ai_consult_monthly_limit = 120,
  updated_at               = now()
where plan_name              = 'family'
  and ai_consult_monthly_limit = 60;

-- ============================================================
-- 완료
-- ============================================================
do $$ begin
  raise notice '✅ 021_fix_family_ai_limit 완료';
  raise notice '   family ai_consult_monthly_limit: 60 → 120 (가구 월 120회)';
  raise notice '   family_plus ai_consult_monthly_limit: 200 유지';
  raise notice '   child_limit 변경 없음';
  raise notice '   운영 DB family row 없는 경우: 0건 UPDATE (정상)';
end; $$;
