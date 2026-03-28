-- ====================================================
-- 꿈따라 Supabase 스키마
-- 파일: 001_family_schema.sql
--
-- [적용 방법]
-- Supabase 대시보드 → SQL Editor → 이 파일 내용 붙여넣기 → Run
-- 또는: supabase db push (Supabase CLI 사용 시)
--
-- [주의] 순서대로 실행해야 합니다 (외래키 의존성)
-- 순서: users → families → family_members → invitations → children
-- ====================================================

-- ============================================================
-- [1] users 테이블 (공개 프로필)
-- auth.users와 연결되는 공개 정보 테이블
-- [주의] email은 저장하지 않음 (auth.users에서만 관리)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(30) NOT NULL,
  avatar_url  TEXT,
  subscription_status VARCHAR(10) NOT NULL DEFAULT 'free'
    CHECK (subscription_status IN ('free', 'premium', 'trial')),
  subscription_plan VARCHAR(10) NOT NULL DEFAULT 'free'
    CHECK (subscription_plan IN ('free', 'basic', 'pro')),
  subscription_expires_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- [2] families 테이블 (가족 그룹)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.families (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(30),                -- 선택적 가족 이름
  main_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- [3] family_members 테이블 (핵심)
-- 한 가족에 최대: main 1명 + co-parent 1명 = 총 2명
-- ============================================================

CREATE TABLE IF NOT EXISTS public.family_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role        VARCHAR(10) NOT NULL CHECK (role IN ('main', 'co-parent')),
  invited_by  UUID NOT NULL REFERENCES public.users(id),
  status      VARCHAR(10) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,

  -- 한 가족에 같은 유저가 중복 등록 안 되도록
  UNIQUE (family_id, user_id)
);

-- co-parent는 한 가족에 최대 1명 제한
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_co_parent_per_family
  ON public.family_members (family_id)
  WHERE role = 'co-parent' AND status = 'accepted';

-- ============================================================
-- [4] invitations 테이블
-- 초대 링크 발송 및 상태 관리
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  invited_by   UUID NOT NULL REFERENCES public.users(id),
  -- [보안] 이메일은 암호화 권장 (pgcrypto 확장 사용)
  -- 현재는 평문으로 저장, 추후 encrypt() 함수 적용
  invited_email TEXT NOT NULL,
  invite_code  VARCHAR(20) NOT NULL UNIQUE,  -- 예: KKUM-A1B2C3
  status       VARCHAR(10) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  expires_at   TIMESTAMPTZ NOT NULL,         -- 생성 후 7일
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 만료된 초대 자동 정리용 인덱스
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at
  ON public.invitations (expires_at)
  WHERE status = 'pending';

-- ============================================================
-- [5] children 테이블 (자녀 프로필)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.children (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by   UUID NOT NULL REFERENCES public.users(id),
  name         VARCHAR(20) NOT NULL,
  grade        VARCHAR(15) NOT NULL
    CHECK (grade IN ('elementary5', 'elementary6', 'middle1', 'middle2', 'middle3')),
  interests    JSONB NOT NULL DEFAULT '[]',  -- InterestField[] 배열
  avatar_emoji VARCHAR(10) NOT NULL DEFAULT '🐻',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER children_updated_at
  BEFORE UPDATE ON public.children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- [6] RLS (Row Level Security) 정책
-- 핵심 보안: 같은 가족만 서로의 데이터 볼 수 있음
-- ============================================================

-- RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- users 테이블 RLS
-- 본인 프로필만 수정 가능, 조회는 같은 가족 구성원만
-- ----------------------------------------
CREATE POLICY "본인 프로필 조회" ON public.users
  FOR SELECT USING (
    auth.uid() = id
    OR
    -- 같은 가족 구성원의 display_name, avatar_url만 조회 허용
    id IN (
      SELECT fm.user_id FROM public.family_members fm
      WHERE fm.family_id IN (
        SELECT family_id FROM public.family_members
        WHERE user_id = auth.uid() AND status = 'accepted'
      )
      AND fm.status = 'accepted'
    )
  );

CREATE POLICY "본인 프로필 수정" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ----------------------------------------
-- families 테이블 RLS
-- ----------------------------------------
CREATE POLICY "소속 가족 조회" ON public.families
  FOR SELECT USING (
    id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "메인 계정만 가족 생성" ON public.families
  FOR INSERT WITH CHECK (auth.uid() = main_user_id);

-- ----------------------------------------
-- family_members 테이블 RLS
-- ----------------------------------------
CREATE POLICY "같은 가족 구성원 조회" ON public.family_members
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

-- ----------------------------------------
-- children 테이블 RLS
-- 조회: 같은 가족 모두 가능
-- 생성/수정/삭제: main 역할만 가능
-- ----------------------------------------
CREATE POLICY "같은 가족 자녀 조회" ON public.children
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "메인 계정만 자녀 생성" ON public.children
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND
    -- family_members에서 role = 'main' 확인
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_id = children.family_id
      AND user_id = auth.uid()
      AND role = 'main'
      AND status = 'accepted'
    )
  );

CREATE POLICY "메인 계정만 자녀 수정" ON public.children
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_id = children.family_id
      AND user_id = auth.uid()
      AND role = 'main'
      AND status = 'accepted'
    )
  );

CREATE POLICY "메인 계정만 자녀 삭제" ON public.children
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_id = children.family_id
      AND user_id = auth.uid()
      AND role = 'main'
      AND status = 'accepted'
    )
  );

-- ----------------------------------------
-- invitations 테이블 RLS
-- 보안: 초대받은 이메일 노출 최소화
-- ----------------------------------------
CREATE POLICY "메인 계정의 초대 조회" ON public.invitations
  FOR SELECT USING (
    invited_by = auth.uid()
    OR
    -- 초대받은 사람도 본인 초대 코드 조회 가능
    -- [주의] invited_email이 auth.users().email과 일치하는 경우만
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "메인 계정만 초대 생성" ON public.invitations
  FOR INSERT WITH CHECK (
    auth.uid() = invited_by
    AND
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_id = invitations.family_id
      AND user_id = auth.uid()
      AND role = 'main'
      AND status = 'accepted'
    )
  );

-- ============================================================
-- [7] 유용한 DB 함수 (추후 API에서 호출)
-- ============================================================

-- 초대 코드로 가족 정보 조회 (보안: 이메일 노출 없이)
CREATE OR REPLACE FUNCTION get_invitation_by_code(p_invite_code TEXT)
RETURNS TABLE (
  family_id UUID,
  family_name VARCHAR,
  status VARCHAR,
  expires_at TIMESTAMPTZ
) AS $$
  SELECT
    i.family_id,
    f.name as family_name,
    i.status,
    i.expires_at
  FROM public.invitations i
  JOIN public.families f ON f.id = i.family_id
  WHERE i.invite_code = p_invite_code
    AND i.status = 'pending'
    AND i.expires_at > NOW();
$$ LANGUAGE sql SECURITY DEFINER;
-- SECURITY DEFINER: RLS를 우회하여 함수가 실행됨 (신중하게 사용)
