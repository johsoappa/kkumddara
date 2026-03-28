// ====================================================
// 오행 에너지 분석 바 차트
// 외부 라이브러리 없이 Tailwind + inline style로 구현
// ====================================================

import type { OhaengElement } from "@/types/myeonddara";

interface OhaengChartProps {
  elements: OhaengElement[];
  summary: string;
}

export default function OhaengChart({ elements, summary }: OhaengChartProps) {
  return (
    <div className="bg-white rounded-card-lg shadow-card p-5">
      <h2 className="text-sm font-bold text-base-text mb-4">오행 에너지 분석</h2>

      <div className="flex flex-col gap-3 mb-4">
        {elements.map((el) => (
          <div key={el.name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-base leading-none">{el.emoji}</span>
                <span className="text-sm font-semibold text-base-text">{el.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-base-muted">{el.strength}</span>
                <span className="text-xs font-bold" style={{ color: el.color }}>
                  {el.percent}%
                </span>
              </div>
            </div>
            <div className="h-2.5 bg-base-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${el.percent}%`,
                  backgroundColor: el.color,
                  transition: "width 0.6s ease",
                  minWidth: el.percent > 0 ? "4px" : "0",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 핵심 분석 문구 */}
      <div
        className="rounded-card p-3.5 border-l-4"
        style={{ backgroundColor: "#EBF5FF", borderColor: "#2196F3" }}
      >
        <p className="text-sm text-base-text leading-relaxed">{summary}</p>
      </div>
    </div>
  );
}
