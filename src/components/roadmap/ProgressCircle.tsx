// ====================================================
// 전체 진행률 원형 게이지
// FitGauge와 달리 로드맵 달성률 전용 (대형, 굵은 선)
// ====================================================

interface ProgressCircleProps {
  progress: number; // 0-100
  size?: number;    // px (기본 90)
}

export default function ProgressCircle({ progress, size = 90 }: ProgressCircleProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          style={{ display: "block" }}
        >
          {/* 배경 트랙 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E0E0E0"
            strokeWidth={strokeWidth}
          />
          {/* 진행 호 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E84B2E"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        {/* 중앙 숫자 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-brand-red leading-none">
            {progress}%
          </span>
        </div>
      </div>
      <span className="text-[11px] text-base-muted">전체 달성률</span>
    </div>
  );
}
