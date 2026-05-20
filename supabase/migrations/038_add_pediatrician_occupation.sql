-- ====================================================
-- 038_add_pediatrician_occupation.sql
-- 의사군 세부 직업 파일럿 1차: 소아청소년과 의사 (pediatrician)
--
-- [목적]
--   occupation_master 계층화 구조가 실제로 작동하는지 검증하기 위해
--   대표 직업 doctor(의사) 아래에 세부 직업 소아청소년과 의사를 추가한다.
--
-- [핵심 계층 정보]
--   parent: doctor (occupation_level=1, is_representative=true)
--   child:  pediatrician (occupation_level=2, is_representative=false)
--
-- [노출 정책]
--   /explore 목록: is_representative=false → 노출되지 않음
--   /explore/doctor 관련 직업 더보기: parent_occupation_id=doctor.id → 노출됨
--   /explore/pediatrician 직접 진입: is_active=true → 가능
--
-- [변경 범위]
--   occupation_master        : INSERT 1행
--   occupation_summary       : INSERT 3행
--   occupation_preparations  : INSERT 3행
--   occupation_student_actions: DELETE(stage=1) 후 INSERT 4행
--   occupation_goyo24_profile: INSERT 1행
--
-- [변경하지 않는 것]
--   DB schema / RLS / 기존 doctor 데이터 / 기존 active 직업 / AI 상담 / 요금제
--
-- [재실행 안전성]
--   occupation_master        : ON CONFLICT (slug) DO UPDATE
--   occupation_summary       : ON CONFLICT (occupation_id, layer, content_type, version_no)
--   occupation_preparations  : ON CONFLICT (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
--   occupation_student_actions: DELETE stage_number=1 후 INSERT
--   occupation_goyo24_profile: ON CONFLICT (occupation_id) DO UPDATE
-- ====================================================

begin;

-- ============================================================
-- [1] occupation_master 추가
--     doctor.id를 parent_occupation_id로 참조
-- ============================================================
insert into public.occupation_master (
  slug,
  name_ko,
  name_aliases,
  emoji,
  category,
  interest_fields,
  employment24_code,
  sync_status,
  is_active,
  priority,
  legacy_occupation_id,
  parent_occupation_id,
  occupation_level,
  display_group,
  is_representative,
  group_display_order
) values (
  'pediatrician',
  '소아청소년과 의사',
  array['소아과 의사', '소아청소년과 전문의', '어린이 의사'],
  '🩺',
  '의료·과학',
  array['medical'],
  null,
  'manual',
  true,
  25,
  'pediatrician',
  (select id from public.occupation_master where slug = 'doctor'),
  2,
  '의사',
  false,
  1
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  parent_occupation_id = excluded.parent_occupation_id,
  occupation_level     = excluded.occupation_level,
  display_group        = excluded.display_group,
  is_representative    = excluded.is_representative,
  group_display_order  = excluded.group_display_order,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;


-- ============================================================
-- [2] occupation_summary 추가
-- ============================================================
insert into public.occupation_summary (
  occupation_id,
  layer,
  content_type,
  content,
  version_no,
  is_current,
  is_latest,
  status,
  published_at,
  actor_type,
  generation_source
) values
  (
    (select id from public.occupation_master where slug = 'pediatrician'),
    'service', 'one_liner',
    '아이와 청소년의 몸과 건강을 살피는 의사입니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'pediatrician'),
    'service', 'easy_description',
    '소아청소년과 의사는 아기부터 청소년까지 아이들의 건강을 돌보는 의사입니다. 열이 나거나 배가 아플 때처럼 몸이 아픈 이유를 살피고, 아이가 건강하게 자랄 수 있도록 도와줍니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'pediatrician'),
    'service', 'why_this_job',
    '아이를 돕는 일, 건강과 성장에 관심이 있는 아이에게 잘 맞을 수 있습니다. 몸의 변화와 증상을 관찰하고, 따뜻하게 설명하는 태도를 배워볼 수 있어요.',
    1, true, true, 'published', now(), 'import', 'manual'
  )
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;


-- ============================================================
-- [3] occupation_preparations 추가
-- ============================================================
insert into public.occupation_preparations (
  occupation_id,
  layer,
  prep_type,
  content,
  grade_group,
  stage_number,
  display_order,
  version_no,
  is_current,
  is_latest,
  status,
  published_at,
  actor_type,
  generation_source
) values
  (
    (select id from public.occupation_master where slug = 'pediatrician'),
    'service', 'mission_hint',
    '가족이나 친구가 아플 때 어떤 증상을 말하는지 관찰해보고, 건강을 지키는 생활 습관을 함께 생각해보세요.',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'pediatrician'),
    'service', 'step_action',
    '감기, 배탈, 열처럼 아이들이 자주 겪는 증상을 그림이나 표로 정리해보기',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'pediatrician'),
    'service', 'step_action',
    '손 씻기, 잠자기, 물 마시기처럼 건강을 지키는 습관 체크리스트 만들어보기',
    'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual'
  )
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [4] Stage 1 student_actions 추가 (멱등성 보장)
-- ============================================================
delete from public.occupation_student_actions
where occupation_id = (
  select id from public.occupation_master where slug = 'pediatrician'
)
and stage_number = 1;

