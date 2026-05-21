-- ====================================================
-- 044_add_military_soldier_representative.sql
-- 대표 직업 "군인" (military-soldier) 신규 추가
--
-- [목적]
--   군인 직업군 세부 직업(육군·해군·공군·해병대) 추가를 위한 전제 조건으로
--   대표 직업 "군인" (slug=military-soldier)을 먼저 추가한다.
--   세부 직업은 다음 migration(045)에서 추가한다.
--
-- [핵심 정책]
--   - slug             : military-soldier
--   - occupation_level : 1 (대표 직업)
--   - is_representative: true (/explore 대표 목록 노출)
--   - parent_occupation_id: null (최상위 대표)
--   - is_active        : true
--
-- [노출 정책]
--   /explore 대표 목록   : is_representative=true → 군인 카드 노출
--   /explore/military-soldier 상세: 정상 진입 가능
--   대표 직업 수          : 54 → 55 (정상 증가)
--
-- [변경 범위]
--   occupation_master        : INSERT 1행
--   occupation_summary       : INSERT 3행 (one_liner, easy_description, why_this_job)
--   occupation_preparations  : INSERT 3행 (mission_hint, step_action ×2)
--   occupation_student_actions: DELETE(stage=1) 후 INSERT 4행
--   occupation_goyo24_profile: INSERT 1행 (source='manual')
--
-- [변경하지 않는 것]
--   DB schema / RLS / auth / AI 상담 / 요금제 / 결제
--   기존 직업 데이터 / 기존 세부 직업 (대표 직업 추가만 수행)
--
-- [재실행 안전성]
--   occupation_master        : ON CONFLICT (slug) DO UPDATE
--   occupation_summary       : ON CONFLICT (occupation_id, layer, content_type, version_no)
--   occupation_preparations  : ON CONFLICT (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
--   occupation_student_actions: DELETE stage_number=1 후 INSERT (멱등)
--   occupation_goyo24_profile: ON CONFLICT (occupation_id) DO UPDATE
--
-- [주의]
--   - 내용은 초·중학생 진로 탐색 목적이므로 전투·무기·군사적 긴장감 중심 표현 사용 안 함
--   - 병역 안내, 입대 조건, 계급별 급여를 단정하지 않음
--   - goyo24 manual profile — 군인은 직업군이 광범위해 임금 범위를 보수적으로 작성
-- ====================================================

begin;


-- ============================================================
-- [1] occupation_master — 대표 직업 "군인" 추가
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
  'military-soldier',
  '군인',
  array['군인', '직업군인', '장교', '부사관', '육군', '해군', '공군', '해병대', '국방', '국가안보'],
  '🪖',
  '공공·안전',
  array['public_safety'],
  null,
  'manual',
  true,
  55,
  'military-soldier',
  null,
  1,
  null,
  true,
  0
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  name_aliases         = excluded.name_aliases,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  is_active            = excluded.is_active,
  is_representative    = excluded.is_representative,
  occupation_level     = excluded.occupation_level,
  legacy_occupation_id = excluded.legacy_occupation_id;


-- ============================================================
-- [2] occupation_summary — 서비스 레이어 텍스트 3개
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
    (select id from public.occupation_master where slug = 'military-soldier'),
    'service', 'one_liner',
    '나라와 사람들의 안전을 지키기 위해 훈련하고 임무를 수행하는 직업이에요.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'military-soldier'),
    'service', 'easy_description',
    '군인은 육군·해군·공군·해병대처럼 다양한 분야에서 각자의 역할을 맡아 팀으로 움직이는 직업이에요. 훈련을 통해 체력과 판단력을 키우고, 규칙을 지키며 동료와 함께 임무를 완수해요. 책임감이 강하고 팀 활동을 좋아하는 학생이 탐색해볼 수 있어요.',
    1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'military-soldier'),
    'service', 'why_this_job',
    '안보와 국방의 중요성이 커지면서 전문성 있는 직업군인의 역할이 다양해지고 있어요. 공공에 기여하고 싶고 체계적인 환경에서 성장하고 싶은 학생이라면 군인이라는 직업을 진지하게 탐색해볼 수 있어요.',
    1, true, true, 'published', now(), 'import', 'manual'
  )
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;


