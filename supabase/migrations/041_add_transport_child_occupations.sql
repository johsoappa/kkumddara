-- ====================================================
-- 041_add_transport_child_occupations.sql
-- 교통·운송 세부 직업군 파일럿: 철도 기관사 하위 직업 2개 추가
--
-- [목적]
--   대표 직업 train-driver(철도 기관사) 아래에 세부 직업 2개를 추가한다.
--   의사군·경찰군 파일럿에 이어 교통·운송 직업군의 계층화를 검증한다.
--
-- [추가 직업]
--   train-controller            열차 관제사   🚦  group_order=1
--   railway-maintenance-technician 철도 정비원 🛠️  group_order=2
--
-- [중복 방지]
--   railway-police-officer(철도경찰)는 police-officer 하위로 이미 존재.
--   train-driver 하위에 중복 연결하지 않는다.
--
-- [노출 정책]
--   /explore 대표 목록       : is_representative=false → 2개 미노출
--   /explore/train-driver 더보기: 2개 노출
--   직접 진입                 : is_active=true → 가능
--
-- [변경 범위]
--   occupation_master          : INSERT 2행
--   occupation_summary         : INSERT 6행 (직업당 3행)
--   occupation_preparations    : INSERT 6행 (직업당 3행)
--   occupation_student_actions : DELETE stage=1 + INSERT 8행 (직업당 4행)
--   occupation_goyo24_profile  : INSERT 2행
--
-- [변경하지 않는 것]
--   DB schema / RLS / 기존 train-driver 데이터
--   의사군·경찰군 데이터 / AI 상담 / 요금제 / auth
--
-- [재실행 안전성]
--   occupation_master          : ON CONFLICT (slug) DO UPDATE
--   occupation_summary         : ON CONFLICT (occupation_id, layer, content_type, version_no)
--   occupation_preparations    : ON CONFLICT (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
--   occupation_student_actions : DELETE stage_number=1 후 INSERT
--   occupation_goyo24_profile  : ON CONFLICT (occupation_id) DO UPDATE
-- ====================================================

begin;

-- ============================================================
-- [1] occupation_master 추가 — 2개 세부 직업
-- ============================================================

-- [1-A] 열차 관제사
insert into public.occupation_master (
  slug, name_ko, name_aliases, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id,
  parent_occupation_id, occupation_level, display_group, is_representative, group_display_order
) values (
  'train-controller',
  '열차 관제사',
  array['철도 관제사', '열차 운행 관제사', '철도교통 관제사'],
  '🚦',
  '공공·안전',
  array['public_safety'],
  null, 'manual', true, 19, 'train-controller',
  (select id from public.occupation_master where slug = 'train-driver'),
  2, '철도', false, 1
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

-- [1-B] 철도 정비원
insert into public.occupation_master (
  slug, name_ko, name_aliases, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id,
  parent_occupation_id, occupation_level, display_group, is_representative, group_display_order
) values (
  'railway-maintenance-technician',
  '철도 정비원',
  array['철도차량 정비원', '열차 정비원', '철도 설비 정비원'],
  '🛠️',
  'IT·기술',
  array['it'],
  null, 'manual', true, 18, 'railway-maintenance-technician',
  (select id from public.occupation_master where slug = 'train-driver'),
  2, '철도', false, 2
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
-- [2] occupation_summary 추가 — 2개 × 3행
-- ============================================================
insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  -- 열차 관제사
  (
    (select id from public.occupation_master where slug = 'train-controller'),
    'service', 'one_liner',
    '여러 열차가 안전하게 움직이도록 운행 흐름을 조정하는 직업입니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'train-controller'),
    'service', 'easy_description',
    '열차 관제사는 기차가 정해진 시간과 선로에 맞게 안전하게 움직이도록 확인하는 사람입니다. 여러 열차의 위치와 상황을 살피며, 문제가 생기지 않도록 운행 흐름을 조정합니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'train-controller'),
    'service', 'why_this_job',
    '기차, 시간표, 지도, 교통 시스템에 관심이 있거나 여러 상황을 차분히 살피고 판단하는 일을 좋아하는 아이에게 좋은 탐색 주제가 될 수 있습니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  -- 철도 정비원
  (
    (select id from public.occupation_master where slug = 'railway-maintenance-technician'),
    'service', 'one_liner',
    '기차와 철도 장비가 안전하게 움직이도록 점검하고 고치는 직업입니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'railway-maintenance-technician'),
    'service', 'easy_description',
    '철도 정비원은 열차, 선로, 신호 장치 같은 철도 시설이 안전하게 작동하는지 점검하는 사람입니다. 문제가 생기지 않도록 미리 살피고, 필요한 부분을 고쳐 열차가 안전하게 운행되도록 돕습니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'railway-maintenance-technician'),
    'service', 'why_this_job',
    '기계, 도구, 고치기, 만들기에 관심이 있거나 작은 문제를 찾아 해결하는 일을 좋아하는 아이에게 좋은 탐색 주제가 될 수 있습니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  )
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;


-- ============================================================
-- [3] occupation_preparations 추가 — 2개 × 3행
-- ============================================================
insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order, version_no,
  is_current, is_latest, status, published_at, actor_type, generation_source
) values
  -- 열차 관제사
  (
    (select id from public.occupation_master where slug = 'train-controller'),
    'service', 'mission_hint',
    '여러 열차가 안전하게 움직이려면 시간표, 위치, 신호를 함께 살펴야 합니다. 가족과 함께 노선도와 시간표를 보며 운행 흐름을 생각해보세요.',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'train-controller'),
    'service', 'step_action',
    '지하철이나 기차 노선도를 보고 출발역에서 도착역까지 가는 경로를 정리해보기',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'train-controller'),
    'service', 'step_action',
    '열차 시간표를 보고 출발 시간, 도착 시간, 걸리는 시간을 계산해보기',
    'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  -- 철도 정비원
  (
    (select id from public.occupation_master where slug = 'railway-maintenance-technician'),
    'service', 'mission_hint',
    '안전한 열차 운행 뒤에는 보이지 않는 점검과 정비가 있습니다. 주변 물건을 관찰하며 고장이나 점검이 왜 중요한지 생각해보세요.',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'railway-maintenance-technician'),
    'service', 'step_action',
    '자전거, 장난감, 가방처럼 자주 쓰는 물건을 관찰하고 점검할 부분을 찾아보기',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'railway-maintenance-technician'),
    'service', 'step_action',
    '기차가 안전하게 움직이려면 어떤 부분을 점검해야 할지 그림으로 그려보기',
    'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual'
  )
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [4] Stage 1 student_actions 추가 (멱등성 보장) — 2개
-- ============================================================

-- 열차 관제사
delete from public.occupation_student_actions
where occupation_id = (select id from public.occupation_master where slug = 'train-controller')
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
  ('train-controller', 1, '지금 당장 시작하기', '지하철이나 기차 노선도를 보고 여러 열차가 어떻게 움직일지 상상해보기',           'explore', 15, 'all', 1),
  ('train-controller', 1, '지금 당장 시작하기', '출발역과 도착역을 정하고 이동 경로와 걸리는 시간을 표로 만들어보기',             'make',    20, 'all', 2),
  ('train-controller', 1, '지금 당장 시작하기', '열차가 늦어졌을 때 어떤 안내가 필요할지 상황 카드를 만들어보기',                 'make',    15, 'all', 3),
  ('train-controller', 1, '지금 당장 시작하기', '열차 관제사에게 필요한 능력인 집중력, 판단력, 책임감을 생각해보기',               'explore', 10, 'all', 4)
) as m(slug, stage_number, stage_title, action_text, action_type, duration_minutes, grade_target, display_order)
  on om.slug = m.slug
 and om.is_active = true;

