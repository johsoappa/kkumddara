-- ====================================================
-- 050_add_missing_occupations_for_roadmap.sql
-- 신규 직업 12개 occupation_master 동기화
--
-- [배경]
--   src/data/occupations.ts에 신규 직업 16개가 추가됐으나
--   Production occupation_master에는 4개만 존재한다.
--   누락된 12개를 이 migration으로 삽입한다.
--
-- [이미 DB에 존재하는 4개 — 이번 migration에서 건드리지 않음]
--   counselor (심리상담사), accountant (회계사),
--   webtoon-artist (웹툰 작가), physical-therapist (물리치료사)
--
-- [이번 작업 대상 — 12개]
--   ai-service-planner, robotics-engineer,
--   clinical-laboratory-technologist, life-science-researcher,
--   nutritionist, spatial-designer, interior-designer,
--   animation-director, actor, special-education-teacher,
--   podcast-producer, airline-pilot
--
-- [idempotent 원칙]
--   occupation_master   : ON CONFLICT (slug) DO NOTHING
--                         → 기존 row 절대 덮어쓰기 없음
--   occupation_summary  : ON CONFLICT DO NOTHING
--   occupation_preparations : ON CONFLICT DO NOTHING
--
-- [airline-pilot 특이사항]
--   slug = 'airline-pilot', legacy_occupation_id = 'pilot'
--   → /explore/pilot 및 /roadmap/pilot 에서 DB 조회 가능
--   → src/data/roadmaps.ts 키('pilot')와 일치시켜 Stage 2/3 정적 데이터 호환
--
-- [변경하지 않는 것]
--   RLS / roadmap_progress / weekly_roadmap_missions
--   명따라 / 카카오 로그인 / 요금제
--   기존 4개 직업 (counselor/accountant/webtoon-artist/physical-therapist)
--
-- [재실행 안전성]
--   ON CONFLICT DO NOTHING → 중복 실행 시 기존 데이터 보존
-- ====================================================

begin;

