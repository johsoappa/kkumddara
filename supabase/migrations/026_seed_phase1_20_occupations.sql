-- ====================================================
-- 026_seed_phase1_20_occupations.sql
-- 1차 확장 직업 20개 시드 — migration 버전
--
-- [목적]
--   베타 공개 전 직업 수를 10개 → 30개로 확장.
--   occupation_master / occupation_summary / occupation_preparations만 포함.
--   occupation_goyo24_profile은 sync 스크립트 별도 실행.
--
-- [idempotent 원칙]
--   occupation_master   : slug 기준 ON CONFLICT DO UPDATE
--                         → id(UUID)가 변경되지 않음
--                         → is_active / sync_status / employment24_code 건드리지 않음
--   occupation_summary  : (occupation_id, layer, content_type, version_no) 기준 ON CONFLICT
--                         → 콘텐츠만 UPDATE, 기존 행의 is_current/published_at 유지
--   occupation_preparations : (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) 기준 ON CONFLICT
--
-- [GOYO24 처리]
--   sync_status='manual' (4개) : AI 엔지니어, 광고기획자, 기자, 과학수사관
--                                 → sync 스크립트 GOYO24_UNSUPPORTED에서 skip
--   sync_status='pending' (16개): sync 스크립트 실행 시 upsert 대상
--
-- [포함 직업 — 1차 추가 20개]
--   IT·기술        : AI 엔지니어, 게임 개발자, 사이버보안 전문가, 로봇 엔지니어
--   의료·과학      : 의사, 약사, 수의사, 치과의사
--   예술·디자인    : 건축가, 패션 디자이너, 웹툰 작가
--   교육·사회      : 초등학교 교사, 사회복지사
--   비즈니스·경영  : 광고기획자, 회계사
--   콘텐츠·미디어  : 기자, 방송 PD (slug='pd-director')
--   공공·안전      : 소방관, 과학수사관
--   환경·미래산업  : 우주항공 엔지니어
--
-- [실행 순서]
--   1. 015_occupation_master_bootstrap.sql 실행 완료 확인
--   2. 001_pilot_occupations_plain.sql (seeds/) 실행 완료 확인
--   3. 024 / 025 migration 실행 완료 확인
--   4. 이 파일 실행 (SQL Editor — service_role)
--   5. 하단 검증 쿼리 확인
--   6. 콘텐츠 육안 검토
--   7. ACTIVATE 섹션 실행 (주석 해제 후)
--   8. goyo24 sync 스크립트 --dry-run 후 실제 실행
-- ====================================================


-- ============================================================
-- [01] AI 엔지니어  |  IT·기술  |  GOYO24_UNSUPPORTED
--      slug = legacy = 'ai-engineer'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'ai-engineer', 'AI 엔지니어', '🤖', 'IT·기술', array['it'],
  null, 'manual', false, 30, 'ai-engineer'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'ai-engineer'),
   'service', 'one_liner',
   '데이터를 바탕으로 인공지능 모델을 만들고 개선해 다양한 문제를 해결하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'ai-engineer'),
   'service', 'easy_description',
   '스마트 스피커가 말을 알아듣고, 추천 알고리즘이 좋아할 영상을 골라주는 것 — 이런 결과물은 수많은 데이터를 학습시켜 만든 AI 모델 덕분이에요. 수학과 프로그래밍을 좋아하고 데이터로 문제를 풀고 싶은 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'ai-engineer'),
   'service', 'why_this_job',
   'IT에 관심 있는 학생 중 특히 "왜 이렇게 작동하지?"를 파고드는 호기심이 강하다면 자연스럽게 탐색하게 되는 직업이에요. 지금도 많은 기업에서 AI를 활용한 제품과 서비스를 만들고 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'ai-engineer'),
   'service', 'mission_hint',
   '오늘 사용한 AI 기능(추천 알고리즘, 음성 인식, 번역 등) 중 하나를 골라 어떻게 작동할지 직접 상상해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'ai-engineer'),
   'service', 'step_action',
   '유튜브에서 "AI가 어떻게 학습하는가" 또는 "머신러닝 기초" 영상 1편 찾아 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'ai-engineer'),
   'service', 'step_action',
   '스크래치(scratch.mit.edu)에서 간단한 반응형 프로그램을 만들며 코딩의 논리 구조 경험해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [02] 게임 개발자  |  IT·기술  |  MANUAL_MAPPING K000007580
