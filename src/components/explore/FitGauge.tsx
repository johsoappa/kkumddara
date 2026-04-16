// ====================================================
// 직업 적합 뱃지 — 정성 라벨 (수치 미표시)
// fitScore 수치는 내부 순서 기준으로만 사용
// ====================================================

interface FitGaugeProps {
  score: number;  // 0-100 (화면에 수치 미표시, 라벨 분기 기준만 사용)
  size?: number;  // 호환성 유지용 (대형 카드에서 isLarge 분기)
}

function getFitLabel(score: number): { text: string; emoji: string } {
  if (score >= 80) return { text: "잘 맞는 직업이에요", emoji: "⭐" };
  if (score >= 70) return { text: "추천 직업이에요",    emoji: "✨" };
  return              { text: "관심을 가져볼 만해요", emoji: "💡" };
}

export default function FitGauge({ score, size = 52 }: FitGaugeProps) {
  const isLarge = size > 60;
  const { text, emoji } = getFitLabel(score);

  return (
    <div
      className="flex items-center gap-1 rounded-full"
      style={{
        backgroundColor: "#FFF0EB",
        padding: isLarge ? "6px 14px" : "3px 8px",
      }}
    >
      <span style={{ fontSize: isLarge ? "14px" : "10px" }}>{emoji}</span>
      <span
        className="font-semibold text-brand-red whitespace-nowrap"
        style={{ fontSize: isLarge ? "13px" : "10px" }}
      >
        {text}
      </span>
    </div>
  );
}
