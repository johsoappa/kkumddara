"use client";

// ====================================================
// 로드맵 단계 카드
// current  → 초록 보더 + "진행중" 뱃지 (활성)
// next     → 파란 보더 + "다음 단계" 뱃지 (opacity 50)
// future   → 회색 보더 + 자물쇠 아이콘 (opacity 40)
//
// 주간 AI 미션 지원:
//   weeklyMissions  — 제공 시 stage.missions 대신 주간 미션 표시
//   isWeeklyLoading — true 시 "이번 주 미션을 준비하고 있어요" 표시
//   allWeeklyDone   — 모든 주간 미션 완료 시 완료 메시지 표시
// ====================================================

import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mission, RoadmapStage as RoadmapStageType, StageStatus } from "@/types/roadmap";
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
  /** 동적으로 계산된 실효 상태. stage.status(정적)가 아닌 이 값으로 렌더링 결정. */
  effectiveStatus: StageStatus;
  completedMissions: Set<string>;
  onToggle: (id: string) => void;
  /** 주간 AI 미션 목록. 제공 시 stage.missions 대신 이 미션을 표시한다. */
  weeklyMissions?: Mission[];
  /** true일 때 "이번 주 미션을 준비하고 있어요" 로딩 표시. */
  isWeeklyLoading?: boolean;
}

export default function RoadmapStage({
  stage,
  effectiveStatus,
  completedMissions,
  onToggle,
  weeklyMissions,
  isWeeklyLoading = false,
}: RoadmapStageProps) {
  const config   = STAGE_CONFIG[effectiveStatus];
  const isCurrent = effectiveStatus === "current";
  const isNext    = effectiveStatus === "next";
  const isFuture  = effectiveStatus === "future";

  // 표시할 미션 결정: 주간 미션 우선, 없으면 정적 미션
  const displayMissions: Mission[] =
    isCurrent && weeklyMissions ? weeklyMissions : stage.missions;

  const completedCount = displayMissions.filter((m) =>
    completedMissions.has(m.id)
  ).length;
  const totalCount = displayMissions.length;

  // 이번 주 미션을 모두 완료했는지 (주간 미션이 있을 때만 메시지 표시)
  const allWeeklyDone =
    isCurrent &&
    !!weeklyMissions &&
    weeklyMissions.length > 0 &&
    weeklyMissions.every((m) => completedMissions.has(m.id));

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

        {/* 진행 카운트 — 로딩 중이 아니고 미션이 있을 때만 표시 */}
        {!isWeeklyLoading && totalCount > 0 && (
          <span className="text-xs text-base-muted font-medium">
            {allWeeklyDone ? (
              <span className="text-status-success font-semibold">이번 주 완료 ✓</span>
            ) : (
              `${completedCount}/${totalCount}`
            )}
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

        ) : isWeeklyLoading ? (
          /* CURRENT: 주간 미션 생성 중 */
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-status-success border-t-transparent animate-spin" />
            <p className="text-sm text-base-muted text-center">
              이번 주 미션을 준비하고 있어요
            </p>
            <p className="text-xs text-base-muted text-center">
              아이에게 맞는 활동을 만들고 있어요 😊
            </p>
          </div>

        ) : allWeeklyDone ? (
          /* CURRENT: 이번 주 미션 전부 완료 */
          <div className="flex flex-col items-center py-5 gap-2">
            <p className="text-2xl">🎉</p>
            <p className="text-sm font-bold text-status-success text-center">
              잘했어요! 이번 주 미션을 모두 완료했어요.
            </p>
            <p className="text-xs text-base-muted text-center leading-relaxed">
              다음 미션은 다음 주에 새롭게 열려요.
              <br />
              이번 주에 배운 내용을 가족과 이야기해보세요.
            </p>
          </div>

        ) : (
          /* CURRENT / NEXT: 미션 리스트 */
          <div className="flex flex-col gap-3">
            {displayMissions.length === 0 ? (
              <p className="text-xs text-base-muted text-center py-4">
                더 알찬 미션을 준비 중이에요! 곧 업데이트될 예정이니 기대해주세요.
              </p>
            ) : (
              displayMissions.map((mission) => (
                <MissionItem
                  key={mission.id}
                  mission={mission}
                  completed={completedMissions.has(mission.id)}
                  disabled={isNext}
                  onToggle={onToggle}
                />
              ))
            )}
            {isNext && displayMissions.length > 0 && (
              <p className="text-xs text-blue-400 mt-1">
                CURRENT 완료 후 해제됩니다
              </p>
            )}
            {/* 주간 미션 안내 (current + 주간 미션 있을 때) */}
            {isCurrent && weeklyMissions && weeklyMissions.length > 0 && (
              <p className="text-xs text-base-muted mt-1 text-center">
                🗓️ 이번 주 미션이에요. 다음 주에 새 미션이 열려요.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