--      slug = legacy = 'game-developer'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'game-developer', '게임 개발자', '🎮', 'IT·기술', array['it'],
  null, 'pending', false, 29, 'game-developer'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'game-developer'),
   'service', 'one_liner',
   '게임의 규칙, 캐릭터 동작, 화면 흐름을 코드와 툴로 직접 구현하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'game-developer'),
   'service', 'easy_description',
   '게임을 즐기는 것과 게임을 만드는 것은 전혀 다른 일이에요. 게임 개발자는 캐릭터가 어떻게 움직이는지, 공격이 어떤 조건에서 성공하는지를 직접 코드로 구현해요. 논리적 사고와 창의성이 동시에 필요한 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'game-developer'),
   'service', 'why_this_job',
   '게임을 좋아하는 학생이라면 "이걸 내가 만들면 어떨까"라는 생각을 해본 적 있을 거예요. 지금 당장 무료 게임 엔진(Unity, Godot)으로 간단한 게임을 직접 만들어볼 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'game-developer'),
   'service', 'mission_hint',
   '자주 하는 게임에서 규칙 하나를 골라 "이걸 코드로 어떻게 표현할까" 상상해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'game-developer'),
   'service', 'step_action',
   '유튜브에서 "Unity 게임 만들기 입문" 영상을 찾아 10분 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'game-developer'),
   'service', 'step_action',
   '스크래치(scratch.mit.edu)로 움직이는 캐릭터 하나를 직접 만들어보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [03] 사이버보안 전문가  |  IT·기술  |  MANUAL_MAPPING K000000832
--      slug = legacy = 'cybersecurity-expert'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'cybersecurity-expert', '사이버보안 전문가', '🔐', 'IT·기술', array['it'],
  null, 'pending', false, 28, 'cybersecurity-expert'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'cybersecurity-expert'),
   'service', 'one_liner',
   '디지털 시스템의 취약점을 찾아내고 해킹과 침입을 막는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'cybersecurity-expert'),
   'service', 'easy_description',
   '개인정보를 노리는 해커와 기업 시스템을 공격하는 위협을 막는 사람이 사이버보안 전문가예요. 컴퓨터 구조를 깊이 이해하고 보안 취약점을 먼저 발견해 방어하는 것이 주요 업무예요. IT와 추리하는 걸 모두 좋아하는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'cybersecurity-expert'),
   'service', 'why_this_job',
   '디지털 위협이 늘어날수록 보안 전문가의 역할은 더 중요해져요. 해킹을 방어하는 "화이트햇 해커"에 관심이 있다면 지금부터 탐색을 시작해볼 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'cybersecurity-expert'),
   'service', 'mission_hint',
   '비밀번호를 안전하게 만드는 방법을 찾아보고, 내 계정의 보안 상태를 직접 점검해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'cybersecurity-expert'),
   'service', 'step_action',
   '유튜브에서 "해킹과 보안 기초" 또는 "사이버보안이란" 영상을 검색해 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'cybersecurity-expert'),
   'service', 'step_action',
   '한국인터넷진흥원(KISA) 홈페이지에서 청소년 보안 관련 콘텐츠를 찾아 읽어보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [04] 로봇 엔지니어  |  IT·기술  |  MANUAL_MAPPING K000000860
--      slug = legacy = 'robot-engineer'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'robot-engineer', '로봇 엔지니어', '🦾', 'IT·기술', array['it'],
  null, 'pending', false, 27, 'robot-engineer'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'robot-engineer'),
   'service', 'one_liner',
   '로봇의 구조를 설계하고 움직임을 프로그래밍하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'robot-engineer'),
   'service', 'easy_description',
   '공장 자동화 로봇, 수술 보조 의료 로봇, 배달 드론 — 이 모든 것을 설계하고 만드는 사람이 로봇 엔지니어예요. 기계 구조와 소프트웨어를 모두 다루는 직업이라 기계와 코딩을 둘 다 좋아하는 학생에게 잘 어울려요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'robot-engineer'),
   'service', 'why_this_job',
   'IT·기술에 관심 있으면서 "눈에 보이는 결과물"을 만들고 싶은 학생에게 잘 맞는 직업이에요. 로봇공학은 전기, 기계, 소프트웨어가 융합된 분야로 진로 선택의 폭이 넓어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'robot-engineer'),
   'service', 'mission_hint',
   '주변에서 자동화된 기계나 로봇을 하나 찾아 어떤 원리로 작동하는지 간단히 상상해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'robot-engineer'),
   'service', 'step_action',
   '유튜브에서 레고 마인드스톰 또는 아두이노 로봇 만들기 입문 영상을 찾아 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'robot-engineer'),
   'service', 'step_action',
   '로봇 엔지니어가 되기 위한 관련 학과(기계공학, 전자공학, 컴퓨터공학)를 검색해 정리해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [05] 의사  |  의료·과학  |  MANUAL_MAPPING K000007504
