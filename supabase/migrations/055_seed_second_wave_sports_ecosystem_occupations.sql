-- ====================================================
-- 055_seed_second_wave_sports_ecosystem_occupations.sql
-- 2차 확장 직업 10개 (스포츠 진로 생태계) bulk insert
--
-- [목적]
--   occupation-100 확장 계획 2차 후보 10개 (스포츠 진로 생태계)를
--   occupation_master / occupation_summary / occupation_preparations 에 삽입한다.
--   이번 migration으로 대표 직업 90개 → 100개 달성 목표.
--
-- [대상 테이블 — 이번 migration에서만 변경]
--   occupation_master       : 10개 신규 직업 행 추가
--   occupation_summary      : 10 × 3 = 30행 (one_liner, easy_description, why_this_job)
--   occupation_preparations : 10 × 3 = 30행 (mission_hint, step_action×2)
--
-- [변경하지 않는 것]
--   occupation_goyo24_profile / quizData.ts / roadmaps.ts
--   weekly_roadmap_missions / src/app / src/components
--   RLS / Auth / 요금제 / 명따라 Phase 2 설정
--   기존 직업 row (ON CONFLICT DO NOTHING으로 보호)
--
-- [직업 목록 — 10개, priority 95~104]
--   IT·기술       (2): sports-data-analyst, sports-tech-developer
--   의료·과학     (1): exercise-prescription-specialist
--   콘텐츠·미디어 (1): sports-content-planner
--   비즈니스·경영 (1): sports-marketer
--   교육·사회     (1): youth-sports-coach
--   환경·미래산업 (2): outdoor-leisure-planner, marine-leisure-specialist
--   공공·안전     (2): sports-safety-manager, water-safety-lifeguard
--
-- [중복 확인]
--   sports-content-planner vs sports-commentator : 콘텐츠 기획자 vs 해설가, 역할 다름 (중복 아님)
--   youth-sports-coach vs youth-worker           : 체육 특화 지도 vs 청소년 활동 전반 (중복 아님)
--   marine-leisure-specialist vs marine-corps-soldier : 해양레저 산업 vs 군인, 무관 (중복 아님)
--
-- [기획 방향]
--   운동선수가 되지 못해도 스포츠 분야 안에서 다양한 직업을 발견할 수 있도록
--   데이터, 기술, 건강, 지도, 콘텐츠, 마케팅, 안전, 레저 직업군으로 구성.
--
-- [idempotent 원칙]
--   occupation_master       : ON CONFLICT (slug) DO NOTHING
--   occupation_summary      : ON CONFLICT (occupation_id, layer, content_type, version_no) DO NOTHING
--   occupation_preparations : ON CONFLICT (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) DO NOTHING
--
-- [재실행 안전성]
--   모든 INSERT에 ON CONFLICT DO NOTHING 적용 → 중복 실행 시 기존 데이터 보존
--
-- [Production 적용]
--   Claude Code는 Production DB에 직접 실행하지 않음.
--   OZ가 Supabase SQL Editor (service_role 키)에서 직접 실행.
-- ====================================================

begin;

