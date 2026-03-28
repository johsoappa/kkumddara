// ====================================================
// 직업 카드 스켈레톤 로딩 UI
// ====================================================

export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-card border-2 border-base-border p-4 flex items-center gap-3 animate-pulse">
      {/* 이모지 자리 */}
      <div className="w-12 h-12 bg-base-card rounded-full flex-shrink-0" />

      {/* 텍스트 자리 */}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-base-card rounded w-1/3" />
        <div className="h-3 bg-base-card rounded w-2/3" />
        <div className="flex gap-1.5 mt-1">
          <div className="h-4 bg-base-card rounded-full w-20" />
          <div className="h-4 bg-base-card rounded-full w-20" />
        </div>
      </div>

      {/* 게이지 자리 */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        <div className="w-[52px] h-[52px] bg-base-card rounded-full" />
        <div className="w-8 h-4 bg-base-card rounded-full" />
      </div>
    </div>
  );
}
