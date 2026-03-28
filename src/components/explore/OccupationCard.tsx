"use client";

// ====================================================
// 직업 카드 컴포넌트
// 클릭 → 직업 상세 페이지 이동
// 하트 → 찜 토글 (stopPropagation으로 카드 클릭 차단)
// ====================================================

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Occupation } from "@/types/occupation";
import FitGauge from "./FitGauge";

interface OccupationCardProps {
  occupation: Occupation;
  liked: boolean;
  onLikeToggle: (id: string) => void;
}

export default function OccupationCard({
  occupation,
  liked,
  onLikeToggle,
}: OccupationCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/explore/${occupation.id}`)}
      className={cn(
        "bg-white rounded-card border-2 p-4 flex items-center gap-3",
        "cursor-pointer transition-all active:scale-[0.98]",
        liked ? "border-brand-red" : "border-base-border"
      )}
    >
      {/* 왼쪽: 이모지 */}
      <span className="text-4xl flex-shrink-0 leading-none">
        {occupation.emoji}
      </span>

      {/* 중앙: 직업 정보 */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-base-text leading-tight">
          {occupation.name}
        </h3>
        <p className="text-xs text-base-muted mt-0.5 line-clamp-1">
          {occupation.description}
        </p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {occupation.relatedMajors.slice(0, 2).map((major) => (
            <span
              key={major.name}
              className="text-[10px] bg-base-card text-base-muted px-2 py-0.5 rounded-full"
            >
              {major.name}
            </span>
          ))}
        </div>
      </div>

      {/* 오른쪽: 적합도 게이지 + 하트 */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        <FitGauge score={occupation.fitScore} size={52} />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLikeToggle(occupation.id);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-base-off transition-colors"
          aria-label={liked ? "찜 해제" : "찜하기"}
        >
          <Heart
            size={17}
            className={cn(
              "transition-colors",
              liked ? "fill-brand-red text-brand-red" : "text-base-muted"
            )}
          />
        </button>
      </div>
    </div>
  );
}