-- 철도 정비원
delete from public.occupation_student_actions
where occupation_id = (select id from public.occupation_master where slug = 'railway-maintenance-technician')
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
  ('railway-maintenance-technician', 1, '지금 당장 시작하기', '기차가 안전하게 달리기 위해 점검해야 할 부분을 가족과 이야기해보기',      'explore', 15, 'all', 1),
  ('railway-maintenance-technician', 1, '지금 당장 시작하기', '자주 쓰는 물건 하나를 정해 점검표를 만들어보기',                         'make',    20, 'all', 2),
  ('railway-maintenance-technician', 1, '지금 당장 시작하기', '장난감 기차나 블록으로 열차와 선로를 만들고 고장 상황을 해결해보기',       'make',    15, 'all', 3),
  ('railway-maintenance-technician', 1, '지금 당장 시작하기', '철도 정비원에게 필요한 능력인 관찰력, 꼼꼼함, 문제 해결력을 생각해보기',   'explore', 10, 'all', 4)
) as m(slug, stage_number, stage_title, action_text, action_type, duration_minutes, grade_target, display_order)
  on om.slug = m.slug
 and om.is_active = true;


-- ============================================================
-- [5] occupation_goyo24_profile 추가 — 2개
--     철도 기관사 및 교통·기술 직업 profile 기반 임시 수동 참고값 (source='manual')
--     고용24 API 코드 매핑 전 수동 입력 — 향후 sync 시 갱신
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id, goyo24_occ_code, goyo24_job_name,
  salary_raw, salary_lower, salary_median, salary_upper, salary_survey_year,
  job_satisfaction, prospect_raw, prospect_label,
  related_majors, source, synced_at
) values
  -- 열차 관제사
  (
    (select id from public.occupation_master where slug = 'train-controller'),
    null,
    '열차관제사',
    '조사년도:2023년, 임금 하위(25%) 4000만원, 중위(50%) 5500만원, 상위(25%) 7000만원',
    4000, 5500, 7000, 2023,
    76.0,
    '철도망 확충과 고속철도 운행 증가에 따라 열차 관제 인력 수요는 안정적으로 유지될 전망입니다.',
    '유지',
    array['철도교통학과', '교통공학과', '철도운전학과', '철도경영학과', '전기공학과'],
    'manual', now()
  ),
  -- 철도 정비원
  (
    (select id from public.occupation_master where slug = 'railway-maintenance-technician'),
    null,
    '철도차량정비원',
    '조사년도:2023년, 임금 하위(25%) 3800만원, 중위(50%) 5200만원, 상위(25%) 6800만원',
    3800, 5200, 6800, 2023,
    74.0,
    '노후 철도차량 교체와 신규 노선 개통에 따라 철도 정비 인력 수요는 꾸준히 유지될 전망입니다.',
    '유지',
    array['철도차량시스템학과', '기계공학과', '전기공학과', '자동차공학과', '철도전기시스템학과'],
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

-- 1. train-driver 하위 세부 직업 확인
select
  child.slug,
  child.name_ko,
  child.occupation_level,
  child.is_representative,
  child.display_group,
  child.group_display_order,
  parent.slug as parent_slug,
  (select count(*) from public.occupation_summary s      where s.occupation_id = child.id) as summary_count,
  (select count(*) from public.occupation_preparations p  where p.occupation_id = child.id) as prep_count,
  (select count(*) from public.occupation_student_actions a where a.occupation_id = child.id and a.stage_number = 1) as action_count,
  (select count(*) from public.occupation_goyo24_profile g where g.occupation_id = child.id) as goyo24_count
from public.occupation_master parent
join public.occupation_master child on child.parent_occupation_id = parent.id
where parent.slug = 'train-driver'
order by child.group_display_order;

-- 기대 결과:
-- train-controller              / level=2 / rep=false / order=1 / sum=3 / prep=3 / act=4 / goyo=1
-- railway-maintenance-technician / level=2 / rep=false / order=2 / sum=3 / prep=3 / act=4 / goyo=1

-- 2. 대표 목록 수 유지 확인
select count(*) as representative_active_count
from public.occupation_master
where is_active = true
  and is_representative = true;
-- 기대값: 이번 작업 전과 동일 (신규 2개 is_representative=false이므로 변화 없음)

-- 3. 전체 세부 직업 수 확인
select count(*) as child_occupation_count
from public.occupation_master
where parent_occupation_id is not null;
-- 기대값: 10 (의사군 4 + 경찰군 4 + 철도군 2)

-- 4. 철도경찰 중복 연결 방지 확인
select child.slug, child.name_ko, parent.slug as parent_slug
from public.occupation_master child
left join public.occupation_master parent on parent.id = child.parent_occupation_id
where child.slug = 'railway-police-officer';
-- 기대값: parent_slug = police-officer (변화 없음)

commit;
