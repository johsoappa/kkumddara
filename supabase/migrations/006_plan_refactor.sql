-- ====================================================
-- 006_plan_refactor.sql
-- subscription_plan 체계 정비
--
-- [C-0] plan_name 체계 정리
--   - 기존: free / basic / pro
--   - 신규: free / basic / family / premium
--   - pro → premium 매핑 (혜택 하향 금지 원칙)
--   - family_plus → family 매핑 (혹시 있을 경우)
--   - check constraint 교체
--
-- [C-1] 컬럼 추가
--   - ai_consult_monthly_limit  int  (월 AI 상담 횟수 한도)
--   - myeonddara_yearly_limit   int  (연 명따라 분석 횟수 한도)
--   - max_guardians             int  (공동양육자 최대 수)
--   - roadmap_full_access       bool (로드맵 전체 공개 여부)
--   - child_limit 컬럼은 기존 유지 (max_children 별도 생성 안 함)
--
-- [C-2] 기존 row 기본값 설정
--   plan_name 기준으로 신규 컬럼 초기값 일괄 UPDATE
--
-- 플랜별 entitlement 기준값:
--   free    : ai=0,  myeonddara=0,  guardians=0, roadmap=false, child=1
--   basic   : ai=3,  myeonddara=0,  guardians=0, roadmap=true,  child=1
--   premium : ai=20, myeonddara=12, guardians=1, roadmap=true,  child=1
--   family  : ai=10, myeonddara=6,  guardians=1, roadmap=true,  child=3
--
-- 주의:
--   - 실운영 데이터 유무 관계없이 안전하게 동작하도록 설계
--   - 기존 사용자 혜택 하향 금지 원칙 적용
--   - 실행 전 Supabase SQL Editor에서 현재 데이터 확인 권장:
--     SELECT plan_name, COUNT(*) FROM subscription_plan GROUP BY plan_name;
-- ====================================================

-- ============================================================
-- [C-0-1] 진단용: 현재 plan_name 분포 확인 (실행 결과 로그에 남김)
-- ============================================================
do $$
declare
  v_pro_count    int;
  v_plus_count   int;
  v_total        int;
begin
  select count(*) into v_pro_count  from public.subscription_plan where plan_name = 'pro';
  select count(*) into v_plus_count from public.subscription_plan where plan_name = 'family_plus';
  select count(*) into v_total      from public.subscription_plan;

  raise notice '── 006 사전 진단 ──────────────────────────────';
  raise notice '전체 subscription_plan 행 수: %', v_total;
  raise notice 'pro 사용 row 수: %', v_pro_count;
  raise notice 'family_plus 사용 row 수: %', v_plus_count;

  if v_pro_count > 0 then
    raise notice '→ pro 행 발견: premium으로 매핑 진행';
  else
    raise notice '→ pro 행 없음: constraint 교체만 수행';
  end if;
end;
$$;

-- ============================================================
-- [C-0-2] 기존 check constraint 제거
-- ============================================================
alter table public.subscription_plan
  drop constraint if exists subscription_plan_plan_name_check;

-- ============================================================
-- [C-0-3] 데이터 마이그레이션 (혜택 하향 금지)
--   pro → premium  (기존 pro는 유료 플랜 → premium으로 상향 동등 매핑)
--   family_plus → family  (혹시 남아있을 경우 대비)
-- ============================================================
update public.subscription_plan
  set plan_name = 'premium'
  where plan_name = 'pro';

update public.subscription_plan
  set plan_name = 'family'
  where plan_name = 'family_plus';

-- ============================================================
-- [C-0-4] 신규 check constraint 추가 (free/basic/family/premium 4종)
-- ============================================================
alter table public.subscription_plan
  add constraint subscription_plan_plan_name_check
    check (plan_name in ('free', 'basic', 'family', 'premium'));

-- ============================================================
-- [C-1] 신규 컬럼 추가 (if not exists — 재실행 안전)
-- ============================================================
alter table public.subscription_plan
  add column if not exists ai_consult_monthly_limit  int not null default 0,
  add column if not exists myeonddara_yearly_limit    int not null default 0,
  add column if not exists max_guardians              int not null default 0,
  add column if not exists roadmap_full_access        boolean not null default false;

comment on column public.subscription_plan.ai_consult_monthly_limit is '월별 AI 진로 상담 횟수 한도. 0=무제한 아님, 0=미제공.';
comment on column public.subscription_plan.myeonddara_yearly_limit  is '연간 명따라 사주 분석 횟수 한도. 0=미제공.';
comment on column public.subscription_plan.max_guardians             is '공동양육자(caregiver) 최대 초대 수.';
comment on column public.subscription_plan.roadmap_full_access       is 'true: 로드맵 전 단계 열람 가능. false: current 단계만.';

-- ============================================================
-- [C-2] 기존 row 엔타이틀먼트 기준값 UPDATE
--   신규 컬럼 기본값(0/false)이 이미 들어간 상태에서
--   plan_name별로 올바른 값으로 정정
-- ============================================================

-- free: 기능 미제공
update public.subscription_plan set
  ai_consult_monthly_limit  = 0,
  myeonddara_yearly_limit   = 0,
  max_guardians             = 0,
  roadmap_full_access       = false,
  child_limit               = 1
where plan_name = 'free';

-- basic: AI 상담 월 3회, 로드맵 전체 공개
update public.subscription_plan set
  ai_consult_monthly_limit  = 3,
  myeonddara_yearly_limit   = 0,
  max_guardians             = 0,
  roadmap_full_access       = true,
  child_limit               = 1
where plan_name = 'basic';

-- premium: 단일 자녀 + 전체 기능 (AI 20회/월, 명따라 12회/년)
update public.subscription_plan set
  ai_consult_monthly_limit  = 20,
  myeonddara_yearly_limit   = 12,
  max_guardians             = 1,
  roadmap_full_access       = true,
  child_limit               = 1
where plan_name = 'premium';

-- family: 자녀 3명 + AI 10회/월, 명따라 6회/년
update public.subscription_plan set
  ai_consult_monthly_limit  = 10,
  myeonddara_yearly_limit   = 6,
  max_guardians             = 1,
  roadmap_full_access       = true,
  child_limit               = 3
where plan_name = 'family';

-- ============================================================
-- 완료 알림
-- ============================================================
do $$ begin
  raise notice '✅ 006_plan_refactor 완료';
  raise notice '  - plan_name 체계: free / basic / family / premium';
  raise notice '  - 신규 컬럼: ai_consult_monthly_limit, myeonddara_yearly_limit, max_guardians, roadmap_full_access';
  raise notice '  - 기존 데이터 엔타이틀먼트 초기값 설정 완료';
end; $$;
