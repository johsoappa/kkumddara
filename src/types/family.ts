// ====================================================
// 꿈따라 — 도메인 타입 정의 (002_mvp_refactor 기준)
// 005_add_grade_level: GradeLevel 타입 추가
// ====================================================

export type Grade =
  | "elementary3" | "elementary4" | "elementary5" | "elementary6"
  | "middle1" | "middle2" | "middle3"
  | "high1" | "high2" | "high3";

/** 005 신규: elem_1~elem_6 / middle_1~middle_3 / high_1~high_3 */
export type GradeLevel =
  | "elem_1" | "elem_2" | "elem_3" | "elem_4" | "elem_5" | "elem_6"
  | "middle_1" | "middle_2" | "middle_3"
  | "high_1" | "high_2" | "high_3";

export type InterestField = "it" | "art" | "medical" | "business" | "education";

export type UserRole = "parent" | "student";

/** 006: free 추가, family_plus 제거 → 4종 확정 */
export type PlanName = "free" | "basic" | "family" | "premium";

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
  school_grade:   Grade | null;       // 기존 형식 (하위호환 유지)
  grade_level:    GradeLevel | null;  // 005 신규: elem_1~high_3
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
// SubscriptionPlan — parent 단위 구독 플랜 (006 업데이트)
// ────────────────────────────────────────────────────────────
export interface SubscriptionPlan {
  id:                       string;
  parent_id:                string;
  plan_name:                PlanName;
  child_limit:              number;   // 최대 자녀 수 (기존 유지, max_children 별도 생성 안 함)
  ai_consult_monthly_limit: number;   // 006 신규: 월 AI 상담 횟수 한도
  myeonddara_yearly_limit:  number;   // 006 신규: 연 명따라 분석 횟수 한도
  max_guardians:            number;   // 006 신규: 공동양육자 최대 수
  roadmap_full_access:      boolean;  // 006 신규: 로드맵 전체 공개 여부
  status:                   "active" | "expired" | "cancelled";
  expires_at:               string | null;
  created_at:               string;
  updated_at:               string;
}

// ────────────────────────────────────────────────────────────
// PlanEntitlement — 플랜별 기능 허용 범위 (중앙화된 단일 기준)
//
// [설계 원칙]
//   - DB subscription_plan 컬럼이 최종 source of truth
//   - 이 상수는 클라이언트 조기 검증 / UI 잠금 / 에러 메시지용
//   - 플랜 정책 변경 시 이 파일 + 006 마이그레이션 UPDATE 값 함께 수정
//
// [006 변경]
//   - PlanName: free 추가, family_plus 제거 → 4종 확정
//   - aiConsultMonthlyLimit / meyonddara YearlyLimit 필드 추가
//   - DB source of truth 컬럼과 1:1 대응
// ────────────────────────────────────────────────────────────
export interface PlanEntitlement {
  maxChildren:              number;  // 등록 가능한 최대 자녀 수 (= DB child_limit)
  maxGuardians:             number;  // 공동 양육자 초대 한도 (= DB max_guardians)
  aiConsultMonthlyLimit:    number;  // 월 AI 상담 횟수 (= DB ai_consult_monthly_limit)
  myeonddraYearlyLimit:     number;  // 연 명따라 분석 횟수 (= DB myeonddara_yearly_limit)
  roadmapFullAccess:        boolean; // 로드맵 전 단계 열람 (= DB roadmap_full_access)
  hasAdvancedReport:        boolean; // 심층 주간 리포트
}

// [008 변경] 명따라 횟수 기준 아이당 연 3회로 통일
//   제공 시점: 1학기(3월) · 2학기(9월) · 연말(12월)
//   basic: 0→3 / premium: 12→9 / family: 6 유지
//   child_limit: family 3→2, premium 1→3 (확정 요금제 기준)
export const PLAN_ENTITLEMENTS: Record<PlanName, PlanEntitlement> = {
  // 무료: 기본 탐색, AI 코치 메시지 월 3개 (018: 1→3), 명따라 없음
  free: {
    maxChildren:           1,
    maxGuardians:          0,
    aiConsultMonthlyLimit: 3,   // 018 최신화: 1→3
    myeonddraYearlyLimit:  0,   // 명따라 없음
    roadmapFullAccess:     false,
    hasAdvancedReport:     false,
  },
  // 베이직 (9,900원): 자녀 1명, 명따라 연 3회, AI 코치 메시지 월 30개, 보호자 2명(+1)
  basic: {
    maxChildren:           1,
    maxGuardians:          1,   // 추가 초대 1명 = 보호자 2명(부모+공동양육자)
    aiConsultMonthlyLimit: 30,  // 018 최신화: 5→30
    myeonddraYearlyLimit:  3,   // 아이 1명 × 3회
    roadmapFullAccess:     true,
    hasAdvancedReport:     false,
  },
  // 패밀리 (19,900원): 자녀 2명, 명따라 아이당 연 3회 (총 6회), AI 코치 메시지 월 60개, 보호자 2명
  family: {
    maxChildren:           2,
    maxGuardians:          1,   // 추가 초대 1명 = 보호자 2명
    aiConsultMonthlyLimit: 60,  // 018 최신화: 10→60
    myeonddraYearlyLimit:  6,   // 아이 2명 × 3회
    roadmapFullAccess:     true,
    hasAdvancedReport:     true,
  },
  // 프리미엄 (14,900원): 자녀 3명, 명따라 아이당 연 3회 (총 9회), AI 코치 메시지 월 100개, 보호자 2명
  premium: {
    maxChildren:           3,
    maxGuardians:          1,   // 추가 초대 1명 = 보호자 2명
    aiConsultMonthlyLimit: 100, // 018 최신화: 15→100
    myeonddraYearlyLimit:  9,   // 아이 3명 × 3회
    roadmapFullAccess:     true,
    hasAdvancedReport:     true,
  },
};

/** UI 표시용 한글 플랜 라벨 */
export const PLAN_LABEL: Record<PlanName, string> = {
  free:    "무료",
  basic:   "베이직",
  premium: "프리미엄",
  family:  "패밀리",
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

/** 005 신규: GradeLevel 표시 라벨 */
export const GRADE_LEVEL_LABEL: Record<GradeLevel, string> = {
  elem_1:   "초1",
  elem_2:   "초2",
  elem_3:   "초3",
  elem_4:   "초4",
  elem_5:   "초5",
  elem_6:   "초6",
  middle_1: "중1",
  middle_2: "중2",
  middle_3: "중3",
  high_1:   "고1",
  high_2:   "고2",
  high_3:   "고3",
};

/** 005 신규: grade_level → school_grade 역방향 매핑 (초1·초2 없음 → null) */
export const GRADE_LEVEL_TO_SCHOOL_GRADE: Partial<Record<GradeLevel, Grade>> = {
  elem_3:   "elementary3",
  elem_4:   "elementary4",
  elem_5:   "elementary5",
  elem_6:   "elementary6",
  middle_1: "middle1",
  middle_2: "middle2",
  middle_3: "middle3",
  high_1:   "high1",
  high_2:   "high2",
  high_3:   "high3",
};

/** DB INSERT/UPDATE 전 런타임 grade_level 검증용 */
export const VALID_GRADE_LEVELS: readonly GradeLevel[] = [
  "elem_1", "elem_2", "elem_3", "elem_4", "elem_5", "elem_6",
  "middle_1", "middle_2", "middle_3",
  "high_1", "high_2", "high_3",
] as const;

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