-- ============================================================
-- [01] AI 서비스 기획자  |  IT·기술
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'ai-service-planner', 'AI 서비스 기획자', '🧩', 'IT·기술', array['it'],
  null, 'manual', true, 60, 'ai-service-planner'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'ai-service-planner'),
   'service', 'one_liner',
   '사람들이 더 편하게 사용할 수 있는 AI 서비스를 기획하고, 어떤 문제가 있는지 찾아 해결 방향을 정하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'ai-service-planner'),
   'service', 'easy_description',
   '우리가 매일 쓰는 검색엔진, 챗봇, 추천 알고리즘 — 이런 AI 서비스는 "무엇을 만들까?"를 먼저 기획하는 사람이 있어서 가능해요. AI 서비스 기획자는 사용자의 불편함을 찾고, AI가 어떻게 도울 수 있을지 방향을 잡아요. 기술보다 사람의 문제에 관심 있는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'ai-service-planner'),
   'service', 'why_this_job',
   'AI가 일상 곳곳에 스며들면서 "어떤 AI를 왜 만들지?"를 고민하는 기획자의 역할이 커지고 있어요. 논리적으로 생각하고 사람들과 소통하기를 좋아하는 학생이라면 자연스럽게 탐색하게 되는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'ai-service-planner'),
   'service', 'mission_hint',
   '집에서 불편했던 일을 3가지 적어보고, "AI가 이걸 해결해줄 수 있을까?" 생각해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'ai-service-planner'),
   'service', 'step_action',
   'ChatGPT나 클로드 같은 AI를 직접 써보며 불편하거나 신기한 점 메모하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'ai-service-planner'),
   'service', 'step_action',
   'IT 서비스 트렌드 뉴스 1개 읽고 "이 서비스가 어떤 문제를 해결하나" 한 줄로 정리하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [02] 로봇공학자  |  IT·기술
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'robotics-engineer', '로봇공학자', '🦾', 'IT·기술', array['it'],
  null, 'manual', true, 61, 'robotics-engineer'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'robotics-engineer'),
   'service', 'one_liner',
   '사람을 도와주는 로봇을 설계하고 움직임을 연구하는 일을 해요. 기계, 코딩, 과학 지식이 함께 필요해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'robotics-engineer'),
   'service', 'easy_description',
   '청소 로봇, 수술 로봇, 공장 자동화 로봇 — 이런 기계를 직접 설계하고 만드는 사람이 로봇공학자예요. 물리, 수학, 프로그래밍을 두루 배워야 하지만, 내가 만든 기계가 실제로 움직이는 순간의 보람은 특별해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'robotics-engineer'),
   'service', 'why_this_job',
   '로봇 기술은 제조업, 의료, 농업, 우주 등 거의 모든 분야에서 빠르게 성장하고 있어요. 만들고 조립하기를 좋아하고 "어떻게 움직이지?"를 궁금해하는 학생에게 잘 맞는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'robotics-engineer'),
   'service', 'mission_hint',
   '집에 있는 가전제품 중 하나를 골라 "이 기계는 어떤 원리로 움직일까?" 설명해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'robotics-engineer'),
   'service', 'step_action',
   '유튜브에서 "로봇공학" 또는 "레고 마인드스톰" 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'robotics-engineer'),
   'service', 'step_action',
   '레고, 블록 등으로 움직이는 구조물 만들어보고 어떻게 개선할 수 있는지 메모하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [03] 임상병리사  |  의료·과학
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'clinical-laboratory-technologist', '임상병리사', '🔬', '의료·과학', array['medical'],
  null, 'manual', true, 62, 'clinical-laboratory-technologist'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'clinical-laboratory-technologist'),
   'service', 'one_liner',
   '혈액, 소변, 세포 등을 검사해 몸의 상태를 확인하고 의사의 진료를 돕는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'clinical-laboratory-technologist'),
   'service', 'easy_description',
   '병원에서 채혈하거나 소변 검사를 받은 적 있나요? 그 결과를 분석하는 사람이 임상병리사예요. 현미경으로 세포를 관찰하고, 정밀한 기기로 수치를 측정해 의사에게 정확한 정보를 전달해요. 꼼꼼함과 과학에 대한 관심이 필요한 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'clinical-laboratory-technologist'),
   'service', 'why_this_job',
   '정확한 검사 결과가 올바른 진단의 시작이에요. 과학 실험을 좋아하고 섬세하게 관찰하는 걸 즐기는 학생이라면 의료 현장에서 중요한 역할을 할 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'clinical-laboratory-technologist'),
   'service', 'mission_hint',
   '건강검진 결과지를 가족과 함께 살펴보며 "이 수치는 무엇을 의미할까?" 찾아보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'clinical-laboratory-technologist'),
   'service', 'step_action',
   '"임상병리사가 하는 일" 영상이나 블로그 찾아보고 기억에 남는 내용 적기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'clinical-laboratory-technologist'),
   'service', 'step_action',
   '간단한 가정용 혈압계나 체온계 사용해보고 수치가 무엇을 의미하는지 조사하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [04] 생명과학 연구원  |  의료·과학
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'life-science-researcher', '생명과학 연구원', '🧬', '의료·과학', array['medical'],
  null, 'manual', true, 63, 'life-science-researcher'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'life-science-researcher'),
   'service', 'one_liner',
   '생물, 세포, 유전자, 환경 등을 연구하며 생명의 원리를 탐구하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'life-science-researcher'),
   'service', 'easy_description',
   '암세포가 왜 생기는지, 유전자를 어떻게 바꿀 수 있는지, 바이러스가 어떻게 퍼지는지 — 이런 생명의 비밀을 파헤치는 사람이 생명과학 연구원이에요. 호기심 하나로 수년씩 연구하는 끈기가 필요하지만, 세상을 바꾸는 발견의 주인공이 될 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'life-science-researcher'),
   'service', 'why_this_job',
   '코로나 백신 개발, 유전자 치료 등 생명과학은 인류의 건강과 직결된 분야예요. 생물 과목을 좋아하고 왜 그런 현상이 일어나는지 파고드는 학생에게 잘 맞는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'life-science-researcher'),
   'service', 'mission_hint',
   '식물 씨앗을 화분에 심고 매일 관찰 일지를 써보세요. 변화를 기록하는 것이 과학의 시작이에요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'life-science-researcher'),
   'service', 'step_action',
   'DNA와 유전자가 무엇인지 어린이 과학책이나 유튜브로 찾아보고 핵심 내용 1가지 정리하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'life-science-researcher'),
   'service', 'step_action',
   '주변에서 흥미로운 생물 현상을 찾아 "왜 이럴까?" 질문 만들어 가족에게 설명해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [05] 영양사  |  의료·과학
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'nutritionist', '영양사', '🥗', '의료·과학', array['medical'],
  null, 'manual', true, 64, 'nutritionist'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'nutritionist'),
   'service', 'one_liner',
   '사람들이 건강하게 먹을 수 있도록 식단과 영양 균형을 계획하고 관리하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'nutritionist'),
   'service', 'easy_description',
   '학교 급식이 골고루 나오는 것, 병원 환자에게 맞는 식사가 제공되는 것 — 이 모든 것이 영양사가 설계한 식단 덕분이에요. 음식과 건강의 관계를 과학적으로 이해하고 사람들이 더 잘 먹도록 돕는 일이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'nutritionist'),
   'service', 'why_this_job',
   '식품 트렌드, 건강 관리에 대한 관심이 높아지면서 영양사의 역할이 다양해지고 있어요. 요리와 건강 모두에 관심 있는 학생이라면 자연스럽게 탐색할 수 있는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'nutritionist'),
   'service', 'mission_hint',
   '오늘 먹은 식사를 떠올리며 "어떤 영양소가 들어있을까?" 가족과 이야기해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'nutritionist'),
   'service', 'step_action',
   '오늘 먹은 음식 3가지를 적고 식품 영양 정보를 찾아 각각의 주요 영양소 확인하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'nutritionist'),
   'service', 'step_action',
   '가족을 위한 건강 식단 1일치를 직접 계획해 보고, 이유와 함께 가족에게 발표해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [06] 공간 디자이너  |  예술·디자인
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'spatial-designer', '공간 디자이너', '🏛️', '예술·디자인', array['art'],
  null, 'manual', true, 65, 'spatial-designer'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'spatial-designer'),
   'service', 'one_liner',
   '사람들이 사용하는 공간을 더 편하고 아름답게 만들기 위해 구조와 분위기를 설계하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'spatial-designer'),
   'service', 'easy_description',
   '카페, 전시장, 팝업스토어처럼 특별한 공간에 들어서면 "어떻게 이런 분위기를 만들었지?" 하는 생각이 들 때가 있어요. 공간 디자이너는 사람들이 머물고 싶은 공간을 빛, 소재, 구조로 설계하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'spatial-designer'),
   'service', 'why_this_job',
   '오프라인 공간의 경험에 대한 가치가 높아지면서 공간 디자이너의 역할도 커지고 있어요. 그림 그리기, 모형 만들기, 공간을 꾸미는 걸 좋아하는 학생에게 잘 맞는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'spatial-designer'),
   'service', 'mission_hint',
   '마음에 드는 카페나 가게 사진을 찾아 "왜 이 공간이 좋은지" 이유 3가지를 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'spatial-designer'),
   'service', 'step_action',
   '집에서 가장 좋아하는 공간을 그림으로 그리고 어떻게 바꾸고 싶은지 메모하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'spatial-designer'),
   'service', 'step_action',
   '좋아하는 인테리어나 공간 디자인 사진을 5장 모아 어떤 공통점이 있는지 가족과 이야기하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [07] 인테리어 디자이너  |  예술·디자인
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'interior-designer', '인테리어 디자이너', '🛋️', '예술·디자인', array['art'],
  null, 'manual', true, 66, 'interior-designer'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'interior-designer'),
   'service', 'one_liner',
   '집, 가게, 사무실 같은 실내 공간을 목적에 맞게 꾸미고 설계하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'interior-designer'),
   'service', 'easy_description',
   '새 집에 이사하면 어떻게 꾸밀지 상상하는 게 즐거운 사람이라면 인테리어 디자이너가 잘 맞을 수 있어요. 색, 가구, 조명을 조합해 공간을 변신시키는 일이에요. 실용성과 미적 감각을 함께 갖춰야 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'interior-designer'),
   'service', 'why_this_job',
   '집을 꾸미고 생활환경을 개선하는 데 대한 관심이 높아지면서 인테리어 디자인 수요도 꾸준히 늘고 있어요. 공간 감각이 뛰어나고 꾸미는 걸 좋아하는 학생이라면 탐색해볼 만한 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'interior-designer'),
   'service', 'mission_hint',
   '내 방을 바꾼다면 어떻게 바꾸고 싶은지 그림이나 글로 아이디어를 표현해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'interior-designer'),
   'service', 'step_action',
   '인테리어 앱(오늘의집 등)이나 잡지에서 마음에 드는 방 사진을 3장 골라 이유 설명하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'interior-designer'),
   'service', 'step_action',
   '종이에 내 방 평면도를 그리고 가구를 새로 배치해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [08] 애니메이션 감독  |  예술·디자인
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'animation-director', '애니메이션 감독', '🎬', '예술·디자인', array['art'],
  null, 'manual', true, 67, 'animation-director'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'animation-director'),
   'service', 'one_liner',
   '캐릭터, 이야기, 장면, 소리 등을 조율해 애니메이션 작품을 만드는 일을 이끌어요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'animation-director'),
   'service', 'easy_description',
   '좋아하는 애니메이션의 캐릭터는 어떻게 탄생했을까요? 애니메이션 감독은 이야기를 구성하고, 캐릭터를 디자인하며, 팀 전체를 이끌어 하나의 작품을 완성해요. 스토리텔링과 그림 그리기를 모두 좋아하는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'animation-director'),
   'service', 'why_this_job',
   '글로벌 OTT 플랫폼의 성장으로 애니메이션 콘텐츠 수요가 크게 늘었어요. 영상과 이야기 만들기를 좋아하고, 내 상상 속 캐릭터를 실제로 움직이게 하고 싶은 학생이라면 탐색해볼 만한 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'animation-director'),
   'service', 'mission_hint',
   '좋아하는 애니메이션 장면 하나를 떠올리고 "이 장면에서 어떤 기분이 들었는지" 가족에게 이야기해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'animation-director'),
   'service', 'step_action',
   '좋아하는 애니메이션 캐릭터를 따라 그리거나 나만의 캐릭터를 스케치해보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'animation-director'),
   'service', 'step_action',
   '짧은 이야기(시작-중간-끝)를 만화 형식으로 4컷에 그려보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [09] 배우  |  예술·디자인
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'actor', '배우', '🎭', '예술·디자인', array['art'],
  null, 'manual', true, 68, 'actor'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'actor'),
   'service', 'one_liner',
   '연극, 영화, 드라마 등에서 인물의 감정과 이야기를 몸으로 표현하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'actor'),
   'service', 'easy_description',
   '좋아하는 드라마나 영화의 주인공처럼 되고 싶다는 꿈을 가진 학생이라면 배우라는 직업을 탐색해볼 수 있어요. 대본을 외우고, 감정을 실감나게 표현하며, 다양한 인물의 삶을 경험하는 일이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'actor'),
   'service', 'why_this_job',
   'K-드라마, K-영화의 세계적 인기로 배우라는 직업에 대한 관심이 높아지고 있어요. 표현하기를 좋아하고 사람의 감정에 공감하는 능력이 뛰어난 학생이라면 탐색해볼 만한 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'actor'),
   'service', 'mission_hint',
   '좋아하는 영화나 드라마 장면을 골라 똑같이 따라 읽어보세요. 목소리와 감정을 표현하는 연습이에요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'actor'),
   'service', 'step_action',
   '좋아하는 영화나 드라마의 명대사를 1~2줄 골라 가족 앞에서 실감나게 읽어보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'actor'),
   'service', 'step_action',
   '내가 연기하고 싶은 인물을 정하고 그 인물이 어떤 사람인지 상상해 3가지 특징 적기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [10] 특수교사  |  교육·사회
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'special-education-teacher', '특수교사', '💛', '교육·사회', array['education'],
  null, 'manual', true, 69, 'special-education-teacher'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'special-education-teacher'),
   'service', 'one_liner',
   '다양한 배움의 속도와 방법을 가진 학생들이 자신에게 맞는 방식으로 성장하도록 돕는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'special-education-teacher'),
   'service', 'easy_description',
   '모든 아이는 배우고 성장하는 속도와 방법이 달라요. 특수교사는 발달장애, 학습장애 등 다양한 어려움을 가진 학생들이 자신의 속도로 배울 수 있도록 맞춤형 교육을 제공해요. 인내심과 공감 능력이 가장 중요한 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'special-education-teacher'),
   'service', 'why_this_job',
   '모든 아이가 교육받을 권리를 가진다는 가치 위에 서 있는 직업이에요. 사람을 돕는 것에 보람을 느끼고, 다양한 방식으로 소통하는 걸 즐기는 학생이라면 탐색해볼 만한 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'special-education-teacher'),
   'service', 'mission_hint',
   '"나는 어떤 방법으로 공부할 때 가장 잘 이해되나?" 스스로 생각해보고 가족과 이야기해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'special-education-teacher'),
   'service', 'step_action',
   '"특수교육이란 무엇인가" 검색해보고 특수교사가 어떤 학생들을 돕는지 찾아보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'special-education-teacher'),
   'service', 'step_action',
   '주변에서 배움의 방법이 나와 다른 친구나 사람을 떠올리고, 어떻게 도울 수 있는지 1가지 아이디어 적기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [11] 팟캐스트 기획자  |  콘텐츠·미디어
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'podcast-producer', '팟캐스트 기획자', '🎧', '콘텐츠·미디어', array['media'],
  null, 'manual', true, 70, 'podcast-producer'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'podcast-producer'),
   'service', 'one_liner',
   '사람들이 듣고 싶어 하는 주제를 정하고, 목소리 콘텐츠의 구성과 진행을 기획하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'podcast-producer'),
   'service', 'easy_description',
   '스포티파이나 네이버 오디오클립에서 듣는 팟캐스트는 누가 어떤 주제로, 어떻게 말할지를 설계하는 기획자가 있어서 가능해요. 말하기와 콘텐츠 기획을 함께 즐기는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'podcast-producer'),
   'service', 'why_this_job',
   '오디오 콘텐츠 시장이 전 세계적으로 빠르게 성장하고 있어요. 말로 이야기를 전달하는 걸 좋아하고, 사람들이 듣고 싶은 주제가 무엇인지 고민하는 걸 즐기는 학생이라면 탐색해볼 만한 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'podcast-producer'),
   'service', 'mission_hint',
   '내가 팟캐스트를 만든다면 어떤 주제로 만들고 싶은지 제목 아이디어 3개를 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'podcast-producer'),
   'service', 'step_action',
   '좋아하는 팟캐스트나 라디오를 1편 듣고, 어떤 구성으로 진행됐는지 메모하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'podcast-producer'),
   'service', 'step_action',
   '가족에게 말하고 싶은 주제를 2분 동안 말하는 연습을 해보고 느낀 점 적기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [12] 항공기 조종사  |  항공·운송
