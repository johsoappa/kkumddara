-- ====================================================
-- 033_fix_active_media_interest_fields.sql
-- 활성 직업 interest_fields ['media'] → ['art'] 정규화 (5건)
--
-- [목적]
--   TypeScript InterestField 허용값('it'|'art'|'medical'|'business'|'education')에
--   'media'가 포함되지 않아 student/home 추천 매칭 누락이 발생하는
--   is_active=true 직업 5개의 interest_fields를 ['art']로 정규화한다.
--
-- [수정 대상]
--   journalist          : 기자          / ['media'] → ['art']
--   novelist            : 소설가         / ['media'] → ['art']
--   pd-director         : 방송 PD        / ['media'] → ['art']
--   translator          : 번역가         / ['media'] → ['art']
--   video-content-creator: 영상콘텐츠 제작자/ ['media'] → ['art']
--     ※ video-content-creator = occupation_master.slug
--        legacy_occupation_id  = 'video-content-editor' (별도)
--
-- [제외 대상]
--   police-officer : 이미 032에서 public_safety → education 완료
--   firefighter, forensic-scientist, aerospace-engineer : 비활성 직업
--
-- [선택 근거]
--   journalist·novelist·pd-director·translator : 창작·표현·언어 계열 → 'art'
--   video-content-creator : 영상 편집·콘텐츠 창작 계열 → 'art'
--
-- [재실행 안전성]
--   WHERE slug IN (...) UPDATE → 동일 값 적용 시 변경 없음 (멱등)
--   updated_at: set_updated_at() 트리거가 자동 갱신
--
-- [실행 환경]
--   Supabase SQL Editor — service_role 키 (RLS 우회)
-- ====================================================


-- ============================================================
-- [수정] active media 직업 5개 → interest_fields = ['art']
-- ============================================================
update public.occupation_master
set
  interest_fields = array['art']::text[]
where slug in (
  'journalist',
  'novelist',
  'pd-director',
  'translator',
  'video-content-creator'
);


-- ============================================================
-- [검증] 실행 후 결과 확인
-- ============================================================
select
  slug,
  name_ko,
  legacy_occupation_id,
  interest_fields,
  is_active
from public.occupation_master
where slug in (
  'journalist',
  'novelist',
  'pd-director',
  'translator',
  'video-content-creator'
)
order by slug;

-- 기대 결과:
-- slug                 | name_ko      | legacy_occupation_id | interest_fields | is_active
-- -------------------- | ------------ | -------------------- | --------------- | ---------
-- journalist           | 기자          | journalist           | {art}           | true
-- novelist             | 소설가        | novelist             | {art}           | true
-- pd-director          | 방송 PD       | pd-director          | {art}           | true
-- translator           | 번역가        | translator           | {art}           | true
-- video-content-creator| 영상콘텐츠 제작자| video-content-editor | {art}           | true


-- ============================================================
-- [보조 검증] active 상태에서 media 잔존 여부 확인
-- ============================================================
select count(*) as remaining_media_count
from public.occupation_master
where is_active = true
  and interest_fields @> array['media']::text[];

-- 기대 결과:
-- remaining_media_count
-- ---------------------
-- 0
