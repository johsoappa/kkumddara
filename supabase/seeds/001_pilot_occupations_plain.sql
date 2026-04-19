-- ====================================================
-- 001_pilot_occupations_plain.sql
-- 파일럿 직업 10개 시드 — plain SQL 버전
--
-- [원칙]
--   DO block 없음 / DECLARE 없음 / 변수 없음 / EXECUTE 없음
--   RETURNING INTO 제거 → slug 서브쿼리로 occupation_id 참조
--   helper 함수 호출 없음
--   version_no=1, is_current=true, is_latest=true, status='published' 직접 삽입
--
-- [재실행 안전]
--   상단 DELETE WHERE slug IN (...) → CASCADE로 관련 데이터 전체 삭제
--   재실행 시 동일 결과 보장
--
-- [is_active]
--   is_active = false 로 삽입
--   검증 완료 후 하단 ACTIVATE 섹션 실행
--
-- [실행]
--   015_occupation_master_bootstrap.sql 먼저 실행 후 이 파일 실행
--   Supabase SQL Editor — service_role 키 사용 (RLS 우회)
-- ====================================================


-- ============================================================
-- 재실행 안전: 기존 파일럿 데이터 삭제 (CASCADE)
-- ============================================================
delete from public.occupation_master
where slug in (
  'software-developer',   'data-analyst',
  'visual-designer',      'video-content-creator',
  'nurse',                'biotech-researcher',
  'teacher',              'counselor',
  'police-officer',       'marketer'
);


-- ============================================================
-- [01] 소프트웨어 개발자  |  IT·기술
--      legacy_occupation_id = 'software-engineer'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'software-developer', '소프트웨어 개발자', '💻', 'IT·기술', array['it'],
  null, 'pending', false, 10, 'software-engineer'
);

insert into public.occupation_source_meta (occupation_id, source_type, raw_payload)
values (
  (select id from public.occupation_master where slug = 'software-developer'),
  'manual',
  jsonb_build_object(
    'pilot', true, 'name_ko', '소프트웨어 개발자', 'category', 'IT·기술',
    'employment24_code_status', 'pending_api_sync', 'ksco_ref', '22111',
    'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
  )
);

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'software-developer'),
   'service', 'one_liner',
   '컴퓨터 프로그램과 앱을 설계하고 코드로 만드는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'software-developer'),
   'service', 'easy_description',
   '스마트폰 앱, 게임, 웹사이트가 어떻게 작동하는지 궁금했던 적 있나요? 소프트웨어 개발자는 이런 것들을 코드로 직접 만드는 사람이에요. 논리적으로 생각하고 문제를 푸는 걸 좋아한다면 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'software-developer'),
   'service', 'why_this_job',
   'IT에 관심 있는 학생에게 가장 자연스럽게 연결되는 직업이에요. 코딩은 지금 바로 온라인에서 시작할 수 있고, 만든 결과물이 눈에 바로 보여서 성취감도 높아요.',
   1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'software-developer'),
   'service', 'mission_hint',
   '내가 매일 쓰는 앱이나 게임을 누가, 어떻게 만들었는지 찾아보는 것부터 시작해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'software-developer'),
   'service', 'step_action',
   '스크래치(scratch.mit.edu)에서 간단한 게임 하나 만들어보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'software-developer'),
   'service', 'step_action',
   '좋아하는 앱의 회사 이름을 찾아보고, 그곳에서 일하는 개발자를 검색해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_parent_questions (
  occupation_id, question, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'software-developer'),
   '요즘 자주 쓰는 앱이나 게임이 있니? 그게 어떻게 만들어졌는지 생각해본 적 있어?',
   'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'software-developer'),
   '프로그래밍을 배우면 어떤 것들을 만들 수 있을지 같이 찾아볼까?',
   'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_student_actions (
  occupation_id, stage_number, stage_title, action_text, action_type,
  duration_minutes, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'software-developer'),
   1, '탐색하기', '유튜브에서 소프트웨어 개발자 하루 일과를 검색해 영상 하나 시청하기',
   'watch', 15, 'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'software-developer'),
   1, '탐색하기', '코드닷오알지(code.org)에서 코딩 입문 강의 1개 완료하기',
   'try', 30, 'all', 1, 1, true, true, 'published', now(), 'import', 'manual');


