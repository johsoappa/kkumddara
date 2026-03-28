"use client";

// ====================================================
// 로드맵 단계 카드
// current  → 초록 보더 + "진행중" 뱃지 (활성)
// next     → 파란 보더 + "다음 단계" 뱃지 (opacity 50)
// future   → 회색 보더 + 자물쇠 아이콘 (opacity 40)
// ====================================================

import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoadmapStage as RoadmapStageType } from "@/types/roadmap";
import MissionItem from "./MissionItem";

interface StageConfig {
  badge: string;
  badgeStyle: React.CSSProperties;
  borderClass: string;
  headerClass: string;
}

const STAGE_CONFIG: Record<string, StageConfig> = {
  current: {
    badge: "진행중",
    badgeStyle: { backgroundColor: "#4CAF50", color: "#fff" },
    borderClass: "border-status-success",
    headerClass: "bg-green-50",
  },
  next: {
    badge: "다음 단계",
    badgeStyle: { backgroundColor: "#2196F3", color: "#fff" },
    borderClass: "border-blue-400",
    headerClass: "bg-blue-50",
  },
  future: {
    badge: "미래 단계",
    badgeStyle: { backgroundColor: "#9E9E9E", color: "#fff" },
    borderClass: "border-base-border",
    headerClass: "bg-base-card",
  },
};

interface RoadmapStageProps {
  stage: RoadmapStageType;
  completedMissions: Set<string>;
  onToggle: (id: string) => void;
}

export default function RoadmapStage({
  stage,
  completedMissions,
  onToggle,
}: RoadmapStageProps) {
  const config = STAGE_CONFIG[stage.status];
  const isCurrent = stage.status === "current";
  const isNext    = stage.status === "next";
  const isFuture  = stage.status === "future";

  const completedCount = stage.missions.filter((m) =>
    completedMissions.has(m.id)
  ).length;
  const totalCount = stage.missions.length;

  return (
    <div
      className={cn(
        "rounded-card-lg border-2 overflow-hidden bg-white transition-opacity duration-300",
        config.borderClass,
        isNext   && "opacity-50",
        isFuture && "opacity-40"
      )}
    >
      {/* ---- 단계 헤더 ---- */}
      <div
        className={cn(
          "px-4 py-3 flex items-center justify-between",
          config.headerClass
        )}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={config.badgeStyle}
          >
            {config.badge}
          </span>
          <h3 className="text-sm font-bold text-base-text">{stage.title}</h3>
        </div>
        {totalCount > 0 && (
          <span className="text-xs text-base-muted font-medium">
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      {/* ---- 단계 본문 ---- */}
      <div className="px-4 py-4">
        {isFuture ? (
          /* FUTURE: 자물쇠 잠금 표시 */
          <div className="flex flex-col items-center py-6 gap-2">
            <Lock size={28} className="text-base-muted" />
            <p className="text-sm text-base-muted text-center">
              NEXT 단계 완료 후 공개됩니다
            </p>
          </div>
        ) : (
          /* CURRENT / NEXT: 미션 리스트 */
          <div className="flex flex-col gap-3">
            {stage.missions.map((mission) => (
              <MissionItem
                key={mission.id}
                mission={mission}
                completed={completedMissions.has(mission.id)}
                disabled={isNext}
                onToggle={onToggle}
              />
            ))}
            {isNext && (
              <p className="text-xs text-blue-400 mt-1">
                CURRENT 완료 후 해제됩니다
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
