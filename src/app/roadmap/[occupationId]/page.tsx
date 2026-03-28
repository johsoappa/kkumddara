"use client";

// ====================================================
// 나의 로드맵 페이지 (/roadmap/[occupationId])
// - 목표 직업 카드 + 전체 진행률
// - 3단계 타임라인 (CURRENT / NEXT / FUTURE)
// - 오늘의 미션 하단 고정
// - CURRENT 전부 완료 시 토스트 알림
// ====================================================

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ProgressCircle from "@/components/roadmap/ProgressCircle";
import RoadmapStage from "@/components/roadmap/RoadmapStage";
import TodayMission from "@/components/roadmap/TodayMission";
import { getRoadmap } from "@/data/roadmaps";

const LAST_ROADMAP_KEY = "kkumddara_last_roadmap";

export default function RoadmapPage() {
  const params = useParams();
  const router = useRouter();
  const occupationId = params.occupationId as string;

  const roadmap = getRoadmap(occupationId);

  const STORAGE_KEY = `kkumddara_roadmap_${occupationId}`;

  const [completedMissions, setCompletedMissions] = useState<Set<string>>(
    new Set()
  );
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 마지막 선택 직업 저장 + localStorage에서 진행 상태 복원
  useEffect(() => {
    localStorage.setItem(LAST_ROADMAP_KEY, occupationId);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setCompletedMissions(new Set(JSON.parse(stored) as string[]));
    } else {
      setCompletedMissions(new Set());
    }
  }, [occupationId, STORAGE_KEY]);

  // 직업 로드맵 없음
  if (!roadmap) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-off">
        <div className="text-center px-6">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="text-base font-bold text-base-text mb-1">
            아직 준비 중인 로드맵이에요
          </p>
          <p className="text-sm text-base-muted mb-5">
            다른 직업을 탐색해 보세요!
          </p>
          <button
            onClick={() => router.push("/explore")}
            className="btn-primary"
          >
            직업 탐색하러 가기
          </button>
        </div>
      </div>
    );
  }

  const currentStage = roadmap.stages.find((s) => s.status === "current")!;
  const allMissions = useMemo(
    () => roadmap.stages.flatMap((s) => s.missions),
    [roadmap]
  );
  const completedCount = allMissions.filter((m) =>
    completedMissions.has(m.id)
  ).length;
  const progress =
    allMissions.length > 0
      ? Math.round((completedCount / allMissions.length) * 100)
      : 0;

  const todayMission = useMemo(
    () =>
      currentStage.missions.find((m) => !completedMissions.has(m.id)) ?? null,
    [currentStage.missions, completedMissions]
  );

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const handleToggle = (id: string) => {
    const next = new Set(completedMissions);
    const wasAdded = !next.has(id);
    wasAdded ? next.add(id) : next.delete(id);

    setCompletedMissions(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));

    if (wasAdded) {
      const allCurrentDone = currentStage.missions.every((m) => next.has(m.id));
      if (allCurrentDone) showToast("NEXT 단계가 해제됐어요! 🎉");
    }
  };

  return (
    <AppShell headerTitle="나의 로드맵">

      {/* ---- 토스트 알림 ---- */}
      {toast && (
        <div
          className="
            fixed top-16 left-1/2 -translate-x-1/2 z-50
            bg-base-text text-white text-sm font-semibold
            px-5 py-3 rounded-full shadow-card
            animate-bounce
          "
        >
          {toast}
        </div>
      )}

      {/* ---- 스크롤 컨텐츠 ---- */}
      <div className="px-4 pt-4" style={{ paddingBottom: "190px" }}>

        {/* ① 목표 직업 카드 */}
        <div className="bg-brand-red rounded-card-lg px-5 py-4 flex items-center gap-4 mb-4">
          <span className="text-4xl leading-none flex-shrink-0">
            {roadmap.occupationEmoji}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium mb-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>
              목표 직업
            </p>
            <p className="text-lg font-bold text-white truncate">
              {roadmap.occupationName}
            </p>
          </div>
          <span
            className="flex-shrink-0 text-white text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            {roadmap.grade}
          </span>
        </div>

        {/* ② 전체 진행률 카드 */}
        <div className="card flex items-center gap-5 mb-4">
          <ProgressCircle progress={progress} size={90} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-base-text mb-1">진행 현황</p>
            <p className="text-xs text-base-muted">
              전체{" "}
              <span className="font-semibold text-base-text">
                {allMissions.length}
              </span>
              개 미션 중{" "}
              <span className="font-semibold text-brand-red">
                {completedCount}
              </span>
              개 완료
            </p>
            <div className="h-1.5 bg-base-border rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-red"
                style={{
                  width: `${progress}%`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        </div>

        {/* ③ 3단계 타임라인 */}
        <div className="flex flex-col gap-3">
          {roadmap.stages.map((stage) => (
            <RoadmapStage
              key={stage.id}
              stage={stage}
              completedMissions={completedMissions}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>

      {/* ④ 오늘의 미션 (하단 고정) */}
      <TodayMission
        missionText={todayMission?.text ?? null}
        onComplete={() => todayMission && handleToggle(todayMission.id)}
      />
    </AppShell>
  );
}
