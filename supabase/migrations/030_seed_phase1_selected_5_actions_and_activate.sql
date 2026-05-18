-- ====================================================
-- 030_seed_phase1_selected_5_actions_and_activate.sql
-- Phase 1 기존 직업 1차 5개 — student_actions 보강 + 활성화
--
-- [목적]
--   026에서 is_active=false로 삽입된 Phase 1 직업 중
--   아이 친숙도·학부모 납득도가 높은 5개를 선별하여
--   occupation_student_actions Stage 1을 보강하고 is_active=true로 전환.
--
-- [대상 직업]
--   수의사       (veterinarian)   — 의료·과학   / [medical]
--   웹툰 작가    (webtoon-artist) — 예술·디자인  / [art]
--   게임 개발자  (game-developer) — IT·기술     / [it]
--   패션 디자이너(fashion-designer)— 예술·디자인 / [art]
--   의사         (doctor)        — 의료·과학   / [medical]
--
-- [변경 범위]
--   occupation_master     : is_active = false → true (5행 UPDATE)
--   occupation_summary    : 기존 데이터 유지 (변경 없음)
--   occupation_preparations: 기존 데이터 유지 (변경 없음)
--   occupation_student_actions: stage_number=1 DELETE 후 INSERT (4행 × 5직업)
--
-- [재실행 안전성]
--   occupation_master UPDATE: WHERE slug IN → 동일 적용 시 변경 없음
--   occupation_student_actions: DELETE(stage_number=1) 후 INSERT → 중복 없음
--
-- [실행 환경]
--   Supabase SQL Editor — service_role 키 (RLS 우회)
--
-- [실행 순서]
--   1. 이 파일 실행
--   2. 하단 검증 쿼리 확인
--   3. /explore 5개 직업 카드 노출 확인
--   4. /roadmap Stage 1 미션 표시 확인
--   5. /student/home 오늘의 미션 반영 확인
--   6. /report 완료율 반영 확인
-- ====================================================


-- ============================================================
-- [1단계] is_active = true 전환
-- ============================================================
update public.occupation_master
set
  is_active  = true
where slug in (
  'veterinarian',
  'webtoon-artist',
  'game-developer',
  'fashion-designer',
  'doctor'
);


-- ============================================================
-- [2단계] 기존 stage 1 student_actions 삭제 (멱등성 보장)
-- ============================================================
delete from public.occupation_student_actions
where occupation_id in (
  select id from public.occupation_master
  where slug in (
    'veterinarian',
    'webtoon-artist',
    'game-developer',
    'fashion-designer',
    'doctor'
  )
)
and stage_number = 1;