-- ============================================================
-- [02] 데이터 분석가  |  IT·기술
--      legacy_occupation_id = 'data-analyst'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'data-analyst', '데이터 분석가', '📊', 'IT·기술', array['it'],
  null, 'pending', false, 9, 'data-analyst'
);

insert into public.occupation_source_meta (occupation_id, source_type, raw_payload)
values (
  (select id from public.occupation_master where slug = 'data-analyst'),
  'manual',
  jsonb_build_object(
    'pilot', true, 'name_ko', '데이터 분석가', 'category', 'IT·기술',
    'employment24_code_status', 'pending_api_sync', 'ksco_ref', '22113',
    'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
  )
);

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'data-analyst'),
   'service', 'one_liner',
   '데이터에서 의미 있는 패턴을 발견해 더 나은 결정을 이끌어내는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'data-analyst'),
   'service', 'easy_description',
   '유튜브 추천 영상, 쇼핑몰 인기 상품, 날씨 예보 — 이 모든 것 뒤에는 데이터를 분석하는 사람이 있어요. 숫자와 통계를 좋아하고, 왜 그런지 파고드는 걸 즐긴다면 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'data-analyst'),
   'service', 'why_this_job',
   'IT 관심사와 논리적 사고를 모두 활용하는 직업이에요. 거의 모든 산업에서 데이터 분석가를 필요로 해서 진로 선택의 폭이 넓어요.',
   1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'data-analyst'),
   'service', 'mission_hint',
   '주변에서 데이터가 활용되는 사례 3가지를 찾아보세요. 예: 유튜브 추천, 날씨 예보, 쇼핑몰 인기 상품.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'data-analyst'),
   'service', 'step_action',
   '일주일 동안 내가 시청한 유튜브 영상 종류를 기록하고 패턴 찾아보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'data-analyst'),
   'service', 'step_action',
   '구글 트렌드(trends.google.com)에 접속해 관심 있는 검색어의 인기 변화 확인해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_parent_questions (
  occupation_id, question, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'data-analyst'),
   '어떤 콘텐츠가 왜 인기 있는지 궁금해한 적 있어? 그 이유를 분석해보는 게 데이터 분석이야.',
   'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'data-analyst'),
   '수학이나 통계에서 재미있었던 부분이 있었어? 어떤 문제를 풀 때 흥미로웠어?',
   'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_student_actions (
  occupation_id, stage_number, stage_title, action_text, action_type,
  duration_minutes, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'data-analyst'),
   1, '탐색하기', '유튜브에서 데이터 분석가 직업 소개 영상 하나 시청하기',
   'watch', 15, 'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'data-analyst'),
   1, '탐색하기', '구글 트렌드에서 내가 관심 있는 주제 2개의 인기 추이 비교해보기',
   'explore', 20, 'all', 1, 1, true, true, 'published', now(), 'import', 'manual');


-- ============================================================
-- [03] 시각디자이너  |  예술·디자인
--      legacy_occupation_id = 'graphic-designer'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'visual-designer', '시각디자이너', '🎨', '예술·디자인', array['art'],
  null, 'pending', false, 8, 'graphic-designer'
);

