-- ====================================================
-- 017_seed_student_actions.sql
-- 파일럿 10개 직업 학생 홈 Stage 1 미션 Seed
--
-- [대상 직업 (legacy_occupation_id 기준)]
--   software-engineer / data-analyst / graphic-designer /
--   video-content-editor / nurse / biotech-researcher /
--   teacher / psychologist / police-officer / marketer
--
-- [설계 원칙]
--   - occupation_master.legacy_occupation_id 기준으로 occupation_id 조회
--   - stage_number = 1 (학생 홈 '오늘의 미션' 섹션 표시 기준)
--   - grade_target = 'all' (초·중·고 공통 표시)
--   - status = 'published', is_current = true, is_active = true
--   - [1단계] DELETE: 대상 직업 stage 1 기존 데이터 삭제 (멱등성 보장)
--   - [2단계] INSERT: 신규 미션 데이터 삽입
--
-- [실행 환경]
--   Supabase SQL Editor — service_role 키 (RLS 우회 필요)
--   공개 anon 키로는 INSERT/DELETE 불가 (관리자 전용 정책)
--
-- [재실행 안전성]
--   DELETE 먼저 실행하므로 중복 삽입 없음
--   occupation_master에 해당 legacy_occupation_id가 없으면 해당 직업 INSERT 건너뜀
-- ====================================================


-- ============================================================
-- [1단계] 기존 stage 1 데이터 삭제 (멱등성 보장)
-- ============================================================
delete from public.occupation_student_actions
where occupation_id in (
  select id from public.occupation_master
  where legacy_occupation_id in (
    'software-engineer',
    'data-analyst',
    'graphic-designer',
    'video-content-editor',
    'nurse',
    'biotech-researcher',
    'teacher',
    'psychologist',
    'police-officer',
    'marketer'
  )
)
and stage_number = 1;


-- ============================================================
-- [2단계] Stage 1 미션 INSERT
--   occupation_master.legacy_occupation_id → id 조인으로 occupation_id 자동 해결
--   is_active = true 인 직업만 삽입 (비활성 직업 제외)
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
  true,        -- is_current
  true,        -- is_latest
  true,        -- is_active
  'published', -- status
  'human',     -- actor_type
  'manual',    -- generation_source
  now()        -- published_at
