// ====================================================
// 꿈따라 — 가족 계정 더미 데이터
//
// [Supabase 연동 시 교체 순서]
// 1. 이 파일의 각 변수가 어떤 테이블에 대응하는지 주석 참고
// 2. 해당 변수를 import하는 파일에서 Supabase 쿼리로 교체
// 3. 타입은 src/types/family.ts를 그대로 사용
// ====================================================

import type {
  User,
  Family,
  FamilyMember,
  Invitation,
  Child,
  FamilySettings,
  ChildWithFamily,
} from "@/types/family";

// ============================================================
// 시나리오: 김민준 가족
// - 메인 계정: 엄마 (김지영)
// - 공동 양육자: 아빠 (김철수) — 초대 수락 완료
// - 자녀: 김민준 (중2)
// ============================================================

// ----------------------------------------
// [users 테이블] 더미 사용자 2명
// ----------------------------------------

/** 메인 계정 — 엄마 */
export const DUMMY_MAIN_USER: User = {
  id: "user-main-001",
  display_name: "민준맘",                // 실명 대신 닉네임
  avatar_url: null,
  subscription_status: "premium",
  subscription_plan: "pro",
  subscription_expires_at: "2026-12-31T23:59:59Z",
  created_at: "2026-01-15T09:00:00Z",
};

/** 공동 양육자 — 아빠 */
export const DUMMY_CO_PARENT_USER: User = {
  id: "user-co-001",
  display_name: "민준아빠",
  avatar_url: null,
  subscription_status: "free",           // 공동 양육자는 메인 구독에 포함
  subscription_plan: "free",
  subscription_expires_at: null,
  created_at: "2026-02-01T14:30:00Z",
};

// ----------------------------------------
// [families 테이블] 가족 그룹
// ----------------------------------------

export const DUMMY_FAMILY: Family = {
  id: "family-001",
  name: "김씨 가족",
  main_user_id: "user-main-001",         // 엄마가 메인 계정
  created_at: "2026-01-15T09:00:00Z",
};

// ----------------------------------------
// [family_members 테이블] 구성원 2명
// ----------------------------------------

export const DUMMY_FAMILY_MEMBERS: FamilyMember[] = [
  {
    // 메인 계정 (결제자·관리자)
    id: "member-001",
    family_id: "family-001",
    user_id: "user-main-001",
    role: "main",
    invited_by: "user-main-001",         // 본인이 생성
    status: "accepted",
    created_at: "2026-01-15T09:00:00Z",
    accepted_at: "2026-01-15T09:00:00Z",
  },
  {
    // 공동 양육자 (아빠, 초대 수락 완료)
    id: "member-002",
    family_id: "family-001",
    user_id: "user-co-001",
    role: "co-parent",
    invited_by: "user-main-001",         // 엄마가 초대
    status: "accepted",
    created_at: "2026-02-01T10:00:00Z",
    accepted_at: "2026-02-01T14:30:00Z",
  },
];

// ----------------------------------------
// [invitations 테이블] 초대 이력
// ----------------------------------------

export const DUMMY_INVITATIONS: Invitation[] = [
  {
    // 완료된 초대 (아빠 → 수락함)
    id: "invite-001",
    family_id: "family-001",
    invited_by: "user-main-001",
    invite_code: "KKUM-A1B2C3",          // URL: /invite/KKUM-A1B2C3
    invited_email: "dad@example.com",    // [주의] 실서비스에서는 암호화 필요
    status: "accepted",
    expires_at: "2026-02-08T10:00:00Z",  // 7일 후 만료
    created_at: "2026-02-01T10:00:00Z",
  },
  {
    // 대기 중인 초대 (다른 공동 양육자, 아직 수락 안 함)
    id: "invite-002",
    family_id: "family-001",
    invited_by: "user-main-001",
    invite_code: "KKUM-D4E5F6",
    invited_email: "grandma@example.com",
    status: "pending",
    expires_at: "2026-04-03T12:00:00Z",  // 만료 전
    created_at: "2026-03-27T12:00:00Z",
  },
];