insert into public.occupation_source_meta (occupation_id, source_type, raw_payload)
values (
  (select id from public.occupation_master where slug = 'visual-designer'),
  'manual',
  jsonb_build_object(
    'pilot', true, 'name_ko', '시각디자이너', 'category', '예술·디자인',
    'employment24_code_status', 'pending_api_sync', 'ksco_ref', '28421',
    'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
  )
);

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'visual-designer'),
   'service', 'one_liner',
   '시각적 언어로 아이디어를 표현하고 사람들의 마음을 움직이는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'visual-designer'),
   'service', 'easy_description',
   '포스터, 로고, 앱 화면, 책 표지 — 우리 주변의 아름다운 것들은 대부분 시각디자이너가 만들어요. 그림 그리기를 좋아하거나 색과 배치에 민감한 학생이라면 탐색해볼 만해요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'visual-designer'),
   'service', 'why_this_job',
   '예술적 감각과 디지털 툴이 만나는 직업이에요. 자신이 만든 작품이 세상에 실제로 나오는 경험이 값지고, 취미 활동과 직업을 연결하기 좋은 분야예요.',
   1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'visual-designer'),
   'service', 'mission_hint',
   '오늘 본 앱, 광고, 간판 중 마음에 드는 디자인을 하나 골라 왜 좋은지 써보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'visual-designer'),
   'service', 'step_action',
   '좋아하는 앱 화면의 색상과 배치를 스케치로 따라 그려보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'visual-designer'),
   'service', 'step_action',
   '캔바(canva.com)에서 내 이름이 들어간 포스터 하나 직접 만들어보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_parent_questions (
  occupation_id, question, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'visual-designer'),
   '평소에 예쁘다거나 멋지다고 느낀 디자인이 있었어? 어떤 점이 좋았어?',
   'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'visual-designer'),
   '그림 그리거나 꾸미는 걸 좋아한다면, 그걸 직업으로 할 수 있다는 거 알고 있었어?',
   'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_student_actions (
  occupation_id, stage_number, stage_title, action_text, action_type,
  duration_minutes, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'visual-designer'),
   1, '탐색하기', '유튜브에서 시각디자이너 포트폴리오 영상을 검색해 작품 구경하기',
   'watch', 15, 'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'visual-designer'),
   1, '탐색하기', '캔바에서 내 이름으로 명함 또는 포스터 디자인 1개 완성해보기',
   'make', 20, 'all', 1, 1, true, true, 'published', now(), 'import', 'manual');


-- ============================================================
-- [04] 영상콘텐츠 제작자  |  콘텐츠·미디어
--      legacy_occupation_id = 'video-content-editor'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'video-content-creator', '영상콘텐츠 제작자', '🎬', '콘텐츠·미디어', array['art'],
  null, 'pending', false, 7, 'video-content-editor'
);

insert into public.occupation_source_meta (occupation_id, source_type, raw_payload)
values (
  (select id from public.occupation_master where slug = 'video-content-creator'),
  'manual',
  jsonb_build_object(
    'pilot', true, 'name_ko', '영상콘텐츠 제작자', 'category', '콘텐츠·미디어',
    'employment24_code_status', 'pending_api_sync', 'ksco_ref', '28512',
    'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
  )
);

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'video-content-creator'),
   'service', 'one_liner',
   '영상으로 이야기를 만들고 시청자와 소통하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'video-content-creator'),
   'service', 'easy_description',
   '유튜브, 틱톡, 인스타그램 릴스처럼 우리가 즐겨 보는 영상 콘텐츠를 기획하고 만드는 사람이에요. 카메라 앞이든 뒤든, 이야기를 전달하는 걸 좋아하는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'video-content-creator'),
   'service', 'why_this_job',
   '창작과 기술이 모두 필요한 직업이에요. 스마트폰 하나로 시작할 수 있고, 관심 있는 주제를 영상으로 만들면서 실력을 키울 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'video-content-creator'),
   'service', 'mission_hint',
   '좋아하는 유튜버의 영상 1편을 집중해서 보며 어떻게 구성됐는지 분석해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'video-content-creator'),
   'service', 'step_action',
   '좋아하는 유튜브 채널의 영상 썸네일과 제목 5개를 분석해 공통 패턴 찾아보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'video-content-creator'),
   'service', 'step_action',
   '스마트폰으로 관심 있는 주제로 30초짜리 짧은 영상 직접 찍어보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_parent_questions (
  occupation_id, question, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'video-content-creator'),
   '어떤 종류의 유튜브 영상을 가장 자주 봐? 그 채널의 어떤 점이 좋아?',
   'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'video-content-creator'),
   '영상 만드는 걸 해본 적 있어? 어떤 주제로 영상을 만들어보고 싶어?',
   'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_student_actions (
  occupation_id, stage_number, stage_title, action_text, action_type,
  duration_minutes, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'video-content-creator'),
   1, '탐색하기', '유튜브에서 영상 편집 기초 강의 10분 시청하기',
   'watch', 10, 'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'video-content-creator'),
   1, '탐색하기', '관심 있는 주제로 30초 브이로그를 촬영하고 감상해보기',
   'make', 20, 'all', 1, 1, true, true, 'published', now(), 'import', 'manual');


