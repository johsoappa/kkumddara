-- ====================================================
-- 032_fix_active_occupation_interest_fields.sql
-- 활성 직업 interest_fields 정규화 (2건)
--
-- [목적]
--   TypeScript InterestField 허용값('it'|'art'|'medical'|'business'|'education')과
--   불일치하는 활성 직업 2개의 interest_fields를 정규화한다.
--   student/home 관심분야 추천 매칭 누락 문제 해소.
--
-- [수정 대상]
--   video-content-editor : ['media']  → ['art']
--     이유: InterestField에 'media' 없음. 창작·편집·표현 활동은 'art' 계열.
--     (025_prepare_occupation_expansion_interest_fields.sql에서 의도적 변경이었으나
--      InterestField 타입 미확장 상태에서 추천 매칭 누락 발생)
--
--   police-officer : ['public_safety'] → ['education']
--     이유: InterestField에 'public_safety' 없음. 사회·공공·규칙·도움 관심군은
--     education(교육·사회) 계열로 매핑하는 것이 현재 타입 구조에서 가장 안전함.
--     (024_align_teacher_and_police_occupation.sql에서 의도적 변경이었으나
--      InterestField 타입 미확장 상태에서 추천 매칭 누락 발생)
--
-- [수정하지 않는 항목]
--   creator : category='콘텐츠·미디어', interest_fields=['art'] → 기능 영향 없음, 유지
--   firefighter·journalist·pd-director·forensic-scientist·aerospace-engineer
--     → 비활성 직업, 별도 보강 활성화 시 함께 처리
--
-- [재실행 안전성]
--   WHERE slug = ... UPDATE → 동일 값 적용 시 변경 없음 (멱등)
--
-- [실행 환경]
--   Supabase SQL Editor — service_role 키 (RLS 우회)
--
-- [실행 후 확인]
--   student/home 관심분야 'art' 선택 아이에게 영상콘텐츠 제작자 추천 노출 확인
--   student/home 관심분야 'education' 선택 아이에게 경찰관 추천 노출 확인
-- ====================================================


-- ============================================================
-- [1] 영상콘텐츠 제작자 (video-content-editor)
--     ['media'] → ['art']
--     updated_at: set_updated_at() 트리거가 자동 갱신
-- ============================================================
update public.occupation_master
set
  interest_fields = array['art']::text[]
where slug = 'video-content-editor';


-- ============================================================
-- [2] 경찰관 (police-officer)
--     ['public_safety'] → ['education']
--     updated_at: set_updated_at() 트리거가 자동 갱신
-- ============================================================
update public.occupation_master
set
  interest_fields = array['education']::text[]
where slug = 'police-officer';


-- ============================================================
-- [검증] 실행 후 결과 확인
-- ============================================================
select
  slug,
  name_ko,
  interest_fields
from public.occupation_master
where slug in ('video-content-editor', 'police-officer')
order by slug;

-- 기대 결과:
-- slug                 | name_ko          | interest_fields
-- -------------------- | ---------------- | ---------------
-- police-officer       | 경찰관            | {education}
-- video-content-editor | 영상콘텐츠 제작자  | {art}