-- ============================================================
-- [01] 스포츠 데이터 분석가  |  IT·기술
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'sports-data-analyst', '스포츠 데이터 분석가', '📊', 'IT·기술', array['it'],
  null, 'manual', true, 95, 'sports-data-analyst'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'sports-data-analyst'),
   'service', 'one_liner',
   '경기 기록, 선수 움직임, 팀 전략 데이터를 분석해 경기 흐름을 이해하고 개선점을 찾는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-data-analyst'),
   'service', 'easy_description',
   '득점 기록, 패스 성공률, 선수 이동 경로 같은 수많은 데이터를 모아 패턴을 찾고 분석해요. 분석 결과는 코치와 감독의 전략 결정에 도움을 주거나, 선수 성과 평가에 활용돼요. 스포츠를 좋아하면서 숫자와 자료 분석을 즐기는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-data-analyst'),
   'service', 'why_this_job',
   '스포츠 산업이 커지면서 데이터 기반 전략의 중요성이 높아지고 있어요. 좋아하는 운동 분야에서 분석 역량을 발휘할 수 있는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'sports-data-analyst'),
   'service', 'mission_hint',
   '좋아하는 운동의 경기 결과를 2주 동안 기록해보세요. 득점, 실점, 주요 장면을 메모하는 것이 스포츠 데이터 분석의 첫 걸음이에요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-data-analyst'),
   'service', 'step_action',
   '좋아하는 팀의 최근 경기 기록을 찾아 가장 인상적인 수치 3가지를 정리하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-data-analyst'),
   'service', 'step_action',
   '스포츠 데이터 분석가가 하는 일을 담은 유튜브 영상이나 기사 1개를 찾아 읽기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [02] 스포츠 테크 개발자  |  IT·기술
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'sports-tech-developer', '스포츠 테크 개발자', '⚙️', 'IT·기술', array['it'],
  null, 'manual', true, 96, 'sports-tech-developer'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'sports-tech-developer'),
   'service', 'one_liner',
   '운동 앱, 웨어러블 기기, 경기 분석 시스템 등 스포츠와 기술을 연결하는 소프트웨어와 도구를 만들어요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-tech-developer'),
   'service', 'easy_description',
   '운동량을 측정하는 스마트워치 앱, 선수 움직임을 분석하는 카메라 시스템, 경기 전략을 시각화하는 소프트웨어 등을 개발해요. 스포츠를 더 즐겁고 안전하게 만드는 기술을 설계하고 구현하는 일이에요. 코딩과 스포츠 두 가지를 모두 좋아하는 학생이라면 탐색해볼 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-tech-developer'),
   'service', 'why_this_job',
   '스포츠 분야에서 AI, 센서, 빅데이터 기술 활용이 늘어나면서 관련 기술 개발 수요도 함께 커지고 있어요. 운동을 기술로 풀어내는 융합형 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'sports-tech-developer'),
   'service', 'mission_hint',
   '좋아하는 운동을 더 재미있게 즐길 수 있는 앱 아이디어를 1개 떠올리고, 어떤 기능이 있으면 좋겠는지 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-tech-developer'),
   'service', 'step_action',
   '운동할 때 쓰는 앱이나 기기(스마트워치, 운동 앱 등)를 조사하고 어떤 데이터를 기록하는지 정리하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-tech-developer'),
   'service', 'step_action',
   '"스포츠 테크" 또는 "운동 앱 개발"을 검색해 어떤 분야인지 알아보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [03] 운동처방사  |  의료·과학
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'exercise-prescription-specialist', '운동처방사', '💪', '의료·과학', array['medical'],
  null, 'manual', true, 97, 'exercise-prescription-specialist'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'exercise-prescription-specialist'),
   'service', 'one_liner',
   '사람의 건강 상태와 체력 수준에 맞는 운동 방법을 설계하고 건강 관리를 돕는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'exercise-prescription-specialist'),
   'service', 'easy_description',
   '몸 상태를 먼저 파악한 뒤 그 사람에게 맞는 운동 종류, 강도, 횟수를 설계해요. 체력이 약한 사람, 재활 중인 사람, 건강을 유지하고 싶은 사람 모두에게 도움을 줄 수 있어요. 건강, 과학, 운동을 모두 좋아하는 학생에게 잘 맞는 분야예요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'exercise-prescription-specialist'),
   'service', 'why_this_job',
   '건강 관리에 대한 관심이 높아지면서 개인 맞춤형 운동 설계를 전문으로 하는 전문가 수요가 커지고 있어요. 국가자격(건강운동관리사 등)과 연결된 직업이라 경력 경로가 비교적 명확해요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'exercise-prescription-specialist'),
   'service', 'mission_hint',
   '가족 중 한 명과 함께 하루 운동량을 기록해보세요. 걷기, 계단 이용, 스트레칭 시간을 메모하면서 건강과 운동의 관계를 생각해보는 게 첫 걸음이에요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'exercise-prescription-specialist'),
   'service', 'step_action',
   '"운동처방사" 또는 "건강운동관리사"를 검색해 어떤 자격이 있고 어디서 일하는지 알아보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'exercise-prescription-specialist'),
   'service', 'step_action',
   '체력 측정 항목(심폐지구력, 근력, 유연성 등)이 무엇인지 조사하고 간단하게 직접 측정해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [04] 스포츠 콘텐츠 기획자  |  콘텐츠·미디어
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'sports-content-planner', '스포츠 콘텐츠 기획자', '🎬', '콘텐츠·미디어', array['media'],
  null, 'manual', true, 98, 'sports-content-planner'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'sports-content-planner'),
   'service', 'one_liner',
   '경기, 선수, 운동 이야기를 영상·숏폼·카드뉴스 같은 콘텐츠로 기획하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-content-planner'),
   'service', 'easy_description',
   '어떤 내용을 어떤 형식으로 만들지 구상하고, 촬영·편집·발행 일정을 계획하는 역할이에요. 스포츠 지식과 기획력, 사람들에게 재미있게 전달하는 능력이 필요해요. 스포츠 해설가(경기 중계·해설)와는 다르게, 사전에 콘텐츠를 설계하고 제작 방향을 결정하는 일에 집중해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-content-planner'),
   'service', 'why_this_job',
   '스포츠 콘텐츠 시장이 유튜브, 숏폼, SNS 중심으로 빠르게 성장하고 있어요. 운동을 좋아하면서 이야기를 만들고 기획하는 것을 즐기는 학생이라면 탐색해볼 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'sports-content-planner'),
   'service', 'mission_hint',
   '좋아하는 선수나 경기에 관한 숏폼 영상 아이디어를 1개 기획해보세요. 제목, 내용, 장면 구성을 간단히 메모하는 게 콘텐츠 기획의 시작이에요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-content-planner'),
   'service', 'step_action',
   '스포츠 관련 유튜브 채널 1개를 찾아 콘텐츠가 어떤 주제로 기획되었는지 3가지 정리하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-content-planner'),
   'service', 'step_action',
   '좋아하는 운동 장면을 짧게 소개하는 카드뉴스 1장(주제+핵심 내용+이미지 설명)을 직접 구성해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [05] 스포츠 마케터  |  비즈니스·경영
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'sports-marketer', '스포츠 마케터', '📣', '비즈니스·경영', array['business'],
  null, 'manual', true, 99, 'sports-marketer'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'sports-marketer'),
   'service', 'one_liner',
   '스포츠 구단, 선수, 브랜드, 대회의 가치를 알리고 팬과 연결하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-marketer'),
   'service', 'easy_description',
   '경기 홍보 자료를 만들고, 팬과 소통하는 이벤트를 기획하고, 스포츠 브랜드가 사람들에게 잘 알려지도록 전략을 세워요. 스포츠에 대한 관심과 함께 기획력, 소통 능력이 중요해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-marketer'),
   'service', 'why_this_job',
   '스포츠 산업 규모가 커지면서 구단, 선수, 스포츠 관련 브랜드의 마케팅 수요도 함께 늘고 있어요. 스포츠를 좋아하면서 사람들과 소통하고 기획하는 일에 관심 있는 학생이라면 탐색해볼 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'sports-marketer'),
   'service', 'mission_hint',
   '좋아하는 스포츠 팀이나 선수를 더 많은 사람에게 알릴 수 있는 아이디어를 3가지 적어보세요. 어떤 방식으로 알리면 좋을지 생각해보는 게 마케팅의 시작이에요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-marketer'),
   'service', 'step_action',
   '좋아하는 구단 또는 스포츠 브랜드의 SNS를 1개 찾아 어떤 내용으로 팬과 소통하는지 살펴보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-marketer'),
   'service', 'step_action',
   '스포츠 행사 홍보물(포스터, 영상, 배너)을 1개 찾아 어떤 메시지를 전달하려 했는지 정리하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [06] 유소년 스포츠 지도자  |  교육·사회
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'youth-sports-coach', '유소년 스포츠 지도자', '🏃', '교육·사회', array['education'],
  null, 'manual', true, 100, 'youth-sports-coach'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'youth-sports-coach'),
   'service', 'one_liner',
   '어린이와 청소년에게 운동 기본기, 협동심, 안전한 스포츠 참여 방법을 가르치는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'youth-sports-coach'),
   'service', 'easy_description',
   '초등학생이나 중학생이 특정 운동을 처음 배울 때 자세, 규칙, 팀워크를 함께 익힐 수 있도록 지도해요. 청소년지도사가 청소년 활동 전반을 다루는 것과 달리, 운동과 체육 지도에 특화된 역할이에요. 스포츠지도사 자격과 연결된 경력 경로가 있어요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'youth-sports-coach'),
   'service', 'why_this_job',
   '학교와 지역사회에서 어린이·청소년 체육 활동 지원 수요가 꾸준해요. 운동을 좋아하고 어린이와 함께 일하는 것을 즐기는 학생이라면 탐색해볼 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'youth-sports-coach'),
   'service', 'mission_hint',
   '어린 동생이나 친구에게 좋아하는 운동의 기본 규칙 1가지를 직접 설명해보세요. 쉽게 이해할 수 있게 전달하는 게 유소년 지도자의 핵심 역할이에요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'youth-sports-coach'),
   'service', 'step_action',
   '학교 또는 지역사회에서 운영하는 어린이 스포츠 프로그램을 1개 찾아 어떤 종목을 어떻게 가르치는지 살펴보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'youth-sports-coach'),
   'service', 'step_action',
   '"스포츠지도사" 자격이 무엇인지 조사하고 어떤 과정을 통해 취득하는지 알아보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [07] 아웃도어 레저 기획자  |  환경·미래산업
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'outdoor-leisure-planner', '아웃도어 레저 기획자', '🏕️', '환경·미래산업', array['environment'],
  null, 'manual', true, 101, 'outdoor-leisure-planner'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'outdoor-leisure-planner'),
   'service', 'one_liner',
   '캠핑, 등산, 트레킹, 자연 체험 프로그램을 기획하고 안전한 야외 활동을 설계하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'outdoor-leisure-planner'),
   'service', 'easy_description',
   '야외 활동 장소를 조사하고, 참가자의 체력과 안전을 고려해 코스와 일정을 계획해요. 자연 환경을 이해하면서도 즐거운 체험을 설계하는 역할이라 환경 감수성과 기획력이 함께 필요해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'outdoor-leisure-planner'),
   'service', 'why_this_job',
   '캠핑, 아웃도어 활동에 대한 관심이 높아지면서 안전하고 체계적인 야외 프로그램 수요가 늘고 있어요. 자연을 좋아하고 활동을 기획하는 일에 관심 있는 학생이라면 탐색해볼 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'outdoor-leisure-planner'),
   'service', 'mission_hint',
   '가족과 함께 갈 수 있는 가까운 자연 체험 장소를 1개 조사해보세요. 어떤 활동이 가능하고 무엇을 준비해야 하는지 정리해보는 게 아웃도어 기획의 출발점이에요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'outdoor-leisure-planner'),
   'service', 'step_action',
   '동네 근처 공원이나 산을 1곳 찾아 걷기 코스, 안전 주의사항, 준비물 목록을 간단히 정리하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'outdoor-leisure-planner'),
   'service', 'step_action',
   '아웃도어 관련 유튜브 영상이나 기사 1개를 찾아 기획자가 어떤 일을 하는지 메모하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [08] 해양레저 전문가  |  환경·미래산업
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'marine-leisure-specialist', '해양레저 전문가', '🌊', '환경·미래산업', array['environment'],
  null, 'manual', true, 102, 'marine-leisure-specialist'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'marine-leisure-specialist'),
   'service', 'one_liner',
   '수상 스포츠와 해양 체험 활동을 기획·운영하고 안전한 바다 활동 환경을 만드는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'marine-leisure-specialist'),
   'service', 'easy_description',
   '카약, 서핑, 스노클링 같은 해양 활동 프로그램을 기획하고, 참가자가 안전하게 즐길 수 있도록 안전 수칙과 장비를 준비해요. 바다 환경을 이해하고 해양 안전 지식을 갖추는 것이 중요한 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'marine-leisure-specialist'),
   'service', 'why_this_job',
   '국내외 해양레저 시장이 꾸준히 성장하고 있고, 수상레저조종면허 같은 관련 자격과 연결된 경력 경로도 있어요. 바다와 물을 좋아하고 체험 프로그램 기획에 관심 있는 학생이라면 탐색해볼 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'marine-leisure-specialist'),
   'service', 'mission_hint',
   '바다나 강에서 할 수 있는 수상 활동 종류를 5가지 이상 찾아 각각 어떤 장비가 필요한지 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'marine-leisure-specialist'),
   'service', 'step_action',
   '해양레저 관련 프로그램(스노클링 체험, 카약 교실 등)을 1개 찾아 어떤 안전 교육이 포함되어 있는지 살펴보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'marine-leisure-specialist'),
   'service', 'step_action',
   '"수상레저 안전수칙"을 검색해 가장 중요한 안전 수칙 3가지를 정리하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [09] 스포츠 안전관리자  |  공공·안전
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'sports-safety-manager', '스포츠 안전관리자', '🦺', '공공·안전', array['public_safety'],
  null, 'manual', true, 103, 'sports-safety-manager'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'sports-safety-manager'),
   'service', 'one_liner',
   '경기장, 학교 체육 활동, 스포츠 행사에서 사고를 예방하고 안전한 활동 환경을 관리하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-safety-manager'),
   'service', 'easy_description',
   '시설 점검, 안전 규칙 수립, 긴급 상황 대응 계획 마련 등 스포츠 활동이 안전하게 이루어지도록 관리해요. 경기장에서 일어날 수 있는 위험 요소를 미리 파악하고 예방하는 것이 핵심 역할이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-safety-manager'),
   'service', 'why_this_job',
   '스포츠 행사 규모가 커지면서 안전 관리의 전문성이 더 중요해지고 있어요. 스포츠를 좋아하면서 안전과 규칙에 관심이 많은 학생이라면 탐색해볼 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'sports-safety-manager'),
   'service', 'mission_hint',
   '학교 운동장이나 체육관에서 안전하지 않을 수 있는 부분을 3가지 찾아 적어보세요. 위험 요소를 미리 파악하는 게 안전관리의 핵심이에요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-safety-manager'),
   'service', 'step_action',
   '운동장이나 체육관에서 지켜야 할 안전 규칙을 5가지 이상 찾아 정리하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-safety-manager'),
   'service', 'step_action',
   '스포츠 행사 안전 관련 기사나 영상 1개를 찾아 어떤 안전 장치가 마련되어 있는지 살펴보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [10] 수상안전요원  |  공공·안전
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'water-safety-lifeguard', '수상안전요원', '🏊', '공공·안전', array['public_safety'],
  null, 'manual', true, 104, 'water-safety-lifeguard'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'water-safety-lifeguard'),
   'service', 'one_liner',
   '수영장, 해수욕장, 수상 활동 현장에서 안전을 지키고 긴급 상황에 침착하게 대응하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'water-safety-lifeguard'),
   'service', 'easy_description',
   '물에서 발생할 수 있는 사고를 예방하고, 위험 상황이 생기면 신속하게 대응해요. 수영 실력뿐 아니라 침착한 판단력과 안전 지식이 중요한 직업이에요. 수상구조사 자격과 연결된 경력 경로가 있어요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'water-safety-lifeguard'),
   'service', 'why_this_job',
   '물놀이 안전사고 예방에 대한 사회적 관심이 높아지면서 전문 수상안전요원 수요가 꾸준해요. 수영을 좋아하고 안전을 지키는 일에 책임감을 느끼는 학생이라면 탐색해볼 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'water-safety-lifeguard'),
   'service', 'mission_hint',
   '수영장이나 해수욕장에 갔을 때 안전요원이 어디에 위치하고 어떤 역할을 하는지 관찰해보세요. 실제 현장을 눈으로 살펴보는 게 탐색의 시작이에요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'water-safety-lifeguard'),
   'service', 'step_action',
   '"수상구조사" 자격이 무엇인지 검색해 어떤 교육을 받아야 하는지 알아보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'water-safety-lifeguard'),
   'service', 'step_action',
   '익수(물에 빠짐) 예방을 위한 안전 수칙 5가지를 조사해 정리하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [검증 SQL — 적용 후 아래 주석을 해제하여 확인]
