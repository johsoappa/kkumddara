// ====================================================
// 리포트 화면 타입 정의
// [Supabase 연동 후] 리포트 데이터 테이블 스키마와 동일하게 유지
// ====================================================

export interface TopOccupation {
  name: string;
  emoji: string;
  score: number; // 0-100
}

export interface Strength {
  emoji: string;
  title: string;
  description: string;
}

export interface WeekData {
  label: string; // "1주차", "2주차" ...
  rate: number;  // 0-100
}

export interface Activity {
  emoji: string;
  title: string;
  duration: string;
}

export interface WeakArea {
  title: string;
  description: string;
}

// 더미 데이터 전체 구조 (Supabase 연동 시 API 응답으로 교체)
export interface ReportDummyData {
  exploredCount: number;
  streakDays: number;
  topOccupations: TopOccupation[];
  strengths: Strength[];
  growthData: WeekData[];
  weakArea: WeakArea;
  activities: Activity[];
}

// 페이지에서 사용하는 미션 아이템
export interface MissionItem {
  id: string;
  text: string;
  completed: boolean;
}
