-- ====================================================
-- 053_seed_first_wave_occupations.sql
-- 1차 확장 직업 23개 bulk insert
--
-- [목적]
--   occupation-100 확장 계획 1차 후보 23개를
--   occupation_master / occupation_summary / occupation_preparations 에 삽입한다.
--
-- [대상 테이블 — 이번 migration에서만 변경]
--   occupation_master     : 23개 신규 직업 행 추가
--   occupation_summary    : 23 × 3 = 69행 (one_liner, easy_description, why_this_job)
--   occupation_preparations : 23 × 3 = 69행 (mission_hint, step_action×2)
--
-- [변경하지 않는 것]
--   occupation_goyo24_profile / quizData.ts / roadmaps.ts
--   weekly_roadmap_missions / src/app / src/components
--   RLS / Auth / 요금제 / 명따라 Phase 2 설정
--   기존 직업 row (ON CONFLICT DO NOTHING으로 보호)
--
-- [직업 목록 — 23개, priority 72~94]
--   환경·미래산업 (5): smart-farm-specialist, climate-data-analyst,
--                      resource-recycling-specialist, green-building-specialist,
--                      environmental-consultant
--   공공·안전     (4): disaster-safety-manager, probation-officer,
--                      correctional-officer, public-administration-officer
--   항공·운송     (2): aircraft-maintenance-technician, logistics-manager
--   콘텐츠·미디어 (3): video-director, game-planner, sports-commentator
--   비즈니스·경영 (3): human-resources-specialist, financial-planner, product-manager
--   교육·사회     (3): lifelong-education-specialist, youth-worker, after-school-teacher
--   IT·기술       (2): network-engineer, mobile-app-developer
--   의료·과학     (1): radiologic-technologist
--
-- [idempotent 원칙]
--   occupation_master     : ON CONFLICT (slug) DO NOTHING
--   occupation_summary    : ON CONFLICT (occupation_id, layer, content_type, version_no) DO NOTHING
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
-- [01] 스마트팜 전문가  |  환경·미래산업
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'smart-farm-specialist', '스마트팜 전문가', '🌾', '환경·미래산업', array['environment'],
  null, 'manual', true, 72, 'smart-farm-specialist'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'smart-farm-specialist'),
   'service', 'one_liner',
   '농업에 센서, 데이터, 자동화 기술을 접목해 작물이 잘 자랄 수 있는 환경을 만드는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'smart-farm-specialist'),
   'service', 'easy_description',
   '스마트팜은 온도·습도·빛을 센서로 측정하고 컴퓨터가 자동으로 조절하는 농장이에요. 스마트팜 전문가는 이런 시스템을 설계하고 운영하며, 데이터를 분석해 더 많은 수확을 얻을 방법을 찾아요. 농업과 IT 기술을 모두 다루는 융합형 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'smart-farm-specialist'),
   'service', 'why_this_job',
   '기후변화로 식량 문제가 주목받으면서 스마트팜 기술의 중요성이 커지고 있어요. 농업과 IT가 결합된 분야라 창업 가능성도 열려 있고, 먹거리를 지키는 일이라는 보람도 커요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'smart-farm-specialist'),
   'service', 'mission_hint',
   '집에 있는 화분에 물·햇빛·온도를 매일 기록해보세요. 식물이 잘 자라는 조건을 찾는 게 스마트팜의 시작이에요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'smart-farm-specialist'),
   'service', 'step_action',
   '유튜브에서 "스마트팜" 또는 "식물공장" 영상 1편을 보고 어떤 기술이 쓰이는지 메모하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'smart-farm-specialist'),
   'service', 'step_action',
   '스마트팜 관련 책이나 기사를 1개 찾아 읽고 가장 인상적인 내용을 가족에게 설명해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [02] 기후데이터 분석가  |  환경·미래산업
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'climate-data-analyst', '기후데이터 분석가', '🌡️', '환경·미래산업', array['environment'],
  null, 'manual', true, 73, 'climate-data-analyst'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'climate-data-analyst'),
   'service', 'one_liner',
   '기후와 환경 데이터를 수집·분석해 변화 흐름을 연구하고 정책 결정에 도움을 주는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'climate-data-analyst'),
   'service', 'easy_description',
   '기온, 강수량, CO2 농도 같은 데이터를 모아 패턴을 분석하고 앞으로 기후가 어떻게 바뀔지 예측하는 일이에요. 분석 결과는 환경 정책 수립이나 기업의 기후 대응 전략에 활용돼요. 수학·통계와 환경 과학에 관심 있는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'climate-data-analyst'),
   'service', 'why_this_job',
   '기후위기가 전 지구적 이슈가 되면서 환경 데이터 전문가 수요가 빠르게 늘고 있어요. 데이터를 통해 세상을 더 나은 방향으로 바꾸고 싶은 학생이라면 탐색해볼 만한 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'climate-data-analyst'),
   'service', 'mission_hint',
   '기상청 앱에서 한 달 동안 매일 최고기온을 기록해보세요. 변화 패턴을 관찰하는 게 기후 분석의 첫 걸음이에요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'climate-data-analyst'),
   'service', 'step_action',
   '환경 관련 뉴스 1개를 찾아 기사에서 근거로 쓰인 데이터가 무엇인지 확인하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'climate-data-analyst'),
   'service', 'step_action',
   '공공데이터포털(data.go.kr)에서 기상 데이터를 1개 찾아 어떤 정보를 담고 있는지 정리하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [03] 자원순환 전문가  |  환경·미래산업
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'resource-recycling-specialist', '자원순환 전문가', '🔄', '환경·미래산업', array['environment'],
  null, 'manual', true, 74, 'resource-recycling-specialist'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'resource-recycling-specialist'),
   'service', 'one_liner',
   '폐기물을 줄이고 버려진 자원을 다시 사용할 수 있도록 재활용 시스템을 설계하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'resource-recycling-specialist'),
   'service', 'easy_description',
   '물건이 버려진 뒤 어떻게 다시 자원이 될 수 있는지 연구하고 시스템을 설계하는 직업이에요. 플라스틱, 금속, 종이 등 다양한 폐기물이 다시 쓰일 수 있도록 순환경제 흐름을 만들어요. 환경 문제 해결에 실질적으로 기여하는 일이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'resource-recycling-specialist'),
   'service', 'why_this_job',
   '순환경제가 정부 정책의 핵심으로 자리잡으면서 자원순환 분야 전문가 수요가 늘고 있어요. 환경 문제를 시스템으로 해결하는 아이디어를 좋아하는 학생에게 잘 맞는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'resource-recycling-specialist'),
   'service', 'mission_hint',
   '1주일 동안 집에서 버리는 쓰레기를 소재별로 기록해보세요. 어떤 것이 가장 많은지 확인해보는 게 시작이에요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'resource-recycling-specialist'),
   'service', 'step_action',
   '유튜브에서 "플라스틱 재활용 과정" 영상 1편을 보고 기억에 남는 내용 2가지 적기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'resource-recycling-specialist'),
   'service', 'step_action',
   '집에서 낭비되는 자원 1가지를 찾아 줄일 수 있는 아이디어를 가족에게 제안해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [04] 그린빌딩 전문가  |  환경·미래산업
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'green-building-specialist', '그린빌딩 전문가', '🏗️', '환경·미래산업', array['environment'],
  null, 'manual', true, 75, 'green-building-specialist'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'green-building-specialist'),
   'service', 'one_liner',
   '에너지와 환경 부담을 줄이는 친환경 건물을 설계하고 인증 기준에 맞게 관리하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'green-building-specialist'),
   'service', 'easy_description',
   '태양광 패널, 고성능 단열재, 빗물 재활용 시스템 등을 갖춘 건물을 설계하고 에너지 효율을 높이는 일이에요. 건축과 환경공학을 함께 다루며, 탄소 배출을 줄이는 건물이 늘어날수록 역할이 커지는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'green-building-specialist'),
   'service', 'why_this_job',
   '탄소중립 2050 목표를 위해 건물의 에너지 효율 기준이 강화되면서 그린빌딩 전문가 수요가 꾸준히 늘고 있어요. 건축과 환경 두 분야 모두에 관심 있는 학생에게 잘 맞는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'green-building-specialist'),
   'service', 'mission_hint',
   '집이나 학교에서 에너지가 낭비되는 곳을 3곳 찾아보세요. 빛이 새는 창문, 켜진 채로 방치된 조명 등이 힌트예요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'green-building-specialist'),
   'service', 'step_action',
   '"그린빌딩" 또는 "제로에너지 건물" 사례를 검색해 어떤 기술을 썼는지 1가지 정리하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'green-building-specialist'),
   'service', 'step_action',
   '단열이 무엇인지 과학 원리로 검색해보고 건물 에너지와 어떻게 연결되는지 가족에게 설명해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [05] 환경 컨설턴트  |  환경·미래산업
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'environmental-consultant', '환경 컨설턴트', '🌎', '환경·미래산업', array['environment'],
  null, 'manual', true, 76, 'environmental-consultant'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'environmental-consultant'),
   'service', 'one_liner',
   '기업과 기관이 환경 규정을 잘 지킬 수 있도록 문제를 진단하고 해결 방향을 제안하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'environmental-consultant'),
   'service', 'easy_description',
   '공장이나 회사가 환경법을 어기지 않도록 점검하고, 오염을 줄이는 방법을 제안하며, 보고서를 작성하는 일이에요. 환경 지식과 비즈니스 이해를 함께 갖춰야 하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'environmental-consultant'),
   'service', 'why_this_job',
   'ESG(환경·사회·지배구조) 경영이 기업의 기본 요건이 되면서 환경 컨설턴트 수요가 빠르게 늘고 있어요. 환경 문제를 현장에서 직접 해결하는 일에 보람을 느끼는 학생에게 잘 맞는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'environmental-consultant'),
   'service', 'mission_hint',
   '동네에서 환경 문제를 1가지 찾아보고 어떻게 개선할 수 있는지 아이디어를 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'environmental-consultant'),
   'service', 'step_action',
   '"ESG 보고서"를 검색해 어떤 기업이 어떤 내용을 담고 있는지 1개 살펴보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'environmental-consultant'),
   'service', 'step_action',
   '환경부 홈페이지에서 환경 관련 자격증 종류를 검색해 관심 있는 것 1개 메모하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [06] 재난안전 관리사  |  공공·안전
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'disaster-safety-manager', '재난안전 관리사', '🆘', '공공·안전', array['public_safety'],
  null, 'manual', true, 77, 'disaster-safety-manager'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'disaster-safety-manager'),
   'service', 'one_liner',
   '재난을 예방하고 위기 상황에 신속히 대응할 수 있도록 계획을 세우고 훈련을 운영하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'disaster-safety-manager'),
   'service', 'easy_description',
   '지진, 화재, 홍수 같은 재난이 일어났을 때 피해를 최소화하기 위해 미리 대응 계획을 세우고, 대피 훈련을 기획하며, 위기 상황에서 지휘하는 역할을 해요. 안전을 설계하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'disaster-safety-manager'),
   'service', 'why_this_job',
   '이상기후와 도시화로 재난 위험이 커지면서 안전 관리 전문가 수요가 늘고 있어요. 사람들을 위기에서 지키는 일에 사명감을 느끼는 학생이라면 탐색해볼 만한 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'disaster-safety-manager'),
   'service', 'mission_hint',
   '학교에서 화재 대피 경로를 확인해보고 재난 발생 시 대응 방법 3가지를 찾아 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'disaster-safety-manager'),
   'service', 'step_action',
   '국민재난안전포털(safekorea.go.kr)에서 재난 유형별 행동 요령을 1가지 읽어보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'disaster-safety-manager'),
   'service', 'step_action',
   '가족과 함께 화재 또는 지진 발생 시 대피 계획을 1장으로 작성해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [07] 보호관찰관  |  공공·안전
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'probation-officer', '보호관찰관', '⚖️', '공공·안전', array['public_safety'],
  null, 'manual', true, 78, 'probation-officer'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'probation-officer'),
   'service', 'one_liner',
   '보호관찰 대상자가 사회에 잘 적응할 수 있도록 정기적으로 상담하고 지원하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'probation-officer'),
   'service', 'easy_description',
   '범죄를 저지른 사람이 다시 사회 구성원으로 돌아올 수 있도록 정기 상담과 지원 프로그램을 운영하는 일이에요. 특히 청소년 비행 예방에 중요한 역할을 해요. 법무부 소속 공무원으로 일하는 경로가 대표적이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'probation-officer'),
   'service', 'why_this_job',
   '재범을 줄이고 사회안전망을 강화하는 데 꼭 필요한 직업이에요. 사람의 변화를 돕는 일에 관심이 있고 법과 복지 두 분야를 함께 탐색하고 싶은 학생에게 잘 맞는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'probation-officer'),
   'service', 'mission_hint',
   '내 주변에 청소년을 돕는 지원 프로그램이 있는지 1개 찾아보세요. 어떤 도움을 제공하는지 확인해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'probation-officer'),
   'service', 'step_action',
   '"보호관찰관이 하는 일" 또는 "보호관찰관 인터뷰"를 검색해 직업 내용 파악하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'probation-officer'),
   'service', 'step_action',
   '법무부 범죄예방정책국 홈페이지에서 보호관찰 제도를 읽고 핵심 내용 2가지 정리하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [08] 교정직 공무원  |  공공·안전
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'correctional-officer', '교정직 공무원', '🔒', '공공·안전', array['public_safety'],
  null, 'manual', true, 79, 'correctional-officer'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'correctional-officer'),
   'service', 'one_liner',
   '교정 시설의 질서와 안전을 유지하며 수용자들이 사회 복귀를 준비할 수 있도록 지도하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'correctional-officer'),
   'service', 'easy_description',
   '교도소에서 규율을 관리하고 수용자들의 생활을 감독하며, 재범 예방을 위한 교육 프로그램에도 참여해요. 법무부 소속 공무원으로 7급·9급 시험을 통해 진입할 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'correctional-officer'),
   'service', 'why_this_job',
   '안정적인 공직 경로이면서 사회 정의 실현에 직접 기여하는 직업이에요. 규칙을 중시하고 책임감 있는 환경에서 일하고 싶은 학생이라면 탐색해볼 만한 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'correctional-officer'),
   'service', 'mission_hint',
   '"교정직 공무원이 하는 일"을 검색해 어떤 업무를 담당하는지 3가지 파악해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'correctional-officer'),
   'service', 'step_action',
   '법무부 교정본부 홈페이지에서 채용 정보와 시험 과목을 확인해보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'correctional-officer'),
   'service', 'step_action',
   '교정 시설을 다룬 다큐멘터리나 뉴스 영상을 1편 보고 느낀 점 적기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [09] 행정직 공무원  |  공공·안전
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'public-administration-officer', '행정직 공무원', '🏛️', '공공·안전', array['public_safety'],
  null, 'manual', true, 80, 'public-administration-officer'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'public-administration-officer'),
   'service', 'one_liner',
   '주민 생활에 필요한 행정 업무를 처리하고 공공 서비스가 원활히 운영되도록 돕는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'public-administration-officer'),
   'service', 'easy_description',
   '시청, 구청, 주민센터에서 민원 서류 처리, 복지 서비스 안내, 지역 사업 운영 등 다양한 행정 업무를 담당해요. 7급·9급 공무원 시험을 통해 진입하며 다양한 행정 분야를 경험할 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'public-administration-officer'),
   'service', 'why_this_job',
   '안정적인 직업 환경과 다양한 행정 분야 경험이 강점이에요. 사회 전반의 흐름을 이해하고 사람들의 일상과 가까운 곳에서 일하고 싶은 학생에게 잘 맞는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'public-administration-officer'),
   'service', 'mission_hint',
   '가까운 주민센터 홈페이지를 찾아 어떤 서비스를 제공하는지 3가지 확인해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'public-administration-officer'),
   'service', 'step_action',
   '"9급 공무원 행정직 시험 과목"을 검색해 어떤 공부가 필요한지 파악해보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'public-administration-officer'),
   'service', 'step_action',
   '9급 공무원 합격 후기나 인터뷰 영상을 1편 보고 준비 방법과 하는 일 정리하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [10] 항공정비사  |  항공·운송
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'aircraft-maintenance-technician', '항공정비사', '🔧', '항공·운송', array['public_safety'],
  null, 'manual', true, 81, 'aircraft-maintenance-technician'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'aircraft-maintenance-technician'),
   'service', 'one_liner',
   '항공기 엔진과 기체, 장비를 꼼꼼히 점검하고 정비해 안전한 비행을 지원하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'aircraft-maintenance-technician'),
   'service', 'easy_description',
   '비행기가 이륙하기 전 수천 개의 부품이 모두 정상인지 점검하고 이상이 있으면 수리하는 일이에요. 정확성과 집중력이 무엇보다 중요하고, 항공정비사 국가자격증이 필요해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'aircraft-maintenance-technician'),
   'service', 'why_this_job',
   '항공 여행 수요 증가와 함께 MRO(항공기 유지·수리·정비) 산업이 성장하면서 전문 인력 수요가 늘고 있어요. 기계를 다루는 것을 좋아하고 섬세하게 작업하는 학생에게 잘 맞는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'aircraft-maintenance-technician'),
   'service', 'mission_hint',
   '유튜브에서 비행기 엔진이 작동하는 원리를 설명하는 영상을 보고 기억에 남는 내용을 메모해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'aircraft-maintenance-technician'),
   'service', 'step_action',
   '"항공정비학과" 또는 "항공정비사 자격증"을 검색해 진로 경로를 찾아보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'aircraft-maintenance-technician'),
   'service', 'step_action',
   '항공정비사 국가자격증 취득 조건을 검색해 요건 1가지를 정리하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [11] 물류 관리사  |  항공·운송
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'logistics-manager', '물류 관리사', '📦', '항공·운송', array['business'],
  null, 'manual', true, 82, 'logistics-manager'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'logistics-manager'),
   'service', 'one_liner',
   '물건이 생산지에서 소비자까지 빠르고 효율적으로 이동할 수 있도록 운송·보관 흐름을 관리하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'logistics-manager'),
   'service', 'easy_description',
   '공장에서 만든 물건이 창고를 거쳐 배송까지 이어지는 전 과정을 설계하고 조율해요. 온라인 쇼핑이 늘면서 빠른 배송이 중요해진 만큼, 이 흐름을 최적화하는 물류 관리사의 역할도 커지고 있어요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'logistics-manager'),
   'service', 'why_this_job',
   '전자상거래 시장이 성장하면서 물류 최적화 전문가 수요가 꾸준히 늘고 있어요. 물류관리사 국가자격증 취득 경로가 있어 목표가 명확하고, 다양한 산업에서 활동할 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'logistics-manager'),
   'service', 'mission_hint',
   '택배가 도착하기까지 어떤 과정을 거치는지 순서대로 적어보세요. 생산·포장·운송·배달을 연결해보는 거예요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'logistics-manager'),
   'service', 'step_action',
   '"물류관리사 자격증" 시험 과목과 합격 경로를 검색해 파악하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'logistics-manager'),
   'service', 'step_action',
   '유튜브에서 물류 센터 투어 영상을 1편 보고 어떤 장비와 시스템이 사용되는지 메모하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [12] 영상 감독  |  콘텐츠·미디어
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'video-director', '영상 감독', '🎬', '콘텐츠·미디어', array['media'],
  null, 'manual', true, 83, 'video-director'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'video-director'),
   'service', 'one_liner',
   '영상의 전체 표현 방향을 결정하고 촬영·편집·연출 과정 전반을 이끄는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'video-director'),
   'service', 'easy_description',
   '광고, 뮤직비디오, 영화 같은 영상 콘텐츠에서 어떤 장면을 어떻게 찍을지 결정하고 현장을 이끄는 사람이에요. 카메라 구도, 조명, 편집 방향까지 총괄하며 창의성과 리더십이 함께 필요해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'video-director'),
   'service', 'why_this_job',
   'OTT 플랫폼과 유튜브 콘텐츠 시장이 커지면서 영상 연출 전문가 수요가 빠르게 늘고 있어요. 영상으로 이야기를 전달하는 것을 좋아하는 학생이라면 탐색해볼 만한 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'video-director'),
   'service', 'mission_hint',
   '좋아하는 유튜브 영상이나 광고를 1개 골라 카메라 각도와 편집 방식을 주의 깊게 관찰해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'video-director'),
   'service', 'step_action',
   '"영상 감독 인터뷰" 또는 "광고 감독 되는 법" 유튜브 영상 1편을 보고 준비 방법 메모하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'video-director'),
   'service', 'step_action',
   '스마트폰으로 30초짜리 짧은 영상을 직접 촬영해보고 어떤 점을 개선하고 싶은지 적기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [13] 게임 기획자  |  콘텐츠·미디어
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'game-planner', '게임 기획자', '🎲', '콘텐츠·미디어', array['media'],
  null, 'manual', true, 84, 'game-planner'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'game-planner'),
   'service', 'one_liner',
   '게임의 규칙, 세계관, 미션을 설계하고 개발자·디자이너에게 전달하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'game-planner'),
   'service', 'easy_description',
   '게임의 레벨 구성, 아이템 규칙, 스토리 흐름을 문서로 기획하고 개발 팀에 전달하는 역할이에요. 게임을 만드는 것은 "어떻게 재미있게 만들까"를 먼저 설계하는 일이에요. 다양한 전공에서 진입할 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'game-planner'),
   'service', 'why_this_job',
   '모바일·PC·콘솔 게임 시장이 꾸준히 성장하면서 창의적인 게임 기획자 수요가 늘고 있어요. 게임을 즐기는 것에서 나아가 "왜 이 게임이 재미있는가"를 분석하는 학생에게 잘 맞는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'game-planner'),
   'service', 'mission_hint',
   '좋아하는 게임에서 규칙 1가지를 골라 "왜 이런 규칙이 있을까?" 분석해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'game-planner'),
   'service', 'step_action',
   '보드게임 1개의 규칙서를 처음부터 읽어보고 어떤 요소가 재미를 만드는지 분석하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'game-planner'),
   'service', 'step_action',
   '간단한 보드게임 규칙을 직접 기획해 종이에 써보고 가족과 함께 테스트해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [14] 스포츠 해설가  |  콘텐츠·미디어
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'sports-commentator', '스포츠 해설가', '🏟️', '콘텐츠·미디어', array['media'],
  null, 'manual', true, 85, 'sports-commentator'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'sports-commentator'),
   'service', 'one_liner',
   '스포츠 경기 상황을 시청자가 이해하기 쉽도록 설명하고 해설하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-commentator'),
   'service', 'easy_description',
   '경기 중 선수의 움직임, 전술 변화, 경기 흐름을 분석해 알기 쉽게 설명하는 일이에요. 스포츠에 대한 깊은 지식과 순발력 있는 말하기 능력이 함께 필요해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-commentator'),
   'service', 'why_this_job',
   '유튜브, OTT, 스트리밍 플랫폼으로 스포츠 중계 채널이 다양해지면서 해설 전문가를 필요로 하는 자리가 늘고 있어요. 좋아하는 스포츠를 직업으로 연결하고 싶은 학생에게 탐색해볼 만한 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'sports-commentator'),
   'service', 'mission_hint',
   '좋아하는 스포츠 경기를 보면서 10분 동안 경기 상황을 소리 내어 해설해보고 녹음해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-commentator'),
   'service', 'step_action',
   '좋아하는 스포츠 해설가 인터뷰를 찾아보고 어떻게 준비했는지 메모하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'sports-commentator'),
   'service', 'step_action',
   '관심 있는 팀 또는 선수를 정해 100단어 분량의 소개글을 직접 써보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [15] 인사 전문가  |  비즈니스·경영
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'human-resources-specialist', '인사 전문가', '👥', '비즈니스·경영', array['business'],
  null, 'manual', true, 86, 'human-resources-specialist'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'human-resources-specialist'),
   'service', 'one_liner',
   '사람을 채용하고 성장을 지원하며 조직이 잘 협력할 수 있도록 돕는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'human-resources-specialist'),
   'service', 'easy_description',
   '좋은 인재를 선발하는 채용 업무, 직원들이 성장할 교육 프로그램 기획, 공정한 성과 평가 체계 운영까지 폭넓은 일을 해요. 사람과 조직 모두에 관심 있는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'human-resources-specialist'),
   'service', 'why_this_job',
   '모든 기업에 인사 부서가 필요하고, 조직 문화와 일하는 방식에 대한 관심이 높아지면서 인사 전문가의 역할도 커지고 있어요. 심리학·경영학 등 다양한 전공에서 진입할 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'human-resources-specialist'),
   'service', 'mission_hint',
   '"내가 팀원을 뽑는다면 어떤 기준을 쓸까?" 기준 3가지를 적어보고 이유를 써보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'human-resources-specialist'),
   'service', 'step_action',
   '관심 있는 기업의 채용 공고를 1개 찾아 어떤 인재를 원하는지 정리하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'human-resources-specialist'),
   'service', 'step_action',
   '인사관리 관련 책의 목차를 검색해 어떤 내용을 배우는지 살펴보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [16] 재무 설계사  |  비즈니스·경영
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'financial-planner', '재무 설계사', '💰', '비즈니스·경영', array['business'],
  null, 'manual', true, 87, 'financial-planner'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'financial-planner'),
   'service', 'one_liner',
   '개인과 가족이 재무 목표를 달성할 수 있도록 저축·투자 계획을 함께 세우는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'financial-planner'),
   'service', 'easy_description',
   '수입과 지출을 파악하고, 목표에 맞는 저축과 투자 방법을 제안하는 일이에요. 막연한 재무 불안을 구체적인 계획으로 바꿔주는 역할이에요. AFPK·CFP 같은 자격증을 통해 전문성을 쌓을 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'financial-planner'),
   'service', 'why_this_job',
   '금융 환경이 복잡해지면서 전문 재무 설계사 수요가 늘고 있어요. 숫자를 다루는 것을 좋아하고 사람들의 경제적 고민을 함께 해결해주고 싶은 학생에게 잘 맞는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'financial-planner'),
   'service', 'mission_hint',
   '한 달 용돈을 어떻게 썼는지 기록해보고, 더 잘 사용할 방법이 무엇인지 생각해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'financial-planner'),
   'service', 'step_action',
   '"재무설계사" 또는 "AFPK 자격증"을 검색해 어떤 역할을 하는지 파악하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'financial-planner'),
   'service', 'step_action',
   '청소년 금융 교육 유튜브 영상에서 용돈 관리 방법을 1가지 배워 실제로 적용해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [17] 프로덕트 매니저  |  비즈니스·경영
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'product-manager', '프로덕트 매니저', '🗂️', '비즈니스·경영', array['business'],
  null, 'manual', true, 88, 'product-manager'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'product-manager'),
   'service', 'one_liner',
   '제품의 방향을 기획하고 개발팀·디자인팀이 함께 목표를 향해 나아갈 수 있도록 조율하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'product-manager'),
   'service', 'easy_description',
   '"어떤 앱을 왜 만들지?"를 결정하고 개발자·디자이너·마케터가 한 방향으로 움직이도록 이끄는 역할이에요. 기술을 직접 만들지 않아도 되지만, 사용자 문제를 정확히 파악하고 해결 방향을 설계하는 능력이 핵심이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'product-manager'),
   'service', 'why_this_job',
   'IT 서비스가 모든 산업에 퍼지면서 PM(프로덕트 매니저)의 역할이 빠르게 중요해지고 있어요. 아이디어를 현실로 만드는 과정을 이끌고 싶은 학생에게 잘 맞는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'product-manager'),
   'service', 'mission_hint',
   '매일 쓰는 앱 하나를 골라 불편한 점을 찾아보고 어떻게 개선하면 좋을지 아이디어를 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'product-manager'),
   'service', 'step_action',
   '"PM이 하는 일" 또는 "프로덕트 매니저 직무 소개" 유튜브 영상 1편을 보고 핵심 내용 정리하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'product-manager'),
   'service', 'step_action',
   '앱 스토어 리뷰에서 불편하다는 내용 5개를 모아 어떤 개선이 필요한지 정리해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [18] 평생교육사  |  교육·사회
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'lifelong-education-specialist', '평생교육사', '🎓', '교육·사회', array['education'],
  null, 'manual', true, 89, 'lifelong-education-specialist'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'lifelong-education-specialist'),
   'service', 'one_liner',
   '다양한 연령대의 사람들이 지속적으로 배울 수 있도록 교육 과정과 프로그램을 기획하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'lifelong-education-specialist'),
   'service', 'easy_description',
   '도서관, 복지관, 기업체에서 어른들을 위한 강좌를 기획하고 운영하는 일이에요. 요리 수업부터 디지털 리터러시 교육까지 배움이 필요한 사람들과 교육을 연결하는 역할을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'lifelong-education-specialist'),
   'service', 'why_this_job',
   '고령화와 디지털 전환으로 평생 학습 수요가 늘고 있어요. 평생교육사 국가자격증이 있어 취업 경로가 명확하고, 교육과 사람을 연결하는 일에 보람을 느끼는 학생에게 잘 맞는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'lifelong-education-specialist'),
   'service', 'mission_hint',
   '가까운 주민센터나 도서관 홈페이지에서 평생교육 프로그램을 1개 찾아보고 어떤 사람들을 위한 강좌인지 확인해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'lifelong-education-specialist'),
   'service', 'step_action',
   '"평생교육사 자격증 취득 방법"을 검색해 어떤 과목을 배우고 어떻게 자격을 얻는지 파악하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'lifelong-education-specialist'),
   'service', 'step_action',
   '내가 강사라면 어떤 수업을 만들고 싶은지 아이디어 1가지를 제목과 대상 연령과 함께 적어보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [19] 청소년지도사  |  교육·사회
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'youth-worker', '청소년지도사', '🤝', '교육·사회', array['education'],
  null, 'manual', true, 90, 'youth-worker'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'youth-worker'),
   'service', 'one_liner',
   '청소년이 건강하게 성장하고 잠재력을 발휘할 수 있도록 다양한 활동과 상담 프로그램을 운영하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'youth-worker'),
   'service', 'easy_description',
   '청소년 센터에서 진로 탐색, 봉사 활동, 문화 체험 프로그램을 기획하고 운영해요. 상담 역할도 하며 10대 청소년들이 고민을 나눌 수 있는 환경을 만들어요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'youth-worker'),
   'service', 'why_this_job',
   '청소년 정책이 강화되고 청소년 지원 기관이 늘면서 전문 인력 수요가 증가하고 있어요. 1급·2급 국가자격증이 있어 진입 경로가 체계적이에요. 청소년과 함께 성장하는 일에 보람을 느끼는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'youth-worker'),
   'service', 'mission_hint',
   '10대 친구들에게 만들어주고 싶은 프로그램 3가지를 적어보고 이유를 써보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'youth-worker'),
   'service', 'step_action',
   '"청소년지도사 자격증" 또는 "청소년지도사 하는 일"을 검색해 취득 방법과 역할 파악하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'youth-worker'),
   'service', 'step_action',
   '가까운 청소년 수련관이나 청소년 센터 홈페이지에서 프로그램 목록을 찾아 어떤 활동들이 있는지 살펴보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [20] 방과후 강사  |  교육·사회
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'after-school-teacher', '방과후 강사', '🏫', '교육·사회', array['education'],
  null, 'manual', true, 91, 'after-school-teacher'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'after-school-teacher'),
   'service', 'one_liner',
   '학교 수업이 끝난 뒤 다양한 과목과 활동을 가르치며 학생들의 다양한 흥미와 능력을 이끌어내는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'after-school-teacher'),
   'service', 'easy_description',
   '미술, 체육, 과학 실험, 코딩 등 다양한 방과후 수업을 운영하며 아이들이 배움의 즐거움을 느끼도록 이끄는 일이에요. 자신이 잘하는 분야로 수업을 열 수 있어 진입 방식이 다양해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'after-school-teacher'),
   'service', 'why_this_job',
   '방과후 프로그램이 학교 교육의 중요한 축으로 자리잡으면서 강사 수요가 꾸준해요. 아이들을 가르치는 것에 즐거움을 느끼고 자신만의 수업 방식을 만들고 싶은 학생에게 잘 맞는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'after-school-teacher'),
   'service', 'mission_hint',
   '내가 잘하거나 좋아하는 것 1가지를 골라 초등학생에게 어떻게 가르칠지 계획을 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'after-school-teacher'),
   'service', 'step_action',
   '"방과후강사 자격증" 또는 "방과후학교 강사 되는 법"을 검색해 진입 방법을 파악하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'after-school-teacher'),
   'service', 'step_action',
   '좋아하는 과목과 관련된 교육 자료나 교안 1개를 검색해보고 어떻게 구성됐는지 살펴보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [21] 네트워크 엔지니어  |  IT·기술
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'network-engineer', '네트워크 엔지니어', '📡', 'IT·기술', array['it'],
  null, 'manual', true, 92, 'network-engineer'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'network-engineer'),
   'service', 'one_liner',
   '컴퓨터와 서버가 안정적으로 연결되도록 네트워크 시스템을 설계하고 관리하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'network-engineer'),
   'service', 'easy_description',
   '학교, 회사, 병원에서 인터넷을 쓸 수 있는 것은 네트워크 장비를 설치하고 연결을 관리하는 엔지니어 덕분이에요. 오류를 찾아 수정하고, 보안 위협을 차단하며, 더 빠른 연결을 설계하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'network-engineer'),
   'service', 'why_this_job',
   '클라우드, IoT, 스마트홈 등 연결 기술이 성장하면서 네트워크 엔지니어 수요가 꾸준히 늘고 있어요. CCNA 같은 국제 자격증이 있어 목표가 명확하고, 문제를 논리적으로 해결하는 걸 좋아하는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'network-engineer'),
   'service', 'mission_hint',
   '집에서 와이파이가 잘 안 터지는 곳을 찾아보고 "왜 그럴까?" 이유를 생각해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'network-engineer'),
   'service', 'step_action',
   '"네트워크란 무엇인가" 또는 "IP 주소 원리" 유튜브 영상을 1편 보고 핵심 개념 1가지 정리하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'network-engineer'),
   'service', 'step_action',
   '공유기와 스위치가 무슨 역할을 하는지 검색해 차이를 간단히 정리해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [22] 모바일 앱 개발자  |  IT·기술
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'mobile-app-developer', '모바일 앱 개발자', '📱', 'IT·기술', array['it'],
  null, 'manual', true, 93, 'mobile-app-developer'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'mobile-app-developer'),
   'service', 'one_liner',
   '스마트폰 앱을 만들고 기능을 개선해 사람들이 더 편리하게 사용할 수 있도록 하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'mobile-app-developer'),
   'service', 'easy_description',
   'iOS와 안드로이드 앱의 화면, 버튼, 기능, 서버 연동을 개발하는 일이에요. Swift, Kotlin, Flutter 같은 언어를 배워 내가 만든 앱이 수백만 명의 손안에 들어가는 경험을 할 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'mobile-app-developer'),
   'service', 'why_this_job',
   '스마트폰 앱 시장이 계속 성장하면서 모바일 개발자 수요가 꾸준히 높아요. 혼자 또는 소규모 팀으로 앱을 만들어 출시하는 개인 창작도 가능한 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'mobile-app-developer'),
   'service', 'mission_hint',
   '매일 쓰는 앱 3개를 골라 가장 유용한 기능과 개선하고 싶은 기능을 각각 1가지씩 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'mobile-app-developer'),
   'service', 'step_action',
   '관심 있는 분야(음악·운동·요리 등) 앱 1개를 찾아 어떤 기능이 핵심인지 분석하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'mobile-app-developer'),
   'service', 'step_action',
   '"앱인벤터" 또는 "스크래치 앱 만들기" 유튜브 영상을 보며 간단한 앱 구성을 직접 따라해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;

