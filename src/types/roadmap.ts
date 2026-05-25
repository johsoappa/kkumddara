// ====================================================
// 로드맵 관련 타입 정의
// ====================================================

export type StageStatus = "current" | "next" | "future";

export interface Mission {
  id: string;
  text: string;
  /** 주간 AI 미션에서 추가 제공되는 선택 필드 */
  description?: string;
  isWeekly?: boolean;
}

// ── 주간 AI 미션 관련 타입 ──────────────────────────────────

/** GET /api/roadmap/weekly-missions 응답 내 미션 항목 */
export interface WeeklyMissionItem {
  id: string;
  title: string;
  description?: string;
  checklist?: string[];
  parentGuide?: string;
  estimatedMinutes?: number;
  difficulty?: "easy" | "normal" | "hard";
}

/** GET /api/roadmap/weekly-missions 응답 */
export interface WeeklyMissionsResponse {
  missions: WeeklyMissionItem[];
  weekStart: string;          // "YYYY-MM-DD"
  source: "ai" | "fallback" | "static";
}

export interface RoadmapStage {
  id: string;
  status: StageStatus;
  title: string;
  missions: Mission[];
}

export interface RoadmapData {
  id: string;
  occupationId: string;
  occupationName: string;
  occupationEmoji: string;
  grade: string;           // 예: "중1"
  stages: RoadmapStage[];
}
