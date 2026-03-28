// ====================================================
// 원형 적합도 게이지 컴포넌트
// size prop으로 카드(소형)와 상세(대형) 모두 대응
// ====================================================

interface FitGaugeProps {
  score: number;  // 0-100
  size?: number;  // px (기본 52)
}

export default function FitGauge({ score, size = 52 }: FitGaugeProps) {
  const isLarge = size > 60;
  const strokeWidth = isLarge ? 5 : 4;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - score / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          style={{ display: "block" }}
        >
          {/* 배경 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E0E0E0"
            strokeWidth={strokeWidth}
          />
          {/* 진행 원 */}
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
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        {/* 점수 텍스트 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-bold text-brand-red ${
              isLarge ? "text-lg" : "text-[10px]"
            }`}
          >
            {score}%
          </span>
        </div>
      </div>
      <span
        className={`text-base-muted ${isLarge ? "text-sm" : "text-[10px]"}`}
      >
        {isLarge ? "나와의 적합도" : "적합도"}
      </span>
    </div>
  );
}
