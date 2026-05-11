-- ====================================================
-- 028_seed_phase2_20_occupations.sql
-- 2차 확장 직업 20개 시드 — migration 버전
--
-- [목적]
--   베타 공개 직업 수를 30개 → 50개로 확장.
--   occupation_master / occupation_summary / occupation_preparations 포함.
--   occupation_goyo24_profile은 sync 스크립트 별도 실행.
--   occupation_student_actions는 별도 migration에서 진행.
--
-- [idempotent 원칙]
--   occupation_master   : slug 기준 ON CONFLICT DO UPDATE
--                         → id(UUID) 변경 없음, is_active / sync_status 건드리지 않음
--   occupation_summary  : (occupation_id, layer, content_type, version_no) 기준 ON CONFLICT
--   occupation_preparations : (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) 기준 ON CONFLICT
--
-- [GOYO24 처리]
--   sync_status='manual' (8개) : 클라우드 엔지니어, VR·AR 개발자, 창업가,
--                                 일러스트레이터, 외교관, 신재생에너지 전문가,
--                                 환경 엔지니어, 탄소중립전문가
--                                 → sync 스크립트 GOYO24_UNSUPPORTED에서 skip
--   sync_status='pending' (12개): sync 스크립트 실행 시 upsert 대상
--
-- [포함 직업 — 2차 추가 20개]
--   IT·기술        : 클라우드 엔지니어, VR·AR 개발자
--   의료·과학      : 물리치료사, 응급구조사
--   예술·디자인    : 제품 디자이너, UX/UI 디자이너, 일러스트레이터, 포토그래퍼
--   교육·사회      : 유치원교사, 사서
--   비즈니스·경영  : 창업가, 무역전문가, 은행원
--   콘텐츠·미디어  : 소설가, 번역가
--   공공·안전      : 외교관, 해양경찰관
--   환경·미래산업  : 신재생에너지 전문가, 환경 엔지니어, 탄소중립전문가
--
-- [실행 순서]
--   1. 026 / 027 migration 실행 완료 확인
--   2. 이 파일 실행 (SQL Editor — service_role)
--   3. 하단 검증 쿼리 확인
--   4. 콘텐츠 육안 검토
--   5. ACTIVATE 섹션 실행 (주석 해제 후)
--   6. goyo24 sync 스크립트 --dry-run 후 실제 실행
-- ====================================================