--      slug = 'airline-pilot',  legacy_occupation_id = 'pilot'
--      → /explore/pilot, /roadmap/pilot 에서 legacy_occupation_id 기준 조회
--      → src/data/roadmaps.ts 키('pilot')와 일치시켜 Stage 2/3 정적 데이터 호환
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'airline-pilot', '항공기 조종사', '✈️', '항공·운송', array['public_safety'],
  null, 'manual', true, 71, 'pilot'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'airline-pilot'),
   'service', 'one_liner',
   '항공기를 안전하게 조종하고 승객과 화물을 목적지까지 이동시키는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'airline-pilot'),
   'service', 'easy_description',
   '하늘을 날아 다른 도시와 나라로 사람들을 안전하게 데려다주는 직업이에요. 조종사가 되려면 수백 시간의 비행 훈련과 항공 지식이 필요하지만, 하늘에서 내려다보는 세상은 특별한 보람이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'airline-pilot'),
   'service', 'why_this_job',
   '항공 여행 수요는 꾸준히 늘고 있고, 조종사 부족 현상이 전 세계적으로 이슈가 되고 있어요. 집중력이 높고 규칙을 잘 지키며 책임감 있는 학생이라면 탐색해볼 만한 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'airline-pilot'),
   'service', 'mission_hint',
   '비행기가 어떻게 하늘을 날 수 있는지 "비행기 원리" 를 검색해보고 가족에게 설명해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'airline-pilot'),
   'service', 'step_action',
   '"조종사가 되는 방법" 또는 "항공대학교"를 검색해 진로 경로를 찾아보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'airline-pilot'),
   'service', 'step_action',
   '플라이트 시뮬레이터 앱이나 유튜브 조종석 영상을 보며 어떤 장비가 있는지 3가지 찾아보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- 검증 쿼리 (migration 적용 후 SQL Editor에서 확인)