from public.occupation_master om
join (values

  -- ── software-engineer ─────────────────────────────────────
  ('software-engineer', 1, '지금 당장 시작하기', '스크래치 또는 엔트리로 첫 번째 프로젝트 만들기', 'make',      30, 'all', 1),
  ('software-engineer', 1, '지금 당장 시작하기', '코딩 관련 유튜브 채널 1개 구독하기',              'watch',     10, 'all', 2),
  ('software-engineer', 1, '지금 당장 시작하기', '컴퓨터 구성 요소 이름 5가지 공부하기',            'read',      20, 'all', 3),
  ('software-engineer', 1, '지금 당장 시작하기', '파이썬 기초 무료 강의 1강 완료하기',              'try',       40, 'all', 4),

  -- ── data-analyst ──────────────────────────────────────────
  ('data-analyst', 1, '지금 당장 시작하기', '엑셀로 간단한 데이터 집계표 만들어 보기',     'make',      25, 'all', 1),
  ('data-analyst', 1, '지금 당장 시작하기', '뉴스에서 그래프·통계 기사 1개 스크랩하기',   'read',      15, 'all', 2),
  ('data-analyst', 1, '지금 당장 시작하기', '데이터 분석 직업 소개 영상 1편 보기',        'watch',     20, 'all', 3),
  ('data-analyst', 1, '지금 당장 시작하기', '파이썬 기초 강의 1강 완료하기',              'try',       40, 'all', 4),

  -- ── graphic-designer ──────────────────────────────────────
  ('graphic-designer', 1, '지금 당장 시작하기', '무료 Canva 계정 만들고 포스터 1개 만들기', 'make',      30, 'all', 1),
  ('graphic-designer', 1, '지금 당장 시작하기', '좋아하는 브랜드 로고 3개 따라 그려보기',  'make',      20, 'all', 2),
  ('graphic-designer', 1, '지금 당장 시작하기', '색상 이론 기초(색상환) 영상으로 공부하기', 'watch',    15, 'all', 3),
  ('graphic-designer', 1, '지금 당장 시작하기', '디자인 관련 유튜브 채널 1개 구독하기',   'watch',     10, 'all', 4),

  -- ── video-content-editor ──────────────────────────────────
  ('video-content-editor', 1, '지금 당장 시작하기', 'CapCut 또는 키네마스터 앱 설치하고 영상 편집해 보기', 'try',       30, 'all', 1),
  ('video-content-editor', 1, '지금 당장 시작하기', '스마트폰으로 30초 일상 영상 촬영하기',               'make',      15, 'all', 2),
  ('video-content-editor', 1, '지금 당장 시작하기', '좋아하는 유튜버 영상 편집 스타일 분석하기',          'watch',     20, 'all', 3),
  ('video-content-editor', 1, '지금 당장 시작하기', '자막·배경음악 넣기 1회 직접 실습하기',              'try',       25, 'all', 4),

  -- ── nurse ─────────────────────────────────────────────────
  ('nurse', 1, '지금 당장 시작하기', '심폐소생술(CPR) 기초 영상 보기',              'watch',     15, 'all', 1),
  ('nurse', 1, '지금 당장 시작하기', '건강 기록 앱으로 1주일 수면·운동 기록하기',   'try',       10, 'all', 2),
  ('nurse', 1, '지금 당장 시작하기', '학교 보건실 선생님께 하루 일과 여쭤보기',     'interview', 20, 'all', 3),
  ('nurse', 1, '지금 당장 시작하기', '인체 주요 기관 5가지 이름과 역할 공부하기',  'read',      20, 'all', 4),

  -- ── biotech-researcher ────────────────────────────────────
  ('biotech-researcher', 1, '지금 당장 시작하기', '세포 구조 그림 그리고 각 부분 이름 적기',    'make',      25, 'all', 1),
  ('biotech-researcher', 1, '지금 당장 시작하기', '과학 유튜브 채널 영상 3편 시청하기',         'watch',     30, 'all', 2),
  ('biotech-researcher', 1, '지금 당장 시작하기', '학교 과학 실험 일지 1회 꼼꼼히 작성하기',   'make',      20, 'all', 3),
  ('biotech-researcher', 1, '지금 당장 시작하기', 'DNA·유전자 기초 개념 검색하고 메모하기',     'read',      20, 'all', 4),

  -- ── teacher ───────────────────────────────────────────────
  ('teacher', 1, '지금 당장 시작하기', '동생이나 친구에게 아는 내용 5분간 가르쳐보기',  'try',       15, 'all', 1),
  ('teacher', 1, '지금 당장 시작하기', '존경하는 선생님 수업 방식 관찰하고 메모하기',  'explore',   20, 'all', 2),
  ('teacher', 1, '지금 당장 시작하기', '좋아하는 과목 설명 자료 1장 만들어 보기',     'make',      30, 'all', 3),
  ('teacher', 1, '지금 당장 시작하기', '교육 관련 유튜브 채널 1개 구독하기',          'watch',     10, 'all', 4),

  -- ── psychologist ──────────────────────────────────────────
  ('psychologist', 1, '지금 당장 시작하기', '감정 일기 1주일 꾸준히 써보기',                 'make',      10, 'all', 1),
  ('psychologist', 1, '지금 당장 시작하기', '심리학 기초 유튜브 영상 2편 보기',              'watch',     30, 'all', 2),
  ('psychologist', 1, '지금 당장 시작하기', '성격 유형 검사(MBTI 등) 하고 결과 정리하기',    'explore',   20, 'all', 3),
  ('psychologist', 1, '지금 당장 시작하기', '나의 스트레스 해소법 3가지 적고 실천해 보기',  'try',       15, 'all', 4),

  -- ── police-officer ────────────────────────────────────────
  ('police-officer', 1, '지금 당장 시작하기', '경찰청 공식 유튜브 채널 구독하기',           'watch',     15, 'all', 1),
  ('police-officer', 1, '지금 당장 시작하기', '범죄 예방 수칙 5가지 찾아 메모하기',         'read',      20, 'all', 2),
  ('police-officer', 1, '지금 당장 시작하기', '체력 관리 루틴 1주일 계획 세우기',           'make',      15, 'all', 3),
  ('police-officer', 1, '지금 당장 시작하기', '우리 지역 안전·신고 연락처 정리하기',        'explore',   15, 'all', 4),

  -- ── marketer ──────────────────────────────────────────────
  ('marketer', 1, '지금 당장 시작하기', '좋아하는 브랜드 광고 3개 모아서 공통점 찾기',    'watch',     20, 'all', 1),
  ('marketer', 1, '지금 당장 시작하기', 'SNS에서 내가 끌린 게시물 이유 3가지 분석하기',  'explore',   15, 'all', 2),
  ('marketer', 1, '지금 당장 시작하기', '간단한 이벤트 포스터 Canva로 만들어 보기',      'make',      30, 'all', 3),
  ('marketer', 1, '지금 당장 시작하기', '마케팅 성공 사례 1개 찾아 한 페이지로 정리하기', 'read',      25, 'all', 4)

) as m(legacy_id, stage_number, stage_title, action_text, action_type, duration_minutes, grade_target, display_order)
  on om.legacy_occupation_id = m.legacy_id
 and om.is_active = true;


-- ============================================================
-- [확인] 삽입 결과 요약
-- ============================================================
select
  om.legacy_occupation_id,
  om.name_ko,
  count(*) as action_count
from public.occupation_student_actions osa
join public.occupation_master om on om.id = osa.occupation_id
where osa.stage_number  = 1
  and osa.is_current    = true
  and osa.status        = 'published'
  and om.legacy_occupation_id in (
    'software-engineer', 'data-analyst', 'graphic-designer',
    'video-content-editor', 'nurse', 'biotech-researcher',
    'teacher', 'psychologist', 'police-officer', 'marketer'
  )
group by om.legacy_occupation_id, om.name_ko
order by om.legacy_occupation_id;
