// ====================================================
// 새싹 모드 타입 정의
// 대상: 초3~4학년 (10~11세)
// 포인트 컬러: #4CAF50 (그린)
// ====================================================

/** 흥미 분야 */
export type SproutInterest =
  | "crafting"   // 만들기/그리기
  | "reading"    // 읽기/쓰기
  | "science"    // 실험/탐구
  | "music"      // 음악/공연
  | "sports"     // 운동/활동
  | "social";    // 친구/돕기

/** 흥미 선택지 UI 데이터 */
export interface SproutInterestOption {
  value: SproutInterest;
  emoji: string;
  label: string;
}

/** 개별 미션 */
export interface SproutMission {
  id: string;
  text: string;
  duration: string;              // "5분", "10분"
  difficulty: "🌱 쉬움" | "🌿 보통";
}

/** 미션 단계 */
export interface SproutMissionStage {
  id: string;
  status: "current" | "next" | "future";
  title: string;
  missions: SproutMission[];
}

/** 직업 카드 */
export interface SproutJob {
  id: string;
  emoji: string;
  name: string;
  desc1: string;               // 첫 번째 설명줄 (카드 + 모달)
  desc2: string;               // 두 번째 설명줄
  relatedInterests: SproutInterest[];
  skills?: string[];           // 필요 역량 태그
  activities?: string[];       // 추천 체험 활동
}

/** 오늘의 탐색 카드 데이터 */
export interface SproutTodayExplore {
  emoji: string;
  topic: string;
  desc: string;
}

/** 부모 리포트 데이터 */
export interface SproutReportData {
  childName: string;
  exploredCount: number;
  completedMissions: number;
  streakDays: number;
  discoveredInterests: SproutInterest[];
  parentComment: string;
  recommendedActivities: { emoji: string; text: string }[];
}
