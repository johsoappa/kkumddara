-- ====================================================
-- supabase/seeds/001_pilot_occupations.sql
-- 파일럿 직업 10개 시드 (end-to-end 검증용)
--
-- [목적]
--   occupation DB 구조 검증 — source → service → publish → UI 노출
--
-- [범위]
--   10개 파일럿 직업만. 50개 확대 금지.
--
-- [주의]
--   employment24_code: NULL (실제 고용24 API 호출 후 업데이트 필요)
--   sync_status: 'pending' → API 동기화 대기 상태로 표시
--   is_active: false → 검증 후 하단 ACTIVATE 블록 실행하여 노출
--
-- [재실행 안전]
--   slug 기준 CASCADE DELETE 후 재삽입 — 멱등성 보장
--
-- [실행 방법]
--   Supabase SQL Editor 또는 psql 직접 실행
--   service_role 키 사용 (RLS 우회 필요)
-- ====================================================

DO $pilot$
DECLARE
  v_id_01 uuid; -- 소프트웨어 개발자
  v_id_02 uuid; -- 데이터 분석가
  v_id_03 uuid; -- 시각디자이너
  v_id_04 uuid; -- 영상콘텐츠 제작자
  v_id_05 uuid; -- 간호사
  v_id_06 uuid; -- 생명과학 연구원
  v_id_07 uuid; -- 교사
  v_id_08 uuid; -- 상담사
  v_id_09 uuid; -- 경찰관
  v_id_10 uuid; -- 마케터
