// ====================================================
// 꿈따라 — 가족 계정 구조 타입 정의
//
// 설계 원칙:
// 1. Supabase 테이블 컬럼명과 1:1 대응 (snake_case)
// 2. 프론트에서 쓸 때는 이 타입을 그대로 import
// 3. 실제 연동 시 이 파일 수정 없이 DB만 연결하면 됨
// ====================================================

// ============================================================
// [1] 공통 기반 타입
// ============================================================

/** UUID 타입 (Supabase가 자동 생성) */
type UUID = string;

/** ISO 8601 날짜 문자열 */
type ISODateString = string;

// ============================================================
// [2] users 테이블
// Supabase Auth의 auth.users와 연결되는 공개 프로필 테이블
// ============================================================

/** 구독 상태 */
export type SubscriptionStatus = "free" | "premium" | "trial";

/** 구독 플랜 */
export type SubscriptionPlan = "free" | "basic" | "pro";

/** 사용자 공개 프로필 (개인정보 최소화) */
export interface User {
  id: UUID;                            // auth.users.id와 동일
  display_name: string;                // 표시 이름 (실명 X, 닉네임)
  avatar_url: string | null;           // 프로필 사진 URL
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
  subscription_expires_at: ISODateString | null;
  created_at: ISODateString;
  // [주의] email은 이 테이블에 저장 안 함 → auth.users에서만 관리
  // 공동 양육자에게 서로의 계정 정보 노출 방지
}

// ============================================================
// [3] families 테이블
// 한 가족 그룹을 나타내는 루트 테이블
// ============================================================

export interface Family {
  id: UUID;
  name: string | null;                 // 선택적 가족 이름 (예: "김씨 가족")
  main_user_id: UUID;                  // 메인 계정 (결제자) user.id
  created_at: ISODateString;
}

// ============================================================
// [4] family_members 테이블 (핵심)
// 가족 그룹에 속한 구성원 (메인 + 공동 양육자)
// ============================================================

/** 가족 내 역할 */
export type FamilyRole = "main" | "co-parent";

/** 초대 상태 */
export type InviteStatus = "pending" | "accepted" | "rejected";

/** 가족 구성원 */
export interface FamilyMember {
  id: UUID;
  family_id: UUID;                     // 소속 가족 그룹 ID
  user_id: UUID;                       // 구성원의 user ID
  role: FamilyRole;                    // "main" | "co-parent"
  invited_by: UUID;                    // 초대한 사람의 user ID
  status: InviteStatus;                // "pending" | "accepted" | "rejected"
  created_at: ISODateString;
  accepted_at: ISODateString | null;   // 수락 시각
}

// ============================================================
// [5] invitations 테이블
// 초대 링크/코드 관리
// 메인 계정 → 공동 양육자에게 초대 링크 발송
// ============================================================

export interface Invitation {
  id: UUID;
  family_id: UUID;
  invited_by: UUID;                    // 초대 발신자 (메인 계정)
  invite_code: string;                 // 고유 초대 코드 (URL에 포함)
  // [중요] invited_email은 암호화 또는 별도 보안 처리 필요
  // Supabase RLS(Row Level Security)로 본인만 조회 가능하게 설정
  invited_email: string;               // 초대받는 사람 이메일
  status: InviteStatus;
  expires_at: ISODateString;           // 초대 만료 시각 (보통 7일)
  created_at: ISODateString;
}

// ============================================================
// [6] children 테이블
// 자녀 프로필 (가족 그룹에 귀속)
// ============================================================

export type Grade =
  | "elementary3"   // 초등 3학년 (새싹 모드)
  | "elementary4"   // 초등 4학년 (새싹 모드)
  | "elementary5"   // 초등 5학년
  | "elementary6"   // 초등 6학년
  | "middle1"       // 중1
  | "middle2"       // 중2
  | "middle3"       // 중3
  | "high1"         // 고1
  | "high2"         // 고2
  | "high3";        // 고3

export type InterestField =
  | "it"
  | "art"
  | "medical"
  | "business"
  | "education";

export interface Child {
  id: UUID;
  family_id: UUID;                     // 소속 가족 그룹
  created_by: UUID;                    // 프로필 생성자 (메인 계정만 가능)
  name: string;                        // 자녀 이름
  grade: Grade;
  interests: InterestField[];          // Supabase에서 JSONB로 저장
  avatar_emoji: string;                // 프로필 이모지 (예: "🐻")
  created_at: ISODateString;
  updated_at: ISODateString;
}

// ============================================================
// [7] 권한 맵 — 역할별 접근 가능 기능 정의
// 실제 코드에서 isAllowed(role, action) 형태로 사용
// ============================================================

export type FamilyAction =
  | "manage_subscription"    // 구독 관리
  | "create_child"           // 자녀 프로필 생성
  | "edit_child"             // 자녀 정보 수정
  | "delete_child"           // 자녀 프로필 삭제
  | "invite_co_parent"       // 공동 양육자 초대
  | "remove_co_parent"       // 공동 양육자 제거
  | "view_report"            // 리포트 조회
  | "view_roadmap"           // 로드맵 조회
  | "edit_roadmap"           // 로드맵 수정
  | "view_member_info";      // 상대방 계정 정보 조회 (항상 false)

/**
 * 역할별 허용 액션 테이블
 *
 * co-parent는 조회만 가능, 개인정보 접근 불가
 */
export const ROLE_PERMISSIONS: Record<FamilyRole, FamilyAction[]> = {
  main: [
    "manage_subscription",
    "create_child",
    "edit_child",
    "delete_child",
    "invite_co_parent",
    "remove_co_parent",
    "view_report",
    "view_roadmap",
    "edit_roadmap",
    // "view_member_info" ← 의도적으로 제외 (서로 계정 정보 비공개)
  ],
  "co-parent": [
    "view_report",
    "view_roadmap",
    // 나머지 모두 제한
  ],
};

/**
 * 권한 체크 헬퍼 함수
 * 사용 예: isAllowed("co-parent", "view_report") → true
 */
export function isAllowed(role: FamilyRole, action: FamilyAction): boolean {
  return ROLE_PERMISSIONS[role].includes(action);
}

// ============================================================
// [8] 복합 타입 (프론트엔드 화면용)
// ============================================================

/** 홈/리포트 화면에서 한 번에 필요한 자녀 + 가족 정보 */
export interface ChildWithFamily {
  child: Child;
  family: Family;
  myRole: FamilyRole;                  // 현재 로그인한 사람의 역할
  coParentExists: boolean;             // 공동 양육자 연결 여부
  // [주의] 공동 양육자의 개인정보(이름, 이메일)는 포함하지 않음
}

/** 가족 설정 페이지에서 필요한 정보 */
export interface FamilySettings {
  family: Family;
  members: Array<{
    member: FamilyMember;
    // display_name만 공개 (이메일, 전화번호 등 비공개)
    display_name: string;
    avatar_url: string | null;
  }>;
  children: Child[];
  pendingInvitations: Invitation[];    // 아직 수락 안 된 초대
}
