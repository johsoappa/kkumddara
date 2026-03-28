// ====================================================
// 로드맵 관련 타입 정의
// ====================================================

export type StageStatus = "current" | "next" | "future";

export interface Mission {
  id: string;
  text: string;
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