-- ============================================================
-- [05] 간호사  |  의료·과학
--      legacy_occupation_id = 'nurse'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'nurse', '간호사', '🩺', '의료·과학', array['medical'],
  null, 'pending', false, 8, 'nurse'
);

insert into public.occupation_source_meta (occupation_id, source_type, raw_payload)
values (
  (select id from public.occupation_master where slug = 'nurse'),
  'manual',
  jsonb_build_object(
    'pilot', true, 'name_ko', '간호사', 'category', '의료·과학',
    'employment24_code_status', 'pending_api_sync', 'ksco_ref', '22631',
    'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
  )
);

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'nurse'),
   'service', 'one_liner',
   '환자 곁에서 건강을 지키고 회복을 함께하는 의료 전문직이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'nurse'),
   'service', 'easy_description',
   '병원에서 의사와 함께 환자의 상태를 살피고, 치료를 돕고, 마음을 위로하는 사람이 간호사예요. 사람을 돌보는 일이 보람 있고, 과학 공부를 좋아하는 학생에게 잘 어울려요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'nurse'),
   'service', 'why_this_job',
   '의료에 관심 있는 학생이라면 가장 먼저 탐색해볼 만한 직업이에요. 사회가 고령화될수록 간호사의 역할은 더 중요해지고, 국내외에서 모두 수요가 높아요.',
   1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'nurse'),
   'service', 'mission_hint',
   '주변 어른 중 병원에서 간호사에게 받은 도움이 무엇이었는지 물어보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'nurse'),
   'service', 'step_action',
   '유튜브에서 간호사 하루 일과 영상 1편 찾아 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'nurse'),
   'service', 'step_action',
   '간호사가 되려면 어떤 공부와 자격증이 필요한지 검색해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_parent_questions (
  occupation_id, question, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'nurse'),
   '아픈 사람을 도와주고 싶다는 생각을 해본 적 있어? 어떤 상황에서 그런 마음이 들었어?',
   'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'nurse'),
   '의료계에서 일하는 사람들을 직접 만나거나 체험할 수 있는 기회를 함께 찾아볼까?',
   'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_student_actions (
  occupation_id, stage_number, stage_title, action_text, action_type,
  duration_minutes, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'nurse'),
   1, '탐색하기', '유튜브에서 간호사 직업 브이로그 영상 하나 시청하기',
   'watch', 15, 'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'nurse'),
   1, '탐색하기', '간호사가 되기 위한 학교(간호학과)와 자격증 종류 검색해보기',
   'explore', 20, 'all', 1, 1, true, true, 'published', now(), 'import', 'manual');


-- ============================================================
-- [06] 생명과학 연구원  |  의료·과학
--      slug = legacy = 'biotech-researcher'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'biotech-researcher', '생명과학 연구원', '🔬', '의료·과학', array['medical'],
  null, 'pending', false, 7, 'biotech-researcher'
);

