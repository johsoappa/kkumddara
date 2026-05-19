-- ====================================================
-- 035_add_train_driver_occupation.sql
-- 신규 직업 1개 추가: 철도 기관사 (train-driver)
--
-- [목적]
--   꿈따라 직업 탐색에 철도 기관사를 추가하고 즉시 활성화.
--   선박·항공·기계실 기관사는 이번 작업 대상이 아님.
--
-- [변경 범위]
--   occupation_master        : INSERT 1행 (is_active=true)
--   occupation_summary       : INSERT 3행 (one_liner, easy_description, why_this_job)
--   occupation_preparations  : INSERT 3행 (mission_hint, step_action ×2)
--   occupation_student_actions: DELETE(stage=1) 후 INSERT 4행
--
-- [재실행 안전성]
--   occupation_master        : ON CONFLICT (slug) DO UPDATE
--   occupation_summary       : ON CONFLICT (occupation_id, layer, content_type, version_no)
--   occupation_preparations  : ON CONFLICT (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
--   occupation_student_actions: DELETE stage_number=1 후 INSERT (멱등)
--
-- [변경하지 않는 것]
--   DB schema / RLS / TypeScript 타입 / 기존 26개 활성 직업
-- ====================================================

begin;

-- ============================================================
-- [1단계] occupation_master 추가
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
  legacy_occupation_id
) values (
  'train-driver',
  '철도 기관사',
  ARRAY['기관사', '전동차 기관사', '기차 기관사'],
  '🚂',
  '공공·안전',
  ARRAY['it'],
  NULL,
  'manual',
  true,
  60,
  'train-driver'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;


-- ============================================================
-- [2단계] occupation_summary 추가 (서비스 레이어 텍스트)
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
    (select id from public.occupation_master where slug = 'train-driver'),
    'service', 'one_liner',
    '기차와 전동차를 안전하게 운행하며 많은 사람을 제시간에 목적지로 이동시키는 직업이에요.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'train-driver'),
    'service', 'easy_description',
    '철도 기관사는 지하철·기차·고속열차 같은 다양한 열차를 운행해요. 신호와 시간표를 지키며 수백 명의 승객을 안전하게 이동시키는 책임감이 필요한 직업이에요. 집중력이 뛰어나고 규칙 지키기를 좋아하는 학생이 도전해볼 수 있어요.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'train-driver'),
    'service', 'why_this_job',
    '철도망이 넓어지고 고속열차와 자율주행 열차가 늘어나면서 철도 기관사의 역할이 달라지고 있어요. 기계와 교통 시스템에 관심 있는 학생이라면 지금부터 탐색을 시작해볼 수 있어요.',
    1, true, true, 'published', now(), 'import', 'manual'
  )
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;


-- ============================================================
-- [3단계] occupation_preparations 추가 (미션 힌트 + 활동 안내)
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
    (select id from public.occupation_master where slug = 'train-driver'),
    'service', 'mission_hint',
    '기차 노선도를 보며 출발역에서 도착역까지 걸리는 시간을 직접 계산해보세요.',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'train-driver'),
    'service', 'step_action',
    '지하철이나 기차를 탈 때 기관사가 하는 일을 관찰하고 어떤 점이 인상 깊었는지 적어보기',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'train-driver'),
    'service', 'step_action',
    '가족과 함께 기차 노선도를 보고 출발역과 도착역을 정해 소요 시간을 계산해보기',
    'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual'
  )
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [4단계] Stage 1 student_actions 추가 (멱등성 보장)
-- ============================================================
delete from public.occupation_student_actions
where occupation_id = (
  select id from public.occupation_master where slug = 'train-driver'
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
  true,
  true,
  true,
  'published',
  'human',
  'manual',
  now()
from public.occupation_master om
join (values
  ('train-driver', 1, '지금 당장 시작하기', '지하철 또는 기차 노선도를 찾아보고, 집에서 가장 가까운 역부터 멀리 떨어진 역까지 경로를 그려보기',       'explore', 15, 'all', 1),
  ('train-driver', 1, '지금 당장 시작하기', '열차 시간표를 보고 출발 시간·도착 시간·걸리는 시간을 직접 계산해보기',                               'make',    15, 'all', 2),
  ('train-driver', 1, '지금 당장 시작하기', '장난감 기차나 블록으로 역과 선로를 만들고 정차할 역 목록과 안전 규칙 3가지를 정해보기',                  'make',    20, 'all', 3),
  ('train-driver', 1, '지금 당장 시작하기', '기관사에게 필요한 능력(집중력·책임감·침착함)을 생각하고 내가 이미 갖춘 것을 적어보기',                   'explore', 10, 'all', 4)
) as m(slug, stage_number, stage_title, action_text, action_type, duration_minutes, grade_target, display_order)
  on om.slug = m.slug
 and om.is_active = true;


-- ============================================================
-- [검증] 실행 후 결과 확인
-- ============================================================
select
  om.slug,
  om.name_ko,
  om.category,
  om.interest_fields,
  om.is_active,
  (select count(*) from public.occupation_summary s     where s.occupation_id = om.id) as summary_count,
  (select count(*) from public.occupation_preparations p where p.occupation_id = om.id) as prep_count,
  (select count(*) from public.occupation_student_actions a where a.occupation_id = om.id and a.stage_number = 1) as action_count
from public.occupation_master om
where om.slug = 'train-driver';

-- 기대 결과:
-- slug         | name_ko     | category | interest_fields | is_active | summary_count | prep_count | action_count
-- train-driver | 철도 기관사  | 공공·안전 | {it}            | true      | 3             | 3          | 4

commit;