-- ============================================================
-- [3] occupation_preparations — 미션 힌트 + 활동 안내 2개
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
    (select id from public.occupation_master where slug = 'military-soldier'),
    'service', 'mission_hint',
    '일주일 동안 매일 약속 시간을 지키는 체크표를 만들어보세요. 책임감이 군인에게 얼마나 중요한지 느껴볼 수 있어요.',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'military-soldier'),
    'service', 'step_action',
    '걷기·달리기·스트레칭처럼 안전한 기초 체력 활동을 꾸준히 하며 느낀 점을 짧게 기록해보기',
    'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'
  ),
  (
    (select id from public.occupation_master where slug = 'military-soldier'),
    'service', 'step_action',
    '친구들과 역할을 나누어 작은 팀 활동을 해보고, 협동하면 어떤 점이 달라지는지 이야기해보기',
    'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual'
  )
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [4] occupation_student_actions — Stage 1 액션 4개 (멱등성 보장)
-- ============================================================
delete from public.occupation_student_actions
where occupation_id = (
  select id from public.occupation_master where slug = 'military-soldier'
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
  ('military-soldier', 1, '지금 당장 시작하기', '하루 10분 걷기나 가벼운 운동을 하고 끝난 후 어떤 기분이었는지 짧게 적어보기',                         'explore', 15, 'all', 1),
  ('military-soldier', 1, '지금 당장 시작하기', '친구나 가족과 역할을 나누어 작은 미션을 정하고 함께 해결해보기',                                         'make',    20, 'all', 2),
  ('military-soldier', 1, '지금 당장 시작하기', '일주일 동안 약속 시간을 지키는 체크표를 만들어 매일 체크하고 끝날 때 얼마나 지켰는지 확인하기',             'make',    10, 'all', 3),
  ('military-soldier', 1, '지금 당장 시작하기', '지도에서 우리나라 산·바다·도시를 찾아보며 안전을 지키는 일이 왜 중요한지 가족과 이야기해보기',               'explore', 15, 'all', 4)
) as m(slug, stage_number, stage_title, action_text, action_type, duration_minutes, grade_target, display_order)
  on om.slug = m.slug
 and om.is_active = true;


-- ============================================================
-- [5] occupation_goyo24_profile — 수동 참고 지표 (source='manual')
--     군인은 계급·군종별로 임금 범위가 매우 다양하므로
--     보수적으로 직업군인 평균 기준 추정값을 입력하고 manual 표시.
--     향후 고용24 API 매핑 시 upsert로 갱신.
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
  (select id from public.occupation_master where slug = 'military-soldier'),
  null,
  '직업군인',
  '조사년도:2023년 (수동 입력 — 계급·군종별 편차 큼), 임금 하위(25%) 3500만원, 중위(50%) 5000만원, 상위(25%) 7000만원',
  3500,
  5000,
  7000,
  2023,
  74.0,
  '국방 및 안보 수요의 지속성으로 직업군인 채용은 안정적으로 유지될 전망이며, 전문 기술직·부사관·장교 분야의 역할이 점차 다양해지고 있습니다.',
  '유지',
  array[
    '군사학과',
    '국방안보학과',
    '체육학과',
    '행정학과',
    '기계공학과',
    '항공정비학과',
    '해양학과'
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
  om.slug,
  om.name_ko,
  om.category,
  om.interest_fields,
  om.is_active,
  om.is_representative,
  om.occupation_level,
  om.parent_occupation_id,
  (select count(*) from public.occupation_summary s     where s.occupation_id = om.id) as summary_count,
  (select count(*) from public.occupation_preparations p where p.occupation_id = om.id) as prep_count,
  (select count(*) from public.occupation_student_actions a where a.occupation_id = om.id and a.stage_number = 1) as action_count,
  (select count(*) from public.occupation_goyo24_profile g where g.occupation_id = om.id) as goyo24_count
from public.occupation_master om
where om.slug = 'military-soldier';

-- 기대 결과:
-- slug=military-soldier | name_ko=군인 | category=공공·안전 | is_active=true
-- is_representative=true | occupation_level=1 | parent_occupation_id=null
-- summary_count=3 | prep_count=3 | action_count=4 | goyo24_count=1

commit;
