-- ====================================================
-- 022_add_occupation_goyo24_profile.sql
-- 고용24 직업정보 프로필 테이블 신규 생성
--
-- [목적]
--   고용24 직업정보 D01 API에서 수집한 임금/만족도/전망/관련학과를
--   occupation_master와 1:1로 저장하는 단순 프로필 테이블.
--   버전 관리 없음 — 배치 동기화 시 upsert로 최신값 유지.
--
-- [연결]
--   occupation_master(id) → occupation_goyo24_profile(occupation_id)
--   1 master : 0-or-1 profile (UNIQUE occupation_id)
--
-- [RLS]
--   - SELECT: 공개 (로그인 불필요 — 직업 상세 참고 정보)
--   - INSERT/UPDATE/DELETE: service_role 또는 admin 클레임만
--
-- [주의]
--   - goyo24_occ_code nullable: 매핑 실패 직업은 row 미생성 또는 null
--   - 인증키 컬럼 없음 — 스크립트/환경변수에서만 관리
--   - 기존 migration(001~021) 영향 없음
-- ====================================================

-- ============================================================
-- [1] occupation_goyo24_profile 테이블 생성
-- ============================================================
create table if not exists public.occupation_goyo24_profile (
  id                 uuid           primary key default gen_random_uuid(),

  -- occupation_master 참조 (1:1 고유)
  occupation_id      uuid           not null unique
                     references public.occupation_master(id) on delete cascade,

  -- 고용24 직업 코드 (K-prefix, 예: K000001176)
  goyo24_occ_code    text,

  -- 고용24 직업명 (D01 jobSmclNm)
  goyo24_job_name    text,

  -- 임금 원문 (예: "조사년도:2023년, 임금 하위(25%) 5000만원, ...")
  salary_raw         text,
  -- 파싱된 임금 (단위: 만원)
  salary_lower       integer,       -- 하위 25%
  salary_median      integer,       -- 중위 50%
  salary_upper       integer,       -- 상위 25%
  salary_survey_year integer,       -- 조사년도

  -- 직업만족도 (0~100 실수, 예: 72.7)
  job_satisfaction   numeric(4,1),

  -- 고용 전망 원문 (D01 jobProspect 요약 텍스트)
  prospect_raw       text,
  -- 전망 레이블: 증가/다소 증가/유지/다소 감소/감소 중 하나 (또는 null)
  prospect_label     text,

  -- 관련 학과 (D01 relMajorList.majorNm 최대 10개)
  related_majors     text[]         not null default '{}',

  -- 메타
  source             text           not null default 'goyo24',
  synced_at          timestamptz    not null default now(),
  created_at         timestamptz    not null default now(),
  updated_at         timestamptz    not null default now()
);

comment on table  public.occupation_goyo24_profile is
  '고용24 직업정보 D01 API 기반 프로필. occupation_master와 1:1. 배치 upsert로 갱신.';
comment on column public.occupation_goyo24_profile.goyo24_occ_code is
  '고용24 K-prefix 직업코드 (예: K000001176). 매핑 실패 시 null.';
comment on column public.occupation_goyo24_profile.salary_lower is
  '하위 25% 임금 (단위: 만원). salary_raw 파싱값.';
comment on column public.occupation_goyo24_profile.salary_median is
  '중위 50% 임금 (단위: 만원). UI 표시 기준값.';
comment on column public.occupation_goyo24_profile.salary_upper is
  '상위 25% 임금 (단위: 만원). salary_raw 파싱값.';
comment on column public.occupation_goyo24_profile.prospect_label is
  '"증가", "다소 증가", "유지", "다소 감소", "감소" 중 하나. 추출 불명확 시 null.';
comment on column public.occupation_goyo24_profile.related_majors is
  'D01 relMajorList.majorNm 배열. 최대 10개 저장, UI는 최대 5개 표시.';


-- ============================================================
-- [2] 인덱스
-- ============================================================
create index if not exists idx_ogp_occupation_id
  on public.occupation_goyo24_profile(occupation_id);

create index if not exists idx_ogp_goyo24_occ_code
  on public.occupation_goyo24_profile(goyo24_occ_code)
  where goyo24_occ_code is not null;

create index if not exists idx_ogp_synced_at
  on public.occupation_goyo24_profile(synced_at desc);


-- ============================================================
-- [3] updated_at 자동 갱신 트리거
--     (public.set_updated_at은 015 migration에서 이미 정의됨)
-- ============================================================
create or replace trigger trg_ogp_updated_at
  before update on public.occupation_goyo24_profile
  for each row execute procedure public.set_updated_at();


-- ============================================================
-- [4] RLS
--   - 읽기: 공개 (직업 상세 참고 정보, 로그인 불필요)
--   - 쓰기: service_role 또는 app_metadata.role=admin 보유자만
--
--   occupation_master의 "om: 공개 조회 (활성 직업)" 정책과 동일한
--   공개 읽기 방침을 따름.
--   occupation_goyo24_profile은 is_active 조건 미포함 —
--   배치 upsert 대상 직업은 이미 occupation_master에서 활성 여부 관리.
-- ============================================================
alter table public.occupation_goyo24_profile enable row level security;

drop policy if exists "ogp: 공개 조회" on public.occupation_goyo24_profile;
drop policy if exists "ogp: 관리자 수정" on public.occupation_goyo24_profile;

-- SELECT: 누구나 읽기 가능 (직업 상세 공개 참고 정보)
create policy "ogp: 공개 조회"
  on public.occupation_goyo24_profile for select
  using (true);

-- INSERT / UPDATE / DELETE: 관리자 또는 service_role만
create policy "ogp: 관리자 수정"
  on public.occupation_goyo24_profile for all
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================================
-- [5] 완료 확인
-- ============================================================
do $$ begin
  raise notice '';
  raise notice '✅ 022: occupation_goyo24_profile 테이블 생성 완료';
  raise notice '';
  raise notice '  테이블: occupation_goyo24_profile';
  raise notice '  주요 컬럼: goyo24_occ_code, salary_*, job_satisfaction, prospect_*, related_majors';
  raise notice '  RLS: SELECT 공개 / INSERT·UPDATE·DELETE 관리자 전용';
  raise notice '  트리거: updated_at 자동 갱신';
  raise notice '';
  raise notice '  다음 단계:';
  raise notice '    1. Supabase SQL Editor에서 이 파일 실행';
  raise notice '    2. SUPABASE_SERVICE_ROLE_KEY 환경변수 등록 (배치 스크립트 전용)';
  raise notice '    3. scripts/sync_goyo24_occupations.ts 실행 (dry-run 먼저)';
  raise notice '';
end $$;
