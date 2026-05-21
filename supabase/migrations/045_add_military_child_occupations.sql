-- ====================================================
-- 045_add_military_child_occupations.sql
-- 군인 세부 직업 4개 추가
--
-- [목적]
--   대표 직업 military-soldier 아래에 세부 직업 4개를 추가한다.
--   아이가 "군인" 안에서 육군·해군·공군·해병대라는 다양한 세부 진로를
--   발견하고, 부모가 대화로 이어갈 수 있도록 콘텐츠를 구성한다.
--
-- [추가 직업]
--   army-soldier          육군 군인   group_order=1
--   navy-sailor           해군 군인   group_order=2
--   air-force-soldier     공군 군인   group_order=3
--   marine-corps-soldier  해병대 군인 group_order=4
--
-- [노출 정책]
--   /explore 대표 목록          : is_representative=false → 4개 미노출
--   /explore/military-soldier 관련 직업 더보기: 4개 노출
--   직접 진입 /explore/[slug]   : is_active=true → 가능
--
-- [변경 범위]
--   occupation_master           : INSERT 4행
--   occupation_summary          : INSERT 12행 (3 × 4직업)
--   occupation_preparations     : INSERT 12행 (3 × 4직업)
--   occupation_student_actions  : DELETE stage=1 후 INSERT 16행 (4 × 4직업)
--   occupation_goyo24_profile   : INSERT 4행
--
-- [변경하지 않는 것]
--   DB schema / RLS / auth / AI 상담 / 요금제 / 결제
--   military-soldier 대표 직업 데이터 / 기존 세부 직업 전체
--
-- [재실행 안전성]
--   occupation_master        : ON CONFLICT (slug) DO UPDATE
--   occupation_summary       : ON CONFLICT (occupation_id, layer, content_type, version_no)
--   occupation_preparations  : ON CONFLICT (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
--   occupation_student_actions: DELETE stage_number=1 후 INSERT
--   occupation_goyo24_profile: ON CONFLICT (occupation_id) DO UPDATE
--
-- [콘텐츠 원칙]
--   - 전투·무기·공격 기술 중심 표현 사용 안 함
--   - 안전·책임·협동·훈련·임무 중심 서술
--   - 초등학생 눈높이 진로 탐색 목적
-- ====================================================

begin;


-- ============================================================
-- [1] occupation_master — 세부 직업 4개 추가
-- ============================================================

-- [1-A] 육군 군인
insert into public.occupation_master (
  slug, name_ko, name_aliases, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id,
  parent_occupation_id, occupation_level, display_group, is_representative, group_display_order
) values (
  'army-soldier',
  '육군 군인',
  array['육군', '육군 군인', '육군 장병', '육군 장교', '육군 부사관', '지상군', '군인'],
  '🪖',
  '공공·안전',
  array['public_safety'],
  null, 'manual', true, 54, 'army-soldier',
  (select id from public.occupation_master where slug = 'military-soldier'),
  2, '군인', false, 1
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  name_aliases         = excluded.name_aliases,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  parent_occupation_id = excluded.parent_occupation_id,
  occupation_level     = excluded.occupation_level,
  display_group        = excluded.display_group,
  is_representative    = excluded.is_representative,
  group_display_order  = excluded.group_display_order,
  is_active            = excluded.is_active,
  legacy_occupation_id = excluded.legacy_occupation_id;

-- [1-B] 해군 군인
insert into public.occupation_master (
  slug, name_ko, name_aliases, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id,
  parent_occupation_id, occupation_level, display_group, is_representative, group_display_order
) values (
  'navy-sailor',
  '해군 군인',
  array['해군', '해군 군인', '해군 장병', '해군 장교', '해군 부사관', '함정', '바다', '군인'],
  '⚓',
  '공공·안전',
  array['public_safety'],
  null, 'manual', true, 53, 'navy-sailor',
  (select id from public.occupation_master where slug = 'military-soldier'),
  2, '군인', false, 2
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  name_aliases         = excluded.name_aliases,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  parent_occupation_id = excluded.parent_occupation_id,
  occupation_level     = excluded.occupation_level,
  display_group        = excluded.display_group,
  is_representative    = excluded.is_representative,
  group_display_order  = excluded.group_display_order,
  is_active            = excluded.is_active,
  legacy_occupation_id = excluded.legacy_occupation_id;

-- [1-C] 공군 군인
insert into public.occupation_master (
  slug, name_ko, name_aliases, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id,
  parent_occupation_id, occupation_level, display_group, is_representative, group_display_order
) values (
  'air-force-soldier',
  '공군 군인',
  array['공군', '공군 군인', '공군 장병', '공군 장교', '공군 부사관', '항공', '비행기', '군인'],
  '✈️',
  '공공·안전',
  array['public_safety'],
  null, 'manual', true, 52, 'air-force-soldier',
  (select id from public.occupation_master where slug = 'military-soldier'),
  2, '군인', false, 3
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  name_aliases         = excluded.name_aliases,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  parent_occupation_id = excluded.parent_occupation_id,
  occupation_level     = excluded.occupation_level,
  display_group        = excluded.display_group,
  is_representative    = excluded.is_representative,
  group_display_order  = excluded.group_display_order,
  is_active            = excluded.is_active,
  legacy_occupation_id = excluded.legacy_occupation_id;

-- [1-D] 해병대 군인
insert into public.occupation_master (
  slug, name_ko, name_aliases, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id,
  parent_occupation_id, occupation_level, display_group, is_representative, group_display_order
) values (
  'marine-corps-soldier',
  '해병대 군인',
  array['해병대', '해병대 군인', '해병대 장병', '해병대 장교', '해병대 부사관', '상륙', '해안', '군인'],
  '🌊',
  '공공·안전',
  array['public_safety'],
  null, 'manual', true, 51, 'marine-corps-soldier',
  (select id from public.occupation_master where slug = 'military-soldier'),
  2, '군인', false, 4
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  name_aliases         = excluded.name_aliases,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  parent_occupation_id = excluded.parent_occupation_id,
  occupation_level     = excluded.occupation_level,
  display_group        = excluded.display_group,
  is_representative    = excluded.is_representative,
  group_display_order  = excluded.group_display_order,
  is_active            = excluded.is_active,
  legacy_occupation_id = excluded.legacy_occupation_id;


-- ============================================================
-- [2] occupation_summary — 각 직업 3개씩 (총 12행)
-- ============================================================
insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  -- 육군 군인
  (
    (select id from public.occupation_master where slug = 'army-soldier'),
    'service', 'one_liner',
    '육지에서 나라와 사람들의 안전을 지키기 위해 훈련하고 임무를 수행하는 직업이에요.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'army-soldier'),
    'service', 'easy_description',
    '육군 군인은 부대 안에서 여러 사람과 협력하며 장비 관리, 이동, 훈련, 안전 임무 등 다양한 역할을 맡아요. 책임감이 강하고 팀 활동을 좋아하는 학생이 탐색해볼 수 있어요.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'army-soldier'),
    'service', 'why_this_job',
    '육군은 국방의 기반이 되는 분야로, 장교·부사관·기술병 등 다양한 역할이 있어요. 규칙을 지키고 책임감 있게 행동하고 싶은 학생이라면 탐색해볼 직업이에요.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),

  -- 해군 군인
  (
    (select id from public.occupation_master where slug = 'navy-sailor'),
    'service', 'one_liner',
    '바다와 항구, 함정을 중심으로 국가의 안전을 지키는 직업이에요.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'navy-sailor'),
    'service', 'easy_description',
    '해군 군인은 배를 안전하게 운용하고, 통신·정비·항해 등 여러 분야의 팀원들과 함께 임무를 수행해요. 침착함과 협동심, 바다와 배에 대한 관심이 있는 학생에게 잘 맞아요.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'navy-sailor'),
    'service', 'why_this_job',
    '해양 영토와 해상 안보의 중요성이 커지면서 해군의 역할이 다양해지고 있어요. 바다와 항해, 해양 기술에 관심 있는 학생이라면 진지하게 탐색해볼 수 있어요.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),

  -- 공군 군인
  (
    (select id from public.occupation_master where slug = 'air-force-soldier'),
    'service', 'one_liner',
    '하늘과 항공 장비를 중심으로 국가의 안전을 지키는 직업이에요.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'air-force-soldier'),
    'service', 'easy_description',
    '공군 군인은 항공기, 관제, 정비, 통신, 기지 운영 등 다양한 역할이 서로 연결되어 함께 움직여요. 정확하게 확인하는 습관과 기술에 대한 관심이 있는 학생에게 잘 맞아요.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'air-force-soldier'),
    'service', 'why_this_job',
    '항공 기술과 드론, 우주 관련 분야가 발전하면서 공군의 역할도 점점 다양해지고 있어요. 하늘과 기술, 정밀한 작업에 관심 있는 학생이라면 탐색해볼 직업이에요.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),

  -- 해병대 군인
  (
    (select id from public.occupation_master where slug = 'marine-corps-soldier'),
    'service', 'one_liner',
    '바다와 육지를 잇는 환경에서 임무를 수행하는 군인이에요.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'marine-corps-soldier'),
    'service', 'easy_description',
    '해병대 군인은 어려운 상황에서도 팀과 함께 움직이며 안전과 책임을 중요하게 생각해요. 기초 체력과 끈기, 협동심이 강한 학생이 탐색해볼 수 있어요.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'marine-corps-soldier'),
    'service', 'why_this_job',
    '해병대는 육군과 해군의 특성을 모두 갖춘 분야예요. 강한 체력과 팀워크를 바탕으로 도전적인 환경에서 성장하고 싶은 학생이라면 탐색해볼 직업이에요.',
    1, true, true, 'published', now(), 'import', 'manual'
  )
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;


-- ============================================================
-- [3] occupation_preparations — 각 직업 3개씩 (총 12행)
-- ============================================================
insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order, version_no,
  is_current, is_latest, status, published_at, actor_type, generation_source
) values
  -- 육군 군인
  (
    (select id from public.occupation_master where slug = 'army-soldier'),
    'service', 'mission_hint',
    '일주일 동안 매일 약속 시간을 지키는 체크표를 만들어보세요. 책임감이 어떤 느낌인지 알아갈 수 있어요.',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'army-soldier'),
    'service', 'step_action',
    '걷기·달리기·스트레칭처럼 안전한 기초 체력 활동을 꾸준히 하며 느낀 점을 짧게 기록해보기',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'army-soldier'),
    'service', 'step_action',
    '친구들과 역할을 나누어 활동하며 서로 협력하면 어떤 점이 달라지는지 이야기해보기',
    'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual'
  ),

  -- 해군 군인
  (
    (select id from public.occupation_master where slug = 'navy-sailor'),
    'service', 'mission_hint',
    '우리나라 바다와 항구를 지도에서 찾아보세요. 바다가 어떻게 우리 생활과 연결되어 있는지 생각해볼 수 있어요.',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'navy-sailor'),
    'service', 'step_action',
    '물놀이 안전수칙과 날씨 변화가 생활에 주는 영향을 가족과 함께 이야기해보기',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'navy-sailor'),
    'service', 'step_action',
    '친구들과 함께 규칙을 정하고 지키는 활동을 하며 팀워크를 연습해보기',
    'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual'
  ),

  -- 공군 군인
  (
    (select id from public.occupation_master where slug = 'air-force-soldier'),
    'service', 'mission_hint',
    '종이비행기를 접어 멀리 날아가는 이유를 관찰해보세요. 항공에 대한 관심이 자라날 수 있어요.',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'air-force-soldier'),
    'service', 'step_action',
    '비행기, 하늘, 날씨, 항공 기술에 대한 어린이 책이나 영상을 찾아보기',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'air-force-soldier'),
    'service', 'step_action',
    '준비물 체크리스트를 만들어 빠뜨린 것이 없는지 확인하는 습관을 길러보기',
    'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual'
  ),

  -- 해병대 군인
  (
    (select id from public.occupation_master where slug = 'marine-corps-soldier'),
    'service', 'mission_hint',
    '어려운 일을 끝까지 해낸 경험을 적어보세요. 끈기가 왜 중요한지 느낄 수 있어요.',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'marine-corps-soldier'),
    'service', 'step_action',
    '무리하지 않는 범위에서 걷기·줄넘기·스트레칭 같은 기초 체력 활동을 해보기',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'marine-corps-soldier'),
    'service', 'step_action',
    '친구나 가족과 협동 미션을 정하고 서로 도와 함께 해결해보기',
    'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual'
  )
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [4] occupation_student_actions — Stage 1 각 4개씩 (총 16행)
--     멱등성: DELETE stage_number=1 후 INSERT
-- ============================================================

