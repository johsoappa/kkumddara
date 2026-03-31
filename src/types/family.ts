// ====================================================
// 꿈따라 — 도메인 타입 정의 (002_mvp_refactor 기준)
// ====================================================

export type Grade =
  | "elementary3" | "elementary4" | "elementary5" | "elementary6"
  | "middle1" | "middle2" | "middle3"
  | "high1" | "high2" | "high3";

export type InterestField = "it" | "art" | "medical" | "business" | "education";

export type UserRole = "parent" | "student";

export type PlanName = "free" | "basic" | "pro";

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