BEGIN

  -- ── 재실행 안전: slug 기준 CASCADE DELETE ───────────────────
  DELETE FROM public.occupation_master
  WHERE slug IN (
    'software-developer',    'data-analyst',
    'visual-designer',       'video-content-creator',
    'nurse',                 'biotech-researcher',
    'teacher',               'counselor',
    'police-officer',        'marketer'
  );
  RAISE NOTICE '🗑  기존 파일럿 데이터 삭제 완료 (occupation_master CASCADE)';


  -- ============================================================
  -- [01] 소프트웨어 개발자  |  IT·기술
  -- ============================================================
  INSERT INTO public.occupation_master (
    slug, name_ko, emoji, category, interest_fields,
    employment24_code, sync_status, is_active, priority, legacy_occupation_id
  ) VALUES (
    'software-developer', '소프트웨어 개발자', '💻', 'IT·기술', ARRAY['it'],
    NULL, 'pending', false, 10, 'software-engineer'
  ) RETURNING id INTO v_id_01;

  INSERT INTO public.occupation_source_meta (occupation_id, source_type, raw_payload)
  VALUES (
    v_id_01, 'manual',
    jsonb_build_object(
      'pilot', true,
      'name_ko', '소프트웨어 개발자',
      'category', 'IT·기술',
      'employment24_code_status', 'pending_api_sync',
      'ksco_ref', '22111',
      'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
    )
  );

  INSERT INTO public.occupation_summary (
    occupation_id, layer, content_type, content,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_01, 'service', 'one_liner',
     '컴퓨터 프로그램과 앱을 설계하고 코드로 만드는 직업이에요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_01, 'service', 'easy_description',
     '스마트폰 앱, 게임, 웹사이트가 어떻게 작동하는지 궁금했던 적 있나요? 소프트웨어 개발자는 이런 것들을 코드로 직접 만드는 사람이에요. 논리적으로 생각하고 문제를 푸는 걸 좋아한다면 잘 맞아요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_01, 'service', 'why_this_job',
     'IT에 관심 있는 학생에게 가장 자연스럽게 연결되는 직업이에요. 코딩은 지금 바로 온라인에서 시작할 수 있고, 만든 결과물이 눈에 바로 보여서 성취감도 높아요.',
     true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_preparations (
    occupation_id, layer, prep_type, content,
    grade_group, stage_number, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_01, 'service', 'mission_hint',
     '내가 매일 쓰는 앱이나 게임을 누가, 어떻게 만들었는지 찾아보는 것부터 시작해보세요.',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_01, 'service', 'step_action',
     '스크래치(scratch.mit.edu)에서 간단한 게임 하나 만들어보기',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_01, 'service', 'step_action',
     '좋아하는 앱의 회사 이름을 찾아보고, 그곳에서 일하는 개발자를 검색해보기',
     'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_parent_questions (
    occupation_id, question, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_01,
     '요즘 자주 쓰는 앱이나 게임이 있니? 그게 어떻게 만들어졌는지 생각해본 적 있어?',
     'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_01,
     '프로그래밍을 배우면 어떤 것들을 만들 수 있을지 같이 찾아볼까?',
     'all', 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_student_actions (
    occupation_id, stage_number, stage_title, action_text, action_type,
    duration_minutes, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_01, 1, '탐색하기',
     '유튜브에서 소프트웨어 개발자 하루 일과를 검색해 영상 하나 시청하기',
     'watch', 15, 'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_01, 1, '탐색하기',
     '코드닷오알지(code.org)에서 코딩 입문 강의 1개 완료하기',
     'try', 30, 'all', 1, true, true, 'published', now(), 'import', 'manual');

  RAISE NOTICE '✅ 01/10 소프트웨어 개발자 완료 (id=%)', v_id_01;


  -- ============================================================
  -- [02] 데이터 분석가  |  IT·기술
  -- ============================================================
  INSERT INTO public.occupation_master (
    slug, name_ko, emoji, category, interest_fields,
    employment24_code, sync_status, is_active, priority, legacy_occupation_id
  ) VALUES (
    'data-analyst', '데이터 분석가', '📊', 'IT·기술', ARRAY['it'],
    NULL, 'pending', false, 9, 'data-analyst'
  ) RETURNING id INTO v_id_02;

  INSERT INTO public.occupation_source_meta (occupation_id, source_type, raw_payload)
  VALUES (
    v_id_02, 'manual',
    jsonb_build_object(
      'pilot', true,
      'name_ko', '데이터 분석가',
      'category', 'IT·기술',
      'employment24_code_status', 'pending_api_sync',
      'ksco_ref', '22113',
      'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
    )
  );

  INSERT INTO public.occupation_summary (
    occupation_id, layer, content_type, content,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_02, 'service', 'one_liner',
     '데이터에서 의미 있는 패턴을 발견해 더 나은 결정을 이끌어내는 직업이에요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_02, 'service', 'easy_description',
     '유튜브 추천 영상, 쇼핑몰 인기 상품, 날씨 예보 — 이 모든 것 뒤에는 데이터를 분석하는 사람이 있어요. 숫자와 통계를 좋아하고, 왜 그런지 파고드는 걸 즐긴다면 잘 맞아요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_02, 'service', 'why_this_job',
     'IT 관심사와 논리적 사고를 모두 활용하는 직업이에요. 거의 모든 산업에서 데이터 분석가를 필요로 해서 진로 선택의 폭이 넓어요.',
     true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_preparations (
    occupation_id, layer, prep_type, content,
    grade_group, stage_number, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_02, 'service', 'mission_hint',
     '주변에서 데이터가 활용되는 사례 3가지를 찾아보세요. 예: 유튜브 추천, 날씨 예보, 쇼핑몰 인기 상품.',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_02, 'service', 'step_action',
     '일주일 동안 내가 시청한 유튜브 영상 종류를 기록하고 패턴 찾아보기',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_02, 'service', 'step_action',
     '구글 트렌드(trends.google.com)에 접속해 관심 있는 검색어의 인기 변화 확인해보기',
     'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_parent_questions (
    occupation_id, question, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_02,
     '어떤 콘텐츠가 왜 인기 있는지 궁금해한 적 있어? 그 이유를 분석해보는 게 데이터 분석이야.',
     'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_02,
     '수학이나 통계에서 재미있었던 부분이 있었어? 어떤 문제를 풀 때 흥미로웠어?',
     'all', 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_student_actions (
    occupation_id, stage_number, stage_title, action_text, action_type,
    duration_minutes, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_02, 1, '탐색하기',
     '유튜브에서 데이터 분석가 직업 소개 영상 하나 시청하기',
     'watch', 15, 'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_02, 1, '탐색하기',
     '구글 트렌드에서 내가 관심 있는 주제 2개의 인기 추이 비교해보기',
     'explore', 20, 'all', 1, true, true, 'published', now(), 'import', 'manual');

  RAISE NOTICE '✅ 02/10 데이터 분석가 완료 (id=%)', v_id_02;


  -- ============================================================
  -- [03] 시각디자이너  |  예술·디자인
  -- ============================================================
  INSERT INTO public.occupation_master (
    slug, name_ko, emoji, category, interest_fields,
    employment24_code, sync_status, is_active, priority, legacy_occupation_id
  ) VALUES (
    'visual-designer', '시각디자이너', '🎨', '예술·디자인', ARRAY['art'],
    NULL, 'pending', false, 8, 'graphic-designer'
  ) RETURNING id INTO v_id_03;

  INSERT INTO public.occupation_source_meta (occupation_id, source_type, raw_payload)
  VALUES (
    v_id_03, 'manual',
    jsonb_build_object(
      'pilot', true,
      'name_ko', '시각디자이너',
      'category', '예술·디자인',
      'employment24_code_status', 'pending_api_sync',
      'ksco_ref', '28421',
      'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
    )
  );

  INSERT INTO public.occupation_summary (
    occupation_id, layer, content_type, content,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_03, 'service', 'one_liner',
     '시각적 언어로 아이디어를 표현하고 사람들의 마음을 움직이는 직업이에요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_03, 'service', 'easy_description',
     '포스터, 로고, 앱 화면, 책 표지 — 우리 주변의 아름다운 것들은 대부분 시각디자이너가 만들어요. 그림 그리기를 좋아하거나 색과 배치에 민감한 학생이라면 탐색해볼 만해요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_03, 'service', 'why_this_job',
     '예술적 감각과 디지털 툴이 만나는 직업이에요. 자신이 만든 작품이 세상에 실제로 나오는 경험이 값지고, 취미 활동과 직업을 연결하기 좋은 분야예요.',
     true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_preparations (
    occupation_id, layer, prep_type, content,
    grade_group, stage_number, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_03, 'service', 'mission_hint',
     '오늘 본 앱, 광고, 간판 중 마음에 드는 디자인을 하나 골라 왜 좋은지 써보세요.',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_03, 'service', 'step_action',
     '좋아하는 앱 화면의 색상과 배치를 스케치로 따라 그려보기',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_03, 'service', 'step_action',
     '캔바(canva.com)에서 내 이름이 들어간 포스터 하나 직접 만들어보기',
     'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_parent_questions (
    occupation_id, question, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_03,
     '평소에 예쁘다거나 멋지다고 느낀 디자인이 있었어? 어떤 점이 좋았어?',
     'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_03,
     '그림 그리거나 꾸미는 걸 좋아한다면, 그걸 직업으로 할 수 있다는 거 알고 있었어?',
     'all', 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_student_actions (
    occupation_id, stage_number, stage_title, action_text, action_type,
    duration_minutes, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_03, 1, '탐색하기',
     '유튜브에서 시각디자이너 포트폴리오 영상을 검색해 작품 구경하기',
     'watch', 15, 'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_03, 1, '탐색하기',
     '캔바에서 내 이름으로 명함 또는 포스터 디자인 1개 완성해보기',
     'make', 20, 'all', 1, true, true, 'published', now(), 'import', 'manual');

  RAISE NOTICE '✅ 03/10 시각디자이너 완료 (id=%)', v_id_03;


  -- ============================================================
  -- [04] 영상콘텐츠 제작자  |  콘텐츠·미디어
  -- ============================================================
  INSERT INTO public.occupation_master (
    slug, name_ko, emoji, category, interest_fields,
    employment24_code, sync_status, is_active, priority, legacy_occupation_id
  ) VALUES (
    'video-content-creator', '영상콘텐츠 제작자', '🎬', '콘텐츠·미디어', ARRAY['art'],
    NULL, 'pending', false, 7, 'video-content-editor'
  ) RETURNING id INTO v_id_04;

  INSERT INTO public.occupation_source_meta (occupation_id, source_type, raw_payload)
  VALUES (
    v_id_04, 'manual',
    jsonb_build_object(
      'pilot', true,
      'name_ko', '영상콘텐츠 제작자',
      'category', '콘텐츠·미디어',
      'employment24_code_status', 'pending_api_sync',
      'ksco_ref', '28512',
      'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
    )
  );

  INSERT INTO public.occupation_summary (
    occupation_id, layer, content_type, content,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_04, 'service', 'one_liner',
     '영상으로 이야기를 만들고 시청자와 소통하는 직업이에요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_04, 'service', 'easy_description',
     '유튜브, 틱톡, 인스타그램 릴스처럼 우리가 즐겨 보는 영상 콘텐츠를 기획하고 만드는 사람이에요. 카메라 앞이든 뒤든, 이야기를 전달하는 걸 좋아하는 학생에게 잘 맞아요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_04, 'service', 'why_this_job',
     '창작과 기술이 모두 필요한 직업이에요. 스마트폰 하나로 시작할 수 있고, 관심 있는 주제를 영상으로 만들면서 실력을 키울 수 있어요.',
     true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_preparations (
    occupation_id, layer, prep_type, content,
    grade_group, stage_number, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_04, 'service', 'mission_hint',
     '좋아하는 유튜버의 영상 1편을 집중해서 보며 어떻게 구성됐는지 분석해보세요.',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_04, 'service', 'step_action',
     '좋아하는 유튜브 채널의 영상 썸네일과 제목 5개를 분석해 공통 패턴 찾아보기',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_04, 'service', 'step_action',
     '스마트폰으로 관심 있는 주제로 30초짜리 짧은 영상 직접 찍어보기',
     'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_parent_questions (
    occupation_id, question, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_04,
     '어떤 종류의 유튜브 영상을 가장 자주 봐? 그 채널의 어떤 점이 좋아?',
     'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_04,
     '영상 만드는 걸 해본 적 있어? 어떤 주제로 영상을 만들어보고 싶어?',
     'all', 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_student_actions (
    occupation_id, stage_number, stage_title, action_text, action_type,
    duration_minutes, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_04, 1, '탐색하기',
     '유튜브에서 영상 편집 기초 강의 10분 시청하기',
     'watch', 10, 'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_04, 1, '탐색하기',
     '관심 있는 주제로 30초 브이로그를 촬영하고 감상해보기',
     'make', 20, 'all', 1, true, true, 'published', now(), 'import', 'manual');

  RAISE NOTICE '✅ 04/10 영상콘텐츠 제작자 완료 (id=%)', v_id_04;


  -- ============================================================
  -- [05] 간호사  |  의료·과학
  -- ============================================================
  INSERT INTO public.occupation_master (
    slug, name_ko, emoji, category, interest_fields,
    employment24_code, sync_status, is_active, priority, legacy_occupation_id
  ) VALUES (
    'nurse', '간호사', '🩺', '의료·과학', ARRAY['medical'],
    NULL, 'pending', false, 8, 'nurse'
  ) RETURNING id INTO v_id_05;

  INSERT INTO public.occupation_source_meta (occupation_id, source_type, raw_payload)
  VALUES (
    v_id_05, 'manual',
    jsonb_build_object(
      'pilot', true,
      'name_ko', '간호사',
      'category', '의료·과학',
      'employment24_code_status', 'pending_api_sync',
      'ksco_ref', '22631',
      'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
    )
  );

  INSERT INTO public.occupation_summary (
    occupation_id, layer, content_type, content,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_05, 'service', 'one_liner',
     '환자 곁에서 건강을 지키고 회복을 함께하는 의료 전문직이에요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_05, 'service', 'easy_description',
     '병원에서 의사와 함께 환자의 상태를 살피고, 치료를 돕고, 마음을 위로하는 사람이 간호사예요. 사람을 돌보는 일이 보람 있고, 과학 공부를 좋아하는 학생에게 잘 어울려요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_05, 'service', 'why_this_job',
     '의료에 관심 있는 학생이라면 가장 먼저 탐색해볼 만한 직업이에요. 사회가 고령화될수록 간호사의 역할은 더 중요해지고, 국내외에서 모두 수요가 높아요.',
     true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_preparations (
    occupation_id, layer, prep_type, content,
    grade_group, stage_number, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_05, 'service', 'mission_hint',
     '주변 어른 중 병원에서 간호사에게 받은 도움이 무엇이었는지 물어보세요.',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_05, 'service', 'step_action',
     '유튜브에서 간호사 하루 일과 영상 1편 찾아 시청하기',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_05, 'service', 'step_action',
     '간호사가 되려면 어떤 공부와 자격증이 필요한지 검색해보기',
     'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_parent_questions (
    occupation_id, question, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_05,
     '아픈 사람을 도와주고 싶다는 생각을 해본 적 있어? 어떤 상황에서 그런 마음이 들었어?',
     'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_05,
     '의료계에서 일하는 사람들을 직접 만나거나 체험할 수 있는 기회를 함께 찾아볼까?',
     'all', 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_student_actions (
    occupation_id, stage_number, stage_title, action_text, action_type,
    duration_minutes, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_05, 1, '탐색하기',
     '유튜브에서 간호사 직업 브이로그 영상 하나 시청하기',
     'watch', 15, 'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_05, 1, '탐색하기',
     '간호사가 되기 위한 학교(간호학과)와 자격증 종류 검색해보기',
     'explore', 20, 'all', 1, true, true, 'published', now(), 'import', 'manual');

  RAISE NOTICE '✅ 05/10 간호사 완료 (id=%)', v_id_05;


  -- ============================================================
  -- [06] 생명과학 연구원  |  의료·과학
  --      slug = legacy_occupation_id = 'biotech-researcher' (정합성 일치)
  --      static data: id="biotech-researcher", name="생명과학 연구원"
  -- ============================================================
  INSERT INTO public.occupation_master (
    slug, name_ko, emoji, category, interest_fields,
    employment24_code, sync_status, is_active, priority, legacy_occupation_id
  ) VALUES (
    'biotech-researcher', '생명과학 연구원', '🔬', '의료·과학', ARRAY['medical'],
    NULL, 'pending', false, 7, 'biotech-researcher'
  ) RETURNING id INTO v_id_06;

  INSERT INTO public.occupation_source_meta (occupation_id, source_type, raw_payload)
  VALUES (
    v_id_06, 'manual',
    jsonb_build_object(
      'pilot', true,
      'name_ko', '생명과학 연구원',
      'category', '의료·과학',
      'employment24_code_status', 'pending_api_sync',
      'ksco_ref', '21211',
      'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
    )
  );

  INSERT INTO public.occupation_summary (
    occupation_id, layer, content_type, content,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_06, 'service', 'one_liner',
     '생명 현상을 연구하고 신기술을 개발하는 과학자예요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_06, 'service', 'easy_description',
     '새로운 백신을 만들고, 질병의 원인을 찾고, 더 나은 치료법을 연구하는 사람이 생명과학 연구원이에요. 생물·화학 시간이 재미있고 실험하는 걸 즐기는 학생에게 잘 맞아요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_06, 'service', 'why_this_job',
     '의료·과학에 관심 있는 학생 중 생명과학, 생물학, 화학에 흥미가 있다면 가장 자연스럽게 연결되는 직업이에요. 미래 바이오 산업의 핵심 인재로 성장할 수 있어요.',
     true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_preparations (
    occupation_id, layer, prep_type, content,
    grade_group, stage_number, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_06, 'service', 'mission_hint',
     '생물 시간에 배운 내용 중 가장 신기했던 것을 하나 떠올려보고, 그것이 실제 연구로 이어지는지 찾아보세요.',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_06, 'service', 'step_action',
     '유튜브 사이언스쿠키 또는 과학드림 채널에서 생명과학 관련 영상 1편 시청하기',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_06, 'service', 'step_action',
     '관심 있는 생명과학 분야(유전자, 면역, 뇌과학 등)의 유명 연구자 1명 찾아 어떤 연구를 했는지 조사하기',
     'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_parent_questions (
    occupation_id, question, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_06,
     '생물이나 화학 시간에 가장 흥미로웠던 실험이나 주제가 있었어? 왜 그게 재미있었어?',
     'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_06,
     '연구자가 된다면 어떤 문제를 해결하고 싶어? 질병 치료, 신약 개발, 유전자 연구 중 뭐가 끌려?',
     'all', 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_student_actions (
    occupation_id, stage_number, stage_title, action_text, action_type,
    duration_minutes, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_06, 1, '탐색하기',
     '유튜브에서 생명과학 연구원 직업 또는 바이오 연구자 인터뷰 영상 하나 시청하기',
     'watch', 15, 'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_06, 1, '탐색하기',
     '생명과학 관련 최근 뉴스(코로나 백신, 유전자 치료 등) 기사 하나를 찾아 읽어보기',
     'read', 15, 'all', 1, true, true, 'published', now(), 'import', 'manual');

  RAISE NOTICE '✅ 06/10 생명과학 연구원 완료 (id=%)', v_id_06;


  -- ============================================================
  -- [07] 교사  |  교육·사회
  -- ============================================================
  INSERT INTO public.occupation_master (
    slug, name_ko, emoji, category, interest_fields,
    employment24_code, sync_status, is_active, priority, legacy_occupation_id
  ) VALUES (
    'teacher', '교사', '📚', '교육·사회', ARRAY['education'],
    NULL, 'pending', false, 8, 'teacher'
  ) RETURNING id INTO v_id_07;

  INSERT INTO public.occupation_source_meta (occupation_id, source_type, raw_payload)
  VALUES (
    v_id_07, 'manual',
    jsonb_build_object(
      'pilot', true,
      'name_ko', '교사',
      'category', '교육·사회',
      'employment24_code_status', 'pending_api_sync',
      'ksco_ref', '23222',
      'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
    )
  );

  INSERT INTO public.occupation_summary (
    occupation_id, layer, content_type, content,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_07, 'service', 'one_liner',
     '지식과 경험을 나누며 학생의 성장을 함께하는 직업이에요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_07, 'service', 'easy_description',
     '학교 선생님뿐 아니라 학원 강사, 온라인 강사 등 다양한 형태로 일해요. 누군가에게 무언가를 가르치고 이해시키는 게 즐거운 학생이라면 잘 맞아요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_07, 'service', 'why_this_job',
     '교육·사회에 관심 있는 학생이 가장 직관적으로 연결할 수 있는 직업이에요. 특히 좋아하는 과목을 남에게 설명하는 걸 즐긴다면 교사는 훌륭한 선택지예요.',
     true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_preparations (
    occupation_id, layer, prep_type, content,
    grade_group, stage_number, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_07, 'service', 'mission_hint',
     '오늘 배운 내용 중 하나를 동생이나 친구에게 설명해보고, 얼마나 잘 전달됐는지 피드백을 받아보세요.',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_07, 'service', 'step_action',
     '내가 잘 설명할 수 있는 과목이나 주제가 무엇인지 생각해보고 목록으로 적어보기',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_07, 'service', 'step_action',
     'EBS 선생님 유튜브 채널에서 내가 좋아하는 과목의 강의를 보며 설명 방식 분석해보기',
     'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_parent_questions (
    occupation_id, question, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_07,
     '동생이나 친구에게 무언가를 가르쳐준 경험이 있어? 그때 어떤 느낌이었어?',
     'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_07,
     '지금까지 기억에 남는 선생님이 있어? 그 선생님의 어떤 점이 좋았어?',
     'all', 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_student_actions (
    occupation_id, stage_number, stage_title, action_text, action_type,
    duration_minutes, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_07, 1, '탐색하기',
     '좋아하는 선생님이나 강사가 가르치는 방식을 노트에 분석해보기',
     'explore', 15, 'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_07, 1, '탐색하기',
     '가족 중 한 명에게 내가 좋아하는 주제를 5분 동안 직접 설명해보기',
     'try', 10, 'all', 1, true, true, 'published', now(), 'import', 'manual');

  RAISE NOTICE '✅ 07/10 교사 완료 (id=%)', v_id_07;


  -- ============================================================
  -- [08] 심리상담사  |  교육·사회
  --      slug='counselor', legacy='psychologist'
  --      static data: id="psychologist", name="심리상담사" (정합 확인)
  -- ============================================================
  INSERT INTO public.occupation_master (
    slug, name_ko, emoji, category, interest_fields,
    employment24_code, sync_status, is_active, priority, legacy_occupation_id
  ) VALUES (
    'counselor', '심리상담사', '💬', '교육·사회', ARRAY['education'],
    NULL, 'pending', false, 7, 'psychologist'
  ) RETURNING id INTO v_id_08;

  INSERT INTO public.occupation_source_meta (occupation_id, source_type, raw_payload)
  VALUES (
    v_id_08, 'manual',
    jsonb_build_object(
      'pilot', true,
      'name_ko', '심리상담사',
      'category', '교육·사회',
      'employment24_code_status', 'pending_api_sync',
      'ksco_ref', '24243',
      'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
    )
  );

  INSERT INTO public.occupation_summary (
    occupation_id, layer, content_type, content,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_08, 'service', 'one_liner',
     '심리적 어려움을 겪는 사람의 마음을 이해하고 회복을 함께하는 직업이에요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_08, 'service', 'easy_description',
     '학교 상담사, 청소년 상담사, 심리치료사 등 다양한 형태로 일해요. 친구의 고민을 잘 들어주고 사람의 감정을 자연스럽게 이해하며, 도움을 주는 일에 보람을 느끼는 학생에게 잘 어울려요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_08, 'service', 'why_this_job',
     '사람과 마음에 관심 있는 학생에게 깊이 있는 탐색이 가능한 직업이에요. 심리학, 교육학, 사회복지학 등 다양한 전공으로 이어질 수 있고, 진로 선택의 폭도 넓어요.',
     true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_preparations (
    occupation_id, layer, prep_type, content,
    grade_group, stage_number, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_08, 'service', 'mission_hint',
     '최근 친구나 가족이 힘들어했던 상황을 떠올려보고, 그때 내가 어떻게 반응했는지 되돌아보세요.',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_08, 'service', 'step_action',
     '유튜브에서 심리상담사 직업 브이로그 또는 하루 일과 영상 1편 시청하기',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_08, 'service', 'step_action',
     '심리학 입문 도서나 청소년 심리 관련 책 1권을 찾아 목차만 읽어보기',
     'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_parent_questions (
    occupation_id, question, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_08,
     '친구가 힘들 때 어떻게 해줬어? 그때 어떤 말이나 행동이 도움이 됐어?',
     'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_08,
     '사람의 마음이나 감정에 관심이 있어? 왜 사람들이 그런 감정을 느끼는지 궁금한 적 있어?',
     'all', 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_student_actions (
    occupation_id, stage_number, stage_title, action_text, action_type,
    duration_minutes, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_08, 1, '탐색하기',
     '유튜브에서 심리상담사가 하는 일 또는 상담 사례 영상 시청하기',
     'watch', 15, 'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_08, 1, '탐색하기',
     '친구의 고민을 들었을 때 내가 어떻게 반응하는지 일기에 써보기',
     'explore', 10, 'all', 1, true, true, 'published', now(), 'import', 'manual');

  RAISE NOTICE '✅ 08/10 심리상담사 완료 (id=%)', v_id_08;


  -- ============================================================
  -- [09] 경찰관  |  공공·안전
  -- ============================================================
  INSERT INTO public.occupation_master (
    slug, name_ko, emoji, category, interest_fields,
    employment24_code, sync_status, is_active, priority, legacy_occupation_id
  ) VALUES (
    'police-officer', '경찰관', '🚔', '공공·안전', ARRAY['education'],
    NULL, 'pending', false, 7, 'police-officer'
  ) RETURNING id INTO v_id_09;

  INSERT INTO public.occupation_source_meta (occupation_id, source_type, raw_payload)
  VALUES (
    v_id_09, 'manual',
    jsonb_build_object(
      'pilot', true,
      'name_ko', '경찰관',
      'category', '공공·안전',
      'employment24_code_status', 'pending_api_sync',
      'ksco_ref', '24311',
      'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
    )
  );

  INSERT INTO public.occupation_summary (
    occupation_id, layer, content_type, content,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_09, 'service', 'one_liner',
     '시민의 안전을 지키고 정의를 실현하는 공공안전 직업이에요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_09, 'service', 'easy_description',
     '범죄를 예방하고 사건을 해결하며 위기에 처한 시민을 돕는 사람이 경찰관이에요. 정의감이 강하고 체력도 좋으며 사람을 돕는 데서 보람을 느끼는 학생에게 잘 맞아요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_09, 'service', 'why_this_job',
     '공공·안전 분야에 관심 있는 학생에게 가장 친숙한 진로예요. 형사, 사이버수사관, 교통경찰 등 다양한 세부 전문 분야 중 선택할 수 있어요.',
     true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_preparations (
    occupation_id, layer, prep_type, content,
    grade_group, stage_number, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_09, 'service', 'mission_hint',
     '경찰관이 하는 일 중 내가 미처 몰랐던 역할을 하나 찾아보세요.',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_09, 'service', 'step_action',
     '유튜브에서 경찰관 하루 일과 또는 경찰관 브이로그 영상 시청하기',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_09, 'service', 'step_action',
     '경찰관 종류(형사, 교통, 사이버 등)를 조사해 가장 관심 있는 분야 하나 골라보기',
     'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_parent_questions (
    occupation_id, question, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_09,
     '정의롭지 않은 일을 보면 어떤 마음이 들어? 바로잡고 싶다는 생각을 해본 적 있어?',
     'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_09,
     '경찰관이 하는 다양한 일들 중 어떤 분야가 가장 흥미로워 보여?',
     'all', 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_student_actions (
    occupation_id, stage_number, stage_title, action_text, action_type,
    duration_minutes, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_09, 1, '탐색하기',
     '경찰청 유튜브 채널에서 경찰관 소개 영상 1편 시청하기',
     'watch', 15, 'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_09, 1, '탐색하기',
     '형사, 교통경찰, 사이버수사관 중 하나를 골라 되는 방법 검색해보기',
     'explore', 20, 'all', 1, true, true, 'published', now(), 'import', 'manual');

  RAISE NOTICE '✅ 09/10 경찰관 완료 (id=%)', v_id_09;


  -- ============================================================
  -- [10] 마케터  |  비즈니스·경영
  -- ============================================================
  INSERT INTO public.occupation_master (
    slug, name_ko, emoji, category, interest_fields,
    employment24_code, sync_status, is_active, priority, legacy_occupation_id
  ) VALUES (
    'marketer', '마케터', '📣', '비즈니스·경영', ARRAY['business'],
    NULL, 'pending', false, 8, 'marketer'
  ) RETURNING id INTO v_id_10;

  INSERT INTO public.occupation_source_meta (occupation_id, source_type, raw_payload)
  VALUES (
    v_id_10, 'manual',
    jsonb_build_object(
      'pilot', true,
      'name_ko', '마케터',
      'category', '비즈니스·경영',
      'employment24_code_status', 'pending_api_sync',
      'ksco_ref', '27521',
      'note', '파일럿 시드 — 고용24 API 동기화 전 수동 입력'
    )
  );

  INSERT INTO public.occupation_summary (
    occupation_id, layer, content_type, content,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_10, 'service', 'one_liner',
     '사람들의 마음을 움직여 상품과 서비스를 알리는 직업이에요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_10, 'service', 'easy_description',
     '광고, SNS 콘텐츠, 이벤트 기획 등을 통해 더 많은 사람이 제품에 관심을 갖도록 만드는 사람이 마케터예요. 창의적이고 사람들의 반응을 예측하는 걸 좋아하는 학생에게 잘 어울려요.',
     true, true, 'published', now(), 'import', 'manual'),
    (v_id_10, 'service', 'why_this_job',
     '비즈니스 감각과 창의성이 모두 필요한 직업이에요. IT, 예술, 심리 등 다양한 관심사를 연결해 커리어를 만들 수 있어서 진로 확장성이 높아요.',
     true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_preparations (
    occupation_id, layer, prep_type, content,
    grade_group, stage_number, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_10, 'service', 'mission_hint',
     '오늘 본 광고나 SNS 게시물 중 눈길을 끈 것을 하나 골라 왜 마음에 들었는지 분석해보세요.',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_10, 'service', 'step_action',
     '인스타그램이나 유튜브에서 인상적인 광고 하나를 찾아 왜 효과적인지 분석해보기',
     'all', 1, 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_10, 'service', 'step_action',
     '좋아하는 제품을 친구에게 소개하는 30초 소개말을 글로 써보기',
     'all', 1, 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_parent_questions (
    occupation_id, question, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_10,
     '어떤 광고나 마케팅이 특히 마음에 들었던 적 있어? 어떤 점이 좋았어?',
     'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_10,
     '아이디어를 내고 사람들을 설득하는 일이 재미있을 것 같아? 어떤 상황에서 그런 생각을 해봤어?',
     'all', 1, true, true, 'published', now(), 'import', 'manual');

  INSERT INTO public.occupation_student_actions (
    occupation_id, stage_number, stage_title, action_text, action_type,
    duration_minutes, grade_target, display_order,
    is_current, is_latest, status, published_at, actor_type, generation_source
  ) VALUES
    (v_id_10, 1, '탐색하기',
     '유튜브에서 마케터 직업 소개 영상 1편 시청하기',
     'watch', 15, 'all', 0, true, true, 'published', now(), 'import', 'manual'),
    (v_id_10, 1, '탐색하기',
     '좋아하는 브랜드의 인스타그램을 방문해 어떤 방식으로 홍보하는지 분석하기',
     'explore', 15, 'all', 1, true, true, 'published', now(), 'import', 'manual');

  RAISE NOTICE '✅ 10/10 마케터 완료 (id=%)', v_id_10;

  RAISE NOTICE '';
  RAISE NOTICE '🎉 파일럿 10개 직업 시드 완료';
  RAISE NOTICE '   다음 단계: 검증 쿼리 실행 → ACTIVATE 블록으로 is_active=true 설정';

END $pilot$;


-- ============================================================
-- [검증] 삽입 결과 확인 쿼리
-- 015 마이그레이션 실행 후 아래를 실행하여 정상 여부 확인
-- ============================================================

-- 1. occupation_master 확인 (10개)
SELECT
  slug,
  name_ko,
  emoji,
  category,
  interest_fields,
  sync_status,
  is_active,
  priority
FROM public.occupation_master
WHERE slug IN (
  'software-developer', 'data-analyst',
  'visual-designer',    'video-content-creator',
  'nurse',              'biotech-researcher',
  'teacher',            'counselor',
  'police-officer',     'marketer'
)
ORDER BY priority DESC, slug;

-- 2. service layer 건수 확인 (직업당 3+3+2+2=10행)
SELECT
  m.slug,
  m.name_ko,
  COUNT(DISTINCT s.id)  AS summary_cnt,    -- 3 목표
  COUNT(DISTINCT p.id)  AS prep_cnt,       -- 3 목표 (1+2)
  COUNT(DISTINCT q.id)  AS question_cnt,   -- 2 목표
  COUNT(DISTINCT a.id)  AS action_cnt      -- 2 목표
FROM public.occupation_master m
LEFT JOIN public.occupation_summary s
  ON s.occupation_id = m.id AND s.is_current = true AND s.status = 'published'
LEFT JOIN public.occupation_preparations p
  ON p.occupation_id = m.id AND p.is_current = true AND p.status = 'published'
LEFT JOIN public.occupation_parent_questions q
  ON q.occupation_id = m.id AND q.is_current = true AND q.status = 'published'
LEFT JOIN public.occupation_student_actions a
  ON a.occupation_id = m.id AND a.is_current = true AND a.status = 'published'
WHERE m.slug IN (
  'software-developer', 'data-analyst',
  'visual-designer',    'video-content-creator',
  'nurse',              'biotech-researcher',
  'teacher',            'counselor',
  'police-officer',     'marketer'
)
GROUP BY m.slug, m.name_ko
ORDER BY m.slug;

-- 3. source_meta 확인 (10개)
SELECT
  m.slug,
  sm.source_type,
  sm.raw_payload->>'pilot' AS is_pilot,
  sm.raw_payload->>'ksco_ref' AS ksco_ref,
  sm.created_at
FROM public.occupation_source_meta sm
JOIN public.occupation_master m ON m.id = sm.occupation_id
WHERE m.slug IN (
  'software-developer', 'data-analyst',
  'visual-designer',    'video-content-creator',
  'nurse',              'biotech-researcher',
  'teacher',            'counselor',
  'police-officer',     'marketer'
)
ORDER BY m.slug;

-- 4. summary 내용 미리보기 (one_liner만)
SELECT
  m.slug,
  m.name_ko,
  s.content_type,
  left(s.content, 60) AS content_preview
FROM public.occupation_summary s
JOIN public.occupation_master m ON m.id = s.occupation_id
WHERE s.content_type = 'one_liner'
  AND s.is_current = true
  AND m.slug IN (
    'software-developer', 'data-analyst',
    'visual-designer',    'video-content-creator',
    'nurse',              'biotech-researcher',
    'teacher',            'counselor',
    'police-officer',     'marketer'
  )
ORDER BY m.slug;


-- ============================================================
-- [ACTIVATE] 검증 완료 후 실행 — UI 노출 활성화
-- ⚠️  검증 쿼리로 데이터 정상 확인 후에만 실행할 것
-- ============================================================

/*
UPDATE public.occupation_master
SET    is_active = true
WHERE  slug IN (
  'software-developer', 'data-analyst',
  'visual-designer',    'video-content-creator',
  'nurse',              'biotech-researcher',
  'teacher',            'counselor',
  'police-officer',     'marketer'
)
RETURNING slug, name_ko, is_active;
*/


-- ============================================================
-- [DEACTIVATE] 롤백 필요 시 실행
-- ============================================================

/*
UPDATE public.occupation_master
SET    is_active = false
WHERE  slug IN (
  'software-developer', 'data-analyst',
  'visual-designer',    'video-content-creator',
  'nurse',              'biotech-researcher',
  'teacher',            'counselor',
  'police-officer',     'marketer'
);
*/
