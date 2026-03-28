"use client";

// ====================================================
// 미션 체크박스 아이템
// completed: 취소선 + 초록 체크
// disabled:  회색 처리 (클릭 불가)
// ====================================================

import { cn } from "@/lib/utils";
import type { Mission } from "@/types/roadmap";

interface MissionItemProps {
  mission: Mission;
  completed: boolean;
  disabled?: boolean;
  onToggle: (id: string) => void;
}

export default function MissionItem({
  mission,
  completed,
  disabled = false,
  onToggle,
}: MissionItemProps) {
  return (
    <button
      onClick={() => !disabled && onToggle(mission.id)}
      disabled={disabled}
      className="flex items-center gap-3 text-left w-full group"
    >
      {/* 체크박스 */}
      <span
        className={cn(
          "w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center",
          "transition-all duration-200",
          completed
            ? "bg-status-success border-status-success scale-95"
            : disabled
            ? "border-base-border bg-base-card"
            : "border-base-border group-hover:border-brand-red"
        )}
      >
        {completed && (
          <span className="text-white text-[10px] font-bold leading-none">
            ✓
          </span>
        )}
      </span>

      {/* 미션 텍스트 */}
      <span
        className={cn(
          "text-sm transition-colors duration-200",
          completed
            ? "text-base-muted line-through"
            : disabled
            ? "text-base-muted"
            : "text-base-text"
        )}
      >
        {mission.text}
      </span>
    </button>
  );
}
