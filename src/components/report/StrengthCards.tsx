// ====================================================
// 발견된 강점 카드 2개 (가로 나열)
// ====================================================

import type { Strength } from "@/types/report";

interface StrengthCardsProps {
  strengths: Strength[];
}

export default function StrengthCards({ strengths }: StrengthCardsProps) {
  return (
    <div>
      <h2 className="text-sm font-bold text-base-text mb-3">
        이번 주 발견된 강점
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {strengths.map((s) => (
          <div
            key={s.title}
            className="rounded-card border border-brand-red p-3.5 flex flex-col gap-2"
            style={{ backgroundColor: "#FFF0EB" }}
          >
            <span className="text-2xl leading-none">{s.emoji}</span>
            <p className="text-sm font-bold text-brand-red">{s.title}</p>
            <p className="text-xs text-base-muted leading-snug">
              {s.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
