-- ====================================================
-- 039_add_doctor_child_occupations.sql
-- 의사군 세부 직업 파일럿 2차: 응급의학과·정신건강의학과·영상의학과 의사
--
-- [목적]
--   pediatrician(038)에 이어 doctor 아래 세부 직업 3개를 추가한다.
--   계층 구조(occupation_level=2)와 노출 정책(is_representative=false)을
--   동일하게 적용하여 /explore 목록에는 숨기고,
--   /explore/doctor 관련 직업 더보기에만 노출한다.
--
-- [추가 직업]
--   emergency-physician  응급의학과 의사  🚑  group_order=2
--   psychiatrist         정신건강의학과 의사 🧠  group_order=3
--   radiologist          영상의학과 의사  🩻  group_order=4
--
-- [노출 정책]
--   /explore 목록           : is_representative=false → 노출 안 됨
--   /explore/doctor 더보기  : parent_occupation_id=doctor.id → 노출됨
--   /explore/[slug] 직접 진입: is_active=true → 가능
--
-- [변경 범위]
--   occupation_master         : INSERT 3행
--   occupation_summary        : INSERT 9행 (직업당 3행)
--   occupation_preparations   : INSERT 9행 (직업당 3행)
--   occupation_student_actions: DELETE(stage=1) 후 INSERT 12행 (직업당 4행)
--   occupation_goyo24_profile : INSERT 3행
--
-- [재실행 안전성]
--   occupation_master         : ON CONFLICT (slug) DO UPDATE
--   occupation_summary        : ON CONFLICT (occupation_id, layer, content_type, version_no)
--   occupation_preparations   : ON CONFLICT (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
--   occupation_student_actions: DELETE stage_number=1 후 INSERT
--   occupation_goyo24_profile : ON CONFLICT (occupation_id) DO UPDATE
-- ====================================================

begin;

-- ============================================================
-- [1] occupation_master 추가 — 3개 세부 직업
-- ============================================================

-- [1-A] 응급의학과 의사
insert into public.occupation_master (
  slug, name_ko, name_aliases, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id,
  parent_occupation_id, occupation_level, display_group, is_representative, group_display_order
) values (
  'emergency-physician',
  '응급의학과 의사',
  array['응급의학전문의', '응급실 의사', 'ER 의사'],
  '🚑',
  '의료·과학',
  array['medical'],
  null, 'manual', true, 24, 'emergency-physician',
  (select id from public.occupation_master where slug = 'doctor'),
  2, '의사', false, 2
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

-- [1-B] 정신건강의학과 의사
insert into public.occupation_master (
  slug, name_ko, name_aliases, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id,
  parent_occupation_id, occupation_level, display_group, is_representative, group_display_order
) values (
  'psychiatrist',
  '정신건강의학과 의사',
  array['정신건강의학전문의', '정신과 의사', '정신건강의학과 전문의'],
  '🧠',
  '의료·과학',
  array['medical'],
  null, 'manual', true, 23, 'psychiatrist',
  (select id from public.occupation_master where slug = 'doctor'),
  2, '의사', false, 3
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

-- [1-C] 영상의학과 의사
insert into public.occupation_master (
  slug, name_ko, name_aliases, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id,
  parent_occupation_id, occupation_level, display_group, is_representative, group_display_order
) values (
  'radiologist',
  '영상의학과 의사',
  array['영상의학전문의', '방사선과 의사', '영상의학과 전문의'],
  '🩻',
  '의료·과학',
  array['medical'],
  null, 'manual', true, 22, 'radiologist',
  (select id from public.occupation_master where slug = 'doctor'),
  2, '의사', false, 4
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
-- [2] occupation_summary 추가 — 직업당 3행 (one_liner, easy_description, why_this_job)
-- ============================================================
insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  -- 응급의학과 의사
  (
    (select id from public.occupation_master where slug = 'emergency-physician'),
    'service', 'one_liner',
    '응급 상황에서 생명을 지키는 의사입니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'emergency-physician'),
    'service', 'easy_description',
    '응급의학과 의사는 갑자기 다치거나 위험한 상태에 빠진 사람들을 빠르게 치료하는 의사입니다. 교통사고, 심장 발작, 뼈 골절처럼 즉각적인 처치가 필요한 상황에서 응급실을 지키며 환자의 생명을 살립니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'emergency-physician'),
    'service', 'why_this_job',
    '빠른 판단과 침착함, 생명을 돕고 싶은 마음이 있다면 잘 맞을 수 있습니다. 응급 상황에서 결정을 내리는 능력과 팀과 협력하는 자세를 일찍부터 연습해볼 수 있어요.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  -- 정신건강의학과 의사
  (
    (select id from public.occupation_master where slug = 'psychiatrist'),
    'service', 'one_liner',
    '마음의 어려움을 함께 살피고 돕는 의사입니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'psychiatrist'),
    'service', 'easy_description',
    '정신건강의학과 의사는 불안, 우울, 스트레스처럼 마음이 힘들 때 도움을 주는 의사입니다. 약 처방과 대화 치료를 통해 사람들이 일상으로 돌아올 수 있도록 곁에서 지원합니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'psychiatrist'),
    'service', 'why_this_job',
    '사람의 마음에 관심이 많고, 잘 듣고 공감하는 성격이라면 잘 맞을 수 있습니다. 마음 건강의 중요성이 높아지는 시대에 많은 사람에게 도움을 줄 수 있는 직업이에요.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  -- 영상의학과 의사
  (
    (select id from public.occupation_master where slug = 'radiologist'),
    'service', 'one_liner',
    'MRI·CT 같은 의료 영상을 분석해 병을 찾아내는 의사입니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'radiologist'),
    'service', 'easy_description',
    '영상의학과 의사는 엑스레이, CT, MRI 같은 의료 사진을 보고 몸 안의 이상을 발견하는 의사입니다. 직접 환자를 수술하지는 않지만, 정확한 진단으로 치료 방향을 결정하는 데 중요한 역할을 합니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'radiologist'),
    'service', 'why_this_job',
    '꼼꼼하게 관찰하고 분석하는 걸 좋아한다면 잘 맞을 수 있습니다. 의학 지식과 첨단 기술이 만나는 분야로, AI와 함께 발전하는 미래 의학에 관심 있는 아이에게도 흥미로운 직업이에요.',
    1, true, true, 'published', now(), 'import', 'manual'
  )
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;


-- ============================================================
-- [3] occupation_preparations 추가 — 직업당 3행
-- ============================================================
insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order, version_no,
  is_current, is_latest, status, published_at, actor_type, generation_source
) values
  -- 응급의학과 의사
  (
    (select id from public.occupation_master where slug = 'emergency-physician'),
    'service', 'mission_hint',
    '긴박한 상황에서도 침착하게 행동하는 연습을 해보세요. 위급한 상황에서 어떻게 도움을 요청하고 대처하는지 알아보는 것도 좋아요.',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'emergency-physician'),
    'service', 'step_action',
    '119에 신고하는 방법, 심폐소생술(CPR) 기초 등 응급처치 지식을 그림으로 정리해보기',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'emergency-physician'),
    'service', 'step_action',
    '가족이나 친구가 다쳤을 때 어떻게 도와야 하는지 상황별 대처법 카드를 만들어보기',
    'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  -- 정신건강의학과 의사
  (
    (select id from public.occupation_master where slug = 'psychiatrist'),
    'service', 'mission_hint',
    '내 감정과 친구의 감정을 잘 살피는 연습을 해보세요. 힘든 마음을 표현하고 들어주는 것이 얼마나 중요한지 느껴볼 수 있어요.',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'psychiatrist'),
    'service', 'step_action',
    '오늘 내 기분을 날씨로 표현해보고, 그 감정이 왜 생겼는지 짧게 적어보기',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'psychiatrist'),
    'service', 'step_action',
    '친구나 가족이 힘들 때 어떤 말이 도움이 될지 공감 대화 카드를 만들어보기',
    'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  -- 영상의학과 의사
  (
    (select id from public.occupation_master where slug = 'radiologist'),
    'service', 'mission_hint',
    '사진이나 그림 속 작은 차이를 찾아내는 관찰력 연습을 해보세요. 꼼꼼히 보는 능력이 영상의학과 의사의 핵심 역량이에요.',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'radiologist'),
    'service', 'step_action',
    'X선, MRI, CT가 어떤 상황에서 쓰이는지 그림과 설명으로 정리해보기',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'radiologist'),
    'service', 'step_action',
    '두 사진을 나란히 놓고 다른 점 찾기 게임으로 관찰력과 집중력을 키워보기',
    'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual'
  )
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [4] Stage 1 student_actions 추가 (멱등성 보장)
-- ============================================================

-- 응급의학과 의사
delete from public.occupation_student_actions
where occupation_id = (select id from public.occupation_master where slug = 'emergency-physician')
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
  ('emergency-physician', 1, '지금 당장 시작하기', '응급실 의사가 하루에 어떤 일을 하는지 상상해보고 하루 일정을 적어보기',                    'explore', 15, 'all', 1),
  ('emergency-physician', 1, '지금 당장 시작하기', '심폐소생술(CPR) 기본 순서를 그림으로 그려 응급처치 포스터 만들기',                          'make',    20, 'all', 2),
  ('emergency-physician', 1, '지금 당장 시작하기', '긴급한 상황에서 침착하게 행동하려면 어떤 훈련이 필요할지 생각해보기',                         'explore', 10, 'all', 3),
  ('emergency-physician', 1, '지금 당장 시작하기', '응급의학과 의사에게 필요한 능력인 빠른 판단력, 체력, 팀워크를 생각해보기',                     'explore', 10, 'all', 4)
) as m(slug, stage_number, stage_title, action_text, action_type, duration_minutes, grade_target, display_order)
  on om.slug = m.slug
 and om.is_active = true;