-- ============================================================
-- [3단계] Stage 1 student_actions INSERT (4개 × 5직업)
--   017 / 029 패턴 동일 — legacy_occupation_id JOIN 방식
-- ============================================================
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

  -- ── 수의사 (veterinarian) ───────────────────────────────
  ('veterinarian', 1, '지금 당장 시작하기', '좋아하는 동물 한 마리를 골라 아픈 증상을 어떻게 알 수 있을지 생각해보기',    'explore', 15, 'all', 1),
  ('veterinarian', 1, '지금 당장 시작하기', '동물병원에서 수의사가 하는 일을 영상이나 글로 찾아보기',                      'watch',   20, 'all', 2),
  ('veterinarian', 1, '지금 당장 시작하기', '반려동물을 돌볼 때 필요한 기본 습관 3가지 적어보기',                          'make',    15, 'all', 3),
  ('veterinarian', 1, '지금 당장 시작하기', '동물을 치료하는 직업에 필요한 마음가짐을 적어보기',                            'make',    10, 'all', 4),

  -- ── 웹툰 작가 (webtoon-artist) ─────────────────────────
  ('webtoon-artist', 1, '지금 당장 시작하기', '좋아하는 웹툰 한 편을 골라 주인공·배경·사건을 정리해보기',                   'read',    20, 'all', 1),
  ('webtoon-artist', 1, '지금 당장 시작하기', '네 컷 만화로 오늘 있었던 일을 그려보기',                                    'make',    25, 'all', 2),
  ('webtoon-artist', 1, '지금 당장 시작하기', '캐릭터 표정 5가지를 그려보고 감정을 적어보기',                               'make',    20, 'all', 3),
  ('webtoon-artist', 1, '지금 당장 시작하기', '웹툰 작가에게 필요한 능력 3가지를 생각해보기',                               'explore', 15, 'all', 4),

  -- ── 게임 개발자 (game-developer) ───────────────────────
  ('game-developer', 1, '지금 당장 시작하기', '좋아하는 게임 하나를 골라 재미있는 이유 3가지를 적어보기',                   'explore', 15, 'all', 1),
  ('game-developer', 1, '지금 당장 시작하기', '게임 속 캐릭터나 규칙을 직접 바꿔 상상해보기',                              'explore', 15, 'all', 2),
  ('game-developer', 1, '지금 당장 시작하기', '간단한 게임 아이디어를 제목·목표·규칙으로 나눠 적어보기',                    'make',    25, 'all', 3),
  ('game-developer', 1, '지금 당장 시작하기', '게임을 만드는 데 필요한 역할들을 찾아보기',                                  'read',    20, 'all', 4),

  -- ── 패션 디자이너 (fashion-designer) ───────────────────
  ('fashion-designer', 1, '지금 당장 시작하기', '마음에 드는 옷 스타일 3가지를 찾아 공통점을 적어보기',                    'explore', 15, 'all', 1),
  ('fashion-designer', 1, '지금 당장 시작하기', '계절에 어울리는 옷차림을 그림으로 디자인해보기',                           'make',    25, 'all', 2),
  ('fashion-designer', 1, '지금 당장 시작하기', '색깔과 무늬가 옷의 느낌을 어떻게 바꾸는지 관찰해보기',                    'explore', 15, 'all', 3),
  ('fashion-designer', 1, '지금 당장 시작하기', '패션 디자이너에게 필요한 감각과 습관을 적어보기',                          'make',    15, 'all', 4),

  -- ── 의사 (doctor) ──────────────────────────────────────
  ('doctor', 1, '지금 당장 시작하기', '의사가 병원에서 하는 일을 진료·검사·설명으로 나눠 알아보기',                         'read',    20, 'all', 1),
  ('doctor', 1, '지금 당장 시작하기', '건강을 지키기 위해 매일 할 수 있는 습관 3가지를 적어보기',                           'make',    15, 'all', 2),
  ('doctor', 1, '지금 당장 시작하기', '몸이 아플 때 의사에게 어떤 정보를 말해야 하는지 생각해보기',                         'explore', 15, 'all', 3),
  ('doctor', 1, '지금 당장 시작하기', '사람을 치료하는 직업에 필요한 태도를 적어보기',                                      'make',    10, 'all', 4)

) as m(slug, stage_number, stage_title, action_text, action_type, duration_minutes, grade_target, display_order)
  on om.slug = m.slug
 and om.is_active = true;


-- ============================================================
-- [검증] 실행 후 결과 확인
-- ============================================================
select
  om.slug,
  om.name_ko,
  om.is_active,
  (select count(*) from public.occupation_summary    s where s.occupation_id = om.id)                            as summary_count,
  (select count(*) from public.occupation_preparations p where p.occupation_id = om.id)                          as prep_count,
  (select count(*) from public.occupation_student_actions a where a.occupation_id = om.id and a.stage_number = 1) as action_count
from public.occupation_master om
where om.slug in ('veterinarian', 'webtoon-artist', 'game-developer', 'fashion-designer', 'doctor')
order by
  case om.slug
    when 'veterinarian'    then 1
    when 'webtoon-artist'  then 2
    when 'game-developer'  then 3
    when 'fashion-designer'then 4
    when 'doctor'          then 5
  end;

-- 기대 결과:
-- slug              | name_ko     | is_active | summary_count | prep_count | action_count
-- ----------------  | ----------- | --------- | ------------- | ---------- | ------------
-- veterinarian      | 수의사       | true      | 3             | 3          | 4
-- webtoon-artist    | 웹툰 작가    | true      | 3             | 3          | 4
-- game-developer    | 게임 개발자  | true      | 3             | 3          | 4
-- fashion-designer  | 패션 디자이너| true      | 3             | 3          | 4
-- doctor            | 의사         | true      | 3             | 3          | 4
