-- ====================================================
-- 010_caregiver_invite_v2.sql
-- 보호자 초대 기능 v2
--
-- [변경 목적]
--   기존 caregiver_invite 테이블에:
--   1. invite_code 기본값을 6자리로 변경
--   2. 코드 조회용 인덱스 추가
--   3. RLS 추가:
--      - authenticated user: 유효한 pending 코드로 조회 가능 (수락 페이지용)
--      - authenticated user: 본인 uid로 수락(UPDATE) 가능
--
-- [기존 RLS 유지]
--   "caregiver_invite: parent 전체 권한" — parent 소유자만 전체 권한
-- ====================================================

-- 1. invite_code 기본값 6자리로 변경
alter table public.caregiver_invite
  alter column invite_code set default upper(substr(md5(random()::text), 1, 6));

-- 2. 코드 조회 인덱스
create index if not exists idx_caregiver_invite_code
  on public.caregiver_invite(invite_code);

-- 3. RLS: authenticated user가 pending 상태의 코드로 조회 가능
--    (보호자가 /join/caregiver 에서 코드 입력 시 사용)
create policy "caregiver_invite: 코드로 조회"
  on public.caregiver_invite for select
  to authenticated
  using (
    invite_status = 'pending'
    and (expires_at is null or expires_at > now())
  );

-- 4. RLS: authenticated user가 pending 초대를 수락 가능
--    - USING: 아직 수락되지 않고 만료되지 않은 초대만
--    - WITH CHECK: accepted_by를 자신 uid로, status를 'accepted'로만 변경 허용
create policy "caregiver_invite: 수락"
  on public.caregiver_invite for update
  to authenticated
  using (
    invite_status = 'pending'
    and (expires_at is null or expires_at > now())
    and accepted_by is null
  )
  with check (
    accepted_by = auth.uid()
    and invite_status = 'accepted'
  );

do $$ begin
  raise notice '✅ 010: caregiver_invite v2 완료';
  raise notice '   - invite_code 기본값 8자 → 6자로 변경';
  raise notice '   - 코드 조회/수락 RLS 추가';
end; $$;