-- ============================================================
-- [23] 방사선사  |  의료·과학
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'radiologic-technologist', '방사선사', '🏥', '의료·과학', array['medical'],
  null, 'manual', true, 94, 'radiologic-technologist'
)
on conflict (slug) do nothing;

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'radiologic-technologist'),
   'service', 'one_liner',
   'X선·CT·MRI 같은 의료 영상 장비를 조작해 진단에 필요한 이미지를 촬영하는 일을 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'radiologic-technologist'),
   'service', 'easy_description',
   '병원에서 X선 촬영, CT 스캔, MRI, 초음파 검사를 전문적으로 수행하는 사람이 방사선사예요. 정확한 촬영이 올바른 진단으로 이어지기 때문에 높은 집중력과 환자를 편안하게 안내하는 소통 능력이 중요해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'radiologic-technologist'),
   'service', 'why_this_job',
   '의료 영상 기술이 발전하고 건강검진 수요가 늘면서 방사선사 역할이 커지고 있어요. 방사선사 국가자격증이 필요하며, 의료 기술에 관심 있고 사람을 돕는 일에 보람을 느끼는 학생에게 잘 맞는 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no) do nothing;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'radiologic-technologist'),
   'service', 'mission_hint',
   '"X선 사진이 찍히는 방법"을 유튜브에서 검색해보고 어떤 원리인지 가족에게 설명해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'radiologic-technologist'),
   'service', 'step_action',
   '"방사선사 자격증" 및 관련 학과를 검색해 어떤 과목을 배우는지 파악하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'radiologic-technologist'),
   'service', 'step_action',
   '"MRI 원리" 또는 "X선 원리" 유튜브 영상을 1편 보고 가장 신기한 내용 1가지를 메모하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) do nothing;


