-- ====================================================
-- 042_fix_coast_guard_forensic_data.sql
-- 해양경찰·과학수사관 누락 데이터 보강
--
-- [목적]
--   세부 직업 구조 QA(042 이전) 결과, 기존 직업에서 하위 직업으로 전환된
--   coast-guard-officer와 forensic-scientist의 occupation_student_actions
--   Stage 1 데이터 및 forensic-scientist goyo24_profile이 누락된 것을 확인.
--   최소 범위로 보강한다.
--
-- [현재 누락 상태]
--   coast-guard-officer : action=0, goyo24=1 (goyo24는 이미 존재)
--   forensic-scientist  : action=0, goyo24=0
--
-- [보강 내용]
--   occupation_student_actions : INSERT 4행 × 2직업 = 8행
--   occupation_goyo24_profile  : INSERT 1행 (forensic-scientist만)
--
-- [변경하지 않는 것]
--   occupation_master (is_active/is_representative/occupation_level/parent 등)
--   occupation_summary (3행 이미 정상)
--   occupation_preparations (3행 이미 정상)
--   occupation_goyo24_profile (coast-guard-officer는 이미 1행 존재 → 건드리지 않음)
--   DB schema / RLS / UI / AI 상담 / 요금제 / auth
--   quizData.ts
--
-- [재실행 안전성]
--   occupation_student_actions : DELETE stage_number=1 후 INSERT (2개 slug만)
--   occupation_goyo24_profile  : ON CONFLICT (occupation_id) DO NOTHING
-- ====================================================

begin;

-- ============================================================
-- [1] 해양경찰 Stage 1 student_actions 보강 (멱등)
-- ============================================================
delete from public.occupation_student_actions
where occupation_id = (select id from public.occupation_master where slug = 'coast-guard-officer')
  and stage_number = 1;

insert into public.occupation_student_actions (
  occupation_id, stage_number, stage_title, action_text, action_type,
  duration_minutes, grade_target, display_order,
  is_current, is_latest, is_active, status, actor_type, generation_source, published_at
)
select
  om.id,
  m.stage_number::integer,
  m.stage_title,
  m.action_text,
  m.action_type,
  m.duration_minutes::integer,
  m.grade_target,
  m.display_order::integer,
  true, true, true, 'published', 'human', 'manual', now()
from public.occupation_master om
join (values
  ('coast-guard-officer', 1, '지금 당장 시작하기', '바다에서 사람들이 안전하게 활동하려면 어떤 규칙이 필요한지 가족과 이야기해보기',   'explore', 15, 'all', 1),
  ('coast-guard-officer', 1, '지금 당장 시작하기', '해변이나 배를 탈 때 지켜야 할 안전 약속 5가지를 카드로 만들어보기',               'make',    20, 'all', 2),
  ('coast-guard-officer', 1, '지금 당장 시작하기', '바다에서 도움이 필요한 상황과 신고해야 하는 상황을 그림으로 정리해보기',           'make',    15, 'all', 3),
  ('coast-guard-officer', 1, '지금 당장 시작하기', '해양경찰에게 필요한 능력인 책임감, 관찰력, 침착함을 생각해보기',                   'explore', 10, 'all', 4)
) as m(slug, stage_number, stage_title, action_text, action_type, duration_minutes, grade_target, display_order)
  on om.slug = m.slug
 and om.is_active = true;


-- ============================================================
-- [2] 과학수사관 Stage 1 student_actions 보강 (멱등)
-- ============================================================
delete from public.occupation_student_actions
where occupation_id = (select id from public.occupation_master where slug = 'forensic-scientist')
  and stage_number = 1;

insert into public.occupation_student_actions (
  occupation_id, stage_number, stage_title, action_text, action_type,
  duration_minutes, grade_target, display_order,
  is_current, is_latest, is_active, status, actor_type, generation_source, published_at
)
select
  om.id,
  m.stage_number::integer,
  m.stage_title,
  m.action_text,
  m.action_type,
  m.duration_minutes::integer,
  m.grade_target,
  m.display_order::integer,
  true, true, true, 'published', 'human', 'manual', now()