insert into public.occupation_source_meta (occupation_id, source_type, raw_payload)
values (
  (select id from public.occupation_master where slug = 'biotech-researcher'),
  'manual',
  jsonb_build_object(
    'pilot', true, 'name_ko', '생명과학 연구원', 'category', '의료·과학',
    'employment24_code_status', 'pending_api_sync', 'ksco_ref', '21211',
    'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
  )
);

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'biotech-researcher'),
   'service', 'one_liner',
   '생명 현상을 연구하고 신기술을 개발하는 과학자예요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'biotech-researcher'),
   'service', 'easy_description',
   '새로운 백신을 만들고, 질병의 원인을 찾고, 더 나은 치료법을 연구하는 사람이 생명과학 연구원이에요. 생물·화학 시간이 재미있고 실험하는 걸 즐기는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'biotech-researcher'),
   'service', 'why_this_job',
   '의료·과학에 관심 있는 학생 중 생명과학, 생물학, 화학에 흥미가 있다면 가장 자연스럽게 연결되는 직업이에요. 미래 바이오 산업의 핵심 인재로 성장할 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'biotech-researcher'),
   'service', 'mission_hint',
   '생물 시간에 배운 내용 중 가장 신기했던 것을 하나 떠올려보고, 그것이 실제 연구로 이어지는지 찾아보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'biotech-researcher'),
   'service', 'step_action',
   '유튜브 사이언스쿠키 또는 과학드림 채널에서 생명과학 관련 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'biotech-researcher'),
   'service', 'step_action',
   '관심 있는 생명과학 분야(유전자, 면역, 뇌과학 등)의 유명 연구자 1명 찾아 어떤 연구를 했는지 조사하기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_parent_questions (
  occupation_id, question, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'biotech-researcher'),
   '생물이나 화학 시간에 가장 흥미로웠던 실험이나 주제가 있었어? 왜 그게 재미있었어?',
   'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'biotech-researcher'),
   '연구자가 된다면 어떤 문제를 해결하고 싶어? 질병 치료, 신약 개발, 유전자 연구 중 뭐가 끌려?',
   'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_student_actions (
  occupation_id, stage_number, stage_title, action_text, action_type,
  duration_minutes, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'biotech-researcher'),
   1, '탐색하기', '유튜브에서 생명과학 연구원 직업 또는 바이오 연구자 인터뷰 영상 하나 시청하기',
   'watch', 15, 'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'biotech-researcher'),
   1, '탐색하기', '생명과학 관련 최근 뉴스(코로나 백신, 유전자 치료 등) 기사 하나를 찾아 읽어보기',
   'read', 15, 'all', 1, 1, true, true, 'published', now(), 'import', 'manual');


-- ============================================================
-- [07] 교사  |  교육·사회
--      legacy_occupation_id = 'teacher'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'teacher', '교사', '📚', '교육·사회', array['education'],
  null, 'pending', false, 8, 'teacher'
);

insert into public.occupation_source_meta (occupation_id, source_type, raw_payload)
values (
  (select id from public.occupation_master where slug = 'teacher'),
  'manual',
  jsonb_build_object(
    'pilot', true, 'name_ko', '교사', 'category', '교육·사회',
    'employment24_code_status', 'pending_api_sync', 'ksco_ref', '23222',
    'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
  )
);

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'teacher'),
   'service', 'one_liner',
   '지식과 경험을 나누며 학생의 성장을 함께하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'teacher'),
   'service', 'easy_description',
   '학교 선생님뿐 아니라 학원 강사, 온라인 강사 등 다양한 형태로 일해요. 누군가에게 무언가를 가르치고 이해시키는 게 즐거운 학생이라면 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'teacher'),
   'service', 'why_this_job',
   '교육·사회에 관심 있는 학생이 가장 직관적으로 연결할 수 있는 직업이에요. 특히 좋아하는 과목을 남에게 설명하는 걸 즐긴다면 교사는 훌륭한 선택지예요.',
   1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'teacher'),
   'service', 'mission_hint',
   '오늘 배운 내용 중 하나를 동생이나 친구에게 설명해보고, 얼마나 잘 전달됐는지 피드백을 받아보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'teacher'),
   'service', 'step_action',
   '내가 잘 설명할 수 있는 과목이나 주제가 무엇인지 생각해보고 목록으로 적어보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'teacher'),
   'service', 'step_action',
   'EBS 선생님 유튜브 채널에서 내가 좋아하는 과목의 강의를 보며 설명 방식 분석해보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_parent_questions (
  occupation_id, question, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'teacher'),
   '동생이나 친구에게 무언가를 가르쳐준 경험이 있어? 그때 어떤 느낌이었어?',
   'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'teacher'),
   '지금까지 기억에 남는 선생님이 있어? 그 선생님의 어떤 점이 좋았어?',
   'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_student_actions (
  occupation_id, stage_number, stage_title, action_text, action_type,
  duration_minutes, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'teacher'),
   1, '탐색하기', '좋아하는 선생님이나 강사가 가르치는 방식을 노트에 분석해보기',
   'explore', 15, 'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'teacher'),
   1, '탐색하기', '가족 중 한 명에게 내가 좋아하는 주제를 5분 동안 직접 설명해보기',
   'try', 10, 'all', 1, 1, true, true, 'published', now(), 'import', 'manual');


