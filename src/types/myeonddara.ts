// ====================================================
// 명따라 타입 정의
// [Supabase 연동 후] 사주 분석 테이블 스키마와 동일하게 유지
// ====================================================

export type Gender = "male" | "female";

export type CalendarType = "양력" | "음력" | "윤달";

export type BirthTime =
  | "ja"      // 자시 23~01시
  | "chuk"    // 축시 01~03시
  | "in"      // 인시 03~05시
  | "myo"     // 묘시 05~07시
  | "jin"     // 진시 07~09시
  | "sa"      // 사시 09~11시
  | "o"       // 오시 11~13시
  | "mi"      // 미시 13~15시
  | "sin"     // 신시 15~17시
  | "yu"      // 유시 17~19시
  | "sul"     // 술시 19~21시
  | "hae"     // 해시 21~23시
  | "unknown"; // 모름

export interface SajuInputData {
  name: string;
  birthDate: string;     // "YYYY-MM-DD"
  birthTime: BirthTime;
  gender: Gender | null;
  calendarType: CalendarType;
}

export interface SajuPillar {
  label: string;   // "年柱"
  hanja: string;   // "甲午"
  korean: string;  // "갑오"
}

export interface OhaengElement {
  name: string;     // "수(水)"
  emoji: string;    // "🌊"
  percent: number;  // 0-100
  strength: string; // "강함" | "보통" | "약함" | "부족" | "없음"
  color: string;    // hex color
}

export interface CareerRecommendation {
  rank: number;
  emoji: string;
  name: string;
  occupationId: string; // /explore/[id] 연동용
  reason: string;
  fitScore: number;
}

export interface SajuResult {
  pillars: SajuPillar[];
  ohaeng: OhaengElement[];
  ohaengSummary: string;
  personalityTags: string[];
  personalityDesc: string;
  careers: CareerRecommendation[];
  fortune: string;
  topOccupationId: string; // 로드맵 바로 시작 연동용
}

// 태어난 시간 표시용 라벨
export const BIRTH_TIME_LABEL: Record<BirthTime, string> = {
  ja:      "자시 (23~01시)",
  chuk:    "축시 (01~03시)",
  in:      "인시 (03~05시)",
  myo:     "묘시 (05~07시)",
  jin:     "진시 (07~09시)",
  sa:      "사시 (09~11시)",
  o:       "오시 (11~13시)",
  mi:      "미시 (13~15시)",
  sin:     "신시 (15~17시)",
  yu:      "유시 (17~19시)",
  sul:     "술시 (19~21시)",
  hae:     "해시 (21~23시)",
  unknown: "시간 미상",
};