-- [4-A] 육군 군인 stage 1 삭제
delete from public.occupation_student_actions
where occupation_id = (select id from public.occupation_master where slug = 'army-soldier')
  and stage_number = 1;

-- [4-B] 해군 군인 stage 1 삭제
delete from public.occupation_student_actions
where occupation_id = (select id from public.occupation_master where slug = 'navy-sailor')
  and stage_number = 1;

-- [4-C] 공군 군인 stage 1 삭제
delete from public.occupation_student_actions
where occupation_id = (select id from public.occupation_master where slug = 'air-force-soldier')
  and stage_number = 1;

-- [4-D] 해병대 군인 stage 1 삭제
delete from public.occupation_student_actions
where occupation_id = (select id from public.occupation_master where slug = 'marine-corps-soldier')
  and stage_number = 1;

-- [4-E] 전체 INSERT (JOIN 방식 — 035 패턴)
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
  -- 육군 군인
  ('army-soldier', 1, '지금 당장 시작하기', '하루 10분 걷기나 가벼운 운동을 하고 끝난 후 어떤 기분이었는지 짧게 적어보기',                       'explore', 15, 'all', 1),
  ('army-soldier', 1, '지금 당장 시작하기', '가족이나 친구와 역할을 나누어 작은 미션을 정하고 함께 해결해보기',                                     'make',    20, 'all', 2),
  ('army-soldier', 1, '지금 당장 시작하기', '일주일 동안 약속 시간을 지키는 체크표를 만들어 매일 체크하기',                                          'make',    10, 'all', 3),
  ('army-soldier', 1, '지금 당장 시작하기', '지도에서 산·강·도로 같은 지형을 찾아보고 이동 경로를 그려보기',                                          'explore', 15, 'all', 4),
  -- 해군 군인
  ('navy-sailor',  1, '지금 당장 시작하기', '우리나라 바다와 항구를 지도에서 찾아보기',                                                              'explore', 15, 'all', 1),
  ('navy-sailor',  1, '지금 당장 시작하기', '배가 안전하게 움직이려면 어떤 규칙이 필요할지 생각해서 적어보기',                                         'make',    15, 'all', 2),
  ('navy-sailor',  1, '지금 당장 시작하기', '날씨와 파도가 생활에 어떤 영향을 주는지 가족과 이야기해보기',                                              'explore', 15, 'all', 3),
  ('navy-sailor',  1, '지금 당장 시작하기', '가족과 함께 물놀이 안전수칙 카드를 만들어보기',                                                          'make',    20, 'all', 4),
  -- 공군 군인
  ('air-force-soldier', 1, '지금 당장 시작하기', '종이비행기를 접고 멀리 날아가는 이유를 관찰해보기',                                                 'explore', 15, 'all', 1),
  ('air-force-soldier', 1, '지금 당장 시작하기', '비행기가 뜨는 원리를 어린이 책이나 영상으로 찾아보기',                                               'explore', 15, 'all', 2),
  ('air-force-soldier', 1, '지금 당장 시작하기', '하늘 날씨를 며칠 동안 관찰하고 날마다 기록해보기',                                                  'make',    10, 'all', 3),
  ('air-force-soldier', 1, '지금 당장 시작하기', '준비물 체크리스트를 만들어 빠뜨린 것이 없는지 확인하는 습관을 연습하기',                                'make',    10, 'all', 4),
  -- 해병대 군인
  ('marine-corps-soldier', 1, '지금 당장 시작하기', '어려운 활동을 끝까지 해낸 경험을 적어보기',                                                     'explore', 15, 'all', 1),
  ('marine-corps-soldier', 1, '지금 당장 시작하기', '친구나 가족과 협동 미션을 정하고 역할을 나누어 해결해보기',                                        'make',    20, 'all', 2),
  ('marine-corps-soldier', 1, '지금 당장 시작하기', '바다와 해안에서 지켜야 할 안전수칙을 가족과 이야기해보기',                                          'explore', 15, 'all', 3),
  ('marine-corps-soldier', 1, '지금 당장 시작하기', '가벼운 체력 활동 후 쉬는 방법과 안전 규칙을 정리해보기',                                           'make',    10, 'all', 4)
) as m(slug, stage_number, stage_title, action_text, action_type, duration_minutes, grade_target, display_order)
  on om.slug = m.slug
 and om.is_active = true;