-- ============================================================
-- [08] 심리상담사  |  교육·사회
--      slug='counselor', legacy='psychologist'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'counselor', '심리상담사', '💬', '교육·사회', array['education'],
  null, 'pending', false, 7, 'psychologist'
);

insert into public.occupation_source_meta (occupation_id, source_type, raw_payload)
values (
  (select id from public.occupation_master where slug = 'counselor'),
  'manual',
  jsonb_build_object(
    'pilot', true, 'name_ko', '심리상담사', 'category', '교육·사회',
    'employment24_code_status', 'pending_api_sync', 'ksco_ref', '24243',
    'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
  )
);

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'counselor'),
   'service', 'one_liner',
   '심리적 어려움을 겪는 사람의 마음을 이해하고 회복을 함께하는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'counselor'),
   'service', 'easy_description',
   '학교 상담사, 청소년 상담사, 심리치료사 등 다양한 형태로 일해요. 친구의 고민을 잘 들어주고 사람의 감정을 자연스럽게 이해하며, 도움을 주는 일에 보람을 느끼는 학생에게 잘 어울려요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'counselor'),
   'service', 'why_this_job',
   '사람과 마음에 관심 있는 학생에게 깊이 있는 탐색이 가능한 직업이에요. 심리학, 교육학, 사회복지학 등 다양한 전공으로 이어질 수 있고, 진로 선택의 폭도 넓어요.',
   1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'counselor'),
   'service', 'mission_hint',
   '최근 친구나 가족이 힘들어했던 상황을 떠올려보고, 그때 내가 어떻게 반응했는지 되돌아보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'counselor'),
   'service', 'step_action',
   '유튜브에서 심리상담사 직업 브이로그 또는 하루 일과 영상 1편 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'counselor'),
   'service', 'step_action',
   '심리학 입문 도서나 청소년 심리 관련 책 1권을 찾아 목차만 읽어보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_parent_questions (
  occupation_id, question, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'counselor'),
   '친구가 힘들 때 어떻게 해줬어? 그때 어떤 말이나 행동이 도움이 됐어?',
   'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'counselor'),
   '사람의 마음이나 감정에 관심이 있어? 왜 사람들이 그런 감정을 느끼는지 궁금한 적 있어?',
   'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_student_actions (
  occupation_id, stage_number, stage_title, action_text, action_type,
  duration_minutes, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'counselor'),
   1, '탐색하기', '유튜브에서 심리상담사가 하는 일 또는 상담 사례 영상 시청하기',
   'watch', 15, 'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'counselor'),
   1, '탐색하기', '친구의 고민을 들었을 때 내가 어떻게 반응하는지 일기에 써보기',
   'explore', 10, 'all', 1, 1, true, true, 'published', now(), 'import', 'manual');


-- ============================================================
-- [09] 경찰관  |  공공·안전
--      legacy_occupation_id = 'police-officer'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'police-officer', '경찰관', '🚔', '공공·안전', array['education'],
  null, 'pending', false, 7, 'police-officer'
);

