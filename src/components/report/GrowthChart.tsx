// ====================================================
// 최근 4주 성장 추이 바 차트
// 외부 라이브러리 없이 Tailwind CSS로 직접 구현
// ====================================================

import type { WeekData } from "@/types/report";

interface GrowthChartProps {
  data: WeekData[];
}

export default function GrowthChart({ data }: GrowthChartProps) {
  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const growth = last && prev ? last.rate - prev.rate : 0;
  const maxRate = Math.max(...data.map((d) => d.rate), 1);

  return (
    <div className="card">
      <h2 className="text-sm font-bold text-base-text mb-4">최근 4주 성장 추이</h2>

      {/* 바 차트 */}
      <div className="flex items-end justify-between gap-2 h-28 mb-3">
        {data.map((d, idx) => {
          const isLast = idx === data.length - 1;
          const barHeight = (d.rate / maxRate) * 100;
          return (
            <div
              key={d.label}
              className="flex flex-col items-center gap-1.5 flex-1"
            >
              {/* 퍼센트 레이블 */}
              <span className="text-[10px] font-semibold text-base-muted">
                {d.rate}%
              </span>
              {/* 바 */}
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${barHeight}%`,
                  background: isLast
                    ? "linear-gradient(180deg, #E84B2E, #FF7043)"
                    : "#FFCBB8",
                  transition: "height 0.6s ease",
                  minHeight: "4px",
                }}
              />
              {/* 주차 레이블 */}
              <span
                className={`text-[10px] font-medium ${
                  isLast ? "text-brand-red font-bold" : "text-base-muted"
                }`}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 성장 메시지 */}
      {growth > 0 && (
        <p className="text-xs font-semibold text-status-success text-center">
          지난주보다 {growth}% 성장했어요! 📈
        </p>
      )}
      {growth === 0 && (
        <p className="text-xs font-semibold text-base-muted text-center">
          지난주와 동일해요. 꾸준히 이어가요! 💪
        </p>
      )}
    </div>
  );
}