-- ============================================================
-- [5] occupation_goyo24_profile — 각 직업 수동 참고 지표 (source='manual')
--     군인 계열은 계급·군종별로 임금 편차가 크므로 보수적 추정값 사용
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id, goyo24_occ_code, goyo24_job_name,
  salary_raw, salary_lower, salary_median, salary_upper, salary_survey_year,
  job_satisfaction, prospect_raw, prospect_label, related_majors, source, synced_at
) values
  -- 육군 군인
  (
    (select id from public.occupation_master where slug = 'army-soldier'),
    null, '육군군인',
    '조사년도:2023년 (수동 입력 — 계급별 편차 큼), 임금 하위(25%) 3200만원, 중위(50%) 4800만원, 상위(25%) 6500만원',
    3200, 4800, 6500, 2023,
    72.0,
    '국방 수요의 안정성으로 직업군인 채용은 지속될 전망이며, 기술병·부사관·장교 등 다양한 직역에서 역할이 이어지고 있습니다.',
    '유지',
    array['군사학과', '국방안보학과', '체육학과', '행정학과'],
    'manual', now()
  ),
  -- 해군 군인
  (
    (select id from public.occupation_master where slug = 'navy-sailor'),
    null, '해군군인',
    '조사년도:2023년 (수동 입력 — 계급별 편차 큼), 임금 하위(25%) 3200만원, 중위(50%) 4800만원, 상위(25%) 6500만원',
    3200, 4800, 6500, 2023,
    73.0,
    '해양 영토 수호와 해상 안보의 중요성이 커지면서 해군의 역할이 다양해지고 있어 수요는 안정적으로 유지될 전망입니다.',
    '유지',
    array['군사학과', '해양학과', '해양경찰학과', '기계공학과'],
    'manual', now()
  ),
  -- 공군 군인
  (
    (select id from public.occupation_master where slug = 'air-force-soldier'),
    null, '공군군인',
    '조사년도:2023년 (수동 입력 — 계급별 편차 큼), 임금 하위(25%) 3200만원, 중위(50%) 4800만원, 상위(25%) 7000만원',
    3200, 4800, 7000, 2023,
    74.0,
    '항공 기술 발전과 드론·우주 관련 분야 확장으로 공군 기술 인력 수요가 다양해질 전망입니다.',
    '유지',
    array['군사학과', '항공운항학과', '항공정비학과', '전자공학과'],
    'manual', now()
  ),
  -- 해병대 군인
  (
    (select id from public.occupation_master where slug = 'marine-corps-soldier'),
    null, '해병대군인',
    '조사년도:2023년 (수동 입력 — 계급별 편차 큼), 임금 하위(25%) 3200만원, 중위(50%) 4800만원, 상위(25%) 6500만원',
    3200, 4800, 6500, 2023,
    72.0,
    '해병대는 육상·해상 복합 작전 수행 특성상 전문성 있는 인력 채용이 지속될 전망입니다.',
    '유지',
    array['군사학과', '국방안보학과', '체육학과', '해양학과'],
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
  parent.slug  as parent_slug,
  parent.name_ko as parent_name,
  child.slug,
  child.name_ko,
  child.occupation_level,
  child.is_representative,
  child.display_group,
  child.group_display_order,
  (select count(*) from public.occupation_summary s     where s.occupation_id = child.id) as summary_count,
  (select count(*) from public.occupation_preparations p where p.occupation_id = child.id) as prep_count,
  (select count(*) from public.occupation_student_actions a where a.occupation_id = child.id and a.stage_number = 1) as action_count,
  (select count(*) from public.occupation_goyo24_profile g where g.occupation_id = child.id) as goyo24_count
from public.occupation_master parent
join public.occupation_master child on child.parent_occupation_id = parent.id
where child.slug in ('army-soldier', 'navy-sailor', 'air-force-soldier', 'marine-corps-soldier')
order by child.group_display_order;

-- 기대 결과 (4 rows):
-- parent_slug=military-soldier | occupation_level=2 | is_representative=false | display_group=군인
-- summary_count=3 | prep_count=3 | action_count=4 | goyo24_count=1

commit;