--      slug = legacy = 'doctor'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'doctor', '의사', '🩻', '의료·과학', array['medical'],
  null, 'pending', false, 26, 'doctor'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'doctor'),
   'service', 'one_liner',
   '환자의 증상을 진단하고 치료 방향을 결정하는 의료 전문직이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'doctor'),
   'service', 'easy_description',
   '아프거나 다쳤을 때 병원에서 만나는 의사는 증상의 원인을 파악하고 치료 방향을 결정해요. 과학 지식과 판단력이 모두 필요하고, 사람의 건강과 생명에 직접 관련되는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'doctor'),
   'service', 'why_this_job',
   '의료에 관심 있는 학생 중 생물·화학을 좋아하고 사람을 돕는 일에 보람을 느낀다면 탐색해볼 만한 직업이에요. 준비 과정이 길지만 그만큼 전문성이 깊어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'doctor'),
   'service', 'mission_hint',
   '가장 최근에 병원을 방문한 경험을 떠올려보고, 의사가 어떤 과정으로 진단했는지 되돌아보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'doctor'),
   'service', 'step_action',
   '유튜브에서 의사 하루 일과 브이로그를 찾아 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'doctor'),
   'service', 'step_action',
   '의과대학 진학 조건과 의사 면허 취득 과정을 검색해 흐름 정리해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [06] 약사  |  의료·과학  |  자동 매핑
--      slug = legacy = 'pharmacist'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'pharmacist', '약사', '💊', '의료·과학', array['medical'],
  null, 'pending', false, 25, 'pharmacist'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'pharmacist'),
   'service', 'one_liner',
   '처방전에 따라 약을 조제하고 올바른 복용 방법을 안내하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'pharmacist'),
   'service', 'easy_description',
   '약국에서 약사는 의사가 처방한 약이 환자에게 맞는지 확인하고, 약의 효능과 부작용, 복용 방법을 설명해요. 화학과 생물에 흥미가 있고 꼼꼼한 성격을 가진 학생에게 잘 어울려요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'pharmacist'),
   'service', 'why_this_job',
   '의료에 관심 있지만 직접 진단·치료보다 약과 건강의 관계를 탐구하고 싶다면 탐색해볼 직업이에요. 지역 약국부터 병원, 제약회사까지 다양한 곳에서 일할 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'pharmacist'),
   'service', 'mission_hint',
   '집에 있는 약 한 가지를 골라 설명서를 꼼꼼히 읽고, 어떤 성분으로 어떤 효과가 있는지 찾아보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'pharmacist'),
   'service', 'step_action',
   '유튜브에서 약사 직업 소개 또는 하루 일과 영상을 찾아 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'pharmacist'),
   'service', 'step_action',
   '약학대학(약대) 입학 방법과 약사 면허 취득 과정을 검색해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [07] 수의사  |  의료·과학  |  자동 매핑
--      slug = legacy = 'veterinarian'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'veterinarian', '수의사', '🐾', '의료·과학', array['medical'],
  null, 'pending', false, 24, 'veterinarian'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'veterinarian'),
   'service', 'one_liner',
   '동물의 건강을 진단하고 치료하는 동물 의료 전문직이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'veterinarian'),
   'service', 'easy_description',
   '강아지, 고양이 같은 반려동물부터 농장 동물, 야생동물까지 — 수의사는 다양한 동물의 질병을 진단하고 치료해요. 동물을 좋아하는 학생에게 가장 먼저 떠오르는 직업이지만, 과학 공부가 의사 못지않게 중요해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'veterinarian'),
   'service', 'why_this_job',
   '동물을 사랑하는 마음과 과학적 사고를 동시에 활용할 수 있는 직업이에요. 반려동물 문화가 확산되면서 수의사의 역할도 더 다양해지고 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'veterinarian'),
   'service', 'mission_hint',
   '가까운 동물병원에서 수의사가 어떤 일을 하는지 찾아보거나, 직접 방문해서 관찰해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'veterinarian'),
   'service', 'step_action',
   '유튜브에서 수의사 하루 일과 또는 동물 치료 영상을 찾아 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'veterinarian'),
   'service', 'step_action',
   '수의대에 진학하기 위한 조건과 수의사 면허 취득 과정을 검색해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [08] 치과의사  |  의료·과학  |  MANUAL_MAPPING K000007472
