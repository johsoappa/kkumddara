-- ====================================================
-- 040_add_police_child_occupations.sql
-- 경찰·공공안전 세부 직업군 구조 정리 및 파일럿 추가
--
-- [목적]
--   대표 직업 police-officer 아래 하위 세부 직업 4개를 구성한다.
--   기존 대표 직업 2개(coast-guard-officer, forensic-scientist)를
--   세부 직업으로 재계층화하고, 신규 2개(railway-police-officer,
--   cyber-investigator)를 추가한다.
--
-- [변경 직업]
--   기존 재계층화:
--     coast-guard-officer  해양경찰     group_order=1
--     forensic-scientist   과학수사관   group_order=2
--   신규 추가:
--     railway-police-officer  철도경찰      group_order=3
--     cyber-investigator      사이버수사관  group_order=4
--
-- [police-officer 보정]
--   interest_fields = {public_safety}
--   occupation_level=1, is_representative=true 유지
--   parent_occupation_id=null 유지
--
-- [노출 정책]
--   /explore 대표 목록    : is_representative=false → 4개 미노출
--   /explore/police-officer 관련 직업 더보기: 4개 노출
--   직접 진입             : is_active=true → 가능
--
-- [변경 범위]
--   occupation_master (UPDATE 3행, INSERT 2행)
--   occupation_summary        : INSERT 6행 (신규 2개 × 3)
--   occupation_preparations   : INSERT 6행 (신규 2개 × 3)
--   occupation_student_actions: DELETE stage=1 + INSERT 8행 (신규 2개 × 4)
--   occupation_goyo24_profile : INSERT 2행 (신규 2개)
--
-- [변경하지 않는 것]
--   DB schema / RLS / 기존 summary·prep·actions·goyo24 (coast/forensic)
--   AI 상담 로직 / 요금제 / 의사군 데이터 / 철도 기관사 데이터
--
-- [재실행 안전성]
--   occupation_master       : 명시적 UPDATE + ON CONFLICT (slug) DO UPDATE
--   occupation_summary      : ON CONFLICT (occupation_id, layer, content_type, version_no)
--   occupation_preparations : ON CONFLICT (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
--   occupation_student_actions: DELETE stage_number=1 후 INSERT
--   occupation_goyo24_profile: ON CONFLICT (occupation_id) DO UPDATE
-- ====================================================

begin;

-- ============================================================
-- [1] police-officer interest_fields 보정
--     category, is_representative, occupation_level, parent_occupation_id 유지
-- ============================================================
update public.occupation_master
set
  interest_fields     = array['public_safety'],
  display_group       = '경찰',
  group_display_order = 0
where slug = 'police-officer';


-- ============================================================
-- [2] 기존 직업 재계층화
--     coast-guard-officer → police-officer 하위
--     forensic-scientist  → police-officer 하위
-- ============================================================

update public.occupation_master
set
  parent_occupation_id = (select id from public.occupation_master where slug = 'police-officer'),
  occupation_level     = 2,
  is_representative    = false,
  display_group        = '경찰',
  group_display_order  = 1,
  category             = '공공·안전',
  interest_fields      = array['public_safety']
where slug = 'coast-guard-officer';

update public.occupation_master
set
  parent_occupation_id = (select id from public.occupation_master where slug = 'police-officer'),
  occupation_level     = 2,
  is_representative    = false,
  display_group        = '경찰',
  group_display_order  = 2,
  category             = '공공·안전',
  interest_fields      = array['public_safety']
where slug = 'forensic-scientist';


-- ============================================================
-- [3] 신규 직업 추가 — occupation_master
-- ============================================================

-- [3-A] 철도경찰
insert into public.occupation_master (
  slug, name_ko, name_aliases, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id,
  parent_occupation_id, occupation_level, display_group, is_representative, group_display_order
) values (
  'railway-police-officer',
  '철도경찰',
  array['철도 경찰관', '열차 경찰', '기차역 경찰'],
  '🚆',
  '공공·안전',
  array['public_safety'],
  null, 'manual', true, 21, 'railway-police-officer',
  (select id from public.occupation_master where slug = 'police-officer'),
  2, '경찰', false, 3
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

-- [3-B] 사이버수사관
insert into public.occupation_master (
  slug, name_ko, name_aliases, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id,
  parent_occupation_id, occupation_level, display_group, is_representative, group_display_order
) values (
  'cyber-investigator',
  '사이버수사관',
  array['사이버 경찰', '사이버범죄 수사관', '디지털 수사관'],
  '🕵️',
  '공공·안전',
  array['public_safety'],
  null, 'manual', true, 20, 'cyber-investigator',
  (select id from public.occupation_master where slug = 'police-officer'),
  2, '경찰', false, 4
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
-- [4] occupation_summary 추가 — 신규 2개 × 3행
-- ============================================================
insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  -- 철도경찰
  (
    (select id from public.occupation_master where slug = 'railway-police-officer'),
    'service', 'one_liner',
    '기차역과 열차 안의 안전을 지키는 경찰입니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'railway-police-officer'),
    'service', 'easy_description',
    '철도경찰은 기차역, 열차 안, 철도 시설에서 사람들이 안전하게 이동할 수 있도록 돕는 경찰입니다. 위험한 상황을 예방하고, 도움이 필요한 사람을 찾아 안전하게 안내합니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'railway-police-officer'),
    'service', 'why_this_job',
    '기차와 사람들의 안전에 관심이 있거나, 규칙을 지키고 침착하게 문제를 해결하는 일에 흥미가 있는 아이에게 좋은 탐색 주제가 될 수 있습니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  -- 사이버수사관
  (
    (select id from public.occupation_master where slug = 'cyber-investigator'),
    'service', 'one_liner',
    '인터넷과 디지털 공간에서 생기는 범죄 단서를 찾는 수사관입니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'cyber-investigator'),
    'service', 'easy_description',
    '사이버수사관은 인터넷, 스마트폰, 컴퓨터에서 생기는 범죄나 피해를 조사하는 사람입니다. 디지털 기록과 단서를 살펴보고 사람들이 안전하게 온라인을 이용할 수 있도록 돕습니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'cyber-investigator'),
    'service', 'why_this_job',
    '컴퓨터, 인터넷, 문제 해결에 관심이 있거나 작은 단서를 찾아내는 것을 좋아하는 아이에게 좋은 탐색 주제가 될 수 있습니다.',
    1, true, true, 'published', now(), 'import', 'manual'
  )
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;


-- ============================================================
-- [5] occupation_preparations 추가 — 신규 2개 × 3행
-- ============================================================
insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order, version_no,
  is_current, is_latest, status, published_at, actor_type, generation_source
) values
  -- 철도경찰
  (
    (select id from public.occupation_master where slug = 'railway-police-officer'),
    'service', 'mission_hint',
    '기차역이나 지하철역에서 사람들이 안전하게 이동하려면 어떤 규칙이 필요한지 가족과 함께 이야기해보세요.',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'railway-police-officer'),
    'service', 'step_action',
    '지하철역이나 기차역에서 볼 수 있는 안전 표지판을 찾아보고 의미를 정리해보기',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'railway-police-officer'),
    'service', 'step_action',
    '열차를 탈 때 지켜야 할 안전 약속 5가지를 가족과 함께 만들어보기',
    'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  -- 사이버수사관
  (
    (select id from public.occupation_master where slug = 'cyber-investigator'),
    'service', 'mission_hint',
    '온라인 공간에서도 안전한 약속이 필요합니다. 개인정보를 지키고 낯선 링크를 조심하는 방법을 알아보세요.',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'cyber-investigator'),
    'service', 'step_action',
    '안전한 비밀번호를 만들 때 필요한 조건을 가족과 함께 정리해보기',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'cyber-investigator'),
    'service', 'step_action',
    '낯선 메시지나 링크를 받았을 때 어떻게 행동해야 하는지 안전 규칙표를 만들어보기',
    'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual'
  )
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [6] Stage 1 student_actions 추가 (멱등성 보장) — 신규 2개
-- ============================================================

