"use client";

// ====================================================
// OccupationTraitSection — "이 일을 할 때 자주 쓰는 힘"
//
// 직업별 핵심 역량을 아이 눈높이로 보여주는 섹션.
// 프론트 정적 seed(occupationTraitSeed.ts) 기반 — DB/API 호출 없음.
//
// [표시 조건]
//   occupationId가 OCCUPATION_TRAIT_SEED에 있고 traits 1개 이상 → 표시
//   없으면 아무것도 렌더하지 않음(섹션 미노출)
//
// [문구 원칙]
//   "자주 쓰는 힘" 톤 유지. 직업 강요/단정 표현 금지.
// ====================================================

import { getOccupationTraits } from "@/data/occupationTraitSeed";

interface OccupationTraitSectionProps {
  occupationId: string;
}

export default function OccupationTraitSection({ occupationId }: OccupationTraitSectionProps) {
  const traitSet = getOccupationTraits(occupationId);
  if (!traitSet || traitSet.traits.length === 0) return null;

  return (
    <section className="card" aria-label="이 일을 할 때 자주 쓰는 힘">
      <h3 className="text-sm font-bold text-base-text mb-1">이 일을 할 때 자주 쓰는 힘</h3>
      <p className="text-[11px] text-base-muted mb-3 leading-relaxed">
        이 직업을 이해할 때 함께 살펴볼 수 있는 힘이에요. 아이가 어떤 활동에 흥미를 보이는지 가볍게 비교해 보세요.
      </p>

      <div className="flex flex-col gap-2.5">
        {traitSet.traits.map((t) => (
          <div key={t.traitCode} className="rounded-lg bg-base-card px-4 py-3">
            <p className="text-sm font-bold text-base-text">{t.displayName}</p>
            <p className="text-xs text-base-text mt-1 leading-relaxed">{t.childDescription}</p>
            <p className="text-[11px] text-base-muted mt-1.5 leading-relaxed">
              부모님은 {t.parentNote}
            </p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-base-muted mt-3 leading-relaxed">
        💡 이 힘이 없으면 안 된다는 뜻이 아니라, 이 일을 할 때 자주 쓰이는 힘이에요.
      </p>
    </section>
  );
}
