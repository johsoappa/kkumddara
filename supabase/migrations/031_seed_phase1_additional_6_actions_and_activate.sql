-- ====================================================
-- 031_seed_phase1_additional_6_actions_and_activate.sql
-- Phase 1 기존 직업 추가 6개 — student_actions 보강 + 활성화
--
-- [목적]
--   026에서 is_active=false로 삽입된 Phase 1 직업 중
--   interest_fields 정합 및 ROADMAPS 정합이 확인된 6개를 선별하여
--   occupation_student_actions Stage 1을 보강하고 is_active=true로 전환.
--
-- [대상 직업]
--   AI 엔지니어       (ai-engineer)          — IT·기술     / [it]
--   사이버보안 전문가  (cybersecurity-expert) — IT·기술     / [it]
--   약사              (pharmacist)           — 의료·과학   / [medical]
--   건축가            (architect)            — 예술·디자인  / [art]
--   초등학교 교사     (elementary-teacher)   — 교육·사회   / [education]
--   사회복지사        (social-worker)        — 교육·사회   / [education]
--
-- [변경 범위]
--   occupation_master          : is_active = false → true (6행 UPDATE)
--   occupation_summary         : 기존 데이터 유지 (변경 없음)
--   occupation_preparations    : 기존 데이터 유지 (변경 없음)
--   occupation_student_actions : stage_number=1 DELETE 후 INSERT (4행 × 6직업)
--
-- [재실행 안전성]
--   occupation_master UPDATE          : WHERE slug IN → 동일 적용 시 변경 없음
--   occupation_student_actions DELETE : stage_number=1 한정 → INSERT 전 정리
--   occupation_student_actions INSERT : DELETE 후 INSERT → 중복 없음
--
-- [실행 환경]
--   Supabase SQL Editor — service_role 키 (RLS 우회)
--
-- [실행 순서]
--   1. 이 파일 실행
--   2. 하단 검증 쿼리 확인
--   3. /explore 6개 직업 카드 노출 확인
--   4. /roadmap Stage 1 미션 표시 확인
--   5. /student/home 오늘의 미션 반영 확인
--   6. /report 완료율 반영 확인
-- ====================================================


-- ============================================================
-- [1단계] is_active = true 전환
--   updated_at: set_updated_at() 트리거가 자동 갱신하므로 생략
-- ============================================================
update public.occupation_master
set
  is_active = true
where slug in (
  'ai-engineer',
  'cybersecurity-expert',
  'pharmacist',
  'architect',
  'elementary-teacher',
  'social-worker'
);


-- ============================================================
-- [2단계] 기존 stage 1 student_actions 삭제 (멱등성 보장)
-- ============================================================
delete from public.occupation_student_actions
where occupation_id in (
  select id from public.occupation_master
  where slug in (
    'ai-engineer',
    'cybersecurity-expert',
    'pharmacist',
    'architect',
    'elementary-teacher',
    'social-worker'
  )
)
and stage_number = 1;