// ----------------------------------------
// [children 테이블] 자녀 프로필
// ----------------------------------------

export const DUMMY_CHILDREN: Child[] = [
  {
    id: "child-001",
    family_id: "family-001",
    created_by: "user-main-001",         // 엄마가 생성
    name: "김민준",
    grade: "middle2",                    // 중2
    interests: ["it", "business"],
    avatar_emoji: "🐻",
    created_at: "2026-01-15T09:30:00Z",
    updated_at: "2026-03-01T10:00:00Z",
  },
  {
    // 두 번째 자녀 (여동생)
    id: "child-002",
    family_id: "family-001",
    created_by: "user-main-001",
    name: "김서연",
    grade: "elementary5",                // 초5
    interests: ["art", "education"],
    avatar_emoji: "🐰",
    created_at: "2026-02-10T14:00:00Z",
    updated_at: "2026-02-10T14:00:00Z",
  },
];

// ============================================================
// 복합 더미 데이터 (화면별로 바로 사용 가능)
// ============================================================

/**
 * 가족 설정 페이지용 더미 데이터
 * 사용: /settings/family 페이지에서 import
 *
 * [Supabase 연동 시 교체]
 * const data = await supabase
 *   .from('families')
 *   .select(`*, family_members(*, users(display_name, avatar_url)), children(*)`)
 *   .eq('id', familyId)
 *   .single();
 */
export const DUMMY_FAMILY_SETTINGS: FamilySettings = {
  family: DUMMY_FAMILY,
  members: [
    {
      member: DUMMY_FAMILY_MEMBERS[0],
      display_name: DUMMY_MAIN_USER.display_name,
      avatar_url: DUMMY_MAIN_USER.avatar_url,
    },
    {
      member: DUMMY_FAMILY_MEMBERS[1],
      display_name: DUMMY_CO_PARENT_USER.display_name,
      avatar_url: DUMMY_CO_PARENT_USER.avatar_url,
      // [주의] email, 전화번호 등 개인정보 절대 포함 안 함
    },
  ],
  children: DUMMY_CHILDREN,
  pendingInvitations: DUMMY_INVITATIONS.filter((i) => i.status === "pending"),
};

/**
 * 메인 계정 기준 — 자녀+가족 복합 정보
 * 사용: 홈/리포트 화면에서 자녀 선택 시
 */
export const DUMMY_CHILDREN_WITH_FAMILY: ChildWithFamily[] = DUMMY_CHILDREN.map(
  (child) => ({
    child,
    family: DUMMY_FAMILY,
    myRole: "main" as const,
    coParentExists: true,
  })
);

/**
 * 공동 양육자 기준 — 자녀+가족 복합 정보
 * 사용: 공동 양육자로 로그인 시 홈 화면
 */
export const DUMMY_CHILDREN_AS_CO_PARENT: ChildWithFamily[] = DUMMY_CHILDREN.map(
  (child) => ({
    child,
    family: DUMMY_FAMILY,
    myRole: "co-parent" as const,
    coParentExists: true,
  })
);

// ============================================================
// 초대 코드 유효성 검사 더미 함수
// [Supabase 연동 시] Edge Function으로 서버에서 처리
// ============================================================

/**
 * 초대 코드로 초대 정보 조회 (더미)
 *
 * [Supabase 연동 시 교체]
 * const { data } = await supabase
 *   .from('invitations')
 *   .select('*')
 *   .eq('invite_code', code)
 *   .eq('status', 'pending')
 *   .gt('expires_at', new Date().toISOString())
 *   .single();
 */
export function findInvitationByCode(
  code: string
): Invitation | null {
  return (
    DUMMY_INVITATIONS.find(
      (inv) =>
        inv.invite_code === code &&
        inv.status === "pending" &&
        new Date(inv.expires_at) > new Date()
    ) ?? null
  );
}