-- ============================================================
-- 검증 쿼리 (migration 적용 후 SQL Editor에서 확인)
-- ============================================================

-- [검증 1] 신규 삽입 23개 occupation_master 확인
-- SELECT
--   slug,
--   name_ko,
--   category,
--   priority,
--   is_active,
--   sync_status,
--   legacy_occupation_id
-- FROM public.occupation_master
-- WHERE slug IN (
--   'smart-farm-specialist', 'climate-data-analyst', 'resource-recycling-specialist',
--   'green-building-specialist', 'environmental-consultant',
--   'disaster-safety-manager', 'probation-officer', 'correctional-officer',
--   'public-administration-officer',
--   'aircraft-maintenance-technician', 'logistics-manager',
--   'video-director', 'game-planner', 'sports-commentator',
--   'human-resources-specialist', 'financial-planner', 'product-manager',
--   'lifelong-education-specialist', 'youth-worker', 'after-school-teacher',
--   'network-engineer', 'mobile-app-developer',
--   'radiologic-technologist'
-- )
-- ORDER BY priority;
-- 기대: 23 rows, is_active=true, sync_status='manual', priority 72~94

-- [검증 2] occupation_summary 행 수 확인 (23 × 3 = 69행)
-- SELECT COUNT(*) AS summary_count
-- FROM public.occupation_summary s
-- JOIN public.occupation_master m ON s.occupation_id = m.id
-- WHERE m.slug IN (
--   'smart-farm-specialist', 'climate-data-analyst', 'resource-recycling-specialist',
--   'green-building-specialist', 'environmental-consultant',
--   'disaster-safety-manager', 'probation-officer', 'correctional-officer',
--   'public-administration-officer',
--   'aircraft-maintenance-technician', 'logistics-manager',
--   'video-director', 'game-planner', 'sports-commentator',
--   'human-resources-specialist', 'financial-planner', 'product-manager',
--   'lifelong-education-specialist', 'youth-worker', 'after-school-teacher',
--   'network-engineer', 'mobile-app-developer',
--   'radiologic-technologist'
-- );
-- 기대: 69