insert into public.occupation_source_meta (occupation_id, source_type, raw_payload)
values (
  (select id from public.occupation_master where slug = 'police-officer'),
  'manual',
  jsonb_build_object(
    'pilot', true, 'name_ko', '경찰관', 'category', '공공·안전',
    'employment24_code_status', 'pending_api_sync', 'ksco_ref', '24311',
    'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
  )
);

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'police-officer'),
   'service', 'one_liner',
   '시민의 안전을 지키고 정의를 실현하는 공공안전 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'police-officer'),
   'service', 'easy_description',
   '범죄를 예방하고 사건을 해결하며 위기에 처한 시민을 돕는 사람이 경찰관이에요. 정의감이 강하고 체력도 좋으며 사람을 돕는 데서 보람을 느끼는 학생에게 잘 맞아요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'police-officer'),
   'service', 'why_this_job',
   '공공·안전 분야에 관심 있는 학생에게 가장 친숙한 진로예요. 형사, 사이버수사관, 교통경찰 등 다양한 세부 전문 분야 중 선택할 수 있어요.',
   1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'police-officer'),
   'service', 'mission_hint',
   '경찰관이 하는 일 중 내가 미처 몰랐던 역할을 하나 찾아보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'police-officer'),
   'service', 'step_action',
   '유튜브에서 경찰관 하루 일과 또는 경찰관 브이로그 영상 시청하기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'police-officer'),
   'service', 'step_action',
   '경찰관 종류(형사, 교통, 사이버 등)를 조사해 가장 관심 있는 분야 하나 골라보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_parent_questions (
  occupation_id, question, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'police-officer'),
   '정의롭지 않은 일을 보면 어떤 마음이 들어? 바로잡고 싶다는 생각을 해본 적 있어?',
   'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'police-officer'),
   '경찰관이 하는 다양한 일들 중 어떤 분야가 가장 흥미로워 보여?',
   'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_student_actions (
  occupation_id, stage_number, stage_title, action_text, action_type,
  duration_minutes, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'police-officer'),
   1, '탐색하기', '경찰청 유튜브 채널에서 경찰관 소개 영상 1편 시청하기',
   'watch', 15, 'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'police-officer'),
   1, '탐색하기', '형사, 교통경찰, 사이버수사관 중 하나를 골라 되는 방법 검색해보기',
   'explore', 20, 'all', 1, 1, true, true, 'published', now(), 'import', 'manual');


-- ============================================================
-- [10] 마케터  |  비즈니스·경영
--      legacy_occupation_id = 'marketer'
-- ============================================================
insert into public.occupation_master (
  slug, name_ko, emoji, category, interest_fields,
  employment24_code, sync_status, is_active, priority, legacy_occupation_id
) values (
  'marketer', '마케터', '📣', '비즈니스·경영', array['business'],
  null, 'pending', false, 8, 'marketer'
);

insert into public.occupation_source_meta (occupation_id, source_type, raw_payload)
values (
  (select id from public.occupation_master where slug = 'marketer'),
  'manual',
  jsonb_build_object(
    'pilot', true, 'name_ko', '마케터', 'category', '비즈니스·경영',
    'employment24_code_status', 'pending_api_sync', 'ksco_ref', '27521',
    'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
  )
);

insert into public.occupation_summary (
  occupation_id, layer, content_type, content,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'marketer'),
   'service', 'one_liner',
   '사람들의 마음을 움직여 상품과 서비스를 알리는 직업이에요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'marketer'),
   'service', 'easy_description',
   '광고, SNS 콘텐츠, 이벤트 기획 등을 통해 더 많은 사람이 제품에 관심을 갖도록 만드는 사람이 마케터예요. 창의적이고 사람들의 반응을 예측하는 걸 좋아하는 학생에게 잘 어울려요.',
   1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'marketer'),
   'service', 'why_this_job',
   '비즈니스 감각과 창의성이 모두 필요한 직업이에요. IT, 예술, 심리 등 다양한 관심사를 연결해 커리어를 만들 수 있어서 진로 확장성이 높아요.',
   1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_preparations (
  occupation_id, layer, prep_type, content,
  grade_group, stage_number, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'marketer'),
   'service', 'mission_hint',
   '오늘 본 광고나 SNS 게시물 중 눈길을 끈 것을 하나 골라 왜 마음에 들었는지 분석해보세요.',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'marketer'),
   'service', 'step_action',
   '인스타그램이나 유튜브에서 인상적인 광고 하나를 찾아 왜 효과적인지 분석해보기',
   'all', 1, 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'marketer'),
   'service', 'step_action',
   '좋아하는 제품을 친구에게 소개하는 30초 소개말을 글로 써보기',
   'all', 1, 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_parent_questions (
  occupation_id, question, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'marketer'),
   '어떤 광고나 마케팅이 특히 마음에 들었던 적 있어? 어떤 점이 좋았어?',
   'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'marketer'),
   '아이디어를 내고 사람들을 설득하는 일이 재미있을 것 같아? 어떤 상황에서 그런 생각을 해봤어?',
   'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