-- ============================================================
-- [01] 클라우드 엔지니어  |  IT·기술  |  GOYO24_UNSUPPORTED
--      slug = legacy = 'cloud-engineer'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'cloud-engineer', '클라우드 엔지니어', '☁️', 'IT·기술', array['it'],
  null, 'manual', false, 50, 'cloud-engineer'
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
  ((select id from public.occupation_master where slug = 'cloud-engineer'),
   'service', 'one_liner',
   '인터넷 서비스가 멈추지 않도록 서버와 데이터를 클라우드에서 관리하고 운영하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'cloud-engineer'),
   'service', 'easy_description',
   '넷플릭스나 유튜브가 수억 명에게 동시에 서비스되는 건 클라우드 덕분이에요. 클라우드 엔지니어는 이 거대한 서버 인프라를 설계하고 유지해요. 컴퓨터 네트워크와 시스템 구조가 궁금한 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'cloud-engineer'),
   'service', 'why_this_job',
   '앱, 게임, 스트리밍 서비스 대부분이 클라우드 위에서 돌아가요. IT를 좋아하면서 "눈에 보이지 않는 인프라"를 설계하고 싶은 학생이라면 탐색해볼 만한 방향이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'cloud-engineer'),
   'service', 'mission_hint',
   '지금 사용하는 앱 중 하나를 골라 "이 앱이 어떻게 동시에 수백만 명에게 서비스될까?" 생각해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'cloud-engineer'),
   'service', 'step_action',
   '유튜브에서 "클라우드 컴퓨팅이란" 영상을 검색해 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'cloud-engineer'),
   'service', 'step_action',
   'AWS 또는 Google Cloud 공식 입문 페이지를 방문해 클라우드 서비스 종류 3가지 찾아보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [02] VR·AR 개발자  |  IT·기술  |  GOYO24_UNSUPPORTED
--      slug = legacy = 'vr-ar-developer'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'vr-ar-developer', 'VR·AR 개발자', '🥽', 'IT·기술', array['it'],
  null, 'manual', false, 49, 'vr-ar-developer'
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
  ((select id from public.occupation_master where slug = 'vr-ar-developer'),
   'service', 'one_liner',
   '가상현실(VR)과 증강현실(AR) 환경을 직접 개발하고 사용자 경험을 설계하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'vr-ar-developer'),
   'service', 'easy_description',
   'VR 게임 속에서 블록을 자르거나 AR로 가구를 방에 배치해보는 경험 — 이걸 만드는 사람이 VR·AR 개발자예요. 프로그래밍과 3D 공간 감각이 동시에 필요해요. 게임·교육·의료 등 다양한 분야에서 활용되고 있어요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'vr-ar-developer'),
   'service', 'why_this_job',
   '메타버스와 실감형 콘텐츠에 관심 있는 학생이라면 지금부터 3D 툴과 간단한 코딩을 접해볼 수 있어요. 아직 성장 중인 분야라 진입 초기에 탐색하는 경험이 도움이 돼요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'vr-ar-developer'),
   'service', 'mission_hint',
   'VR이나 AR을 경험한 적 있다면 "이걸 만들려면 어떤 기술이 필요할까?" 떠올려보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'vr-ar-developer'),
   'service', 'step_action',
   '유튜브에서 "VR 개발 입문" 또는 "Unity VR 기초" 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'vr-ar-developer'),
   'service', 'step_action',
   'Unity 또는 Unreal Engine 공식 사이트에서 무료 입문 학습 자료 하나 찾아 읽어보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [03] 물리치료사  |  의료·과학  |  MANUAL K000007501 (auto 가능)
--      slug = legacy = 'physical-therapist'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'physical-therapist', '물리치료사', '💪', '의료·과학', array['medical'],
  null, 'pending', false, 48, 'physical-therapist'
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
  ((select id from public.occupation_master where slug = 'physical-therapist'),
   'service', 'one_liner',
   '다친 몸이나 신체 기능 저하를 운동과 치료로 회복시키는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'physical-therapist'),
   'service', 'easy_description',
   '운동 중 다친 선수가 다시 경기에 복귀하도록 돕거나, 뇌졸중 후 걷지 못하게 된 환자가 다시 걸을 수 있게 재활을 이끄는 사람이 물리치료사예요. 의학 지식과 신체 움직임 이해, 그리고 환자를 꾸준히 돕는 끈기가 필요한 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'physical-therapist'),
   'service', 'why_this_job',
   '스포츠나 의료에 관심 있고 사람을 직접 도우며 성취감을 느끼는 학생에게 잘 맞아요. 인구 고령화로 재활 수요도 꾸준히 늘고 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'physical-therapist'),
   'service', 'mission_hint',
   '몸의 관절과 근육 중 하나를 골라 어떻게 움직이는지 직접 찾아보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'physical-therapist'),
   'service', 'step_action',
   '유튜브에서 "물리치료사 하루 일과" 또는 "재활치료란" 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'physical-therapist'),
   'service', 'step_action',
   '집에서 간단한 스트레칭 루틴 하나를 찾아 1주일 동안 직접 실천해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [04] 응급구조사  |  의료·과학  |  AUTO K000007461
--      slug = legacy = 'emergency-medical-technician'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'emergency-medical-technician', '응급구조사', '🚑', '의료·과학', array['medical'],
  null, 'pending', false, 47, 'emergency-medical-technician'
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
  ((select id from public.occupation_master where slug = 'emergency-medical-technician'),
   'service', 'one_liner',
   '응급 상황에서 가장 먼저 현장에 도착해 생명을 지키는 응급처치를 수행하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'emergency-medical-technician'),
   'service', 'easy_description',
   '119에 신고가 들어오면 구급차를 타고 현장으로 달려가 심폐소생술과 응급처치를 하는 사람이 응급구조사예요. 빠른 판단력과 침착함이 가장 중요하고, 의료 지식과 체력도 모두 갖춰야 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'emergency-medical-technician'),
   'service', 'why_this_job',
   '누군가의 생명을 직접 살리는 현장에서 일하고 싶은 학생에게 잘 맞아요. 의료와 공공 서비스 두 분야를 함께 경험할 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'emergency-medical-technician'),
   'service', 'mission_hint',
   '응급 상황에서 내가 지금 당장 할 수 있는 행동이 무엇인지 생각해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'emergency-medical-technician'),
   'service', 'step_action',
   '대한적십자사나 소방청 공식 유튜브에서 심폐소생술(CPR) 기초 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'emergency-medical-technician'),
   'service', 'step_action',
   '응급구조학과가 있는 대학 2곳을 찾아 어떤 내용을 배우는지 확인해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [05] 제품 디자이너  |  예술·디자인  |  MANUAL_MAPPING K000001000
--      slug = legacy = 'product-designer'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'product-designer', '제품 디자이너', '🪛', '예술·디자인', array['art'],
  null, 'pending', false, 46, 'product-designer'
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
  ((select id from public.occupation_master where slug = 'product-designer'),
   'service', 'one_liner',
   '생활 속 제품의 형태와 기능을 함께 고려해 사람이 쓰기 편하고 아름다운 물건을 설계하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'product-designer'),
   'service', 'easy_description',
   '지금 쓰는 스마트폰, 가방, 의자 — 이것들은 모두 누군가가 설계한 결과물이에요. 제품 디자이너는 "어떻게 생겼는가"와 "어떻게 작동하는가"를 함께 고민해요. 미적 감각과 공학적 이해가 동시에 필요해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'product-designer'),
   'service', 'why_this_job',
   '주변 물건을 보면서 "이걸 더 좋게 바꾼다면?" 하는 생각이 자주 드는 학생에게 잘 맞아요. 제품 디자인은 생활 속 작은 불편을 해결하는 데서 시작해요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'product-designer'),
   'service', 'mission_hint',
   '오늘 불편하게 느낀 제품 하나를 골라 무엇을 어떻게 바꾸면 좋을지 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'product-designer'),
   'service', 'step_action',
   '유튜브에서 "제품 디자인 과정" 영상을 검색해 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'product-designer'),
   'service', 'step_action',
   '종이와 연필로 좋아하는 물건을 다시 디자인해보고 스케치 1장 그리기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [06] UX/UI 디자이너  |  예술·디자인  |  MANUAL_MAPPING K000000890
--      slug = legacy = 'ux-ui-designer'
--      ⚠️  슬래시(/) 포함 직업명 — slug는 'ux-ui-designer' 고정
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'ux-ui-designer', 'UX/UI 디자이너', '🖥️', '예술·디자인', array['art'],
  null, 'pending', false, 45, 'ux-ui-designer'
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
  ((select id from public.occupation_master where slug = 'ux-ui-designer'),
   'service', 'one_liner',
   '앱이나 웹사이트를 사람들이 쉽고 편하게 사용할 수 있도록 화면과 흐름을 설계하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'ux-ui-designer'),
   'service', 'easy_description',
   '쇼핑 앱에서 원하는 상품을 쉽게 찾고 결제할 수 있는 건 UX/UI 디자이너가 사용자 흐름을 잘 설계했기 때문이에요. UX(사용자 경험)는 "어떻게 하면 편한가", UI(사용자 인터페이스)는 "화면을 어떻게 구성하는가"를 다뤄요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'ux-ui-designer'),
   'service', 'why_this_job',
   '앱이나 웹을 사용할 때 불편한 점이 바로 보이고 더 좋게 만들고 싶다는 생각이 드는 학생에게 잘 맞아요. 디자인 감각과 논리적 사고를 함께 쓸 수 있는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'ux-ui-designer'),
   'service', 'mission_hint',
   '자주 쓰는 앱 하나를 골라 불편한 점 3가지를 직접 찾아 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'ux-ui-designer'),
   'service', 'step_action',
   '무료 디자인 툴 Figma에 가입하고 기본 화면 하나를 직접 만들어보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'ux-ui-designer'),
   'service', 'step_action',
   '유튜브에서 "UX 디자인이란" 또는 "UI 디자인 기초" 영상 1편 시청하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [07] 일러스트레이터  |  예술·디자인  |  GOYO24_UNSUPPORTED
--      slug = legacy = 'illustrator'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'illustrator', '일러스트레이터', '🎨', '예술·디자인', array['art'],
  null, 'manual', false, 44, 'illustrator'
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
  ((select id from public.occupation_master where slug = 'illustrator'),
   'service', 'one_liner',
   '글, 이야기, 아이디어를 그림으로 표현해 독자에게 시각적으로 전달하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'illustrator'),
   'service', 'easy_description',
   '책 표지 삽화, 광고 이미지, 캐릭터 디자인 — 이 모두가 일러스트레이터의 작업이에요. 디지털 툴이나 전통 재료로 이야기를 시각적으로 전달하는 것이 핵심이에요. 그림 실력보다 "무엇을 어떻게 보여줄까"를 고민하는 능력이 더 중요해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'illustrator'),
   'service', 'why_this_job',
   '그림 그리는 걸 좋아하고 자신의 생각을 이미지로 표현하고 싶은 학생에게 잘 맞아요. 출판, 게임, 광고, 교육 등 다양한 분야에서 일러스트를 필요로 해요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'illustrator'),
   'service', 'mission_hint',
   '오늘 있었던 일 중 하나를 그림 한 장으로 표현해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'illustrator'),
   'service', 'step_action',
   '종이에 좋아하는 캐릭터나 물건을 10분 안에 스케치해보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'illustrator'),
   'service', 'step_action',
   '무료 그림 툴(Krita 또는 MediBang Paint)을 설치해 간단한 그림 1개 그려보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [08] 포토그래퍼  |  예술·디자인  |  MANUAL_MAPPING K000001007
--      slug = legacy = 'photographer'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'photographer', '포토그래퍼', '📷', '예술·디자인', array['art'],
  null, 'pending', false, 43, 'photographer'
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
  ((select id from public.occupation_master where slug = 'photographer'),
   'service', 'one_liner',
   '빛과 구도를 조절해 순간을 사진으로 기록하고 이야기를 전달하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'photographer'),
   'service', 'easy_description',
   '한 장의 사진이 수천 마디 말보다 강하게 감동을 줄 수 있어요. 포토그래퍼는 상업 광고, 신문 보도, 자연 다큐멘터리, 결혼식 등 다양한 현장에서 그 순간을 영구적인 이미지로 담아내요. 기술보다 시선과 감각이 먼저예요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'photographer'),
   'service', 'why_this_job',
   '스마트폰으로 사진 찍는 걸 즐기거나 세상을 관찰하는 걸 좋아하는 학생에게 잘 맞아요. 사진은 지금 당장 스마트폰으로 연습을 시작할 수 있는 몇 안 되는 직업 중 하나예요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'photographer'),
   'service', 'mission_hint',
   '오늘 눈에 띈 것 하나를 스마트폰으로 찍고 "왜 이게 눈에 들어왔나" 생각해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'photographer'),
   'service', 'step_action',
   '스마트폰으로 같은 피사체를 각도·거리를 달리해 3장 찍고 비교해보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'photographer'),
   'service', 'step_action',
   '유튜브에서 "사진 구도 기초" 또는 "스마트폰 사진 잘 찍는 법" 영상 1편 시청하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [09] 유치원교사  |  교육·사회  |  AUTO K000007530
--      slug = legacy = 'kindergarten-teacher'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'kindergarten-teacher', '유치원교사', '🌱', '교육·사회', array['education'],
  null, 'pending', false, 42, 'kindergarten-teacher'
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
  ((select id from public.occupation_master where slug = 'kindergarten-teacher'),
   'service', 'one_liner',
   '어린 아이들이 처음으로 사회를 경험하는 시간을 안전하고 따뜻하게 안내하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'kindergarten-teacher'),
   'service', 'easy_description',
   '유치원교사는 아이들에게 단순히 지식을 가르치는 게 아니에요. 친구와 어울리는 법, 감정을 표현하는 법, 세상에 대한 호기심 — 이런 것들이 놀이와 생활 속에서 자연스럽게 자라도록 함께하는 사람이에요. 아이들을 진심으로 좋아하는 마음이 가장 중요해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'kindergarten-teacher'),
   'service', 'why_this_job',
   '아이들과 함께하는 시간에서 에너지를 얻고 누군가의 성장을 가까이서 지켜보고 싶은 학생에게 잘 맞아요. 유아교육학과를 통해 자격증을 취득해 진입할 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'kindergarten-teacher'),
   'service', 'mission_hint',
   '어린 동생이나 친척 아이에게 새로운 것을 한 가지 가르쳐보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'kindergarten-teacher'),
   'service', 'step_action',
   '유아교육학과를 소개하는 대학 홈페이지 1곳을 찾아 무엇을 배우는지 읽어보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'kindergarten-teacher'),
   'service', 'step_action',
   '유튜브에서 "유치원 교사 하루 일과" 영상을 검색해 1편 시청하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [10] 사서  |  교육·사회  |  AUTO K000007532
--      slug = legacy = 'librarian'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'librarian', '사서', '📚', '교육·사회', array['education'],
  null, 'pending', false, 41, 'librarian'
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
  ((select id from public.occupation_master where slug = 'librarian'),
   'service', 'one_liner',
   '도서관의 자료를 분류하고 관리하며, 사람들이 원하는 정보를 찾을 수 있게 돕는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'librarian'),
   'service', 'easy_description',
   '사서는 책을 꽂는 사람이 아니에요. 수만 권의 책과 디지털 자료를 체계적으로 분류하고, 정보를 찾는 사람에게 가장 정확한 자료를 안내하는 정보 전문가예요. 요즘은 디지털 아카이브 관리도 중요한 역할이 됐어요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'librarian'),
   'service', 'why_this_job',
   '책을 좋아하고 정보를 정리하는 일에서 즐거움을 느끼는 학생에게 잘 맞아요. 단순한 독서가 아니라 정보 조직화 능력이 핵심이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'librarian'),
   'service', 'mission_hint',
   '집이나 학교 도서관에서 책이 어떻게 분류되어 있는지 직접 살펴보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'librarian'),
   'service', 'step_action',
   '국립중앙도서관 홈페이지(www.nl.go.kr)를 방문해 어떤 서비스를 제공하는지 살펴보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'librarian'),
   'service', 'step_action',
   '문헌정보학과가 있는 대학 1곳을 찾아 어떤 내용을 배우는지 읽어보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [11] 창업가  |  비즈니스·경영  |  GOYO24_UNSUPPORTED
--      slug = legacy = 'entrepreneur'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'entrepreneur', '창업가', '💡', '비즈니스·경영', array['business'],
  null, 'manual', false, 40, 'entrepreneur'
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
  ((select id from public.occupation_master where slug = 'entrepreneur'),
   'service', 'one_liner',
   '새로운 제품이나 서비스를 직접 만들고 사업으로 운영하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'entrepreneur'),
   'service', 'easy_description',
   '창업가는 없던 것을 만드는 사람이에요. "이런 서비스가 있으면 좋겠다"는 생각에서 출발해, 직접 팀을 꾸리고 제품을 만들고 판매까지 책임져요. 불확실성을 견디는 힘과 끊임없이 배우려는 의지가 필요해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'entrepreneur'),
   'service', 'why_this_job',
   '아이디어가 많고 직접 뭔가를 만들거나 운영해보고 싶은 학생에게 잘 맞아요. 창업가는 특정 전공이나 자격증 없이도 지금 당장 작은 것부터 시작할 수 있는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'entrepreneur'),
   'service', 'mission_hint',
   '주변에서 불편한 점 하나를 찾고, 그걸 해결하는 아이디어를 간단히 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'entrepreneur'),
   'service', 'step_action',
   '유튜브에서 "청소년 창업" 또는 "스타트업이란" 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'entrepreneur'),
   'service', 'step_action',
   '학교나 동네에서 해결하고 싶은 문제 하나를 골라 해결 방법을 5문장으로 적어보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [12] 무역전문가  |  비즈니스·경영  |  MANUAL_MAPPING K000000918
--      slug = legacy = 'trade-specialist'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'trade-specialist', '무역전문가', '🌐', '비즈니스·경영', array['business'],
  null, 'pending', false, 39, 'trade-specialist'
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
  ((select id from public.occupation_master where slug = 'trade-specialist'),
   'service', 'one_liner',
   '국가 간 물건의 수출·수입을 계획하고 관리하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'trade-specialist'),
   'service', 'easy_description',
   '해외에서 만든 과자가 한국 편의점에 팔리고, 국내 기업의 제품이 세계로 나가는 모든 과정에는 무역전문가가 있어요. 계약서 작성부터 물건이 국경을 넘어 도착하기까지 여러 과정을 조율해요. 외국어 실력과 꼼꼼함이 강점인 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'trade-specialist'),
   'service', 'why_this_job',
   '세계와 연결되는 비즈니스에 관심 있고 영어나 외국어를 활용하고 싶은 학생에게 잘 맞아요. 경영학·국제학 등 다양한 학과에서 진입할 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'trade-specialist'),
   'service', 'mission_hint',
   '집에 있는 물건 3개의 원산지를 확인하고, 어느 나라에서 왔는지 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'trade-specialist'),
   'service', 'step_action',
   '유튜브에서 "무역 실무 기초" 또는 "수출입이란" 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'trade-specialist'),
   'service', 'step_action',
   '한국무역협회(KITA) 홈페이지(www.kita.net)에서 무역 관련 직업 정보 읽어보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [13] 은행원  |  비즈니스·경영  |  MANUAL_MAPPING K000001136
--      slug = legacy = 'banker'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'banker', '은행원', '🏦', '비즈니스·경영', array['business'],
  null, 'pending', false, 38, 'banker'
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
  ((select id from public.occupation_master where slug = 'banker'),
   'service', 'one_liner',
   '돈을 맡기고 빌려주는 금융 서비스를 고객에게 안내하고 처리하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'banker'),
   'service', 'easy_description',
   '은행원은 계좌 개설이나 대출 상담만 하지 않아요. 기업 자금을 운용하거나 금융 상품을 설계하는 복잡한 업무도 있어요. 숫자에 강하고 사람과 대화하는 것을 편안하게 느끼는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'banker'),
   'service', 'why_this_job',
   '금융 구조와 경제 흐름을 이해하고 싶고 전문성 있는 안정적 직장을 원하는 학생에게 잘 맞아요. 경영·경제 계열 진학 후 접근할 수 있는 대표적인 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'banker'),
   'service', 'mission_hint',
   '가족과 함께 은행 앱이나 인터넷 뱅킹을 사용할 때 어떤 기능이 있는지 살펴보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'banker'),
   'service', 'step_action',
   '유튜브에서 "은행원 직업 소개" 또는 "금융 직업이란" 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'banker'),
   'service', 'step_action',
   '한국은행 경제교육 사이트(econ.bok.or.kr)에서 기초 금융 용어 5개 찾아 정리하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [14] 소설가  |  콘텐츠·미디어  |  AUTO K000007572
--      slug = legacy = 'novelist'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'novelist', '소설가', '✍️', '콘텐츠·미디어', array['media'],
  null, 'pending', false, 37, 'novelist'
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
  ((select id from public.occupation_master where slug = 'novelist'),
   'service', 'one_liner',
   '상상 속 이야기를 문장으로 쌓아 독자가 다른 세계를 경험하게 하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'novelist'),
   'service', 'easy_description',
   '소설가는 타고나는 게 아니에요. 꾸준히 관찰하고, 메모하고, 쓰고, 다시 고치는 과정의 반복 속에서 자라요. 화려한 문장보다 "이 장면에서 독자는 어떤 감정을 느낄까"를 고민하는 능력이 핵심이에요. 글쓰기를 좋아하고 사람과 세계를 관찰하는 걸 즐기는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'novelist'),
   'service', 'why_this_job',
   '글쓰기가 즐겁고 내 이야기를 세상에 꺼내고 싶은 학생이라면 지금 당장 짧은 이야기 하나를 써보는 것만으로 첫걸음이 돼요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'novelist'),
   'service', 'mission_hint',
   '오늘 있었던 일 중 가장 인상적인 장면을 한 문단으로 적어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'novelist'),
   'service', 'step_action',
   '좋아하는 소설의 첫 문장을 5개 찾아 공통점을 찾아보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'novelist'),
   'service', 'step_action',
   '15분 안에 짧은 이야기 하나를 끝까지 써보기 (완성도 상관없이)',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [15] 번역가  |  콘텐츠·미디어  |  AUTO K000000824
--      slug = legacy = 'translator'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'translator', '번역가', '🗺️', '콘텐츠·미디어', array['media'],
  null, 'pending', false, 36, 'translator'
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
  ((select id from public.occupation_master where slug = 'translator'),
   'service', 'one_liner',
   '한 언어로 쓰인 글을 다른 언어로 정확하고 자연스럽게 옮기는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'translator'),
   'service', 'easy_description',
   '번역은 단어를 바꾸는 게 아니에요. 문화적 맥락, 미묘한 감정, 작가의 의도까지 함께 전달해야 해요. 영어, 일본어, 중국어 등 언어 실력 이상으로 두 언어를 깊이 이해하는 능력이 필요해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'translator'),
   'service', 'why_this_job',
   '외국어 배우는 걸 좋아하고 언어 사이의 차이를 발견하는 게 재미있는 학생에게 잘 맞아요. 문학, 비즈니스, 법률, 의료 등 전문 분야 번역가는 해당 분야 전문 지식도 함께 필요해요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'translator'),
   'service', 'mission_hint',
   '영어 문장 하나를 직접 번역한 뒤 번역기 결과와 비교해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'translator'),
   'service', 'step_action',
   '좋아하는 외국 노래 가사나 짧은 글을 직접 번역해보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'translator'),
   'service', 'step_action',
   '유튜브에서 "번역가 직업 소개" 또는 "통번역사 인터뷰" 영상 1편 시청하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [16] 외교관  |  공공·안전  |  GOYO24_UNSUPPORTED
--      slug = legacy = 'diplomat'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'diplomat', '외교관', '🎖️', '공공·안전', array['public_safety'],
  null, 'manual', false, 35, 'diplomat'
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
  ((select id from public.occupation_master where slug = 'diplomat'),
   'service', 'one_liner',
   '국가를 대표해 다른 나라와 협상하고 국제 관계를 관리하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'diplomat'),
   'service', 'easy_description',
   '외교관은 해외 대사관에서 일하며 양국 간 협약을 체결하거나 자국민을 보호하는 역할을 해요. 뛰어난 외국어 실력, 국제 문제 이해, 협상 능력이 필요해요. 한국 외교관이 되려면 외교관후보자 선발시험을 통과해야 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'diplomat'),
   'service', 'why_this_job',
   '세계 무대에서 나라를 위해 일하고 싶고 국제 정치와 다른 문화에 관심 있는 학생에게 잘 맞아요. 외국어와 역사·사회 공부를 좋아한다면 자연스럽게 탐색할 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'diplomat'),
   'service', 'mission_hint',
   '오늘 뉴스에서 한국이 관련된 국제 사건 하나를 찾아 어떤 내용인지 정리해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'diplomat'),
   'service', 'step_action',
   '외교부 공식 유튜브 채널을 찾아 외교관 소개 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'diplomat'),
   'service', 'step_action',
   '외교관후보자 선발시험 공고를 검색해 어떤 과목을 준비하는지 확인해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [17] 해양경찰관  |  공공·안전  |  AUTO K000007540
--      slug = legacy = 'coast-guard-officer'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'coast-guard-officer', '해양경찰관', '⚓', '공공·안전', array['public_safety'],
  null, 'pending', false, 34, 'coast-guard-officer'
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
  ((select id from public.occupation_master where slug = 'coast-guard-officer'),
   'service', 'one_liner',
   '바다에서 발생하는 사고·범죄를 예방하고 구조·수색 업무를 수행하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'coast-guard-officer'),
   'service', 'easy_description',
   '해상에서 배가 침몰하거나 어부가 실종됐을 때, 바다 밀수를 단속할 때 달려가는 사람이 해양경찰관이에요. 육지 경찰과 달리 선박 운항 능력과 잠수·수중 구조 등 특수 역량이 필요해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'coast-guard-officer'),
   'service', 'why_this_job',
   '바다를 좋아하고 공공 서비스에서 의미를 찾는 학생에게 잘 맞아요. 체력과 책임감이 중요하며, 다양한 해양 특기도 살릴 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'coast-guard-officer'),
   'service', 'mission_hint',
   '우리나라 해안선 길이가 얼마인지 찾아보고 해양경찰이 왜 필요한지 생각해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'coast-guard-officer'),
   'service', 'step_action',
   '해양경찰청 공식 유튜브 채널에서 구조 현장 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'coast-guard-officer'),
   'service', 'step_action',
   '해양경찰관이 되기 위한 시험·자격 조건을 검색해 정리해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [18] 신재생에너지 전문가  |  환경·미래산업  |  GOYO24_UNSUPPORTED
--      slug = legacy = 'renewable-energy-specialist'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'renewable-energy-specialist', '신재생에너지 전문가', '☀️', '환경·미래산업', array['environment'],
  null, 'manual', false, 33, 'renewable-energy-specialist'
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
  ((select id from public.occupation_master where slug = 'renewable-energy-specialist'),
   'service', 'one_liner',
   '태양광·풍력 등 재생 가능한 에너지 자원을 개발하고 보급하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'renewable-energy-specialist'),
   'service', 'easy_description',
   '화석 연료를 태우지 않고도 전기를 만드는 방법이 있어요. 태양광 패널, 풍력 발전기, 수소 에너지 — 신재생에너지 전문가는 이런 기술을 연구하고 실제 현장에 적용해요. 환경 문제에 관심 많고 에너지 기술이 궁금한 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'renewable-energy-specialist'),
   'service', 'why_this_job',
   '기후 변화 해결이 시대적 과제가 되면서 에너지 전환 분야는 빠르게 성장하고 있어요. 과학·공학을 좋아하는 학생이라면 미래 탐색 방향으로 살펴볼 만해요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'renewable-energy-specialist'),
   'service', 'mission_hint',
   '태양광, 풍력, 수력 중 하나를 골라 어떻게 전기가 만들어지는지 찾아보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'renewable-energy-specialist'),
   'service', 'step_action',
   '유튜브에서 "신재생에너지란" 또는 "태양광 발전 원리" 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'renewable-energy-specialist'),
   'service', 'step_action',
   '우리 집이나 학교 주변에서 태양광 패널이 설치된 곳을 찾아 사진 찍어보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [19] 환경 엔지니어  |  환경·미래산업  |  GOYO24_UNSUPPORTED
--      slug = legacy = 'environmental-engineer'
--      (수질·대기·토양 등 세부 코드만 존재 — 단일 코드 선택 불가)
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'environmental-engineer', '환경 엔지니어', '♻️', '환경·미래산업', array['environment'],
  null, 'manual', false, 32, 'environmental-engineer'
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
  ((select id from public.occupation_master where slug = 'environmental-engineer'),
   'service', 'one_liner',
   '환경오염 문제를 기술적으로 분석하고 해결 방법을 개발하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'environmental-engineer'),
   'service', 'easy_description',
   '강이 오염됐을 때 원인을 분석하고 정화 시스템을 설계하거나, 공장 폐수 처리 방식을 개선하는 일이 환경 엔지니어의 역할이에요. 수질, 대기, 토양 오염 등 다양한 환경 문제를 과학과 공학으로 풀어요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'environmental-engineer'),
   'service', 'why_this_job',
   '환경 문제에 관심 많고 과학·수학을 좋아하는 학생에게 잘 맞아요. 기후 변화와 환경 규제가 강화될수록 이 분야 전문가의 역할은 점점 더 중요해져요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'environmental-engineer'),
   'service', 'mission_hint',
   '뉴스나 인터넷에서 환경 오염 관련 기사 하나를 찾아 어떤 해결책이 제시됐는지 확인해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'environmental-engineer'),
   'service', 'step_action',
   '유튜브에서 "환경공학이란" 또는 "수질오염 정화 과정" 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'environmental-engineer'),
   'service', 'step_action',
   '주변 하천이나 공원을 방문해 환경 상태를 관찰하고 느낀 점 메모하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [20] 탄소중립전문가  |  환경·미래산업  |  GOYO24_UNSUPPORTED
--      slug = legacy = 'carbon-neutrality-specialist'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'carbon-neutrality-specialist', '탄소중립전문가', '🌿', '환경·미래산업', array['environment'],
  null, 'manual', false, 31, 'carbon-neutrality-specialist'
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
  ((select id from public.occupation_master where slug = 'carbon-neutrality-specialist'),
   'service', 'one_liner',
   '기업이나 기관의 탄소 배출을 줄이는 전략을 세우고 실행하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'carbon-neutrality-specialist'),
   'service', 'easy_description',
   '탄소중립이란 내가 배출한 탄소만큼을 다시 흡수하거나 줄여 실질 배출량을 0으로 만드는 것이에요. 탄소중립전문가는 기업의 탄소 배출을 측정하고 줄이는 계획을 세우며, 관련 제도와 정책도 함께 이해해야 해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'carbon-neutrality-specialist'),
   'service', 'why_this_job',
   '기후 위기 해결에 기여하고 싶고 환경·경영·정책을 두루 공부하고 싶은 학생에게 잘 맞아요. 아직 성장 중인 분야라 관심을 가지고 탐색하기 좋은 시점이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'carbon-neutrality-specialist'),
   'service', 'mission_hint',
   '오늘 하루 내가 만든 탄소 발자국을 생각해보고 줄일 수 있는 것 하나를 찾아보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'carbon-neutrality-specialist'),
   'service', 'step_action',
   '유튜브에서 "탄소중립이란" 또는 "ESG 직업" 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'carbon-neutrality-specialist'),
   'service', 'step_action',
   '환경부 탄소중립 정책 웹사이트를 방문해 현재 목표와 전략 읽어보기',
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
  'cloud-engineer',               'vr-ar-developer',
  'physical-therapist',           'emergency-medical-technician',
  'product-designer',             'ux-ui-designer',
  'illustrator',                  'photographer',
  'kindergarten-teacher',         'librarian',
  'entrepreneur',                 'trade-specialist',
  'banker',
  'novelist',                     'translator',
  'diplomat',                     'coast-guard-officer',
  'renewable-energy-specialist',  'environmental-engineer',
  'carbon-neutrality-specialist'
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
  on s.occupation_id = m.id and s.is_current = true
left join public.occupation_preparations p
  on p.occupation_id = m.id and p.is_current = true
where m.slug in (
  'cloud-engineer',               'vr-ar-developer',
  'physical-therapist',           'emergency-medical-technician',
  'product-designer',             'ux-ui-designer',
  'illustrator',                  'photographer',
  'kindergarten-teacher',         'librarian',
  'entrepreneur',                 'trade-specialist',
  'banker',
  'novelist',                     'translator',
  'diplomat',                     'coast-guard-officer',
  'renewable-energy-specialist',  'environmental-engineer',
  'carbon-neutrality-specialist'
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
    'cloud-engineer',               'vr-ar-developer',
    'physical-therapist',           'emergency-medical-technician',
    'product-designer',             'ux-ui-designer',
    'illustrator',                  'photographer',
    'kindergarten-teacher',         'librarian',
    'entrepreneur',                 'trade-specialist',
    'banker',
    'novelist',                     'translator',
    'diplomat',                     'coast-guard-officer',
    'renewable-energy-specialist',  'environmental-engineer',
    'carbon-neutrality-specialist'
  )
order by m.priority desc;

-- 4. 기존 30개 변경 없음 확인
select slug, name_ko, is_active, priority
from public.occupation_master
where slug in (
  -- 파일럿 10개
  'software-developer', 'data-analyst',
  'visual-designer',    'video-content-creator',
  'nurse',              'biotech-researcher',
  'teacher',            'counselor',
  'police-officer',     'marketer',
  -- 1차 추가 20개
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

-- 5. 전체 직업 수 확인 (50개 목표)
select
  count(*) as total_occupations,
  count(*) filter (where is_active = true)  as active_count,
  count(*) filter (where is_active = false) as inactive_count
from public.occupation_master;


-- ============================================================
-- [ACTIVATE] 검증 완료 후 실행 — UI 노출 활성화
-- ⚠️  검증 쿼리 2번: 20개 전부 summary=3, prep=3 확인 후 실행
-- ⚠️  콘텐츠 육안 검토 완료 후 실행
-- ⚠️  goyo24 sync --dry-run 확인 후 실행 권장
-- ============================================================

/*
update public.occupation_master
set    is_active  = true,
       updated_at = now()
where  slug in (
  'cloud-engineer',               'vr-ar-developer',
  'physical-therapist',           'emergency-medical-technician',
  'product-designer',             'ux-ui-designer',
  'illustrator',                  'photographer',
  'kindergarten-teacher',         'librarian',
  'entrepreneur',                 'trade-specialist',
  'banker',
  'novelist',                     'translator',
  'diplomat',                     'coast-guard-officer',
  'renewable-energy-specialist',  'environmental-engineer',
  'carbon-neutrality-specialist'
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
  'cloud-engineer',               'vr-ar-developer',
  'physical-therapist',           'emergency-medical-technician',
  'product-designer',             'ux-ui-designer',
  'illustrator',                  'photographer',
  'kindergarten-teacher',         'librarian',
  'entrepreneur',                 'trade-specialist',
  'banker',
  'novelist',                     'translator',
  'diplomat',                     'coast-guard-officer',
  'renewable-energy-specialist',  'environmental-engineer',
  'carbon-neutrality-specialist'
)
returning slug, name_ko, is_active;
*/