--      slug = legacy = 'dentist'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'dentist', '치과의사', '🦷', '의료·과학', array['medical'],
  null, 'pending', false, 23, 'dentist'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'dentist'),
   'service', 'one_liner',
   '치아와 잇몸 질환을 진단하고 치료하는 구강 전문 의료직이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'dentist'),
   'service', 'easy_description',
   '치아가 아플 때 찾는 치과의사는 충치 치료, 교정, 잇몸 치료 등 입 속 건강 전반을 담당해요. 섬세한 손기술과 과학 지식이 모두 필요하고, 환자와 직접 소통하며 일하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'dentist'),
   'service', 'why_this_job',
   '의료 분야에 관심 있으면서 손으로 직접 치료하는 기술적인 작업을 좋아한다면 잘 맞는 직업이에요. 개인 치과 개업부터 대학병원 구강외과까지 진로 선택의 폭도 넓어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'dentist'),
   'service', 'mission_hint',
   '내가 받아본 치과 치료를 떠올려보고, 치과의사가 구체적으로 어떤 치료를 했는지 기억해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'dentist'),
   'service', 'step_action',
   '유튜브에서 치과의사 직업 소개 또는 하루 일과 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'dentist'),
   'service', 'step_action',
   '치과대학 진학 방법과 치과의사 면허 취득 과정을 검색해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [09] 건축가  |  예술·디자인  |  MANUAL_MAPPING K000001014
--      slug = legacy = 'architect'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'architect', '건축가', '🏛️', '예술·디자인', array['art'],
  null, 'pending', false, 22, 'architect'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'architect'),
   'service', 'one_liner',
   '사람이 생활하는 건물의 구조와 공간을 설계하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'architect'),
   'service', 'easy_description',
   '집, 학교, 도서관, 박물관 — 우리가 매일 드나드는 건물은 모두 건축가가 설계했어요. 사람들이 편하고 안전하게 생활할 수 있도록 공간을 디자인하면서, 구조적으로 건물이 제대로 서 있도록 설계해요. 그림 그리기와 수학이 모두 필요한 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'architect'),
   'service', 'why_this_job',
   '예술적 감각과 공학적 사고를 함께 활용하는 직업이에요. 내가 설계한 건물이 실제로 세상에 지어지는 경험은 오래 기억에 남는 성취감을 줘요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'architect'),
   'service', 'mission_hint',
   '동네를 걸으며 마음에 드는 건물 하나를 골라 왜 그 건물이 좋은지 이유를 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'architect'),
   'service', 'step_action',
   '유튜브에서 건축가 직업 소개 또는 건축 설계 과정 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'architect'),
   'service', 'step_action',
   '마음에 드는 건물을 스케치로 따라 그리거나, 내 방 구조를 간단히 평면도로 그려보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [10] 패션 디자이너  |  예술·디자인  |  MANUAL_MAPPING K000007454
--      slug = legacy = 'fashion-designer'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'fashion-designer', '패션 디자이너', '👗', '예술·디자인', array['art'],
  null, 'pending', false, 21, 'fashion-designer'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'fashion-designer'),
   'service', 'one_liner',
   '옷과 패션 아이템을 디자인하고 제작하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'fashion-designer'),
   'service', 'easy_description',
   '우리가 입는 옷의 색상, 소재, 실루엣을 결정하는 사람이 패션 디자이너예요. 트렌드를 읽고 스케치를 그려 실제 옷으로 완성하는 전 과정을 담당해요. 그림 그리기와 패션에 관심 있는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'fashion-designer'),
   'service', 'why_this_job',
   '자신만의 스타일을 옷으로 표현하는 걸 즐긴다면 자연스럽게 연결되는 직업이에요. 패션은 예술과 산업이 만나는 분야라 다양한 진로로 발전할 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'fashion-designer'),
   'service', 'mission_hint',
   '오늘 입은 옷을 보고 색상, 소재, 디자인을 분석한 뒤 내가 바꾸고 싶은 부분이 있다면 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'fashion-designer'),
   'service', 'step_action',
   '유튜브에서 패션 디자이너 작업 과정 또는 패션쇼 준비 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'fashion-designer'),
   'service', 'step_action',
   '좋아하는 옷이나 패션 아이템을 스케치로 그리고 어떤 소재로 만들지 간단히 메모해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [11] 웹툰 작가  |  예술·디자인  |  MANUAL_MAPPING K000007518
--      slug = legacy = 'webtoon-artist'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'webtoon-artist', '웹툰 작가', '✏️', '예술·디자인', array['art'],
  null, 'pending', false, 20, 'webtoon-artist'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'webtoon-artist'),
   'service', 'one_liner',
   '이야기를 디지털 만화 형식으로 창작하고 독자와 소통하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'webtoon-artist'),
   'service', 'easy_description',
   '플랫폼에 연재되는 만화를 직접 기획하고 그리는 사람이 웹툰 작가예요. 스토리를 구성하고 캐릭터를 디자인해 디지털 드로잉 툴로 완성해요. 그림 그리기와 이야기 만들기를 둘 다 좋아하는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'webtoon-artist'),
   'service', 'why_this_job',
   '예술적 표현과 이야기 창작이 만나는 직업이에요. 지금 당장 종이나 태블릿으로 연습을 시작할 수 있고, 자신의 작품을 온라인에 공유하며 독자 반응을 받아볼 수도 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'webtoon-artist'),
   'service', 'mission_hint',
   '좋아하는 웹툰의 컷 구성을 분석하고, 주인공 캐릭터가 어떻게 표현됐는지 관찰해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'webtoon-artist'),
   'service', 'step_action',
   '유튜브에서 웹툰 작가 작업 과정 또는 작업실 브이로그 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'webtoon-artist'),
   'service', 'step_action',
   '간단한 4컷 만화를 스케치로 직접 그려보기 (주제 자유)',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [12] 초등학교 교사  |  교육·사회  |  자동 매핑
