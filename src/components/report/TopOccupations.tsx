// ====================================================
// 관심 직업 Top 3 바 그래프
// 외부 차트 라이브러리 없이 Tailwind CSS로 직접 구현
// ====================================================

import type { TopOccupation } from "@/types/report";

interface TopOccupationsProps {
  occupations: TopOccupation[];
}

const RANK_COLORS = ["text-yellow-500", "text-gray-400", "text-amber-700"];
const RANK_LABELS = ["1위", "2위", "3위"];

export default function TopOccupations({ occupations }: TopOccupationsProps) {
  return (
    <div className="card">
      <h2 className="text-sm font-bold text-base-text mb-4">관심 직업 Top 3</h2>
      <div className="flex flex-col gap-4">
        {occupations.map((occ, idx) => (
          <div key={occ.name}>
            {/* 직업명 + 순위 + 점수 */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${RANK_COLORS[idx]}`}>
                  {RANK_LABELS[idx]}
                </span>
                <span className="text-base leading-none">{occ.emoji}</span>
                <span className="text-sm font-semibold text-base-text">
                  {occ.name}
                </span>
              </div>
            </div>
            {/* 바 그래프 */}
            <div className="h-2.5 bg-base-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${occ.score}%`,
                  background: "linear-gradient(90deg, #E84B2E, #FF7043)",
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
