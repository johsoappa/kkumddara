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
