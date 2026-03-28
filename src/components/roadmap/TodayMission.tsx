"use client";

// ====================================================
// 오늘의 미션 고정 하단 박스
// - CURRENT 단계의 첫 번째 미완료 미션 표시
// - "완료했어요!" 클릭 → 해당 미션 체크
// - 모든 미션 완료 시 축하 메시지 표시
// ====================================================

interface TodayMissionProps {
  missionText: string | null;   // null → 모든 미션 완료 상태
  onComplete: () => void;
}

export default function TodayMission({
  missionText,
  onComplete,
}: TodayMissionProps) {
  return (
    /* BottomNav(약 68px) 바로 위에 고정 */
    <div
      className="
        fixed left-1/2 -translate-x-1/2
        w-full max-w-mobile
        px-4 z-40
      "
      style={{ bottom: "72px" }}
    >
      <div
        className="
          bg-brand-light rounded-xl px-4 py-3
          shadow-card border border-brand-soft/30
        "
      >
        <p className="text-xs font-bold text-brand-orange mb-1.5">
          🎯 오늘의 미션
        </p>

        {missionText ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-base-text flex-1 leading-snug">
              {missionText}
            </p>
            <button
              onClick={onComplete}
              className="
                flex-shrink-0
                bg-brand-red text-white
                text-xs font-bold
                px-3 py-2 rounded-button
                whitespace-nowrap
                active:opacity-80 transition-opacity
              "
            >
              완료했어요!
            </button>
          </div>
        ) : (
          <p className="text-sm font-semibold text-status-success">
            🎉 오늘 모든 미션을 완료했어요!
          </p>
        )}
      </div>
    </div>
  );
}
