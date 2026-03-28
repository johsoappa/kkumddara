// ====================================================
// 오늘의 진로 운세 카드 (딥블루 배경)
// ====================================================

interface FortuneCardProps {
  fortune: string;
}

export default function FortuneCard({ fortune }: FortuneCardProps) {
  return (
    <div
      className="rounded-card-lg p-5 text-center"
      style={{
        background: "linear-gradient(135deg, #1A3A6B, #2C5F8A)",
      }}
    >
      <p className="text-xs font-semibold text-white/70 mb-2 tracking-wide">
        ✨ 오늘의 진로 운세
      </p>
      <p className="text-sm font-medium text-white leading-relaxed">
        {fortune}
      </p>
    </div>
  );
}