-- ============================================================

-- [검증 1] 10개 slug 존재 확인
-- SELECT
--   slug,
--   name_ko,
--   category,
--   is_active,
--   is_representative
-- FROM public.occupation_master
-- WHERE slug IN (
--   'sports-data-analyst',
--   'sports-tech-developer',
--   'exercise-prescription-specialist',
--   'sports-content-planner',
--   'sports-marketer',
--   'youth-sports-coach',
--   'outdoor-leisure-planner',
--   'marine-leisure-specialist',
--   'sports-safety-manager',
--   'water-safety-lifeguard'
-- )
-- ORDER BY category, slug;
-- 기대: 10행

-- [검증 2] 전체 집계 확인
-- SELECT
--   COUNT(*) AS total,
--   COUNT(*) FILTER (WHERE is_active = true) AS active_total,
--   COUNT(*) FILTER (WHERE is_active = false) AS inactive_total,
--   COUNT(*) FILTER (
--     WHERE is_representative = true
--       AND is_active = true
--   ) AS representative_active,
--   COUNT(*) FILTER (WHERE is_representative = false) AS sub_total
-- FROM public.occupation_master;
-- 기대: total=114, active_total=114, inactive_total=0, representative_active=100, sub_total=14

-- [검증 3] 카테고리별 집계 확인
-- SELECT
--   category,
--   COUNT(*) AS total,
--   COUNT(*) FILTER (
--     WHERE is_representative = true
--       AND is_active = true
--   ) AS representative_active,
--   COUNT(*) FILTER (
--     WHERE is_representative = false
--   ) AS sub_occupation,
--   COUNT(*) FILTER (
--     WHERE is_active = true
--   ) AS active_total,
--   COUNT(*) FILTER (
--     WHERE is_active = false
--   ) AS inactive_total
-- FROM public.occupation_master
-- GROUP BY category
-- ORDER BY category;
-- 기대 representative_active:
--   IT·기술 14 / 의료·과학 14 / 예술·디자인 14 / 콘텐츠·미디어 11
--   비즈니스·경영 11 / 교육·사회 11 / 환경·미래산업 11 / 공공·안전 10 / 항공·운송 4