-- ============================================================

-- 1. 신규 삽입 12개 확인
select
  slug,
  name_ko,
  category,
  is_active,
  sync_status,
  legacy_occupation_id
from public.occupation_master
where slug in (
  'ai-service-planner',
  'robotics-engineer',
  'clinical-laboratory-technologist',
  'life-science-researcher',
  'nutritionist',
  'spatial-designer',
  'interior-designer',
  'animation-director',
  'actor',
  'special-education-teacher',
  'podcast-producer',
  'airline-pilot'
)
order by category, name_ko;
-- 기대: 12 rows, is_active = true, sync_status = 'manual'

-- 2. 기존 4개 overwrite 없음 확인
select
  slug,
  name_ko,
  category,
  is_active
from public.occupation_master
where slug in (
  'counselor',
  'accountant',
  'webtoon-artist',
  'physical-therapist'
)
order by slug;
-- 기대: 4 rows, 기존 name_ko/category 유지

do $$ begin
  raise notice '✅ 050: 신규 직업 12개 occupation_master 동기화 완료';
  raise notice '   ai-service-planner / robotics-engineer / clinical-laboratory-technologist';
  raise notice '   life-science-researcher / nutritionist / spatial-designer';
  raise notice '   interior-designer / animation-director / actor';
  raise notice '   special-education-teacher / podcast-producer / airline-pilot';
  raise notice '   ⚠ airline-pilot: slug=airline-pilot, legacy_occupation_id=pilot';
  raise notice '     → /explore/pilot 및 /roadmap/pilot 에서 DB 조회 가능';
end $$;

commit;