insert into public.occupation_student_actions (
  occupation_id,
  stage_number,
  stage_title,
  action_text,
  action_type,
  duration_minutes,
  grade_target,
  display_order,
  is_current,
  is_latest,
  is_active,
  status,
  actor_type,
  generation_source,
  published_at
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
  ('pediatrician', 1, '지금 당장 시작하기', '가족이 병원에 갔던 경험을 떠올리고 어떤 도움을 받았는지 이야기해보기',          'explore', 15, 'all', 1),
  ('pediatrician', 1, '지금 당장 시작하기', '감기, 열, 배탈처럼 몸이 아플 때 나타나는 증상 카드를 만들어보기',              'make',    20, 'all', 2),
  ('pediatrician', 1, '지금 당장 시작하기', '하루 건강 습관표를 만들고 손 씻기, 물 마시기, 잠자기 항목을 체크해보기',        'make',    15, 'all', 3),
  ('pediatrician', 1, '지금 당장 시작하기', '소아청소년과 의사에게 필요한 능력인 관찰력, 친절함, 책임감을 생각해보기',        'explore', 10, 'all', 4)
) as m(slug, stage_number, stage_title, action_text, action_type, duration_minutes, grade_target, display_order)
  on om.slug = m.slug
 and om.is_active = true;


-- ============================================================
-- [5] occupation_goyo24_profile 추가
--     doctor profile 기반 임시 수동 참고값 (source='manual')
--     고용24 API 코드 매핑 전 수동 입력 — 향후 sync 시 갱신
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id,
  goyo24_occ_code,
  goyo24_job_name,
  salary_raw,
  salary_lower,
  salary_median,
  salary_upper,
  salary_survey_year,
  job_satisfaction,
  prospect_raw,
  prospect_label,
  related_majors,
  source,
  synced_at
) values (
  (select id from public.occupation_master where slug = 'pediatrician'),
  null,
  '소아청소년과의사',
  '조사년도:2023년, 임금 하위(25%) 7000만원, 중위(50%) 10500만원, 상위(25%) 14000만원',
  7000,
  10500,
  14000,
  2023,
  78.0,
  '출생아 수 감소 추세가 있으나 아동 전문 진료 수요는 지속되어 소아청소년과 의사 수요는 당분간 유지될 전망입니다.',
  '유지',
  array[
    '의예과',
    '의학과',
    '간호학과',
    '생명과학과',
    '아동학과',
    '보건학과'
  ],
  'manual',
  now()
)
on conflict (occupation_id) do update set
  goyo24_job_name    = excluded.goyo24_job_name,
  salary_raw         = excluded.salary_raw,
  salary_lower       = excluded.salary_lower,
  salary_median      = excluded.salary_median,
  salary_upper       = excluded.salary_upper,
  salary_survey_year = excluded.salary_survey_year,
  job_satisfaction   = excluded.job_satisfaction,
  prospect_raw       = excluded.prospect_raw,
  prospect_label     = excluded.prospect_label,
  related_majors     = excluded.related_majors,
  updated_at         = now();


-- ============================================================
-- [검증] 실행 후 결과 확인
-- ============================================================
select
  child.slug,
  child.name_ko,
  child.is_active,
  child.occupation_level,
  child.is_representative,
  child.display_group,
  child.group_display_order,
  parent.slug  as parent_slug,
  parent.name_ko as parent_name,
  (select count(*) from public.occupation_summary s     where s.occupation_id = child.id) as summary_count,
  (select count(*) from public.occupation_preparations p where p.occupation_id = child.id) as prep_count,
  (select count(*) from public.occupation_student_actions a where a.occupation_id = child.id and a.stage_number = 1) as action_count,
  (select count(*) from public.occupation_goyo24_profile g where g.occupation_id = child.id) as goyo24_count
from public.occupation_master child
left join public.occupation_master parent on parent.id = child.parent_occupation_id
where child.slug = 'pediatrician';

-- 기대 결과:
-- slug=pediatrician | name_ko=소아청소년과 의사 | is_active=true
-- occupation_level=2 | is_representative=false | display_group=의사
-- group_display_order=1 | parent_slug=doctor
-- summary_count=3 | prep_count=3 | action_count=4 | goyo24_count=1

commit;