-- [검증 4] occupation_summary 행 수 확인 (10 × 3 = 30행)
-- SELECT COUNT(*) AS summary_count
-- FROM public.occupation_summary s
-- JOIN public.occupation_master m ON s.occupation_id = m.id
-- WHERE m.slug IN (
--   'sports-data-analyst', 'sports-tech-developer',
--   'exercise-prescription-specialist', 'sports-content-planner',
--   'sports-marketer', 'youth-sports-coach',
--   'outdoor-leisure-planner', 'marine-leisure-specialist',
--   'sports-safety-manager', 'water-safety-lifeguard'
-- );
-- 기대: 30

-- [검증 5] occupation_preparations 행 수 확인 (10 × 3 = 30행)
-- SELECT COUNT(*) AS prep_count
-- FROM public.occupation_preparations p
-- JOIN public.occupation_master m ON p.occupation_id = m.id
-- WHERE m.slug IN (
--   'sports-data-analyst', 'sports-tech-developer',
--   'exercise-prescription-specialist', 'sports-content-planner',
--   'sports-marketer', 'youth-sports-coach',
--   'outdoor-leisure-planner', 'marine-leisure-specialist',
--   'sports-safety-manager', 'water-safety-lifeguard'
-- );
-- 기대: 30

-- [검증 6] 카테고리별 집계 요약 (적용 후 기대값)
-- SELECT
--   category,
--   COUNT(*) FILTER (WHERE is_representative = true  AND is_active = true) AS representative_active,
--   COUNT(*) FILTER (WHERE is_representative = false)                       AS sub_occupation,
--   COUNT(*) FILTER (WHERE is_active = true)                                AS active_total
-- FROM public.occupation_master
-- GROUP BY category
-- ORDER BY category;

do $$ begin
  raise notice '✅ 055: 2차 확장 직업 10개 (스포츠 진로 생태계) bulk insert 완료';
  raise notice '   IT·기술       (2): sports-data-analyst, sports-tech-developer';
  raise notice '   의료·과학     (1): exercise-prescription-specialist';
  raise notice '   콘텐츠·미디어 (1): sports-content-planner';
  raise notice '   비즈니스·경영 (1): sports-marketer';
  raise notice '   교육·사회     (1): youth-sports-coach';
  raise notice '   환경·미래산업 (2): outdoor-leisure-planner, marine-leisure-specialist';
  raise notice '   공공·안전     (2): sports-safety-manager, water-safety-lifeguard';
  raise notice '   적용 후 예상: occupation_master 114개, 대표 직업 100개 달성';
  raise notice '   ⚠ occupation_goyo24_profile / quizData / roadmaps는 별도 작업 필요';
  raise notice '   ⚠ Production 적용 전 OZ 승인 필수';
end $$;

commit;