-- 철도경찰
delete from public.occupation_student_actions
where occupation_id = (select id from public.occupation_master where slug = 'railway-police-officer')
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
  ('railway-police-officer', 1, '지금 당장 시작하기', '기차역이나 지하철역에서 볼 수 있는 안전 표지판을 찾아보기',                        'explore', 15, 'all', 1),
  ('railway-police-officer', 1, '지금 당장 시작하기', '열차를 탈 때 지켜야 할 안전 약속 5가지를 카드로 만들어보기',                         'make',    20, 'all', 2),
  ('railway-police-officer', 1, '지금 당장 시작하기', '역에서 길을 잃은 사람을 도와주는 안내 역할 놀이를 해보기',                            'make',    15, 'all', 3),
  ('railway-police-officer', 1, '지금 당장 시작하기', '철도경찰에게 필요한 능력인 관찰력, 책임감, 침착함을 생각해보기',                       'explore', 10, 'all', 4)
) as m(slug, stage_number, stage_title, action_text, action_type, duration_minutes, grade_target, display_order)
  on om.slug = m.slug
 and om.is_active = true;

-- 사이버수사관
delete from public.occupation_student_actions
where occupation_id = (select id from public.occupation_master where slug = 'cyber-investigator')
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
  ('cyber-investigator', 1, '지금 당장 시작하기', '온라인에서 개인정보를 지켜야 하는 이유를 가족과 이야기해보기',                            'explore', 15, 'all', 1),
  ('cyber-investigator', 1, '지금 당장 시작하기', '안전한 인터넷 사용 약속표를 만들어보기',                                                   'make',    20, 'all', 2),
  ('cyber-investigator', 1, '지금 당장 시작하기', '수상한 메시지나 링크를 받았을 때의 대처 방법을 순서도로 그려보기',                          'make',    15, 'all', 3),
  ('cyber-investigator', 1, '지금 당장 시작하기', '사이버수사관에게 필요한 능력인 관찰력, 책임감, 문제 해결력을 생각해보기',                    'explore', 10, 'all', 4)
) as m(slug, stage_number, stage_title, action_text, action_type, duration_minutes, grade_target, display_order)
  on om.slug = m.slug
 and om.is_active = true;


