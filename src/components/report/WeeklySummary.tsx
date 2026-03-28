// ====================================================
// 주간 요약 카드 3개 (탐색 직업 수 / 미션 완료율 / 연속 학습일)
// ====================================================

interface WeeklySummaryProps {
  exploredCount: number;
  missionRate: number; // 0-100
  streakDays: number;
}

interface SummaryCardProps {
  icon: string;
  value: string;
  label: string;
}

function SummaryCard({ icon, value, label }: SummaryCardProps) {
  return (
    <div className="flex-1 bg-white rounded-card shadow-card p-3 flex flex-col items-center gap-1 min-w-0">
      <span className="text-xl leading-none">{icon}</span>
      <p className="text-xl font-bold text-brand-red leading-none mt-0.5">{value}</p>
      <p className="text-[11px] text-base-muted text-center leading-tight">{label}</p>
    </div>
  );
}

export default function WeeklySummary({
  exploredCount,
  missionRate,
  streakDays,
}: WeeklySummaryProps) {
  return (
    <div className="flex gap-3">
      <SummaryCard
        icon="🔍"
        value={`${exploredCount}개`}
        label="이번 주 탐색"
      />
      <SummaryCard
        icon="✅"
        value={`${missionRate}%`}
        label="미션 달성률"
      />
      <SummaryCard
        icon="🔥"
        value={`${streakDays}일`}
        label="연속 학습"
      />
    </div>
  );
}
