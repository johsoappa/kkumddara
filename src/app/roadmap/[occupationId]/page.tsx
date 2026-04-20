"use client";

// ====================================================
// 나의 로드맵 페이지 (/roadmap/[occupationId])
//
// 데이터 소스 우선순위:
//   1순위: DB (occupation_master.legacy_occupation_id 매핑)
//          → 직업명/이모지: occupation_master
//          → Stage 1 미션: occupation_student_actions
//          → 준비 힌트: occupation_preparations(mission_hint)
//          → Stage 2, 3: 정적 ROADMAPS 폴백
//   2순위: 정적 ROADMAPS (비파일럿 직업 or DB 조회 실패 시)
//
// 진행 상태 저장 우선순위:
//   1순위: Supabase roadmap_progress (child_id 있을 때)
//   2순위: localStorage fallback (비로그인/온보딩 미완료)
//
// [주의] DB Stage 1 미션 ID: 'prep-{uuid}' / 'action-{uuid}'
//        정적 Stage 1 미션 ID: 'm1', 'm2' 등
//        → DB 전환 후 기존 정적 Stage 1 진행률은 초기화됨 (MVP 허용 리스크)
//        Stage 2, 3 미션 ID는 정적 그대로 유지 → 진행률 보존
//
// child_id 결정:
//   - student role → student 테이블에서 child_id 조회
//   - parent role  → child 테이블에서 첫 번째 자녀 id 조회
//   - 없으면 → localStorage 모드
//
// checked_missions JSONB 형식: { [missionId]: true }
// ====================================================

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ProgressCircle from "@/components/roadmap/ProgressCircle";
import RoadmapStage from "@/components/roadmap/RoadmapStage";
import TodayMission from "@/components/roadmap/TodayMission";
import { getRoadmap } from "@/data/roadmaps";
import { supabase } from "@/lib/supabase";
import type { RoadmapData, RoadmapStage as RoadmapStageType, StageStatus } from "@/types/roadmap";

const LAST_ROADMAP_KEY = "kkumddara_last_roadmap";

type RoadmapMode = "loading" | "db" | "static" | "not-found";