--      slug = legacy = 'elementary-teacher'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'elementary-teacher', '초등학교 교사', '📝', '교육·사회', array['education'],
  null, 'pending', false, 19, 'elementary-teacher'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'elementary-teacher'),
   'service', 'one_liner',
   '초등학생이 여러 과목을 배우고 학교생활에 잘 적응하도록 함께 이끄는 선생님이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'elementary-teacher'),
   'service', 'easy_description',
   '초등학교 교사는 한 반의 담임을 맡아 국어, 수학, 과학, 미술 등 여러 과목을 직접 가르쳐요. 아이들이 처음 학교생활을 시작하는 시기를 함께하는 중요한 역할이에요. 아이들과 소통하는 걸 좋아하고 책임감이 강한 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'elementary-teacher'),
   'service', 'why_this_job',
   '중·고등학교 교사와 달리 한 반 학생들의 전반적인 성장을 함께 이끄는 점이 특징이에요. 교육대학교(교대)를 통해 체계적으로 진로를 설계할 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'elementary-teacher'),
   'service', 'mission_hint',
   '기억에 남는 초등학교 선생님을 떠올려 그 선생님이 잘했던 점을 3가지 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'elementary-teacher'),
   'service', 'step_action',
   '유튜브에서 초등학교 교사 하루 일과 브이로그 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'elementary-teacher'),
   'service', 'step_action',
   '교육대학교(교대) 입학 조건과 초등학교 정교사 자격증 취득 과정을 검색해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [13] 사회복지사  |  교육·사회  |  자동 매핑 (K000000857 예상)
--      slug = legacy = 'social-worker'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'social-worker', '사회복지사', '🤝', '교육·사회', array['education'],
  null, 'pending', false, 18, 'social-worker'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'social-worker'),
   'service', 'one_liner',
   '어려운 상황에 처한 사람을 찾아 필요한 서비스와 지원을 연결해주는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'social-worker'),
   'service', 'easy_description',
   '가정폭력, 빈곤, 장애, 노인 돌봄 등 다양한 어려움을 겪는 사람들을 도와 생활을 안정시키는 사람이 사회복지사예요. 문제를 직접 해결하기보다 사람과 함께 답을 찾아가는 과정이 중심이에요. 공감 능력이 높고 사회 문제에 관심 있는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'social-worker'),
   'service', 'why_this_job',
   '사람과 사회에 관심 있는 학생이라면 탐색해볼 만한 직업이에요. 복지관, 학교, 병원, 지자체 등 다양한 곳에서 일할 수 있고, 대학에서 사회복지학과를 전공하면 자격증을 취득할 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'social-worker'),
   'service', 'mission_hint',
   '주변에서 도움이 필요한 사람을 위해 사회가 어떤 지원을 제공하는지 하나만 찾아보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'social-worker'),
   'service', 'step_action',
   '유튜브에서 사회복지사 하루 일과 또는 직업 소개 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'social-worker'),
   'service', 'step_action',
   '사회복지사가 일하는 곳(종합복지관, 학교, 병원, 지자체 등)의 종류를 정리해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [14] 광고기획자  |  비즈니스·경영  |  GOYO24_UNSUPPORTED
--      slug = legacy = 'ad-planner'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'ad-planner', '광고기획자', '📢', '비즈니스·경영', array['business'],
  null, 'manual', false, 17, 'ad-planner'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'ad-planner'),
   'service', 'one_liner',
   '브랜드의 메시지를 담은 광고 캠페인을 기획하고 만드는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'ad-planner'),
   'service', 'easy_description',
   'TV 광고, 유튜브 광고, 옥외 광고판의 아이디어를 처음부터 기획하는 사람이 광고기획자예요. 마케터가 "어떻게 알릴까"를 고민한다면, 광고기획자는 "어떤 이야기로 기억에 남길까"를 고민해요. 창의적인 아이디어를 내는 걸 좋아하는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'ad-planner'),
   'service', 'why_this_job',
   '비즈니스 감각과 창의성, 이야기 만들기를 모두 활용하는 직업이에요. 좋아하는 광고를 분석하는 것 자체가 진로 탐색의 시작이 돼요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'ad-planner'),
   'service', 'mission_hint',
   '가장 인상 깊었던 광고를 하나 골라 어떤 메시지를 어떻게 전달했는지 분석해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'ad-planner'),
   'service', 'step_action',
   '유튜브에서 칸 광고제 수상작 또는 인상적인 광고 영상을 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'ad-planner'),
   'service', 'step_action',
   '좋아하는 브랜드의 광고 캠페인을 하나 찾아 슬로건과 전달 방식을 간단히 정리해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [15] 회계사  |  비즈니스·경영  |  자동 매핑
