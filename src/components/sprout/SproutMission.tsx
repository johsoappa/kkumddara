"use client";

// ====================================================
// 새싹 미션 컴포넌트
// - 라우트: /sprout/mission
// - CURRENT 단계 체크박스 + NEXT 단계 잠금
// - 하단 고정 "오늘의 미션 완료" 버튼
// ====================================================

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { SPROUT_MISSION_STAGES } from "@/data/sprout";

const GREEN       = "#4CAF50";
const GREEN_LIGHT = "#F1F8E9";
const GREEN_MID   = "#C8E6C9";

export default function SproutMission() {
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("kkumddara_sprout_missions");
    if (stored) setCompletedMissions(JSON.parse(stored) as string[]);
  }, []);

  const toggleMission = (id: string) => {
    const next = completedMissions.includes(id)
      ? completedMissions.filter((m) => m !== id)
      : [...completedMissions, id];
    setCompletedMissions(next);
    localStorage.setItem("kkumddara_sprout_missions", JSON.stringify(next));
  };

  const currentStage = SPROUT_MISSION_STAGES.find((s) => s.status === "current");
  const nextStage    = SPROUT_MISSION_STAGES.find((s) => s.status === "next");

  const currentTotal = currentStage?.missions.length ?? 0;
  const currentDone  = currentStage
    ? currentStage.missions.filter((m) => completedMissions.includes(m.id)).length
    : 0;
  const isCurrentComplete = currentTotal > 0 && currentDone === currentTotal;

  const progressPct = currentTotal > 0
    ? Math.round((currentDone / currentTotal) * 100)
    : 0;

  // 오늘의 미션: 전체 완료 처리
  const handleTodayComplete = () => {
    if (!currentStage || isCurrentComplete) return;
    const allIds = currentStage.missions.map((m) => m.id);
    const next   = Array.from(new Set([...completedMissions, ...allIds]));
    setCompletedMissions(next);
    localStorage.setItem("kkumddara_sprout_missions", JSON.stringify(next));
  };

  return (
    <AppShell headerTitle="새싹 미션 🌿">
      {/* 하단 고정 버튼 높이만큼 여백 확보 */}
      <div className="px-5 py-5 pb-36 flex flex-col gap-6">

        {/* ── CURRENT 단계 ── */}
        {currentStage && (
          <section>
            {/* 단계 헤더 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: GREEN }}
                >
                  진행중
                </span>
                <h2 className="text-base font-bold text-base-text">
                  {currentStage.title}
                </h2>
              </div>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: GREEN }}
              >
                {currentDone}/{currentTotal}
              </span>
            </div>

            {/* 진행 바 */}
            <div className="h-2 bg-base-border rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full"
                style={{
                  width:           `${progressPct}%`,
                  backgroundColor: GREEN,
                  transition:      "width 0.4s ease",
                }}
              />
            </div>

            {/* 미션 목록 */}
            <div className="flex flex-col gap-3">
              {currentStage.missions.map((mission) => {
                const done = completedMissions.includes(mission.id);
                return (
                  <button
                    key={mission.id}
                    onClick={() => toggleMission(mission.id)}
                    className="flex items-start gap-3 p-4 rounded-card-lg bg-white shadow-card border text-left w-full active:opacity-80 transition-opacity"
                    style={{ borderColor: done ? GREEN : "#E0E0E0" }}
                  >
                    {/* 원형 체크 */}
                    <div
                      className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5"
                      style={{
                        borderColor:     done ? GREEN   : "#BDBDBD",
                        backgroundColor: done ? GREEN   : "#ffffff",
                      }}
                    >
                      {done && (
                        <span className="text-white text-xs font-bold leading-none">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-semibold leading-snug ${
                          done ? "line-through text-base-muted" : "text-base-text"
                        }`}
                      >
                        {mission.text}
                      </p>
                      <p className="text-xs text-base-muted mt-1">
                        ⏱ {mission.duration} · {mission.difficulty}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 완료 축하 메시지 */}
            {isCurrentComplete && (
              <div
                className="mt-3 rounded-card p-3 text-center"
                style={{ backgroundColor: GREEN_MID }}
              >
                <p className="text-sm font-bold" style={{ color: GREEN }}>
                  🎉 모든 미션을 완료했어요! 정말 잘했어요!
                </p>
              </div>
            )}
          </section>
        )}

        {/* ── NEXT 단계 (잠금) ── */}
        {nextStage && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-base-card text-base-muted">
                다음 단계
              </span>
              <h2 className="text-base font-bold text-base-muted">
                {nextStage.title}
              </h2>
              {!isCurrentComplete && <span className="text-lg">🔒</span>}
            </div>

            <div
              className={`rounded-card-lg border border-dashed border-base-border transition-opacity ${
                isCurrentComplete ? "opacity-100" : "opacity-50"
              }`}
            >
              {isCurrentComplete ? (
                <div
                  className="px-4 pt-3 pb-1 rounded-t-card-lg"
                  style={{ backgroundColor: GREEN_LIGHT }}
                >
                  <p
                    className="text-sm font-bold text-center"
                    style={{ color: GREEN }}
                  >
                    🌿 이전 단계 완료! 다음 단계가 열렸어요
                  </p>
                </div>
              ) : (
                <div className="px-4 pt-3 pb-1 bg-base-off rounded-t-card-lg">
                  <p className="text-sm text-center text-base-muted">
                    🌱 이전 단계를 모두 완료하면 열려요
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 p-4">
                {nextStage.missions.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-card bg-base-off"
                  >
                    <div className="flex-shrink-0 w-5 h-5 rounded border-2 border-base-border bg-white" />
                    <p className="text-sm text-base-muted">{m.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </div>

      {/* ── 하단 고정: 오늘의 미션 ── */}
      <div
        className="fixed bottom-[64px] left-1/2 -translate-x-1/2 w-full max-w-mobile px-5 py-3 border-t"
        style={{ backgroundColor: GREEN_LIGHT, borderColor: GREEN_MID }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-base-text">🎯 오늘의 미션</p>
            <p className="text-xs text-base-muted mt-0.5">
              {currentDone}/{currentTotal} 완료
            </p>
          </div>
          <button
            onClick={handleTodayComplete}
            disabled={isCurrentComplete}
            className="flex-shrink-0 px-5 py-2.5 rounded-button text-sm font-bold text-white disabled:opacity-50 active:opacity-80 transition-opacity"
            style={{ backgroundColor: GREEN }}
          >
            {isCurrentComplete ? "완료 ✓" : "완료했어요!"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