export default function RoadmapPage() {
  const params       = useParams();
  const router       = useRouter();
  const occupationId = params.occupationId as string;   // = legacy_occupation_id
  const STORAGE_KEY  = `kkumddara_roadmap_${occupationId}`;

  // ── 로드맵 데이터 상태 ──────────────────────────────────
  const [roadmap, setRoadmap]         = useState<RoadmapData | null>(null);
  const [missionHint, setMissionHint] = useState<string | null>(null);
  const [roadmapMode, setRoadmapMode] = useState<RoadmapMode>("loading");

  // ── 진행 상태 ──────────────────────────────────────────
  const [childId, setChildId]             = useState<string | null>(null);
  const [completedMissions, setCompleted] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated]           = useState(false);
  const [toast, setToast]                 = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 초기화: 로드맵 데이터 + 진행 상태 동시 로드 ──────────
  useEffect(() => {
    localStorage.setItem(LAST_ROADMAP_KEY, occupationId);

    let cancelled = false;

    async function init() {
      // ── ① 로드맵 데이터 로드 (DB 우선) ─────────────────
      await loadRoadmapData();

      if (cancelled) return;

      // ── ② 진행 상태 로드 (child_id → DB, 없으면 localStorage) ─
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) {
        restoreFromLocalStorage();
        return;
      }

      const role = user.user_metadata?.role as "parent" | "student" | undefined;
      let resolvedChildId: string | null = null;

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
        restoreFromLocalStorage();
        return;
      }

      setChildId(resolvedChildId);

      const { data: progress } = await supabase
        .from("roadmap_progress")
        .select("checked_missions")
        .eq("child_id", resolvedChildId)
        .eq("occupation_id", occupationId)
        .maybeSingle();

      if (cancelled) return;

      if (progress?.checked_missions) {
        const checked = progress.checked_missions as Record<string, boolean>;
        const ids = Object.entries(checked)
          .filter(([, v]) => v === true)
          .map(([k]) => k);
        setCompleted(new Set(ids));
      } else {
        setCompleted(new Set());
      }

      setHydrated(true);
    }

    // ── DB 우선 로드맵 데이터 빌드 ─────────────────────────
    async function loadRoadmapData() {
      try {
        // Query 1: occupation_master (legacy_occupation_id 기준)
        const { data: master, error: masterErr } = await supabase
          .from("occupation_master")
          .select("id, name_ko, emoji, legacy_occupation_id")
          .eq("legacy_occupation_id", occupationId)
          .eq("is_active", true)
          .maybeSingle();

        if (masterErr || !master) {
          // DB에 없는 직업 → 정적 폴백
          useStaticFallback();
          return;
        }

        // Query 2, 3: 병렬 fetch
        const [{ data: prepRows }, { data: actionRows }] = await Promise.all([
          supabase
            .from("occupation_preparations")
            .select("id, prep_type, content, display_order")
            .eq("occupation_id", master.id)
            .eq("is_current", true)
            .eq("status", "published")
            .in("prep_type", ["mission_hint", "step_action"])
            .order("display_order", { ascending: true }),
          supabase
            .from("occupation_student_actions")
            .select("id, stage_number, stage_title, action_text, display_order")
            .eq("occupation_id", master.id)
            .eq("is_current", true)
            .eq("status", "published")
            .order("stage_number", { ascending: true })
            .order("display_order", { ascending: true }),
        ]);

        if (cancelled) return;

        const staticRoadmap = getRoadmap(occupationId);

        // mission_hint
        const hint = prepRows?.find((r) => r.prep_type === "mission_hint")?.content ?? null;

        // Stage 1 미션: step_action(preparations) + student_actions(stage_number=1)
        const stepActions = (prepRows ?? [])
          .filter((r) => r.prep_type === "step_action")
          .map((r) => ({ id: `prep-${r.id}`, text: r.content }));

        const stage1Actions = (actionRows ?? [])
          .filter((r) => r.stage_number === 1)
          .map((r) => ({ id: `action-${r.id}`, text: r.action_text }));

        const stage1Missions = [...stepActions, ...stage1Actions];

        // Stage 1 카드 구성
        const stage1: RoadmapStageType = {
          id: staticRoadmap?.stages[0]?.id ?? "stage-current",
          status: "current",
          title: staticRoadmap?.stages[0]?.title ?? "탐색하기",
          missions: stage1Missions.length > 0
            ? stage1Missions
            : (staticRoadmap?.stages[0]?.missions ?? []),  // DB 미션 없으면 정적 유지
        };

        // Stage 2, 3: 정적 ROADMAPS에서 그대로 사용
        const stages2and3: RoadmapStageType[] = staticRoadmap?.stages.slice(1) ?? [
          {
            id: "stage-next",
            status: "next",
            title: "실력 키우기",
            missions: [],
          },
          {
            id: "stage-future",
            status: "future",
            title: "전문가 되기",
            missions: [],
          },
        ];

        const merged: RoadmapData = {
          id: `${occupationId}-db-roadmap`,
          occupationId,
          occupationName: master.name_ko,
          occupationEmoji: master.emoji,
          grade: staticRoadmap?.grade ?? "중1",
          stages: [stage1, ...stages2and3],
        };

        if (!cancelled) {
          setMissionHint(hint);
          setRoadmap(merged);
          setRoadmapMode("db");
        }
      } catch {
        // 예외 시 정적 폴백
        useStaticFallback();
      }
    }

    function useStaticFallback() {
      const staticRoadmap = getRoadmap(occupationId);
      if (staticRoadmap) {
        setRoadmap(staticRoadmap);
        setRoadmapMode("static");
      } else {
        setRoadmapMode("not-found");
      }
    }

    function restoreFromLocalStorage() {
      const stored = localStorage.getItem(STORAGE_KEY);
      setCompleted(stored ? new Set(JSON.parse(stored) as string[]) : new Set());
      setHydrated(true);
    }

    init();
    return () => { cancelled = true; };
  }, [occupationId, STORAGE_KEY]);

  // ── 로딩 중 ─────────────────────────────────────────────
  if (roadmapMode === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-off">
        <div className="text-center">
          <p className="text-3xl mb-2">🗺️</p>
          <p className="text-sm text-base-muted">로드맵 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // ── 로드맵 없음 ───────────────────────────────────────────
  if (roadmapMode === "not-found" || !roadmap) {
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

  // ── unlock 판단 함수 ──────────────────────────────────────
  // 75% 이상 완료 시 해당 단계 "완료로 간주" → 다음 단계 해제
  const isStageCleared = (
    stageMissions: { id: string }[],
    completedSet: Set<string>
  ): boolean => {
    const total = stageMissions.length;
    if (total === 0) return true;
    const done = stageMissions.filter((m) => completedSet.has(m.id)).length;
    return done >= Math.ceil(total * 0.75);
  };

  // ── 파생 값 ──────────────────────────────────────────────
  const currentStage  = roadmap.stages.find((s) => s.status === "current")!;
  const allMissions   = useMemo(
    () => roadmap.stages.flatMap((s) => s.missions),
    [roadmap]
  );
  const completedCount = allMissions.filter((m) => completedMissions.has(m.id)).length;
  const progress = allMissions.length > 0
    ? Math.round((completedCount / allMissions.length) * 100)
    : 0;

  const todayMission = useMemo(
    () => currentStage?.missions.find((m) => !completedMissions.has(m.id)) ?? null,
    [currentStage?.missions, completedMissions]
  );

  // ── 단계별 실효 상태 (동적 계산) ─────────────────────────
  const effectiveStatuses = useMemo<StageStatus[]>(() => {
    const missions = hydrated ? completedMissions : new Set<string>();
    return roadmap.stages.map((stage, i) => {
      if (i === 0) return "current";
      const prevStage = roadmap.stages[i - 1];
      if (!isStageCleared(prevStage.missions, missions)) return stage.status;
      if (stage.status === "next")   return "current";
      if (stage.status === "future") return "next";
      return stage.status;
    });
  }, [roadmap.stages, completedMissions, hydrated]);

  // ── 토스트 ───────────────────────────────────────────────
  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  // ── 미션 토글 ────────────────────────────────────────────
  const handleToggle = async (id: string) => {
    const next    = new Set(completedMissions);
    const wasAdded = !next.has(id);
    wasAdded ? next.add(id) : next.delete(id);
    setCompleted(next);

    if (childId) {
      const checkedObj: Record<string, boolean> = {};
      next.forEach((mid) => { checkedObj[mid] = true; });

      await supabase
        .from("roadmap_progress")
        .upsert(
          {
            child_id:         childId,
            occupation_id:    occupationId,     // legacy_occupation_id (text 키)
            checked_missions: checkedObj,
            last_visited_at:  new Date().toISOString(),
          },
          { onConflict: "child_id,occupation_id" }
        );
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    }

    if (wasAdded && currentStage) {
      if (isStageCleared(currentStage.missions, next)) {
        showToast("NEXT 단계가 해제됐어요! 🎉");
      }
    }
  };

  // ── 렌더 ─────────────────────────────────────────────────
  const displayProgress  = hydrated ? progress      : 0;
  const displayCompleted = hydrated ? completedCount : 0;
  const displayMissions  = hydrated ? completedMissions : new Set<string>();

  return (
    <AppShell headerTitle="나의 로드맵">

      {/* ── 토스트 ── */}
      {toast && (
        <div
          className="
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

        {/* ③ 준비 힌트 (DB 모드에서만) */}
        {roadmapMode === "db" && missionHint && (
          <div className="rounded-card-lg border border-brand-red/20 bg-red-50 px-4 py-3 flex items-start gap-3 mb-3">
            <span className="text-lg flex-shrink-0 mt-0.5">💡</span>
            <p className="text-sm text-base-text leading-relaxed">{missionHint}</p>
          </div>
        )}

        {/* ④ 3단계 타임라인 */}
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

      {/* ⑤ 오늘의 미션 (하단 고정) */}
      <TodayMission
        missionText={hydrated ? (todayMission?.text ?? null) : null}
        onComplete={() => todayMission && handleToggle(todayMission.id)}
      />
    </AppShell>
  );
}