--      slug = legacy = 'accountant'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'accountant', '회계사', '🧾', '비즈니스·경영', array['business'],
  null, 'pending', false, 16, 'accountant'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'accountant'),
   'service', 'one_liner',
   '기업의 재무 상태를 살피고 회계 기록이 정확한지 확인하는 전문직이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'accountant'),
   'service', 'easy_description',
   '회사가 얼마를 벌고 얼마를 썼는지 정확하게 기록하고, 세금 신고와 회계 감사를 통해 기업 재무를 투명하게 관리하는 사람이 회계사예요. 숫자를 꼼꼼히 다루고 규칙을 정확히 지키는 일이 중심이에요. 수학과 경제에 관심 있고 정확성을 중요하게 여기는 학생에게 잘 어울려요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'accountant'),
   'service', 'why_this_job',
   '비즈니스 분야에서 가장 기초가 되는 전문 자격직 중 하나예요. 공인회계사(CPA) 자격증은 어느 기업에서도 인정받는 전문성이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'accountant'),
   'service', 'mission_hint',
   '용돈 기입장을 일주일간 적어보고, 수입과 지출이 정확히 맞는지 확인해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'accountant'),
   'service', 'step_action',
   '유튜브에서 회계사 직업 소개 또는 하는 일 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'accountant'),
   'service', 'step_action',
   '공인회계사(CPA)가 무엇인지, 어떻게 취득하는지 검색해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [16] 기자  |  콘텐츠·미디어  |  GOYO24_UNSUPPORTED
--      slug = legacy = 'journalist'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'journalist', '기자', '📰', '콘텐츠·미디어', array['media'],
  null, 'manual', false, 15, 'journalist'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'journalist'),
   'service', 'one_liner',
   '사실을 취재하고 검증해 대중에게 정확하게 전달하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'journalist'),
   'service', 'easy_description',
   '신문, 방송, 온라인 미디어에서 세상에 일어난 일을 취재하고 사실 여부를 확인해 글이나 영상으로 알리는 사람이 기자예요. 글쓰기와 호기심이 강하고, 사회 문제에 관심 있는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'journalist'),
   'service', 'why_this_job',
   '세상의 다양한 분야를 탐구하면서 정보를 정확하게 전달하는 두 가지 역할을 모두 하는 직업이에요. 특정 분야를 깊이 다루는 전문 기자로 성장할 수도 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'journalist'),
   'service', 'mission_hint',
   '오늘 뉴스에서 기사 하나를 골라 사실인지, 출처가 어디인지, 어떻게 확인할 수 있는지 생각해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'journalist'),
   'service', 'step_action',
   '관심 있는 뉴스 기사를 하나 골라 누가·언제·무엇을·왜의 구조로 분석해보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'journalist'),
   'service', 'step_action',
   '교내 신문부나 학교 방송부에서 활동하는 방법을 찾아보거나 직접 도전해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [17] 방송 PD  |  콘텐츠·미디어  |  MANUAL_MAPPING K000001138
--      slug = legacy = 'pd-director'  (정적 fallback ID와 통일)
--      화면명: 방송 PD
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'pd-director', '방송 PD', '🎙️', '콘텐츠·미디어', array['media'],
  null, 'pending', false, 14, 'pd-director'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'pd-director'),
   'service', 'one_liner',
   '방송 프로그램의 기획과 제작 전체를 총괄하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'pd-director'),
   'service', 'easy_description',
   '예능, 드라마, 다큐멘터리 — 방송 프로그램의 전체 흐름을 설계하고 만드는 사람이 방송 PD예요. 아이디어를 내고 작가·배우·스태프를 이끌며 하나의 콘텐츠를 완성해요. 리더십과 창의성이 모두 필요한 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'pd-director'),
   'service', 'why_this_job',
   '콘텐츠와 영상에 관심 있는 학생이라면 탐색해볼 만한 직업이에요. 유튜브 채널 운영이나 영상 편집 경험이 가장 가까운 탐색의 시작점이 돼요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'pd-director'),
   'service', 'mission_hint',
   '좋아하는 TV 프로그램이나 유튜브 시리즈를 골라 "이걸 누가, 어떻게 기획했을까" 생각해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'pd-director'),
   'service', 'step_action',
   '유튜브에서 방송 PD 또는 예능 연출 과정 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'pd-director'),
   'service', 'step_action',
   '짧은 영상 하나를 기획해 제목, 주제, 구성 방식을 종이에 간단하게 써보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [18] 소방관  |  공공·안전  |  MANUAL_MAPPING K000007495
