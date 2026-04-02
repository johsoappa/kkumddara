// ====================================================
// 꿈따라 — 도메인 타입 정의 (002_mvp_refactor 기준)
// ====================================================

export type Grade =
  | "elementary3" | "elementary4" | "elementary5" | "elementary6"
  | "middle1" | "middle2" | "middle3"
  | "high1" | "high2" | "high3";

export type InterestField = "it" | "art" | "medical" | "business" | "education";

export type UserRole = "parent" | "student";

export type PlanName = "basic" | "premium" | "family" | "family_plus";

// ────────────────────────────────────────────────────────────
// Parent — 학부모 프로필
// ────────────────────────────────────────────────────────────
export interface Parent {
  id:                string;
  user_id:           string;
  display_name:      string | null;
  phone_number:      string | null;
  onboarding_status: "pending" | "child_creation" | "completed";
  created_at:        string;
  updated_at:        string;
}

// ────────────────────────────────────────────────────────────
// Child — 자녀 도메인 프로필
// ────────────────────────────────────────────────────────────
export interface Child {
  id:             string;
  parent_id:      string;
  name:           string;
  birth_year:     number | null;
  school_grade:   Grade | null;
  interests:      InterestField[];
  avatar_emoji:   string;
  profile_status: "active" | "inactive";
  invite_code:    string | null;
  created_at:     string;
  updated_at:     string;
}

// ────────────────────────────────────────────────────────────
// Student — 학생 계정 프로필
// ────────────────────────────────────────────────────────────
export interface Student {
  id:                string;
  user_id:           string;
  child_id:          string | null;
  nickname:          string | null;
  onboarding_status: "pending" | "child_linking" | "completed";
  created_at:        string;
  updated_at:        string;
}

// ────────────────────────────────────────────────────────────
// SubscriptionPlan — parent 단위 구독 플랜
// ────────────────────────────────────────────────────────────
export interface SubscriptionPlan {
  id:          string;
  parent_id:   string;
  plan_name:   PlanName;
  child_limit: number;
  status:      "active" | "expired" | "cancelled";
  expires_at:  string | null;
  created_at:  string;
  updated_at:  string;
}

// ────────────────────────────────────────────────────────────
// PlanEntitlement — 플랜별 기능 허용 범위 (중앙화된 단일 기준)
//
// [설계 원칙]
//   - DB subscription_plan.child_limit 이 최종 source of truth
//   - 이 상수는 클라이언트 조기 검증 / UI 잠금 / 에러 메시지용
//   - 플랜 정책 변경 시 이 파일 한 곳만 수정
// ────────────────────────────────────────────────────────────
export interface PlanEntitlement {
  maxChildren:       number;  // 등록 가능한 최대 자녀 수
  maxCoParents:      number;  // 공동 양육자 초대 한도
  hasMyeonddara:     boolean; // 명따라 AI 사주 분석
  hasAiConsulting:   boolean; // AI 진로 상담
  hasAdvancedReport: boolean; // 심층 주간 리포트
}

export const PLAN_ENTITLEMENTS: Record<PlanName, PlanEntitlement> = {
  // 베이직: 입문 플랜 — 핵심 기능만 제공
  basic: {
    maxChildren:       1,
    maxCoParents:      0,
    hasMyeonddara:     false,
    hasAiConsulting:   false,
    hasAdvancedReport: false,
  },
  // 프리미엄: 단일 자녀 + 심층 기능 전체 제공
  premium: {
    maxChildren:       1,
    maxCoParents:      1,
    hasMyeonddara:     true,
    hasAiConsulting:   true,
    hasAdvancedReport: true,
  },
  // 패밀리: 자녀 2명 + 공동 양육자 1명
  family: {
    maxChildren:       2,
    maxCoParents:      1,
    hasMyeonddara:     true,
    hasAiConsulting:   true,
    hasAdvancedReport: true,
  },
  // 패밀리+: 자녀 3명 이상 (DB child_limit이 실제 상한 결정) + 공동 양육자 1명
  family_plus: {
    maxChildren:       5,
    maxCoParents:      1,
    hasMyeonddara:     true,
    hasAiConsulting:   true,
    hasAdvancedReport: true,
  },
};

/** UI 표시용 한글 플랜 라벨 */
export const PLAN_LABEL: Record<PlanName, string> = {
  basic:       "베이직",
  premium:     "프리미엄",
  family:      "패밀리",
  family_plus: "패밀리+",
};

// ────────────────────────────────────────────────────────────
// 편의 상수
// ────────────────────────────────────────────────────────────
export const GRADE_LABEL: Record<Grade, string> = {
  elementary3: "초3",
  elementary4: "초4",
  elementary5: "초5",
  elementary6: "초6",
  middle1:     "중1",
  middle2:     "중2",
  middle3:     "중3",
  high1:       "고1",
  high2:       "고2",
  high3:       "고3",
};

export const INTEREST_LABEL: Record<InterestField, string> = {
  it:        "IT·기술",
  art:       "예술·디자인",
  medical:   "의료·과학",
  business:  "비즈니스",
  education: "교육·사회",
};

export const SPROUT_GRADES = new Set<Grade>(["elementary3", "elementary4"]);

/** DB INSERT/UPDATE 전 런타임 grade 검증용 허용 목록 */
export const VALID_GRADES: readonly Grade[] = [
  "elementary3", "elementary4", "elementary5", "elementary6",
  "middle1", "middle2", "middle3",
  "high1", "high2", "high3",
] as const;