-- 정신건강의학과 의사
delete from public.occupation_student_actions
where occupation_id = (select id from public.occupation_master where slug = 'psychiatrist')
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
  ('psychiatrist', 1, '지금 당장 시작하기', '오늘 내 기분을 색이나 날씨로 표현해보고 왜 그런 감정이 드는지 일기에 써보기',                       'make',    15, 'all', 1),
  ('psychiatrist', 1, '지금 당장 시작하기', '힘든 상황에 있는 친구에게 해주고 싶은 말을 공감 카드로 만들어보기',                                  'make',    20, 'all', 2),
  ('psychiatrist', 1, '지금 당장 시작하기', '마음 건강을 지키는 좋은 습관(규칙적 수면, 운동, 대화)을 체크리스트로 정리해보기',                      'make',    15, 'all', 3),
  ('psychiatrist', 1, '지금 당장 시작하기', '정신건강의학과 의사에게 필요한 능력인 공감력, 경청, 전문 지식을 생각해보기',                           'explore', 10, 'all', 4)
) as m(slug, stage_number, stage_title, action_text, action_type, duration_minutes, grade_target, display_order)
  on om.slug = m.slug
 and om.is_active = true;

-- 영상의학과 의사
delete from public.occupation_student_actions
where occupation_id = (select id from public.occupation_master where slug = 'radiologist')
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
  ('radiologist', 1, '지금 당장 시작하기', '엑스레이, CT, MRI가 각각 어떤 상황에서 쓰이는지 정리해서 비교표 만들기',                            'make',    20, 'all', 1),
  ('radiologist', 1, '지금 당장 시작하기', '두 사진을 나란히 보고 다른 점 5가지 찾기로 관찰력 훈련해보기',                                       'make',    15, 'all', 2),
  ('radiologist', 1, '지금 당장 시작하기', '의학 영상이 AI로 분석되는 미래에 대해 상상해보고 짧게 글 써보기',                                     'make',    15, 'all', 3),
  ('radiologist', 1, '지금 당장 시작하기', '영상의학과 의사에게 필요한 능력인 관찰력, 집중력, 분석력을 생각해보기',                                 'explore', 10, 'all', 4)
) as m(slug, stage_number, stage_title, action_text, action_type, duration_minutes, grade_target, display_order)
  on om.slug = m.slug
 and om.is_active = true;


