// ====================================================
// 직업 관련 타입 정의
// ====================================================

export type CategoryFilter =
  | "전체"
  | "IT·기술"
  | "의료·과학"
  | "예술·디자인"
  | "교육·사회"
  | "비즈니스·경영"
  | "콘텐츠·미디어"
  | "공공·안전"
  | "환경·미래산업";

export type OccupationCategory = Exclude<CategoryFilter, "전체">;

export interface RelatedMajor {
  name: string;
  universities: string[];
}

export interface Occupation {
  id: string;
  name: string;
  emoji: string;
  category: OccupationCategory;
  description: string;
  fitScore: number;         // 0-100
  relatedMajors: RelatedMajor[];
  skills: string[];
  salaryMin: number;        // 단위: 만원
  salaryMax: number;        // 단위: 만원
  growthRate: number;       // 연간 성장률 %
  futureRating: number;     // 미래 유망도 1-5
  preparations: string[];   // 지금 할 수 있는 준비 3-5개
}

// ── /explore 리스트용 경량 타입 ──────────────────────────
// occupation_master + occupation_summary(one_liner) DB 조회 결과
// Occupation 전체 구조가 아닌 카드 렌더링에 필요한 필드만 포함
export interface OccupationListItem {
  id:           string;             // occupation_master.slug (URL 식별자)
  name:         string;             // occupation_master.name_ko
  emoji:        string;             // occupation_master.emoji
  category:     OccupationCategory; // occupation_master.category
  description:  string;             // occupation_summary.content (one_liner)
  relatedMajors: Array<{ name: string }>; // [추후 DB 연결] 현재 빈 배열
  skills:       string[];           // occupation_master.interest_fields
}
