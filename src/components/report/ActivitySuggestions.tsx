// ====================================================
// 이번 주 함께 해보세요 섹션
// - 부모와 자녀가 함께할 수 있는 추천 활동 2개
// ====================================================

import type { Activity } from "@/types/report";

interface ActivitySuggestionsProps {
  activities: Activity[];
}

export default function ActivitySuggestions({
  activities,
}: ActivitySuggestionsProps) {
  return (
    <div
      className="rounded-card-lg p-4"
      style={{ backgroundColor: "#FFF8F0" }}
    >
      <h2 className="text-sm font-bold text-base-text mb-3">
        이번 주 함께 해보세요 💛
      </h2>
      <div className="flex flex-col gap-3">
        {activities.map((act) => (
          <div
            key={act.title}
            className="bg-white rounded-card p-3.5 flex items-start gap-3 shadow-card"
          >
            <span className="text-2xl leading-none flex-shrink-0 mt-0.5">
              {act.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-base-text leading-snug">
                {act.title}
              </p>
              <p className="text-xs text-base-muted mt-1">
                예상 시간:{" "}
                <span className="font-semibold text-brand-orange">
                  {act.duration}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