--      slug = legacy = 'firefighter'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'firefighter', '소방관', '🚒', '공공·안전', array['public_safety'],
  null, 'pending', false, 13, 'firefighter'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'firefighter'),
   'service', 'one_liner',
   '화재를 진압하고 사고 현장에서 인명을 구조하는 공공안전 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'firefighter'),
   'service', 'easy_description',
   '불을 끄는 것뿐 아니라 교통사고, 수난 사고, 건물 붕괴 현장에서 생명을 구하는 일도 소방관이 해요. 강한 체력과 침착한 판단력, 팀워크가 중요한 직업이에요. 위험한 순간에 도움을 주는 일에 보람을 느끼는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'firefighter'),
   'service', 'why_this_job',
   '공공·안전에 관심 있는 학생 중 실질적인 현장 활동을 선호한다면 탐색해볼 직업이에요. 소방공무원 시험을 통해 진입하며, 체력과 전문 지식이 모두 중요해요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'firefighter'),
   'service', 'mission_hint',
   '내가 사는 동네 소방서가 어디 있는지 확인하고, 화재 시 대피 경로를 한 번 생각해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'firefighter'),
   'service', 'step_action',
   '유튜브에서 소방관 하루 일과 또는 소방 훈련 영상을 찾아 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'firefighter'),
   'service', 'step_action',
   '소방공무원 시험 과목과 체력 기준을 검색해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [19] 과학수사관  |  공공·안전  |  GOYO24_UNSUPPORTED
--      slug = legacy = 'forensic-scientist'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'forensic-scientist', '과학수사관', '🔍', '공공·안전', array['public_safety'],
  null, 'manual', false, 12, 'forensic-scientist'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'forensic-scientist'),
   'service', 'one_liner',
   '범죄 현장의 증거를 과학적으로 분석해 사건 해결을 돕는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'forensic-scientist'),
   'service', 'easy_description',
   '지문, DNA, 혈흔, 디지털 기록 등 범죄 현장에 남겨진 증거를 분석하는 사람이 과학수사관이에요. 실험실과 현장을 오가며 일하고, 과학 지식이 핵심이에요. 추리와 과학 실험을 모두 좋아하는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'forensic-scientist'),
   'service', 'why_this_job',
   '경찰관과 달리 현장 수사보다 증거 분석이 중심이에요. 법과학, 생물, 화학, 디지털 포렌식 등 다양한 전문 분야로 세분화돼 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'forensic-scientist'),
   'service', 'mission_hint',
   '범죄 드라마나 다큐멘터리에서 과학수사관이 어떤 장비와 기술을 쓰는지 하나 찾아보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'forensic-scientist'),
   'service', 'step_action',
   '유튜브에서 과학수사 또는 법과학 직업 소개 영상을 검색해 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'forensic-scientist'),
   'service', 'step_action',
   '과학수사관이 되기 위해 도움이 되는 학과(법과학, 화학, 컴퓨터공학 등)를 찾아 정리해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [20] 우주항공 엔지니어  |  환경·미래산업  |  MANUAL_MAPPING K000000877
--      slug = legacy = 'aerospace-engineer'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'aerospace-engineer', '우주항공 엔지니어', '🚀', '환경·미래산업', array['environment'],
  null, 'pending', false, 11, 'aerospace-engineer'
)
on conflict (slug) do update set
  name_ko              = excluded.name_ko,
  emoji                = excluded.emoji,
  category             = excluded.category,
  interest_fields      = excluded.interest_fields,
  priority             = excluded.priority,
  legacy_occupation_id = excluded.legacy_occupation_id;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'aerospace-engineer'),
   'service', 'one_liner',
   '항공기와 우주 발사체의 구조와 시스템을 설계하고 개발하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'aerospace-engineer'),
   'service', 'easy_description',
   '비행기가 하늘을 나는 원리, 로켓이 우주로 가는 방법을 연구하고 실제로 만드는 사람이 우주항공 엔지니어예요. 물리와 수학을 좋아하고 하늘과 우주에 관심 있는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'aerospace-engineer'),
   'service', 'why_this_job',
   '미래 산업 중 우주항공 분야는 세계적으로 빠르게 성장하고 있어요. 항공기 제조, 위성 개발, 우주 탐사 등 다양한 방향으로 발전할 수 있는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'aerospace-engineer'),
   'service', 'mission_hint',
   '비행기나 로켓이 어떻게 하늘로 올라가는지 간단히 찾아보고, 가장 신기했던 원리를 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'aerospace-engineer'),
   'service', 'step_action',
   '유튜브에서 항공우주 엔지니어 직업 소개 또는 로켓 발사 과정 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'aerospace-engineer'),
   'service', 'step_action',
   '한국항공우주연구원(KARI) 홈페이지(www.kari.re.kr)를 방문해 어떤 연구를 하는지 살펴보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [검증 쿼리] seed 실행 후 확인
