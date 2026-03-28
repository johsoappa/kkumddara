"use client";

// ====================================================
// 명따라 추천 직업군 카드 3개
// - 클릭 시 해당 직업 상세 (/explore/[id])로 이동
// ====================================================

import { useRouter } from "next/navigation";
import type { CareerRecommendation } from "@/types/myeonddara";

const RANK_LABEL = ["1위", "2위", "3위"];
const RANK_COLOR = ["#E84B2E", "#FF7043", "#FFA270"];

interface RecommendedCareersProps {
  careers: CareerRecommendation[];
}

export default function RecommendedCareers({ careers }: RecommendedCareersProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-card-lg shadow-card p-5">
      <h2 className="text-sm font-bold text-base-text mb-4">
        명따라 추천 직업군
      </h2>

      <div className="flex flex-col gap-3">
        {careers.map((c, idx) => (
          <button
            key={c.rank}
            onClick={() => router.push(`/explore/${c.occupationId}`)}
            className="
              flex items-center gap-3 text-left w-full
              p-3.5 rounded-card border-2 border-base-border
              hover:border-brand-red active:border-brand-red
              transition-colors
            "
          >
            {/* 순위 뱃지 */}
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center
                         text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: RANK_COLOR[idx] }}
            >
              {RANK_LABEL[idx]}
            </span>

            {/* 이모지 */}
            <span className="text-2xl leading-none flex-shrink-0">{c.emoji}</span>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-base-text">{c.name}</p>
              <p className="text-xs text-base-muted mt-0.5 leading-snug">
                {c.reason}
              </p>
            </div>

            {/* 적합도 */}
            <span className="text-sm font-bold text-brand-red flex-shrink-0">
              {c.fitScore}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
