-- ====================================================
-- 023_disable_caregiver_invite_for_beta.sql
-- 베타 기간 공동 양육자 초대 기능 RLS 비활성화
--
-- [목적]
--   caregiver_invite의 broad SELECT / UPDATE 정책을 제거해
--   외부 사용자(초대받은 보호자)가 초대 코드를 조회·수락할 수 없도록 닫는다.
--
-- [Phase 3 예정]
--   - verify_caregiver_invite / accept_caregiver_invite RPC 구현
--   - caregiver 읽기 전용 권한 (child / liked_occupations / roadmap_progress)
--   - /caregiver/home 화면 추가
--
-- [제거 대상 정책]
--   "caregiver_invite: 코드로 조회"  — 010_caregiver_invite_v2.sql에서 추가된 broad SELECT
--   "caregiver_invite: 수락"         — 010_caregiver_invite_v2.sql에서 추가된 broad UPDATE
--
-- [유지 대상 정책]
--   "caregiver_invite: parent 전체 권한" — 002_mvp_refactor.sql, parent 본인 관리용
--
-- [금지]
--   caregiver_invite 테이블 삭제 금지
--   caregiver_invite 데이터 삭제 금지
--   parent 본인 관리용 정책 삭제 금지
--   새 broad 정책 생성 금지
--   child / roadmap_progress / liked_occupations 정책 수정 금지
--
-- [idempotent]
--   drop policy if exists — 이미 없어도 오류 없음
-- ====================================================

-- 1. broad SELECT 정책 제거
drop policy if exists "caregiver_invite: 코드로 조회"
  on public.caregiver_invite;

-- 2. broad UPDATE 정책 제거
drop policy if exists "caregiver_invite: 수락"
  on public.caregiver_invite;

-- ── 검증 로그 ─────────────────────────────────────────────────
do $$ begin
  raise notice '✅ 023: caregiver_invite broad 정책 제거 완료';
  raise notice '   - 제거: caregiver_invite: 코드로 조회 (broad SELECT)';
  raise notice '   - 제거: caregiver_invite: 수락 (broad UPDATE)';
  raise notice '   - 유지: caregiver_invite: parent 전체 권한';
  raise notice '   - Phase 3 구현 전까지 외부 보호자 초대 흐름 비활성화';
end; $$;
