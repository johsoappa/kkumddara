-- ====================================================
-- 029_seed_popular_5_occupations.sql
-- 베타 인기 직업 1차 5개 시드
--
-- [포함 직업]
--   비즈니스·경영  : 셰프 (chef)
--   의료·과학      : 사육사 (zookeeper)
--   예술·디자인    : 헤어디자이너 (hair-designer), 가수 (singer)
--   콘텐츠·미디어  : 크리에이터 (creator)
--
-- [방침 — A안]
--   is_active = true 로 직접 삽입 (별도 ACTIVATE 단계 없음)
--
-- [idempotent 원칙]
--   occupation_master      : slug 기준 ON CONFLICT DO UPDATE
--   occupation_summary     : (occupation_id, layer, content_type, version_no) 기준 ON CONFLICT
--   occupation_preparations: (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order) 기준 ON CONFLICT
--   occupation_student_actions: DELETE(stage_number=1) 후 INSERT (017 패턴 동일)
--
-- [포함 테이블]
--   occupation_master (5행)
--   occupation_summary (15행 = 3 content_type × 5직업)
--   occupation_preparations (15행 = 3행 × 5직업: mission_hint 1 + step_action 2)
--   occupation_student_actions (20행 = 4행 × 5직업)
--
-- [실행 환경]
--   Supabase SQL Editor — service_role 키
-- ====================================================


