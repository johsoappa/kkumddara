-- ====================================================
-- 015_occupation_master_v2.sql  (rev 6 — 단독 실행 가능)
-- 고용24 API 기반 직업 마스터 데이터 스키마
--
-- [rev 6 변경 사항]
--   rev 5 → rev 6: v_next_version / v_draft_cnt EXECUTE INTO 버그 수정
--   - 문제: EXECUTE format(…) INTO var 패턴에서 format()이 여러 줄로
--           분리될 때 파서가 INTO var를 relation 참조로 오해 → 42P01
--   - 수정: format() 결과를 v_sql text 변수에 먼저 대입,
--           EXECUTE v_sql INTO var USING … 을 한 줄로 명확화
--   - 적용: fn_deactivate_latest_content (v_next_version)
--           fn_publish_content_version   (v_draft_cnt)
--   - 추가: CREATE UNIQUE INDEX → IF NOT EXISTS (재실행 안전)
--           CREATE POLICY → DROP IF EXISTS 선행 (재실행 안전)
--
-- [rev 5 변경 사항 유지]
--   - public.occupations (014) 의존 완전 제거
--   - legacy_occupation_id: FK → 순수 text (독립 참조)
--   - set_updated_at(): 조건부 내장 (미설치 환경 호환)
--   - 이 파일 하나만 실행해도 동작하는 완전 독립형 스키마
--
-- [안전장치 4개 유지]
--   1. is_latest UNIQUE INDEX — 테이블별 슬롯 기준 적용
--   2. version_no UNIQUE INDEX — 동시 draft 충돌 원천 차단
--   3. 함수 원자성 — advisory lock + row-level UPDATE lock
--   4. RLS 정책 확정 — 공개/관리자/서버전용 3-tier
--
-- [실행 전 확인]
--   - auth.users 테이블 접근 가능 확인 (Supabase 기본 제공)
--   - public.occupations (014) 불필요 — 의존 제거됨
--   - public.set_updated_at() 불필요 — 이 파일에 포함됨
-- ====================================================


-- ============================================================
-- [0-A] set_updated_at 트리거 함수 — 조건부 내장
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at is
  'updated_at 자동 갱신 트리거 함수. 001/002 마이그레이션에도 동일 정의 포함.';


-- ============================================================
-- [0-B] 관리자 판별 헬퍼 함수
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select
    auth.role() = 'service_role'
    or
    coalesce(
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
      false
    )
$$;

comment on function public.is_admin is
  'service_role 키 또는 app_metadata.role=admin 클레임 보유 시 true. RLS 관리자 정책 기준.';




