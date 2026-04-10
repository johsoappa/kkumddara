-- ====================================================
-- 008_update_myeonddara.sql
-- 명따라 횟수 기준 변경 + 사용량 추적 테이블 신설
--
-- [변경 목적]
--   기존: 아이당 연 1회 (premium=12, family=6, basic=0)
--   변경: 아이당 연 3회 기준으로 통일
--
-- [확정 기준값]
--   free:    myeonddara_yearly_limit = 0  (명따라 미제공)
--   basic:   myeonddara_yearly_limit = 3  (아이 1명 × 3회, 9,900원)
--   family:  myeonddara_yearly_limit = 6  (아이 2명 × 3회, 14,900원)
--   premium: myeonddara_yearly_limit = 9  (아이 3명 × 3회, 19,900원)
--
-- [child_limit 함께 정비]
--   family:  child_limit 3 → 2 (확정 요금제 기준)
--   premium: child_limit 1 → 3 (확정 요금제 기준)
--
-- [신설 테이블]
--   myeonddara_usage: 연간 사용량 추적 (used_year INT 기준)
-- ====================================================

-- ============================================================
-- [1] 진단 (실행 전 현재 상태 확인)
-- ============================================================
do $$
declare
  v_row record;
begin
  raise notice '── 008 사전 진단 ──────────────────────────────';
  for v_row in
    select plan_name, myeonddara_yearly_limit, child_limit, count(*) as cnt
    from public.subscription_plan
    group by plan_name, myeonddara_yearly_limit, child_limit
    order by plan_name
  loop
    raise notice 'plan=% | myeonddara_yearly_limit=% | child_limit=% | rows=%',
      v_row.plan_name, v_row.myeonddara_yearly_limit, v_row.child_limit, v_row.cnt;
  end loop;
end;
$$;

-- ============================================================
-- [2] myeonddara_yearly_limit + child_limit CASE UPDATE
--     plan_name 기준으로 한 번에 처리 (안전한 UPDATE 방식)
-- ============================================================
update public.subscription_plan
set
  myeonddara_yearly_limit = case plan_name
    when 'free'    then 0
    when 'basic'   then 3
    when 'family'  then 6
    when 'premium' then 9
    else myeonddara_yearly_limit  -- 미지 plan_name은 그대로 유지
  end,
  child_limit = case plan_name
    when 'family'  then 2   -- 확정: 아이 2명
    when 'premium' then 3   -- 확정: 아이 3명
    else child_limit        -- free(1), basic(1) 그대로
  end
where plan_name in ('free', 'basic', 'family', 'premium');

-- ============================================================
-- [3] myeonddara_usage — 연간 사용량 추적 테이블
--     ai_consult_usage 패턴 동일 적용 (used_month → used_year)
-- ============================================================
create table if not exists public.myeonddara_usage (
  id         uuid        primary key default gen_random_uuid(),
  parent_id  uuid        not null references public.parent(id) on delete cascade,
  used_year  int         not null          -- YYYY 형식 (예: 2026)
                         check (used_year between 2020 and 2100),
  count      int         not null default 0
                         check (count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_id, used_year)
);

comment on table public.myeonddara_usage is
  '명따라 연간 사용량. parent_id + used_year 기준 unique. 무료 플랜은 count 집계 없이 차단.';
comment on column public.myeonddara_usage.used_year is
  'YYYY 형식 연도. 예: 2026. subscription_plan.myeonddara_yearly_limit과 비교.';

create trigger trg_myeonddara_usage_updated_at
  before update on public.myeonddara_usage
  for each row execute procedure public.set_updated_at();

create index if not exists idx_myeonddara_usage_parent_year
  on public.myeonddara_usage(parent_id, used_year);

-- ============================================================
-- [4] RLS
-- ============================================================
alter table public.myeonddara_usage enable row level security;

create policy "myeonddara_usage: parent 전체 권한"
  on public.myeonddara_usage for all
  using (parent_id in (
    select id from public.parent where user_id = auth.uid()
  ));

-- ============================================================
-- 완료
-- ============================================================
do $$ begin
  raise notice '✅ 008_update_myeonddara 완료';
  raise notice '  - myeonddara_yearly_limit: free=0, basic=3, family=6, premium=9';
  raise notice '  - child_limit: family=2, premium=3';
  raise notice '  - 신설 테이블: myeonddara_usage (used_year INT 기준)';
end; $$;