-- ============================================================
-- [7] occupation_goyo24_profile 추가 — 신규 2개
--     기존 공공·안전 직업 profile 기반 임시 수동 참고값 (source='manual')
--     고용24 API 코드 매핑 전 수동 입력 — 향후 sync 시 갱신
-- ============================================================
insert into public.occupation_goyo24_profile (
  occupation_id, goyo24_occ_code, goyo24_job_name,
  salary_raw, salary_lower, salary_median, salary_upper, salary_survey_year,
  job_satisfaction, prospect_raw, prospect_label,
  related_majors, source, synced_at
) values
  -- 철도경찰
  (
    (select id from public.occupation_master where slug = 'railway-police-officer'),
    null,
    '철도경찰',
    '조사년도:2023년, 임금 하위(25%) 3800만원, 중위(50%) 5200만원, 상위(25%) 6800만원',
    3800, 5200, 6800, 2023,
    75.0,
    '철도망 확충 및 이용객 증가에 따라 철도 안전 인력 수요는 안정적으로 유지될 전망입니다.',
    '유지',
    array['경찰행정학과', '철도경영학과', '교통공학과', '법학과', '행정학과'],
    'manual', now()
  ),
  -- 사이버수사관
  (
    (select id from public.occupation_master where slug = 'cyber-investigator'),
    null,
    '사이버수사관',
    '조사년도:2023년, 임금 하위(25%) 4000만원, 중위(50%) 5500만원, 상위(25%) 7200만원',
    4000, 5500, 7200, 2023,
    78.0,
    '사이버 범죄 유형이 다양해지고 피해 규모가 커지면서 디지털 수사 전문 인력에 대한 수요는 지속적으로 증가할 전망입니다.',
    '증가',
    array['경찰행정학과', '사이버보안학과', '정보보호학과', '컴퓨터공학과', '디지털포렌식학과'],
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

-- 1. police-officer 하위 세부 직업 전체 확인
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
where parent.slug = 'police-officer'
order by child.group_display_order, child.name_ko;

-- 기대 결과:
-- coast-guard-officer / 해양경찰     / level=2 / rep=false / order=1 / parent_slug=police-officer
-- forensic-scientist  / 과학수사관   / level=2 / rep=false / order=2 / parent_slug=police-officer
-- railway-police-officer / 철도경찰  / level=2 / rep=false / order=3 / parent_slug=police-officer / sum=3, prep=3, act=4, goyo=1
-- cyber-investigator  / 사이버수사관 / level=2 / rep=false / order=4 / parent_slug=police-officer / sum=3, prep=3, act=4, goyo=1

-- 2. 대표 목록 수 확인
select count(*) as representative_active_count
from public.occupation_master
where is_active = true
  and is_representative = true;
-- 기대값: 기존 대표 수 - 2 (coast-guard-officer + forensic-scientist 전환)

-- 3. 전체 세부 직업 수 확인
select count(*) as child_occupation_count
from public.occupation_master
where parent_occupation_id is not null;
-- 기대값: 8 (의사군 4 + 경찰군 4)

-- 4. police-officer interest_fields 확인
select slug, name_ko, category, interest_fields, occupation_level, is_representative
from public.occupation_master
where slug = 'police-officer';
-- 기대값: interest_fields={public_safety}, level=1, rep=true

commit;