-- ============================================================
-- [1] occupation_master — 직업 코어 레지스트리
-- ============================================================
create table if not exists public.occupation_master (
  id                    uuid        primary key default gen_random_uuid(),

  slug                  text        not null unique,
  employment24_code     text        unique,
  careerapi_code        text        unique,
  dictionary_code       text,

  name_ko               text        not null,
  name_aliases          text[]      not null default '{}',
  emoji                 text        not null default '💼',

  category              text        not null,
  interest_fields       text[]      not null default '{}',

  is_active             boolean     not null default false,

  sync_status           text        not null default 'pending'
                        check (sync_status in (
                          'pending', 'synced', 'partial', 'failed', 'retry', 'manual'
                        )),
  last_synced_at        timestamptz,
  last_error_message    text,
  sync_attempt_count    integer     not null default 0,
  priority              integer     not null default 0,

  legacy_occupation_id  text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on column public.occupation_master.sync_attempt_count is '5회 이상이면 retry 자동 중단 → 수동 확인. occupation_sync_log에 전체 이력.';

create index if not exists idx_om_employment24_code on public.occupation_master(employment24_code);
create index if not exists idx_om_slug             on public.occupation_master(slug);
create index if not exists idx_om_category        on public.occupation_master(category);
create index if not exists idx_om_interest_fields on public.occupation_master using gin(interest_fields);
create index if not exists idx_om_active_priority on public.occupation_master(priority desc)
  where is_active = true;
create index if not exists idx_om_sync_pending    on public.occupation_master(sync_status)
  where sync_status in ('pending', 'failed', 'retry');

create or replace trigger trg_om_updated_at
  before update on public.occupation_master
  for each row execute procedure public.set_updated_at();


-- ============================================================
-- [2] occupation_source_meta — 외부 API 원문 보관 (서버 전용)
-- ============================================================
create table if not exists public.occupation_source_meta (
  id              uuid        primary key default gen_random_uuid(),
  occupation_id   uuid        not null references public.occupation_master(id) on delete cascade,

  source_type     text        not null
                  check (source_type in (
                    'employment24_list', 'employment24_detail',
                    'dictionary', 'careerapi_detail', 'manual'
                  )),

  source_code     text,
  raw_payload     jsonb       not null,
  field_snapshot  jsonb,
  payload_hash    text,

  fetched_at      timestamptz not null default now(),
  api_version     text,
  http_status     integer,

  created_at      timestamptz not null default now()
);

create index if not exists idx_osm_occupation_id on public.occupation_source_meta(occupation_id);
create index if not exists idx_osm_source_type   on public.occupation_source_meta(source_type);
create index if not exists idx_osm_fetched_at    on public.occupation_source_meta(fetched_at desc);
create index if not exists idx_osm_payload_hash  on public.occupation_source_meta(payload_hash);


-- ============================================================
-- [3] occupation_sync_log — 동기화 시도 전체 이력
-- ============================================================
create table if not exists public.occupation_sync_log (
  id                uuid        primary key default gen_random_uuid(),
  occupation_id     uuid        not null references public.occupation_master(id) on delete cascade,

  source_type       text        not null,
  endpoint_name     text,
  request_params    jsonb,
  attempt_no        integer     not null,

  status            text        not null
                    check (status in (
                      'started', 'success', 'partial', 'failed', 'skipped'
                    )),
  http_status_code  integer,
  error_code        text,
  error_message     text,
  payload_hash      text,

  started_at        timestamptz not null default now(),
  finished_at       timestamptz,
  duration_ms       integer
    generated always as (
      case when finished_at is not null
        then extract(epoch from (finished_at - started_at))::integer * 1000
      end
    ) stored
);

comment on column public.occupation_sync_log.error_code  is '고용24 API 자체 오류 코드. HTTP 오류와 별개.';
comment on column public.occupation_sync_log.duration_ms is 'GENERATED 컬럼. finished_at 입력 시 자동 계산.';

create index if not exists idx_osl_occupation_id on public.occupation_sync_log(occupation_id);
create index if not exists idx_osl_started_at    on public.occupation_sync_log(started_at desc);
create index if not exists idx_osl_status        on public.occupation_sync_log(status);


-- ============================================================
-- [공통 설계 원칙] Service Layer 버전 관리
-- ============================================================
--
-- is_current = true  : 지금 사용자에게 노출되는 LIVE 버전
-- is_latest  = true  : 가장 최근 편집 버전 (draft 포함)
--
-- 가능한 row 상태 조합:
--   is_current=F, is_latest=F → archived (과거 버전)
--   is_current=T, is_latest=F → published, 새 draft 편집 중 (LIVE 유지)
--   is_current=F, is_latest=T → draft (미발행)
--   is_current=T, is_latest=T → published, 미편집 상태
--
-- [draft 생성 절차]
--   1. fn_deactivate_latest_content() 호출 → 기존 is_latest=true 해제 + next_version_no 반환
--   2. next_version_no로 신규 row INSERT (is_current=false, is_latest=true, status=draft)
--   ※ 기존 LIVE(is_current=true)는 건드리지 않음
--
-- [publish 절차]
--   BEGIN; fn_publish_content_version() 호출; COMMIT;
--   1. 기존 is_current=true → is_current=false, is_latest=false, status=archived
--   2. is_latest=true → is_current=true, status=published
--
-- ============================================================


-- ============================================================
-- [4] occupation_summary — 직업 설명 텍스트
-- ============================================================
create table if not exists public.occupation_summary (
  id              uuid        primary key default gen_random_uuid(),
  occupation_id   uuid        not null references public.occupation_master(id) on delete cascade,

  layer           text        not null check (layer in ('source', 'service')),
  content_type    text        not null,

  constraint chk_summary_content_type check (
    (layer = 'source'  and content_type in (
      'duties', 'work_environment', 'how_to_become',
      'outlook', 'definition', 'perform_duties'
    )) or
    (layer = 'service' and content_type in (
      'one_liner', 'easy_description', 'parent_description',
      'why_this_job', 'outlook_summary'
    ))
  ),

  content         text        not null,
  version_no      integer     not null default 1,

  is_current      boolean     not null default false,
  is_latest       boolean     not null default true,

  status          text        not null default 'draft'
                  check (status in ('draft', 'reviewed', 'published', 'archived')),

  created_by_user_id uuid     references auth.users(id) on delete set null,
  actor_type         text     not null default 'human'
                     check (actor_type in ('human', 'ai', 'system', 'import')),
  generation_source  text     not null default 'manual'
                     check (generation_source in (
                       'employment24', 'dictionary', 'manual', 'ai_hybrid', 'import'
                     )),

  reviewed_by_user_id uuid    references auth.users(id) on delete set null,
  published_at        timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── 안전장치 인덱스 (IF NOT EXISTS → 재실행 안전) ────────────
create unique index if not exists idx_osumm_live
  on public.occupation_summary(occupation_id, layer, content_type)
  where is_current = true;

create unique index if not exists idx_osumm_latest
  on public.occupation_summary(occupation_id, layer, content_type)
  where is_latest = true;

create unique index if not exists idx_osumm_version_no
  on public.occupation_summary(occupation_id, layer, content_type, version_no);

create index if not exists idx_osumm_occupation_id on public.occupation_summary(occupation_id);
create index if not exists idx_osumm_layer_type    on public.occupation_summary(layer, content_type);
create index if not exists idx_osumm_status        on public.occupation_summary(status);

create or replace trigger trg_osumm_updated_at
  before update on public.occupation_summary
  for each row execute procedure public.set_updated_at();


-- ============================================================
-- [5] occupation_traits — 적성·역량·흥미 키워드
-- ============================================================
create table if not exists public.occupation_traits (
  id              uuid        primary key default gen_random_uuid(),
  occupation_id   uuid        not null references public.occupation_master(id) on delete cascade,

  layer           text        not null check (layer in ('source', 'service')),
  trait_type      text        not null,

  constraint chk_traits_type check (
    (layer = 'source'  and trait_type in (
      'aptitude', 'interest_code', 'competency', 'personality'
    )) or
    (layer = 'service' and trait_type in (
      'keyword', 'interest_match', 'aptitude_match', 'work_style'
    ))
  ),

  content         text        not null,
  display_order   integer     not null default 0,
  version_no      integer     not null default 1,

  is_current      boolean     not null default false,
  is_latest       boolean     not null default true,

  status          text        not null default 'draft'
                  check (status in ('draft', 'reviewed', 'published', 'archived')),

  created_by_user_id uuid     references auth.users(id) on delete set null,
  actor_type         text     not null default 'human'
                     check (actor_type in ('human', 'ai', 'system', 'import')),
  generation_source  text     not null default 'manual'
                     check (generation_source in (
                       'employment24', 'dictionary', 'manual', 'ai_hybrid', 'import'
                     )),

  reviewed_by_user_id uuid    references auth.users(id) on delete set null,
  published_at        timestamptz,

  created_at      timestamptz not null default now()
);

-- ── 안전장치 인덱스 (IF NOT EXISTS → 재실행 안전) ────────────
create unique index if not exists idx_ot_live
  on public.occupation_traits(occupation_id, layer, trait_type, display_order)
  where is_current = true;

create unique index if not exists idx_ot_latest
  on public.occupation_traits(occupation_id, layer, trait_type, display_order)
  where is_latest = true;

create unique index if not exists idx_ot_version_no
  on public.occupation_traits(occupation_id, layer, trait_type, version_no, display_order);

create index if not exists idx_ot_occupation_id on public.occupation_traits(occupation_id);
create index if not exists idx_ot_layer_type    on public.occupation_traits(layer, trait_type);
create index if not exists idx_ot_status        on public.occupation_traits(status);


-- ============================================================
-- [6] occupation_preparations — 준비 방법
-- ============================================================
create table if not exists public.occupation_preparations (
  id              uuid        primary key default gen_random_uuid(),
  occupation_id   uuid        not null references public.occupation_master(id) on delete cascade,

  layer           text        not null check (layer in ('source', 'service')),
  prep_type       text        not null,

  constraint chk_prep_type check (
    (layer = 'source'  and prep_type in (
      'education_req', 'certification', 'related_major', 'enter_path'
    )) or
    (layer = 'service' and prep_type in (
      'mission_hint', 'step_action', 'parent_support_tip', 'school_connection'
    ))
  ),

  content         text        not null,
  grade_group     text
                  check (grade_group in ('elementary', 'middle', 'high', 'all')),
  stage_number    integer
                  check (stage_number between 1 and 5),
  display_order   integer     not null default 0,
  version_no      integer     not null default 1,

  is_current      boolean     not null default false,
  is_latest       boolean     not null default true,

  status          text        not null default 'draft'
                  check (status in ('draft', 'reviewed', 'published', 'archived')),

  created_by_user_id uuid     references auth.users(id) on delete set null,
  actor_type         text     not null default 'human'
                     check (actor_type in ('human', 'ai', 'system', 'import')),
  generation_source  text     not null default 'manual'
                     check (generation_source in (
                       'employment24', 'dictionary', 'manual', 'ai_hybrid', 'import'
                     )),

  reviewed_by_user_id uuid    references auth.users(id) on delete set null,
  published_at        timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── 안전장치 인덱스 (IF NOT EXISTS → 재실행 안전) ────────────
create unique index if not exists idx_oprep_live
  on public.occupation_preparations
    (occupation_id, layer, prep_type, grade_group, stage_number, display_order)
  where is_current = true;

create unique index if not exists idx_oprep_latest
  on public.occupation_preparations
    (occupation_id, layer, prep_type, grade_group, stage_number, display_order)
  where is_latest = true;

create unique index if not exists idx_oprep_version_no
  on public.occupation_preparations
    (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order);

create index if not exists idx_oprep_occupation_id on public.occupation_preparations(occupation_id);
create index if not exists idx_oprep_layer_type    on public.occupation_preparations(layer, prep_type);
create index if not exists idx_oprep_grade_stage   on public.occupation_preparations(grade_group, stage_number);
create index if not exists idx_oprep_status        on public.occupation_preparations(status);

create or replace trigger trg_oprep_updated_at
  before update on public.occupation_preparations
  for each row execute procedure public.set_updated_at();


-- ============================================================
-- [7] occupation_parent_questions — 부모 대화 질문 (SERVICE ONLY)
-- ============================================================
create table if not exists public.occupation_parent_questions (
  id              uuid        primary key default gen_random_uuid(),
  occupation_id   uuid        not null references public.occupation_master(id) on delete cascade,

  question        text        not null,
  context_hint    text,

  grade_target    text        not null default 'all'
                  check (grade_target in ('elementary', 'middle', 'high', 'all')),
  interest_tags   text[]      not null default '{}',
  display_order   integer     not null default 0,
  version_no      integer     not null default 1,

  is_current      boolean     not null default false,
  is_latest       boolean     not null default true,
  is_active       boolean     not null default true,

  status          text        not null default 'draft'
                  check (status in ('draft', 'reviewed', 'published', 'archived')),

  created_by_user_id uuid     references auth.users(id) on delete set null,
  actor_type         text     not null default 'human'
                     check (actor_type in ('human', 'ai', 'system', 'import')),
  generation_source  text     not null default 'manual'
                     check (generation_source in (
                       'employment24', 'dictionary', 'manual', 'ai_hybrid', 'import'
                     )),

  reviewed_by_user_id uuid    references auth.users(id) on delete set null,
  published_at        timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── 안전장치 인덱스 (IF NOT EXISTS → 재실행 안전) ────────────
create unique index if not exists idx_opq_live
  on public.occupation_parent_questions(occupation_id, grade_target, display_order)
  where is_current = true;

create unique index if not exists idx_opq_latest
  on public.occupation_parent_questions(occupation_id, grade_target, display_order)
  where is_latest = true;

create unique index if not exists idx_opq_version_no
  on public.occupation_parent_questions
    (occupation_id, grade_target, version_no, display_order);

create index if not exists idx_opq_occupation_id on public.occupation_parent_questions(occupation_id);
create index if not exists idx_opq_grade_target  on public.occupation_parent_questions(grade_target);
create index if not exists idx_opq_live_status   on public.occupation_parent_questions(occupation_id)
  where is_current = true and is_active = true and status = 'published';
create index if not exists idx_opq_interest_tags on public.occupation_parent_questions using gin(interest_tags);

create or replace trigger trg_opq_updated_at
  before update on public.occupation_parent_questions
  for each row execute procedure public.set_updated_at();


-- ============================================================
-- [8] occupation_student_actions — 학생 탐색 미션 (SERVICE ONLY)
-- ============================================================
create table if not exists public.occupation_student_actions (
  id              uuid        primary key default gen_random_uuid(),
  occupation_id   uuid        not null references public.occupation_master(id) on delete cascade,

  stage_number    integer     not null check (stage_number between 1 and 5),
  stage_title     text        not null,
  action_text     text        not null,
  action_type     text        not null default 'explore'
                  check (action_type in (
                    'read', 'watch', 'make', 'visit', 'interview', 'try', 'explore'
                  )),

  duration_minutes integer,
  grade_target    text        not null default 'all'
                  check (grade_target in ('elementary', 'middle', 'high', 'all')),
  display_order   integer     not null default 0,
  version_no      integer     not null default 1,

  is_current      boolean     not null default false,
  is_latest       boolean     not null default true,
  is_active       boolean     not null default true,

  status          text        not null default 'draft'
                  check (status in ('draft', 'reviewed', 'published', 'archived')),

  created_by_user_id uuid     references auth.users(id) on delete set null,
  actor_type         text     not null default 'human'
                     check (actor_type in ('human', 'ai', 'system', 'import')),
  generation_source  text     not null default 'manual'
                     check (generation_source in (
                       'employment24', 'dictionary', 'manual', 'ai_hybrid', 'import'
                     )),

  reviewed_by_user_id uuid    references auth.users(id) on delete set null,
  published_at        timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── 안전장치 인덱스 (IF NOT EXISTS → 재실행 안전) ────────────
create unique index if not exists idx_osa_live
  on public.occupation_student_actions
    (occupation_id, stage_number, grade_target, display_order)
  where is_current = true;

create unique index if not exists idx_osa_latest
  on public.occupation_student_actions
    (occupation_id, stage_number, grade_target, display_order)
  where is_latest = true;

create unique index if not exists idx_osa_version_no
  on public.occupation_student_actions
    (occupation_id, stage_number, grade_target, version_no, display_order);

create index if not exists idx_osa_occupation_id on public.occupation_student_actions(occupation_id);
create index if not exists idx_osa_stage_grade   on public.occupation_student_actions(stage_number, grade_target);
create index if not exists idx_osa_live_status   on public.occupation_student_actions(occupation_id, stage_number)
  where is_current = true and is_active = true and status = 'published';

create or replace trigger trg_osa_updated_at
  before update on public.occupation_student_actions
  for each row execute procedure public.set_updated_at();


-- ============================================================
-- [9] occupation_related_jobs — 관련 직업
-- ============================================================
create table if not exists public.occupation_related_jobs (
  id                        uuid  primary key default gen_random_uuid(),
  occupation_id             uuid  not null references public.occupation_master(id) on delete cascade,

  layer                     text  not null check (layer in ('source', 'service')),
  relation_type             text  not null,

  constraint chk_related_type check (
    (layer = 'source'  and relation_type in ('similar', 'related_source')) or
    (layer = 'service' and relation_type in ('career_path', 'kkumddara_suggest'))
  ),

  related_occupation_id     uuid  references public.occupation_master(id) on delete set null,
  related_name_ko           text  not null,
  related_employment24_code text,

  display_order             integer not null default 0,
  created_at                timestamptz not null default now()
);

create index if not exists idx_orj_occupation_id         on public.occupation_related_jobs(occupation_id);
create index if not exists idx_orj_related_occupation_id on public.occupation_related_jobs(related_occupation_id);
create index if not exists idx_orj_layer_type            on public.occupation_related_jobs(layer, relation_type);


-- ============================================================
-- [10] RLS 정책 — 3-tier 접근 제어
-- ============================================================
-- [rev 6] 재실행 안전: DROP POLICY IF EXISTS 선행
--
-- Tier 1. 서버 전용  → occupation_source_meta, occupation_sync_log
-- Tier 2. 공개       → occupation_master(is_active=true)
--                       service layer(is_current=true AND published)
-- Tier 3. 관리자     → 모든 테이블 전체 조회/수정
-- ============================================================

-- [1] occupation_master
alter table public.occupation_master enable row level security;

drop policy if exists "om: 공개 조회 (활성 직업)"    on public.occupation_master;
drop policy if exists "om: 관리자 전체 조회"          on public.occupation_master;
drop policy if exists "om: 관리자 수정"               on public.occupation_master;

create policy "om: 공개 조회 (활성 직업)"
  on public.occupation_master for select
  using (is_active = true);

create policy "om: 관리자 전체 조회"
  on public.occupation_master for select
  using (public.is_admin());

create policy "om: 관리자 수정"
  on public.occupation_master for all
  using (public.is_admin())
  with check (public.is_admin());

-- [2] occupation_source_meta — 서버 전용 (Tier 1)
alter table public.occupation_source_meta enable row level security;

drop policy if exists "source_meta: 관리자 전체 조회" on public.occupation_source_meta;
drop policy if exists "source_meta: 관리자 수정"      on public.occupation_source_meta;

create policy "source_meta: 관리자 전체 조회"
  on public.occupation_source_meta for select
  using (public.is_admin());

create policy "source_meta: 관리자 수정"
  on public.occupation_source_meta for all
  using (public.is_admin())
  with check (public.is_admin());

-- [3] occupation_sync_log — 서버 전용 (Tier 1)
alter table public.occupation_sync_log enable row level security;

drop policy if exists "sync_log: 관리자 전체 조회" on public.occupation_sync_log;
drop policy if exists "sync_log: 관리자 수정"      on public.occupation_sync_log;

create policy "sync_log: 관리자 전체 조회"
  on public.occupation_sync_log for select
  using (public.is_admin());

create policy "sync_log: 관리자 수정"
  on public.occupation_sync_log for all
  using (public.is_admin())
  with check (public.is_admin());

-- [4] occupation_summary
alter table public.occupation_summary enable row level security;

drop policy if exists "osumm: 공개 조회 (live+published)"      on public.occupation_summary;
drop policy if exists "osumm: 관리자 전체 조회 (draft 포함)"    on public.occupation_summary;
drop policy if exists "osumm: 관리자 수정"                      on public.occupation_summary;

create policy "osumm: 공개 조회 (live+published)"
  on public.occupation_summary for select
  using (is_current = true and status = 'published');

create policy "osumm: 관리자 전체 조회 (draft 포함)"
  on public.occupation_summary for select
  using (public.is_admin());

create policy "osumm: 관리자 수정"
  on public.occupation_summary for all
  using (public.is_admin())
  with check (public.is_admin());

-- [5] occupation_traits
alter table public.occupation_traits enable row level security;

drop policy if exists "ot: 공개 조회"       on public.occupation_traits;
drop policy if exists "ot: 관리자 전체 조회" on public.occupation_traits;
drop policy if exists "ot: 관리자 수정"      on public.occupation_traits;

create policy "ot: 공개 조회"
  on public.occupation_traits for select
  using (is_current = true and status = 'published');

create policy "ot: 관리자 전체 조회"
  on public.occupation_traits for select
  using (public.is_admin());

create policy "ot: 관리자 수정"
  on public.occupation_traits for all
  using (public.is_admin())
  with check (public.is_admin());

-- [6] occupation_preparations
alter table public.occupation_preparations enable row level security;

drop policy if exists "oprep: 공개 조회"       on public.occupation_preparations;
drop policy if exists "oprep: 관리자 전체 조회" on public.occupation_preparations;
drop policy if exists "oprep: 관리자 수정"      on public.occupation_preparations;

create policy "oprep: 공개 조회"
  on public.occupation_preparations for select
  using (is_current = true and status = 'published');

create policy "oprep: 관리자 전체 조회"
  on public.occupation_preparations for select
  using (public.is_admin());

create policy "oprep: 관리자 수정"
  on public.occupation_preparations for all
  using (public.is_admin())
  with check (public.is_admin());

-- [7] occupation_parent_questions
alter table public.occupation_parent_questions enable row level security;

drop policy if exists "opq: 공개 조회"       on public.occupation_parent_questions;
drop policy if exists "opq: 관리자 전체 조회" on public.occupation_parent_questions;
drop policy if exists "opq: 관리자 수정"      on public.occupation_parent_questions;

create policy "opq: 공개 조회"
  on public.occupation_parent_questions for select
  using (is_current = true and status = 'published' and is_active = true);

create policy "opq: 관리자 전체 조회"
  on public.occupation_parent_questions for select
  using (public.is_admin());

create policy "opq: 관리자 수정"
  on public.occupation_parent_questions for all
  using (public.is_admin())
  with check (public.is_admin());

-- [8] occupation_student_actions
alter table public.occupation_student_actions enable row level security;

drop policy if exists "osa: 공개 조회"       on public.occupation_student_actions;
drop policy if exists "osa: 관리자 전체 조회" on public.occupation_student_actions;
drop policy if exists "osa: 관리자 수정"      on public.occupation_student_actions;

create policy "osa: 공개 조회"
  on public.occupation_student_actions for select
  using (is_current = true and status = 'published' and is_active = true);

create policy "osa: 관리자 전체 조회"
  on public.occupation_student_actions for select
  using (public.is_admin());

create policy "osa: 관리자 수정"
  on public.occupation_student_actions for all
  using (public.is_admin())
  with check (public.is_admin());

-- [9] occupation_related_jobs
alter table public.occupation_related_jobs enable row level security;

drop policy if exists "orj: 공개 조회" on public.occupation_related_jobs;
drop policy if exists "orj: 관리자 수정" on public.occupation_related_jobs;

create policy "orj: 공개 조회"
  on public.occupation_related_jobs for select using (true);

create policy "orj: 관리자 수정"
  on public.occupation_related_jobs for all
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================================
-- [11] 버전 전환 헬퍼 함수 — 동시성 제어 포함 [안전장치 3]
-- ============================================================
--
-- 동시성 제어 방식:
--   A. pg_advisory_xact_lock(lock_key)
--   B. UPDATE 자체의 row-level lock
--
-- [rev 6 수정] EXECUTE INTO 버그 수정
--   format() 결과를 v_sql text 변수에 먼저 대입.
--   EXECUTE v_sql INTO var USING … 을 한 줄로 작성.
--   파서가 INTO를 EXECUTE 결과 대입으로 명확히 인식.
-- ============================================================

-- ── A. draft 생성 전 latest 해제 + next_version_no 반환 ───
create or replace function public.fn_deactivate_latest_content(
  p_occupation_id uuid,
  p_table_name    text,   -- 'occupation_summary' | 'occupation_traits' | 'occupation_preparations'
  p_layer         text,
  p_type_col      text,   -- 'content_type' | 'trait_type' | 'prep_type'
  p_type_val      text
) returns integer          -- next version_no
language plpgsql security definer
set search_path = public
as $$
declare
  v_lock_key      bigint;
  v_next_version  integer;
  v_sql           text;   -- [rev 6] EXECUTE 분리용 SQL 문자열 변수
begin
  -- [안전장치 3-A] advisory lock: 동일 범위 동시 실행 직렬화
  v_lock_key := hashtext(
    p_occupation_id::text || '|' || p_table_name || '|' || p_layer || '|' || p_type_val
  );
  perform pg_advisory_xact_lock(v_lock_key);

  -- [rev 6 수정] format() → v_sql 먼저 대입, EXECUTE를 한 줄로 명확화
  -- 이전: execute format(...) into v_next_version using ...  ← 42P01 발생
  -- 수정: v_sql := format(...); execute v_sql into v_next_version using ...;
  v_sql := format(
    'select coalesce(max(version_no), 0) + 1
     from public.%I
     where occupation_id = $1 and layer = $2 and %I = $3',
    p_table_name, p_type_col
  );
  execute v_sql into v_next_version using p_occupation_id, p_layer, p_type_val;

  -- [안전장치 3-B] UPDATE row lock: 기존 is_latest=true 행 lock + 해제
  v_sql := format(
    'update public.%I
     set is_latest = false, updated_at = now()
     where occupation_id = $1 and layer = $2 and %I = $3 and is_latest = true',
    p_table_name, p_type_col
  );
  execute v_sql using p_occupation_id, p_layer, p_type_val;

  return v_next_version;

exception
  when unique_violation then
    raise exception
      '[fn_deactivate_latest_content] version_no 충돌 (occupation_id=%, table=%, type=%)',
      p_occupation_id, p_table_name, p_type_val
      using errcode = 'unique_violation';
end;
$$;

comment on function public.fn_deactivate_latest_content is
  'draft INSERT 전 호출. 기존 is_latest=true → false. advisory lock + row lock으로 동시성 보호.
   반환값(next_version_no)을 신규 draft INSERT의 version_no로 사용.
   반드시 트랜잭션 내에서 호출 (BEGIN; SELECT fn_...; INSERT ...; COMMIT;).
   [rev 6] EXECUTE format() INTO var 분리 수정 — 42P01 방지.';


-- ── B. publish: draft → LIVE 승격 ────────────────────────
create or replace function public.fn_publish_content_version(
  p_occupation_id uuid,
  p_table_name    text,
  p_layer         text,
  p_type_col      text,
  p_type_val      text
) returns void
language plpgsql security definer
set search_path = public
as $$
declare
  v_lock_key   bigint;
  v_draft_cnt  integer;
  v_sql        text;   -- [rev 6] EXECUTE 분리용 SQL 문자열 변수
begin
  -- [안전장치 3-A] advisory lock
  v_lock_key := hashtext(
    p_occupation_id::text || '|' || p_table_name || '|' || p_layer || '|' || p_type_val
  );
  perform pg_advisory_xact_lock(v_lock_key);

  -- [rev 6 수정] 발행할 draft 존재 확인 — INTO 분리
  v_sql := format(
    'select count(*) from public.%I
     where occupation_id = $1 and layer = $2 and %I = $3
       and is_latest = true and status != ''published''',
    p_table_name, p_type_col
  );
  execute v_sql into v_draft_cnt using p_occupation_id, p_layer, p_type_val;

  if v_draft_cnt = 0 then
    raise exception
      '[fn_publish_content_version] 발행할 draft 없음 (occupation_id=%, type=%)',
      p_occupation_id, p_type_val
      using errcode = 'no_data_found';
  end if;

  -- [안전장치 3-B] step 1: 기존 LIVE → archived
  v_sql := format(
    'update public.%I
     set is_current = false, is_latest = false,
         status = ''archived'', updated_at = now()
     where occupation_id = $1 and layer = $2 and %I = $3 and is_current = true',
    p_table_name, p_type_col
  );
  execute v_sql using p_occupation_id, p_layer, p_type_val;

  -- step 2: latest draft → LIVE 승격
  v_sql := format(
    'update public.%I
     set is_current = true, status = ''published'',
         published_at = now(), updated_at = now()
     where occupation_id = $1 and layer = $2 and %I = $3 and is_latest = true',
    p_table_name, p_type_col
  );
  execute v_sql using p_occupation_id, p_layer, p_type_val;

exception
  when unique_violation then
    raise exception
      '[fn_publish_content_version] LIVE 버전 충돌. 동시 publish 시도 감지. (occupation_id=%, type=%)',
      p_occupation_id, p_type_val
      using errcode = 'unique_violation';
end;
$$;

comment on function public.fn_publish_content_version is
  'is_latest=true draft → LIVE 승격. 기존 LIVE → archived. advisory lock으로 동시 publish 차단.
   반드시 트랜잭션 내에서 호출 (BEGIN; SELECT fn_...; COMMIT;).
   [rev 6] EXECUTE format() INTO var 분리 수정 — 42P01 방지.';


-- ============================================================
-- [12] 완료 확인 및 실행 가이드
-- ============================================================
do $$ begin
  raise notice '';
  raise notice '✅ 015 rev6 (단독 실행 가능): occupation master v2 생성 완료';
  raise notice '';
  raise notice '  [rev 6 수정 내용]';
  raise notice '    - 42P01 "relation v_next_version" 버그 수정';
  raise notice '    - fn_deactivate_latest_content: v_sql 변수 분리 → EXECUTE v_sql INTO 명확화';
  raise notice '    - fn_publish_content_version:   v_sql 변수 분리 → EXECUTE v_sql INTO 명확화';
  raise notice '    - CREATE UNIQUE INDEX → IF NOT EXISTS 추가 (재실행 안전)';
  raise notice '    - CREATE POLICY → DROP IF EXISTS 선행 (재실행 안전)';
  raise notice '';
  raise notice '  테이블 9개:';
  raise notice '    occupation_master / source_meta / sync_log';
  raise notice '    summary / traits / preparations';
  raise notice '    parent_questions / student_actions / related_jobs';
  raise notice '';
  raise notice '  내장 함수:';
  raise notice '    set_updated_at()               → updated_at 자동 갱신 트리거';
  raise notice '    is_admin()                     → RLS 관리자 판별';
  raise notice '    fn_deactivate_latest_content() → draft 생성 전. next_version_no 반환.';
  raise notice '    fn_publish_content_version()   → draft → LIVE 승격.';
  raise notice '';
  raise notice '  안전장치 4개:';
  raise notice '    [1] is_latest UNIQUE INDEX — 5개 서비스 테이블 전체 적용';
  raise notice '    [2] version_no UNIQUE INDEX — 5개 서비스 테이블 전체 적용';
  raise notice '    [3] 함수 원자성 — advisory lock(직렬화) + UPDATE row lock(이중보호)';
  raise notice '    [4] RLS 3-tier — 서버전용/공개/관리자';
  raise notice '';
  raise notice '  다음 실행 순서:';
  raise notice '    1. ✅ 이 파일 실행 완료';
  raise notice '    2. 관리자 유저 → raw_app_meta_data: {"role":"admin"} 설정';
  raise notice '    3. EMPLOYMENT24_API_KEY 환경변수 등록';
  raise notice '    4. occupation_master INSERT (priority 상위 50개, is_active=false)';
  raise notice '    5. sync 스크립트 → source_meta + sync_log 적재';
  raise notice '    6. service layer draft → fn_publish_content_version() 호출';
  raise notice '    7. is_active = true → 서비스 노출';
  raise notice '';
end $$;