-- [검증 3] occupation_preparations 행 수 확인 (23 × 3 = 69행)
-- SELECT COUNT(*) AS prep_count
-- FROM public.occupation_preparations p
-- JOIN public.occupation_master m ON p.occupation_id = m.id
-- WHERE m.slug IN (
--   'smart-farm-specialist', 'climate-data-analyst', 'resource-recycling-specialist',
--   'green-building-specialist', 'environmental-consultant',
--   'disaster-safety-manager', 'probation-officer', 'correctional-officer',
--   'public-administration-officer',
--   'aircraft-maintenance-technician', 'logistics-manager',
--   'video-director', 'game-planner', 'sports-commentator',
--   'human-resources-specialist', 'financial-planner', 'product-manager',
--   'lifelong-education-specialist', 'youth-worker', 'after-school-teacher',
--   'network-engineer', 'mobile-app-developer',
--   'radiologic-technologist'
-- );
-- 기대: 69

-- [검증 4] 카테고리별 집계 확인
-- SELECT
--   category,
--   COUNT(*) FILTER (WHERE is_representative = true  AND is_active = true) AS representative_active,
--   COUNT(*) FILTER (WHERE is_representative = false)                       AS sub_occupation,
--   COUNT(*) FILTER (WHERE is_active = true)                                AS active_total
-- FROM public.occupation_master
-- GROUP BY category
-- ORDER BY category;

do $$ begin
  raise notice '✅ 053: 1차 확장 직업 23개 bulk insert 완료';
  raise notice '   환경·미래산업 (5): smart-farm-specialist, climate-data-analyst,';
  raise notice '                       resource-recycling-specialist, green-building-specialist,';
  raise notice '                       environmental-consultant';
  raise notice '   공공·안전     (4): disaster-safety-manager, probation-officer,';
  raise notice '                       correctional-officer, public-administration-officer';
  raise notice '   항공·운송     (2): aircraft-maintenance-technician, logistics-manager';
  raise notice '   콘텐츠·미디어 (3): video-director, game-planner, sports-commentator';
  raise notice '   비즈니스·경영 (3): human-resources-specialist, financial-planner, product-manager';
  raise notice '   교육·사회     (3): lifelong-education-specialist, youth-worker, after-school-teacher';
  raise notice '   IT·기술       (2): network-engineer, mobile-app-developer';
  raise notice '   의료·과학     (1): radiologic-technologist';
  raise notice '   ⚠ occupation_goyo24_profile / quizData / roadmaps는 별도 작업 필요';
  raise notice '   ⚠ Production 적용 전 OZ 승인 필수';
end $$;

commit;