-- ============================================================
-- [3단계] Stage 1 student_actions INSERT (4개 × 6직업)
--   030 패턴 동일 — slug JOIN 방식 (slug = legacy_occupation_id)
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

  -- ── AI 엔지니어 (ai-engineer) ────────────────────────────
  ('ai-engineer', 1, '지금 당장 시작하기', 'AI가 생활 속에서 쓰이는 예시 3가지를 찾아보기',                            'explore', 15, 'all', 1),
  ('ai-engineer', 1, '지금 당장 시작하기', 'AI에게 질문을 해보고 어떤 답을 잘하는지 관찰해보기',                       'explore', 15, 'all', 2),
  ('ai-engineer', 1, '지금 당장 시작하기', 'AI가 사람을 도울 수 있는 일을 상상해서 적어보기',                          'make',    20, 'all', 3),
  ('ai-engineer', 1, '지금 당장 시작하기', 'AI 엔지니어에게 필요한 수학·코딩·관찰 습관을 정리해보기',                  'make',    15, 'all', 4),

  -- ── 사이버보안 전문가 (cybersecurity-expert) ─────────────
  ('cybersecurity-expert', 1, '지금 당장 시작하기', '안전한 비밀번호를 만드는 방법 3가지를 찾아보기',                  'explore', 15, 'all', 1),
  ('cybersecurity-expert', 1, '지금 당장 시작하기', '피싱 문자나 이상한 링크를 구별하는 방법을 알아보기',               'read',    20, 'all', 2),
  ('cybersecurity-expert', 1, '지금 당장 시작하기', '가족에게 알려줄 인터넷 안전 수칙 3가지를 적어보기',               'make',    15, 'all', 3),
  ('cybersecurity-expert', 1, '지금 당장 시작하기', '사이버보안 전문가가 지켜야 할 정보가 무엇인지 생각해보기',         'explore', 10, 'all', 4),

  -- ── 약사 (pharmacist) ────────────────────────────────────
  ('pharmacist', 1, '지금 당장 시작하기', '약국에서 약사가 하는 일을 처방전·복약 설명·건강 상담으로 나눠 알아보기',    'read',    20, 'all', 1),
  ('pharmacist', 1, '지금 당장 시작하기', '약을 먹을 때 지켜야 할 안전 수칙 3가지를 적어보기',                         'make',    15, 'all', 2),
  ('pharmacist', 1, '지금 당장 시작하기', '감기약·연고·소독약처럼 집에서 자주 보는 약의 용도를 조사해보기',            'explore', 20, 'all', 3),
  ('pharmacist', 1, '지금 당장 시작하기', '약사에게 필요한 꼼꼼함과 책임감을 생각해보기',                              'make',    10, 'all', 4),

  -- ── 건축가 (architect) ───────────────────────────────────
  ('architect', 1, '지금 당장 시작하기', '마음에 드는 건물 3개를 찾아 공통점을 적어보기',                              'explore', 15, 'all', 1),
  ('architect', 1, '지금 당장 시작하기', '내가 살고 싶은 방이나 집을 간단히 그려보기',                                 'make',    25, 'all', 2),
  ('architect', 1, '지금 당장 시작하기', '건물이 튼튼하고 편리하려면 무엇이 필요한지 생각해보기',                       'explore', 15, 'all', 3),
  ('architect', 1, '지금 당장 시작하기', '건축가에게 필요한 관찰력·공간 감각·협업 능력을 정리해보기',                   'make',    15, 'all', 4),

  -- ── 초등학교 교사 (elementary-teacher) ───────────────────
  ('elementary-teacher', 1, '지금 당장 시작하기', '좋은 선생님이 해주는 행동 3가지를 생각해보기',                      'explore', 15, 'all', 1),
  ('elementary-teacher', 1, '지금 당장 시작하기', '친구에게 내가 잘 아는 내용을 쉽게 설명해보기',                      'make',    20, 'all', 2),
  ('elementary-teacher', 1, '지금 당장 시작하기', '수업을 재미있게 만들 방법을 하나 상상해보기',                        'make',    15, 'all', 3),
  ('elementary-teacher', 1, '지금 당장 시작하기', '교사에게 필요한 인내심·설명력·책임감을 적어보기',                    'make',    10, 'all', 4),

  -- ── 사회복지사 (social-worker) ───────────────────────────
  ('social-worker', 1, '지금 당장 시작하기', '도움이 필요한 사람을 돕는 방법 3가지를 생각해보기',                      'explore', 15, 'all', 1),
  ('social-worker', 1, '지금 당장 시작하기', '주변에서 배려가 필요한 상황을 찾아보기',                                 'explore', 15, 'all', 2),
  ('social-worker', 1, '지금 당장 시작하기', '지역사회에서 아이·어르신·장애인을 돕는 기관을 알아보기',                  'read',    20, 'all', 3),
  ('social-worker', 1, '지금 당장 시작하기', '사회복지사에게 필요한 공감과 문제 해결 능력을 정리해보기',                'make',    10, 'all', 4)

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
where om.slug in (
  'ai-engineer',
  'cybersecurity-expert',
  'pharmacist',
  'architect',
  'elementary-teacher',
  'social-worker'
)
order by
  case om.slug
    when 'ai-engineer'          then 1
    when 'cybersecurity-expert' then 2
    when 'pharmacist'           then 3
    when 'architect'            then 4
    when 'elementary-teacher'   then 5
    when 'social-worker'        then 6
  end;

-- 기대 결과:
-- slug                 | name_ko        | is_active | summary_count | prep_count | action_count
-- -------------------- | -------------- | --------- | ------------- | ---------- | ------------
-- ai-engineer          | AI 엔지니어     | true      | 3             | 3          | 4
-- cybersecurity-expert | 사이버보안 전문가| true      | 3             | 3          | 4
-- pharmacist           | 약사            | true      | 3             | 3          | 4
-- architect            | 건축가          | true      | 3             | 3          | 4
-- elementary-teacher   | 초등학교 교사   | true      | 3             | 3          | 4
-- social-worker        | 사회복지사      | true      | 3             | 3          | 4