-- ============================================================

-- 1. 20개 occupation_master 확인 (ID·is_active·sync_status 포함)
select
  priority,
  slug,
  name_ko,
  emoji,
  sync_status,
  is_active,
  legacy_occupation_id
from public.occupation_master
where slug in (
  'ai-engineer',        'game-developer',      'cybersecurity-expert', 'robot-engineer',
  'doctor',             'pharmacist',           'veterinarian',          'dentist',
  'architect',          'fashion-designer',     'webtoon-artist',
  'elementary-teacher', 'social-worker',
  'ad-planner',         'accountant',
  'journalist',         'pd-director',
  'firefighter',        'forensic-scientist',
  'aerospace-engineer'
)
order by priority desc;

-- 2. 직업별 summary(3개) / preparations(3개) 건수 확인
select
  m.priority,
  m.slug,
  m.name_ko,
  count(distinct s.id) as summary_cnt,
  count(distinct p.id) as prep_cnt
from public.occupation_master m
left join public.occupation_summary s
  on s.occupation_id = m.id and s.is_current = true and s.status = 'published'
left join public.occupation_preparations p
  on p.occupation_id = m.id and p.is_current = true and p.status = 'published'
where m.slug in (
  'ai-engineer',        'game-developer',      'cybersecurity-expert', 'robot-engineer',
  'doctor',             'pharmacist',           'veterinarian',          'dentist',
  'architect',          'fashion-designer',     'webtoon-artist',
  'elementary-teacher', 'social-worker',
  'ad-planner',         'accountant',
  'journalist',         'pd-director',
  'firefighter',        'forensic-scientist',
  'aerospace-engineer'
)
group by m.priority, m.slug, m.name_ko
order by m.priority desc;

-- 3. one_liner 미리보기
select
  m.priority,
  m.slug,
  left(s.content, 60) as one_liner_preview
from public.occupation_summary s
join public.occupation_master m on m.id = s.occupation_id
where s.content_type = 'one_liner' and s.is_current = true
  and m.slug in (
    'ai-engineer',        'game-developer',      'cybersecurity-expert', 'robot-engineer',
    'doctor',             'pharmacist',           'veterinarian',          'dentist',
    'architect',          'fashion-designer',     'webtoon-artist',
    'elementary-teacher', 'social-worker',
    'ad-planner',         'accountant',
    'journalist',         'pd-director',
    'firefighter',        'forensic-scientist',
    'aerospace-engineer'
  )
order by m.priority desc;

-- 4. 기존 10개 변경 없음 확인
select slug, name_ko, is_active, priority
from public.occupation_master
where slug in (
  'software-developer', 'data-analyst',
  'visual-designer',    'video-content-creator',
  'nurse',              'biotech-researcher',
  'teacher',            'counselor',
  'police-officer',     'marketer'
)
order by priority desc;


-- ============================================================
-- [ACTIVATE] 검증 완료 후 실행 — UI 노출 활성화
-- ⚠️  검증 쿼리 2번: 20개 전부 summary=3, prep=3 확인 후 실행
-- ⚠️  콘텐츠 육안 검토 완료 후 실행
-- ============================================================

/*
update public.occupation_master
set    is_active  = true,
       updated_at = now()
where  slug in (
  'ai-engineer',        'game-developer',      'cybersecurity-expert', 'robot-engineer',
  'doctor',             'pharmacist',           'veterinarian',          'dentist',
  'architect',          'fashion-designer',     'webtoon-artist',
  'elementary-teacher', 'social-worker',
  'ad-planner',         'accountant',
  'journalist',         'pd-director',
  'firefighter',        'forensic-scientist',
  'aerospace-engineer'
)
returning slug, name_ko, is_active;
*/


-- ============================================================
-- [DEACTIVATE] 롤백 필요 시 실행
-- ============================================================

/*
update public.occupation_master
set    is_active  = false,
       updated_at = now()
where  slug in (
  'ai-engineer',        'game-developer',      'cybersecurity-expert', 'robot-engineer',
  'doctor',             'pharmacist',           'veterinarian',          'dentist',
  'architect',          'fashion-designer',     'webtoon-artist',
  'elementary-teacher', 'social-worker',
  'ad-planner',         'accountant',
  'journalist',         'pd-director',
  'firefighter',        'forensic-scientist',
  'aerospace-engineer'
);
*/
