"use client";

// ====================================================
// 나의 로드맵 페이지 (/roadmap/[occupationId])
//
// 진행 상태 저장 우선순위:
//   1순위: Supabase roadmap_progress (child_id 있을 때)
//   2순위: localStorage fallback (비로그인/온보딩 미완료)
//
// child_id 결정:
//   - student role → student 테이블에서 child_id 조회
//   - parent role  → child 테이블에서 첫 번째 자녀 id 조회
//   - 없으면 → localStorage 모드
//
// checked_missions JSONB 형식: { [missionId]: true }
// 없는 키 = false (미완료) → 초기값 0%
// ====================================================

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ProgressCircle from "@/components/roadmap/ProgressCircle";
import RoadmapStage from "@/components/roadmap/RoadmapStage";
import TodayMission from "@/components/roadmap/TodayMission";
import { getRoadmap } from "@/data/roadmaps";
import { supabase } from "@/lib/supabase";
import type { StageStatus } from "@/types/roadmap";

const LAST_ROADMAP_KEY = "kkumddara_last_roadmap";

export default function RoadmapPage() {
  const params    = useParams();
  const router    = useRouter();
  const occupationId = params.occupationId as string;

  const roadmap    = getRoadmap(occupationId);
  const STORAGE_KEY = `kkumddara_roadmap_${occupationId}`;

  // ── 상태 ──────────────────────────────────────────────
  const [childId, setChildId]               = useState<string | null>(null);
  const [completedMissions, setCompleted]   = useState<Set<string>>(new Set());
  const [hydrated, setHydrated]             = useState(false); // SSR flicker 방지
  const [toast, setToast]                   = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 초기화: child_id 확보 → DB 조회 → 진행 상태 복원 ──
  useEffect(() => {
    localStorage.setItem(LAST_ROADMAP_KEY, occupationId);

    let cancelled = false;

    async function init() {
      // 1. 로그인 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) {
        // 비로그인 → localStorage fallback
        restoreFromLocalStorage();
        return;
      }

      const role = user.user_metadata?.role as "parent" | "student" | undefined;
      let resolvedChildId: string | null = null;

      // 2. child_id 확보
      if (role === "student") {
        const { data } = await supabase
          .from("student")
          .select("child_id")
          .eq("user_id", user.id)
          .maybeSingle();
        resolvedChildId = data?.child_id ?? null;
      } else if (role === "parent") {
        const { data } = await supabase
          .from("child")
          .select("id, parent_id, parent:parent(user_id)")
          .eq("parent.user_id", user.id)
          .limit(1)
          .maybeSingle();
        resolvedChildId = (data as { id: string } | null)?.id ?? null;
      }

      if (cancelled) return;

      if (!resolvedChildId) {
        // child_id 없으면 localStorage fallback
        restoreFromLocalStorage();
        return;
      }

      setChildId(resolvedChildId);

      // 3. DB에서 진행 상태 조회
      const { data: progress } = await supabase
        .from("roadmap_progress")
        .select("checked_missions")
        .eq("child_id", resolvedChildId)
        .eq("occupation_id", occupationId)
        .maybeSingle();

      if (cancelled) return;

      if (progress?.checked_missions) {
        // checked_missions: { [missionId]: true } → Set으로 변환
        const checked = progress.checked_missions as Record<string, boolean>;
        const ids = Object.entries(checked)
          .filter(([, v]) => v === true)
          .map(([k]) => k);
        setCompleted(new Set(ids));
      } else {
        // DB에 데이터 없음 → 0%로 시작
        setCompleted(new Set());
      }

      setHydrated(true);
    }

    function restoreFromLocalStorage() {
      const stored = localStorage.getItem(STORAGE_KEY);
      setCompleted(stored ? new Set(JSON.parse(stored) as string[]) : new Set());
      setHydrated(true);
    }

    init();
    return () => { cancelled = true; };
  }, [occupationId, STORAGE_KEY]);

  // ── 로드맵 없음 ───────────────────────────────────────
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
          <button onClick={() => router.push("/explore")} className="btn-primary">
            직업 탐색하러 가기
          </button>
        </div>
      </div>
    );
  }

  // ── unlock 판단 함수 (단일 기준) ─────────────────────
  // 75% 이상 완료 시 해당 단계를 "완료로 간주" → 다음 단계 해제
  // Math.ceil(4 * 0.75) = 3 → 미션 4개 기준 3개 완료 시 unlock
  // 토스트·카드 unlock 모두 이 함수 하나로 판단한다.
  const isStageCleared = (
    stageMissions: { id: string }[],
    completedSet: Set<string>
  ): boolean => {
    const total = stageMissions.length;
    if (total === 0) return true;
    const done = stageMissions.filter((m) => completedSet.has(m.id)).length;
    return done >= Math.ceil(total * 0.75);
  };

  // ── 파생 값 ──────────────────────────────────────────
  const currentStage = roadmap.stages.find((s) => s.status === "current")!;
  const allMissions  = useMemo(
    () => roadmap.stages.flatMap((s) => s.missions),
    [roadmap]
  );
  const completedCount = allMissions.filter((m) => completedMissions.has(m.id)).length;
  const progress = allMissions.length > 0
    ? Math.round((completedCount / allMissions.length) * 100)
    : 0;

  const todayMission = useMemo(
    () => currentStage.missions.find((m) => !completedMissions.has(m.id)) ?? null,
    [currentStage.missions, completedMissions]
  );

  // ── 단계별 실효 상태 (동적 계산) ──────────────────────
  // stage.status는 정적 초기값. 실제 unlock 여부는
  // isStageCleared (75% 기준) 로 동적으로 결정한다.
  //   i=0 (current): 항상 "current"
  //   i=1 (next)   : stage[0] 75% 이상 완료 시 → "current" (해제)
  //   i=2 (future) : stage[1] 75% 이상 완료 시 → "next"   (해제)
  const effectiveStatuses = useMemo<StageStatus[]>(() => {
    const missions = hydrated ? completedMissions : new Set<string>();
    return roadmap.stages.map((stage, i) => {
      if (i === 0) return "current";
      const prevStage = roadmap.stages[i - 1];
      if (!isStageCleared(prevStage.missions, missions)) return stage.status;
      // 이전 단계 75% 이상 완료 → 한 단계 승격
      if (stage.status === "next")   return "current";
      if (stage.status === "future") return "next";
      return stage.status;
    });
  }, [roadmap.stages, completedMissions, hydrated]);

  // ── 토스트 ───────────────────────────────────────────
  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  // ── 미션 토글 ────────────────────────────────────────
  const handleToggle = async (id: string) => {
    const next    = new Set(completedMissions);
    const wasAdded = !next.has(id);
    wasAdded ? next.add(id) : next.delete(id);
    setCompleted(next);

    if (childId) {
      // DB upsert — checked_missions: { [id]: true } のみ保存 (false は省く)
      const checkedObj: Record<string, boolean> = {};
      next.forEach((mid) => { checkedObj[mid] = true; });

      await supabase
        .from("roadmap_progress")
        .upsert(
          {
            child_id:         childId,
            occupation_id:    occupationId,
            checked_missions: checkedObj,
            last_visited_at:  new Date().toISOString(),
          },
          { onConflict: "child_id,occupation_id" }
        );
    } else {
      // localStorage fallback
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    }

    if (wasAdded) {
      // 토스트 기준도 isStageCleared (75%) 로 카드 unlock과 동일하게 판단
      if (isStageCleared(currentStage.missions, next)) {
        showToast("NEXT 단계가 해제됐어요! 🎉");
      }
    }
  };

  // ── 렌더 ─────────────────────────────────────────────
  // hydrated 전: 진행률 0%로 고정 (SSR flicker 방지)
  const displayProgress      = hydrated ? progress      : 0;
  const displayCompleted     = hydrated ? completedCount : 0;
  const displayMissions      = hydrated ? completedMissions : new Set<string>();

  return (
    <AppShell headerTitle="나의 로드맵">

      {/* ── 토스트 (페이지 최상단 중앙, 카드와 겹치지 않음) ── */}
      {toast && (
        <div className="
          fixed top-4 left-1/2 -translate-x-1/2 z-[500]
          bg-base-text text-white text-sm font-semibold
          px-5 py-3 rounded-full shadow-card
          whitespace-nowrap
        "
          style={{ animation: "toast-in 0.25s ease-out both" }}
        >
          {toast}
        </div>
      )}
      <style>{`
        @keyframes toast-in {
          0%   { transform: translate(-50%, -12px); opacity: 0; }
          100% { transform: translate(-50%, 0);     opacity: 1; }
        }
      `}</style>

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
          <ProgressCircle progress={displayProgress} size={90} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-base-text mb-1">진행 현황</p>
            <p className="text-xs text-base-muted">
              전체{" "}
              <span className="font-semibold text-base-text">{allMissions.length}</span>
              개 미션 중{" "}
              <span className="font-semibold text-brand-red">{displayCompleted}</span>
              개 완료
            </p>
            <div className="h-1.5 bg-base-border rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-red"
                style={{ width: `${displayProgress}%`, transition: "width 0.4s ease" }}
              />
            </div>
          </div>
        </div>

        {/* ③ 3단계 타임라인 */}
        <div className="flex flex-col gap-3">
          {roadmap.stages.map((stage, i) => (
            <RoadmapStage
              key={stage.id}
              stage={stage}
              effectiveStatus={effectiveStatuses[i]}
              completedMissions={displayMissions}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>

      {/* ④ 오늘의 미션 (하단 고정) */}
      <TodayMission
        missionText={hydrated ? (todayMission?.text ?? null) : null}
        onComplete={() => todayMission && handleToggle(todayMission.id)}
      />
    </AppShell>
  );
}