insert into public.occupation_student_actions (
  occupation_id, stage_number, stage_title, action_text, action_type,
  duration_minutes, grade_target, display_order,
  version_no, is_current, is_latest, status, published_at, actor_type, generation_source
) values
  ((select id from public.occupation_master where slug = 'marketer'),
   1, '탐색하기', '유튜브에서 마케터 직업 소개 영상 1편 시청하기',
   'watch', 15, 'all', 0, 1, true, true, 'published', now(), 'import', 'manual'),
  ((select id from public.occupation_master where slug = 'marketer'),
   1, '탐색하기', '좋아하는 브랜드의 인스타그램을 방문해 어떤 방식으로 홍보하는지 분석하기',
   'explore', 15, 'all', 1, 1, true, true, 'published', now(), 'import', 'manual');


-- ============================================================
-- [검증 쿼리] seed 실행 후 확인
-- ============================================================

-- 1. occupation_master 10개 확인
select slug, name_ko, emoji, category, is_active, priority, legacy_occupation_id
from public.occupation_master
where slug in (
  'software-developer', 'data-analyst',
  'visual-designer',    'video-content-creator',
  'nurse',              'biotech-researcher',
  'teacher',            'counselor',
  'police-officer',     'marketer'
)
order by priority desc, slug;

-- 2. 직업별 서비스 데이터 건수 확인 (summary=3, prep=3, question=2, action=2)
select
  m.slug,
  m.name_ko,
  count(distinct s.id)  as summary_cnt,
  count(distinct p.id)  as prep_cnt,
  count(distinct q.id)  as question_cnt,
  count(distinct a.id)  as action_cnt
from public.occupation_master m
left join public.occupation_summary s
  on s.occupation_id = m.id and s.is_current = true and s.status = 'published'
left join public.occupation_preparations p
  on p.occupation_id = m.id and p.is_current = true and p.status = 'published'
left join public.occupation_parent_questions q
  on q.occupation_id = m.id and q.is_current = true and q.status = 'published'
left join public.occupation_student_actions a
  on a.occupation_id = m.id and a.is_current = true and a.status = 'published'
where m.slug in (
  'software-developer', 'data-analyst',
  'visual-designer',    'video-content-creator',
  'nurse',              'biotech-researcher',
  'teacher',            'counselor',
  'police-officer',     'marketer'
)
group by m.slug, m.name_ko
order by m.slug;

-- 3. one_liner 내용 미리보기
select m.slug, left(s.content, 50) as one_liner_preview
from public.occupation_summary s
join public.occupation_master m on m.id = s.occupation_id
where s.content_type = 'one_liner' and s.is_current = true
  and m.slug in (
    'software-developer', 'data-analyst',
    'visual-designer',    'video-content-creator',
    'nurse',              'biotech-researcher',
    'teacher',            'counselor',
    'police-officer',     'marketer'
  )
order by m.slug;


-- ============================================================
-- [ACTIVATE] 검증 완료 후 실행 — UI 노출 활성화
-- ⚠️  위 검증 쿼리에서 모든 직업이 summary=3, prep=3 확인 후 실행
-- ============================================================

/*
update public.occupation_master
set    is_active = true,
       updated_at = now()
where  slug in (
  'software-developer', 'data-analyst',
  'visual-designer',    'video-content-creator',
  'nurse',              'biotech-researcher',
  'teacher',            'counselor',
  'police-officer',     'marketer'
)
returning slug, name_ko, is_active;
*/


-- ============================================================
-- [DEACTIVATE] 롤백 필요 시 실행
-- ============================================================

/*
update public.occupation_master
set    is_active = false,
       updated_at = now()
where  slug in (
  'software-developer', 'data-analyst',
  'visual-designer',    'video-content-creator',
  'nurse',              'biotech-researcher',
  'teacher',            'counselor',
  'police-officer',     'marketer'
);
*/