-- ============================================================
-- [01] 셰프  |  비즈니스·경영  |  slug = 'chef'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'chef', '셰프', '👨‍🍳', '비즈니스·경영', array['business'],
  null, 'pending', true, 25, 'chef'
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
  ((select id from public.occupation_master where slug = 'chef'),
   'service', 'one_liner',
   '재료의 맛과 어울림을 이해하고, 요리를 통해 사람들에게 즐거움을 전달하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'chef'),
   'service', 'easy_description',
   '셰프는 단순히 음식을 만드는 것을 넘어 재료의 특성, 맛의 조화, 플레이팅까지 설계하는 사람이에요. 식사를 통해 사람들에게 행복을 주고 싶은 학생, 맛과 냄새에 민감하고 손으로 직접 만드는 것을 좋아하는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'chef'),
   'service', 'why_this_job',
   '요리를 통해 가족이나 친구가 맛있게 먹는 모습을 보는 것이 좋다면, 셰프의 길이 자연스럽게 열릴 수 있어요. 요리 경진대회·요리 학원·외식 창업 등 다양한 경로가 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'chef'),
   'service', 'mission_hint',
   '집에서 먹은 음식 중 하나를 골라 재료를 상상해보고, 어떻게 만들면 더 맛있을지 아이디어를 메모해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'chef'),
   'service', 'step_action',
   '유튜브에서 좋아하는 음식 만들기 영상 1편 보고, 사용된 재료 목록 적어보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'chef'),
   'service', 'step_action',
   '간단한 요리 1가지(달걀 요리, 샌드위치 등) 직접 만들어보고 맛 평가 메모하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [02] 사육사  |  의료·과학  |  slug = 'zookeeper'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'zookeeper', '사육사', '🐾', '의료·과학', array['medical'],
  null, 'pending', true, 24, 'zookeeper'
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
  ((select id from public.occupation_master where slug = 'zookeeper'),
   'service', 'one_liner',
   '동물원·아쿠아리움 등에서 동물의 건강과 생활을 돌보며 사람과 동물을 연결하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'zookeeper'),
   'service', 'easy_description',
   '사육사는 동물에게 먹이를 주고 건강 상태를 확인하며, 자연스러운 행동을 유도하는 환경을 설계해요. 동물을 좋아하는 마음만큼이나 꼼꼼한 관찰력과 책임감이 중요해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'zookeeper'),
   'service', 'why_this_job',
   '동물을 보살피고 싶은 마음이 강하고, 생물·과학에 관심 있는 학생에게 잘 맞아요. 동물원 체험 봉사, 수의보조 실습 등으로 미리 경험해볼 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'zookeeper'),
   'service', 'mission_hint',
   '좋아하는 동물 1종류를 골라 하루 생활 패턴(잠, 먹이, 활동)을 조사하고 간단히 정리해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'zookeeper'),
   'service', 'step_action',
   '동물원 사육사의 하루를 소개하는 유튜브 영상 1편 보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'zookeeper'),
   'service', 'step_action',
   '관심 동물의 생태와 식습관 3가지를 찾아 메모하고 학부모 또는 친구에게 설명해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [03] 헤어디자이너  |  예술·디자인  |  slug = 'hair-designer'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'hair-designer', '헤어디자이너', '✂️', '예술·디자인', array['art'],
  null, 'pending', true, 23, 'hair-designer'
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
  ((select id from public.occupation_master where slug = 'hair-designer'),
   'service', 'one_liner',
   '얼굴형과 개성에 어울리는 헤어스타일을 제안하고 직접 완성하는 예술적인 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'hair-designer'),
   'service', 'easy_description',
   '헤어디자이너는 고객의 얼굴형·생활 습관·원하는 분위기를 파악해 최적의 스타일을 제안하고, 가위·드라이어·염색 등 다양한 기술로 직접 구현해요. 손 기술과 감각이 모두 필요한 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'hair-designer'),
   'service', 'why_this_job',
   '사람의 외모 변화를 직접 만들어내는 것이 즐겁고, 꼼꼼한 손기술에 자신 있다면 잘 맞아요. 미용사 국가 자격증을 취득한 후 헤어 전문 디자이너로 성장하는 경로가 가장 일반적이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'hair-designer'),
   'service', 'mission_hint',
   '가족이나 친구의 얼굴형을 관찰하고, 어울릴 것 같은 헤어스타일을 직접 제안해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'hair-designer'),
   'service', 'step_action',
   '헤어디자이너의 하루 또는 국가 자격증 취득 과정을 소개하는 유튜브 영상 1편 보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'hair-designer'),
   'service', 'step_action',
   '좋아하는 헤어스타일 사진 5장을 모아 공통적인 특징 분석하고 메모하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [04] 가수  |  예술·디자인  |  slug = 'singer'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'singer', '가수', '🎤', '예술·디자인', array['art'],
  null, 'pending', true, 22, 'singer'
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
  ((select id from public.occupation_master where slug = 'singer'),
   'service', 'one_liner',
   '목소리와 음악으로 감정을 전달하고, 무대 위에서 사람들과 소통하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'singer'),
   'service', 'easy_description',
   '가수는 노래 실력뿐 아니라 음악 해석, 무대 표현, 꾸준한 훈련이 함께 필요한 직업이에요. 아이돌부터 싱어송라이터까지 다양한 형태가 있고, 음악을 통해 자신만의 이야기를 전하고 싶은 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'singer'),
   'service', 'why_this_job',
   '노래하는 것이 즐겁고, 음악으로 감정을 표현하는 데 관심 있다면 자연스럽게 탐색하게 되는 분야예요. 보컬 레슨, 합창단, 교내 음악 활동이 좋은 출발점이에요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'singer'),
   'service', 'mission_hint',
   '좋아하는 노래 1곡을 골라 가사의 감정을 분석하고, 어떤 장면에서 어떤 감정을 전달하는지 메모해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'singer'),
   'service', 'step_action',
   '좋아하는 가수의 라이브 공연 영상 1편 보며 표현 방식(표정·제스처·호흡) 관찰하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'singer'),
   'service', 'step_action',
   '노래방 또는 녹음 앱으로 노래 1곡 녹음해 직접 들어보고 개선점 1가지 찾기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [05] 크리에이터  |  콘텐츠·미디어  |  slug = 'creator'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'creator', '크리에이터', '🎬', '콘텐츠·미디어', array['art'],
  null, 'pending', true, 21, 'creator'
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
  ((select id from public.occupation_master where slug = 'creator'),
   'service', 'one_liner',
   '영상·글·이미지로 자신만의 이야기를 콘텐츠로 만들어 온라인에서 구독자와 소통하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'creator'),
   'service', 'easy_description',
   '크리에이터는 기획·촬영·편집·업로드 전 과정을 스스로 운영해요. 유튜버, 블로거, 팟캐스터 등 다양한 형태가 있고, 꾸준함과 자기만의 관점이 핵심이에요. 단순한 취미를 넘어 브랜딩과 수익화까지 배울 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'creator'),
   'service', 'why_this_job',
   '콘텐츠 크리에이터는 관심 분야와 표현 방식에 따라 누구나 시작할 수 있어요. 영상 편집·기획·SNS 운영 경험이 쌓이면 미디어·마케팅·방송 분야로도 연결돼요.',
   1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, content_type, version_no)
do update set content = excluded.content;

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'creator'),
   'service', 'mission_hint',
   '내가 가장 잘 알거나 좋아하는 주제 3가지를 적고, 그중 콘텐츠로 만들고 싶은 것을 1가지 골라보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'creator'),
   'service', 'step_action',
   '좋아하는 유튜버 채널의 콘텐츠 구성 방식(주제·편집·썸네일) 분석하고 메모하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'creator'),
   'service', 'step_action',
   'CapCut 또는 키네마스터로 1분짜리 소개 영상 1편 직접 만들어보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual')
on conflict (occupation_id, layer, prep_type, grade_group, stage_number, version_no, display_order)
do update set content = excluded.content;


-- ============================================================
-- [학생 액션] occupation_student_actions Stage 1
--   017_seed_student_actions 패턴 동일:
--   1단계 DELETE → 2단계 INSERT
-- ============================================================

-- [1단계] 기존 stage 1 데이터 삭제 (멱등성 보장)
delete from public.occupation_student_actions
where occupation_id in (
  select id from public.occupation_master
  where legacy_occupation_id in (
    'chef',
    'zookeeper',
    'hair-designer',
    'singer',
    'creator'
  )
)
and stage_number = 1;

-- [2단계] Stage 1 미션 INSERT
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

  -- ── chef ──────────────────────────────────────────────────
  ('chef', 1, '지금 당장 시작하기', '집에서 간단한 요리 1가지 직접 만들고 가족 반응 적어보기',             'make',    30, 'all', 1),
  ('chef', 1, '지금 당장 시작하기', '좋아하는 음식 레시피 영상 보며 재료와 순서 메모하기',                'watch',   20, 'all', 2),
  ('chef', 1, '지금 당장 시작하기', '냉장고 재료 3가지로 만들 수 있는 요리 아이디어 떠올려보기',           'explore', 15, 'all', 3),
  ('chef', 1, '지금 당장 시작하기', '국내 유명 셰프 1명을 찾아 그의 요리 철학 한 문장으로 정리하기',       'read',    20, 'all', 4),

  -- ── zookeeper ─────────────────────────────────────────────
  ('zookeeper', 1, '지금 당장 시작하기', '관심 동물 1종의 하루 생활 패턴 조사하고 요약하기',               'read',    20, 'all', 1),
  ('zookeeper', 1, '지금 당장 시작하기', '동물원 사육사 일상 브이로그 또는 소개 영상 1편 보기',            'watch',   20, 'all', 2),
  ('zookeeper', 1, '지금 당장 시작하기', '동물 행동 풍부화(enrichment)가 무엇인지 찾아서 예시 3개 메모하기', 'explore', 15, 'all', 3),
  ('zookeeper', 1, '지금 당장 시작하기', '동물을 돌본 경험(반려동물, 봉사 등) 떠올려 느낀 점 일기 쓰기',   'make',    15, 'all', 4),

  -- ── hair-designer ─────────────────────────────────────────
  ('hair-designer', 1, '지금 당장 시작하기', '가족 또는 친구에게 어울리는 헤어스타일 사진 찾아서 제안해보기', 'explore', 15, 'all', 1),
  ('hair-designer', 1, '지금 당장 시작하기', '헤어디자이너 하루 일과 소개 영상 또는 브이로그 1편 보기',     'watch',   20, 'all', 2),
  ('hair-designer', 1, '지금 당장 시작하기', '미용사 국가 자격증 취득 과정 검색하고 필요한 시험 과목 메모하기', 'read',  20, 'all', 3),
  ('hair-designer', 1, '지금 당장 시작하기', '좋아하는 헤어스타일 5가지를 모아 공통 키워드 3개 찾기',       'make',    20, 'all', 4),

  -- ── singer ────────────────────────────────────────────────
  ('singer', 1, '지금 당장 시작하기', '좋아하는 노래 1곡 녹음 앱으로 녹음해서 직접 들어보기',              'try',     15, 'all', 1),
  ('singer', 1, '지금 당장 시작하기', '관심 가수의 라이브 공연 영상 보며 표현 방식 관찰하기',              'watch',   20, 'all', 2),
  ('singer', 1, '지금 당장 시작하기', '가수가 되려면 어떤 준비가 필요한지 찾아서 3가지 정리하기',           'read',    20, 'all', 3),
  ('singer', 1, '지금 당장 시작하기', '좋아하는 노래 가사의 감정을 분석하고 느낀 점 메모하기',              'explore', 15, 'all', 4),

  -- ── creator ───────────────────────────────────────────────
  ('creator', 1, '지금 당장 시작하기', '스마트폰으로 30초~1분 짜리 영상 1편 촬영하고 편집해보기',           'make',    30, 'all', 1),
  ('creator', 1, '지금 당장 시작하기', '좋아하는 유튜버 채널의 기획 방식(주제·썸네일·편집) 분석하기',       'watch',   20, 'all', 2),
  ('creator', 1, '지금 당장 시작하기', '내가 콘텐츠로 만들고 싶은 주제 3가지 적고 가장 잘 할 수 있는 것 고르기', 'explore', 15, 'all', 3),
  ('creator', 1, '지금 당장 시작하기', '크리에이터의 수익 구조(광고·협찬·굿즈 등) 조사하고 메모하기',       'read',    20, 'all', 4)

) as m(legacy_id, stage_number, stage_title, action_text, action_type, duration_minutes, grade_target, display_order)
  on om.legacy_occupation_id = m.legacy_id
 and om.is_active = true;


-- ============================================================
-- [확인] 삽입 결과 검증
-- ============================================================
select
  om.slug,
  om.name_ko,
  om.is_active,
  (select count(*) from public.occupation_summary s where s.occupation_id = om.id)         as summary_count,
  (select count(*) from public.occupation_preparations p where p.occupation_id = om.id)    as prep_count,
  (select count(*) from public.occupation_student_actions a where a.occupation_id = om.id) as action_count
from public.occupation_master om
where om.slug in ('chef', 'zookeeper', 'hair-designer', 'singer', 'creator')
order by om.priority desc;