from public.occupation_master om
join (values
  ('forensic-scientist', 1, '지금 당장 시작하기', '작은 단서로 문제를 해결하는 일이 왜 중요한지 가족과 이야기해보기',                  'explore', 15, 'all', 1),
  ('forensic-scientist', 1, '지금 당장 시작하기', '방 안의 물건을 관찰하고 위치나 특징을 기록하는 관찰 노트를 만들어보기',             'make',    20, 'all', 2),
  ('forensic-scientist', 1, '지금 당장 시작하기', '두 그림의 다른 점을 찾아 단서 카드로 정리해보기',                                   'make',    15, 'all', 3),
  ('forensic-scientist', 1, '지금 당장 시작하기', '과학수사관에게 필요한 능력인 관찰력, 정확함, 과학적 생각을 정리해보기',              'explore', 10, 'all', 4)
) as m(slug, stage_number, stage_title, action_text, action_type, duration_minutes, grade_target, display_order)
  on om.slug = m.slug
 and om.is_active = true;


-- ============================================================
-- [3] 과학수사관 goyo24_profile 보강
--     공공·안전/과학 계열 직업 기반 manual 임시 참고값
--     고용24 API 매핑 전 수동 입력 — 향후 sync 시 갱신
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id, goyo24_occ_code, goyo24_job_name,
  salary_raw, salary_lower, salary_median, salary_upper, salary_survey_year,
  job_satisfaction, prospect_raw, prospect_label,
  related_majors, source, synced_at
)
select
  om.id,
  null,
  '과학수사관',
  '조사년도:2023년, 임금 하위(25%) 4200만원, 중위(50%) 5500만원, 상위(25%) 7000만원',
  4200, 5500, 7000, 2023,
  77.0,
  '범죄 유형 다양화 및 디지털 포렌식 수요 증가로 과학수사 전문 인력 수요는 안정적으로 유지될 전망입니다.',
  '유지',
  array['과학수사학과', '법과학과', '화학과', '생명과학과', '경찰행정학과'],
  'manual',
  now()
from public.occupation_master om
where om.slug = 'forensic-scientist'
  and not exists (
    select 1 from public.occupation_goyo24_profile g
    where g.occupation_id = om.id
  );


-- ============================================================
-- [검증] 실행 후 결과 확인
-- ============================================================

-- 1. 보강 대상 데이터 완성도 확인
select
  om.slug,
  om.name_ko,
  om.is_active,
  om.occupation_level,
  om.is_representative,
  (select count(*) from public.occupation_summary s      where s.occupation_id = om.id) as summary_count,
  (select count(*) from public.occupation_preparations p  where p.occupation_id = om.id) as prep_count,
  (select count(*) from public.occupation_student_actions a where a.occupation_id = om.id and a.stage_number = 1) as action_count,
  (select count(*) from public.occupation_goyo24_profile g where g.occupation_id = om.id) as goyo24_count
from public.occupation_master om
where om.slug in ('coast-guard-officer', 'forensic-scientist')
order by om.slug;

-- 기대값:
-- coast-guard-officer : summary=3, prep=3, action=4, goyo24=1
-- forensic-scientist  : summary=3, prep=3, action=4, goyo24=1

-- 2. 경찰관 하위 직업 구조 유지 확인
select
  child.slug,
  child.name_ko,
  child.occupation_level,
  child.is_representative,
  child.display_group,
  child.group_display_order,
  parent.slug as parent_slug
from public.occupation_master parent
join public.occupation_master child on child.parent_occupation_id = parent.id
where parent.slug = 'police-officer'
order by child.group_display_order;
-- 기대: 4개 모두 level=2, rep=false, display_group=경찰, parent_slug=police-officer

-- 3. 대표 수 / 세부 수 유지 확인
select
  count(*) filter (where is_active=true and is_representative=true) as representative_count,
  count(*) filter (where parent_occupation_id is not null)          as child_count
from public.occupation_master;
-- 기대: representative_count=54, child_count=10

commit;
