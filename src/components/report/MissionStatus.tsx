// ====================================================
// 이번 주 미션 현황
// - 실제 로드맵 미션 데이터와 연동 (props로 수신)
// - 완료 / 미완료 구분 + 완료율 프로그레스 바
// ====================================================

import type { MissionItem } from "@/types/report";

interface MissionStatusProps {
  missions: MissionItem[];
}

export default function MissionStatus({ missions }: MissionStatusProps) {
  const completedCount = missions.filter((m) => m.completed).length;
  const total = missions.length;
  const rate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-base-text">이번 주 미션 현황</h2>
        <span className="text-xs font-semibold text-brand-red">
          {completedCount}/{total} 완료
        </span>
      </div>

      {/* 미션 리스트 */}
      <div className="flex flex-col gap-2.5 mb-4">
        {missions.map((m) => (
          <div key={m.id} className="flex items-center gap-2.5">
            <span className="text-base leading-none flex-shrink-0">
              {m.completed ? "✅" : "⬜"}
            </span>
            <span
              className={`text-sm leading-snug ${
                m.completed ? "text-base-muted line-through" : "text-base-text"
              }`}
            >
              {m.text}
            </span>
          </div>
        ))}
      </div>

      {/* 완료율 프로그레스 바 */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-base-muted">완료율</span>
          <span className="text-xs font-bold text-brand-red">{rate}% 완료</span>
        </div>
        <div className="h-2.5 bg-base-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${rate}%`,
              background: "linear-gradient(90deg, #E84B2E, #FF7043)",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}