-- ============================================================
-- [5] occupation_goyo24_profile 추가
--     doctor profile 기반 임시 수동 참고값 (source='manual')
--     고용24 API 코드 매핑 전 수동 입력 — 향후 sync 시 갱신
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id, goyo24_occ_code, goyo24_job_name,
  salary_raw, salary_lower, salary_median, salary_upper, salary_survey_year,
  job_satisfaction, prospect_raw, prospect_label,
  related_majors, source, synced_at
) values
  -- 응급의학과 의사
  (
    (select id from public.occupation_master where slug = 'emergency-physician'),
    null,
    '응급의학과의사',
    '조사년도:2023년, 임금 하위(25%) 7500만원, 중위(50%) 11000만원, 상위(25%) 15000만원',
    7500, 11000, 15000, 2023,
    79.0,
    '응급 의료 수요는 꾸준하며, 대형 병원 중심으로 응급의학전문의 수요가 안정적으로 유지될 전망입니다.',
    '유지',
    array['의예과', '의학과', '응급구조학과', '간호학과', '보건학과'],
    'manual', now()
  ),
  -- 정신건강의학과 의사
  (
    (select id from public.occupation_master where slug = 'psychiatrist'),
    null,
    '정신건강의학과의사',
    '조사년도:2023년, 임금 하위(25%) 7000만원, 중위(50%) 10000만원, 상위(25%) 14000만원',
    7000, 10000, 14000, 2023,
    76.0,
    '정신건강 인식 개선과 치료 수요 증가로 정신건강의학과 의사에 대한 필요는 지속적으로 늘어날 전망입니다.',
    '증가',
    array['의예과', '의학과', '심리학과', '상담심리학과', '사회복지학과'],
    'manual', now()
  ),
  -- 영상의학과 의사
  (
    (select id from public.occupation_master where slug = 'radiologist'),
    null,
    '영상의학과의사',
    '조사년도:2023년, 임금 하위(25%) 8000만원, 중위(50%) 11500만원, 상위(25%) 15500만원',
    8000, 11500, 15500, 2023,
    77.0,
    'AI 의료 영상 기술 발전으로 업무 방식이 변화하고 있으나, 최종 판독 전문의 수요는 중장기적으로 유지될 전망입니다.',
    '유지',
    array['의예과', '의학과', '방사선학과', '의공학과', '생명과학과'],
    'manual', now()
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
  (select count(*) from public.occupation_summary s      where s.occupation_id = child.id) as summary_count,
  (select count(*) from public.occupation_preparations p  where p.occupation_id = child.id) as prep_count,
  (select count(*) from public.occupation_student_actions a where a.occupation_id = child.id and a.stage_number = 1) as action_count,
  (select count(*) from public.occupation_goyo24_profile g where g.occupation_id = child.id) as goyo24_count
from public.occupation_master child
left join public.occupation_master parent on parent.id = child.parent_occupation_id
where child.slug in ('emergency-physician', 'psychiatrist', 'radiologist')
order by child.group_display_order;

-- 기대 결과 (각 행):
-- occupation_level=2 | is_representative=false | display_group=의사
-- parent_slug=doctor | summary_count=3 | prep_count=3 | action_count=4 | goyo24_count=1

commit;
