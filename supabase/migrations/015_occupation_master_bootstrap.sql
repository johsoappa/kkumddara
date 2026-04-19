-- ====================================================
-- 015_occupation_master_bootstrap.sql
-- occupation 스키마 부트스트랩 (helper 함수 제외)
--
-- [목적]
--   DO block / EXECUTE INTO 환경 제약으로 015_occupation_master_v2.sql
--   실행 불가 시 대체 실행 파일.
--   helper 함수(fn_deactivate_latest_content, fn_publish_content_version)는
--   제외하고, 서비스 운영에 필요한 스키마만 포함.
--
-- [포함]
--   set_updated_at() 트리거 함수
--   is_admin() RLS 판별 함수
--   테이블 9개 (occupation_master, source_meta, sync_log,
--               summary, traits, preparations,
--               parent_questions, student_actions, related_jobs)
--   모든 인덱스 (IF NOT EXISTS → 재실행 안전)
--   모든 RLS 정책 (DROP IF EXISTS 선행 → 재실행 안전)
--
-- [제외]
--   fn_deactivate_latest_content()  ← DO + EXECUTE INTO 사용 → 환경 불안정
--   fn_publish_content_version()    ← 동일 이유로 제외
--   DO $$ notice 블록               ← 환경 불안정 회피
--
-- [원칙]
--   EXECUTE 사용 없음
--   DO block 사용 없음
--   순수 DDL + CREATE OR REPLACE FUNCTION + INDEX + POLICY
--
-- [실행]
--   Supabase SQL Editor — 전체 붙여넣기 후 실행
--   service_role 키 사용 (RLS 우회)
-- ====================================================


-- ============================================================
-- [0-A] set_updated_at — updated_at 자동 갱신 트리거 함수
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


-- ============================================================
-- [0-B] is_admin — RLS 관리자 판별 함수
-- ============================================================
-- service_role 키 또는 app_metadata.role = 'admin' 클레임 시 true
-- 설정: Supabase Dashboard → Auth → Users → raw_app_meta_data: {"role":"admin"}
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

  -- legacy_occupation_id: /explore/[id] 라우팅 호환용 plain text
  -- (베타: static 상세 페이지 ID와 매핑. DB 상세 전환 후 제거 예정)
  legacy_occupation_id  text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_om_slug             on public.occupation_master(slug);
create index if not exists idx_om_employment24_code on public.occupation_master(employment24_code);
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
  occupation_id   uuid        not null
                  references public.occupation_master(id) on delete cascade,

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
  occupation_id     uuid        not null
                    references public.occupation_master(id) on delete cascade,

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

create index if not exists idx_osl_occupation_id on public.occupation_sync_log(occupation_id);
create index if not exists idx_osl_started_at    on public.occupation_sync_log(started_at desc);
create index if not exists idx_osl_status        on public.occupation_sync_log(status);


-- ============================================================
-- [4] occupation_summary — 직업 설명 텍스트
-- ============================================================
--
-- is_current = true  : LIVE 버전 (현재 사용자에게 노출)
-- is_latest  = true  : 최신 편집 버전 (draft 포함)
--
-- content_type 허용 슬롯:
--   layer='source' : duties | work_environment | how_to_become |
--                    outlook | definition | perform_duties
--   layer='service': one_liner | easy_description | parent_description |
--                    why_this_job | outlook_summary
-- ============================================================
create table if not exists public.occupation_summary (
  id              uuid        primary key default gen_random_uuid(),
  occupation_id   uuid        not null
                  references public.occupation_master(id) on delete cascade,

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

-- LIVE 슬롯: (occupation_id, layer, content_type) 당 is_current=true 1개
create unique index if not exists idx_osumm_live
  on public.occupation_summary(occupation_id, layer, content_type)
  where is_current = true;

-- 최신 편집 슬롯: is_latest=true 1개
create unique index if not exists idx_osumm_latest
  on public.occupation_summary(occupation_id, layer, content_type)
  where is_latest = true;

-- version_no 중복 방지
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
  occupation_id   uuid        not null
                  references public.occupation_master(id) on delete cascade,

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
  occupation_id   uuid        not null
                  references public.occupation_master(id) on delete cascade,

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
-- [7] occupation_parent_questions — 부모 대화 질문
-- ============================================================
create table if not exists public.occupation_parent_questions (
  id              uuid        primary key default gen_random_uuid(),
  occupation_id   uuid        not null
                  references public.occupation_master(id) on delete cascade,

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
create index if not exists idx_opq_interest_tags
  on public.occupation_parent_questions using gin(interest_tags);

create or replace trigger trg_opq_updated_at
  before update on public.occupation_parent_questions
  for each row execute procedure public.set_updated_at();


-- ============================================================
-- [8] occupation_student_actions — 학생 탐색 미션
-- ============================================================
create table if not exists public.occupation_student_actions (
  id              uuid        primary key default gen_random_uuid(),
  occupation_id   uuid        not null
                  references public.occupation_master(id) on delete cascade,

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
create index if not exists idx_osa_live_status
  on public.occupation_student_actions(occupation_id, stage_number)
  where is_current = true and is_active = true and status = 'published';

create or replace trigger trg_osa_updated_at
  before update on public.occupation_student_actions
  for each row execute procedure public.set_updated_at();


-- ============================================================
-- [9] occupation_related_jobs — 관련 직업 (버전 관리 미적용)
-- ============================================================
create table if not exists public.occupation_related_jobs (
  id                        uuid  primary key default gen_random_uuid(),
  occupation_id             uuid  not null
                            references public.occupation_master(id) on delete cascade,

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

create index if not exists idx_orj_occupation_id
  on public.occupation_related_jobs(occupation_id);
create index if not exists idx_orj_related_occupation_id
  on public.occupation_related_jobs(related_occupation_id);
create index if not exists idx_orj_layer_type
  on public.occupation_related_jobs(layer, relation_type);


-- ============================================================
-- [10] RLS 정책 — 3-tier 접근 제어
-- ============================================================
-- DROP IF EXISTS 선행 → 재실행 안전
--
-- Tier 1. 서버 전용  → occupation_source_meta, occupation_sync_log
-- Tier 2. 공개       → occupation_master(is_active=true),
--                       service layer(is_current+published)
-- Tier 3. 관리자     → 전체 조회/수정
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

-- [2] occupation_source_meta (Tier 1 — anon 차단)
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

-- [3] occupation_sync_log (Tier 1)
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

drop policy if exists "orj: 공개 조회"   on public.occupation_related_jobs;
drop policy if exists "orj: 관리자 수정" on public.occupation_related_jobs;

create policy "orj: 공개 조회"
  on public.occupation_related_jobs for select using (true);

create policy "orj: 관리자 수정"
  on public.occupation_related_jobs for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- bootstrap 완료
-- 다음 단계: 001_pilot_occupations_plain.sql 실행
-- ============================================================
