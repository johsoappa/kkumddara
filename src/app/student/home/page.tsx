"use client";

// ====================================================
// 학생 홈 (/student/home)
// Must Have v1:
//   섹션 1 — 오늘의 미션
//   섹션 2 — 탐색 이어가기 / 추천 직업·활동
// ====================================================

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Compass,
  ChevronRight,
  CheckCircle2,
  Circle,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";
import { OCCUPATIONS } from "@/data/occupations";
import { getRoadmap } from "@/data/roadmaps";
import type { Child } from "@/types/family";
import { GRADE_LABEL, INTEREST_LABEL } from "@/types/family";
import type { Grade, InterestField } from "@/types/family";

// 직업 카테고리 → InterestField 역매핑
const CATEGORY_TO_INTEREST: Record<string, InterestField> = {
  "IT·기술":    "it",
  "예술·디자인": "art",
  "의료·과학":  "medical",
  "비즈니스":   "business",
  "교육·사회":  "education",
};

export default function StudentHomePage() {
  const router = useRouter();

  const [child, setChild]           = useState<Child | null>(null);
  const [chosenRoadmapId, setChosen] = useState<string | null>(null);
  const [completedMissions, setCompleted] = useState<string[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // student → child 로드
        const { data: studentData } = await supabase
          .from("student")
          .select("child_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!studentData?.child_id) return;

        const { data: childData } = await supabase
          .from("child")
          .select("*")
          .eq("id", studentData.child_id)
          .maybeSingle();

        if (childData) setChild(childData as Child);

        // 선택된 로드맵 & 완료 미션 (localStorage 캐시 우선, DB 폴백)
        const localChosen = localStorage.getItem("kkumddara_chosen_roadmap");
        if (localChosen) {
          setChosen(localChosen);
          const localProgress = localStorage.getItem(`kkumddara_roadmap_${localChosen}`);
          if (localProgress) setCompleted(JSON.parse(localProgress));
        } else if (childData) {
          const { data: roadmapData } = await supabase
            .from("roadmap_progress")
            .select("occupation_id, checked_missions")
            .eq("child_id", childData.id)
            .eq("chosen", true)
            .maybeSingle();

          if (roadmapData) {
            setChosen(roadmapData.occupation_id);
            const missions = roadmapData.checked_missions as Record<string, boolean>;
            setCompleted(Object.keys(missions).filter((k) => missions[k]));
          }
        }
      } catch (err) {
        console.error("[student/home] loadData 오류:", err);
      } finally {
        setLoading(false); // 성공/실패/예외 모두 로딩 종료 보장
      }
    }

    loadData();
  }, []);

  // 오늘의 미션 — 선택된 로드맵의 미완료 미션 중 첫 3개
  const todayMissions = useMemo(() => {
    if (!chosenRoadmapId) return [];
    const roadmap = getRoadmap(chosenRoadmapId);
    if (!roadmap) return [];

    const allMissions = roadmap.stages.flatMap((s) =>
      s.missions.map((m) => ({ ...m, stageTitle: s.title }))
    );
    const remaining = allMissions.filter((m) => !completedMissions.includes(m.id));
    return remaining.slice(0, 3);
  }, [chosenRoadmapId, completedMissions]);

  // 추천 직업 — 관심 분야 기반
  const recommendedOccupations = useMemo(() => {
    if (!child || !child.interests?.length) return OCCUPATIONS.slice(0, 3);
    const interestCategories = child.interests.map((i) => {
      const found = Object.entries(CATEGORY_TO_INTEREST).find(([, v]) => v === i);
      return found ? found[0] : null;
    }).filter(Boolean) as string[];

    const matched = OCCUPATIONS.filter((o) => interestCategories.includes(o.category));
    return (matched.length > 0 ? matched : OCCUPATIONS).slice(0, 3);
  }, [child]);

  const chosenRoadmap = chosenRoadmapId ? getRoadmap(chosenRoadmapId) : null;
  const totalMissions = chosenRoadmap
    ? chosenRoadmap.stages.flatMap((s) => s.missions).length
    : 0;
  const progressPct = totalMissions > 0
    ? Math.round((completedMissions.length / totalMissions) * 100)
    : 0;

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-off">
        <p className="text-sm text-base-muted">불러오는 중...</p>
      </div>
    );
  }

  const gradeLabel = child?.school_grade
    ? GRADE_LABEL[child.school_grade as Grade]
    : null;

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-base-off">

        {/* ── 헤더 ─────────────────────────────────── */}
        <header className="sticky top-0 z-10 bg-white border-b border-base-border px-5 h-14 flex items-center justify-between">
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: "#E84B2E" }}
          >
            꿈따라
          </span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 text-xs text-base-muted active:opacity-60"
          >
            <LogOut size={14} />
            로그아웃
          </button>
        </header>

        <div className="px-5 py-6 flex flex-col gap-5">

          {/* ── 인사말 ──────────────────────────────── */}
          <div>
            <p className="text-xs text-base-muted">
              {child?.name ? `${child.name} · ` : ""}
              {gradeLabel ?? "학생 홈"}
            </p>
            <h1 className="mt-0.5 text-xl font-bold text-base-text leading-snug">
              오늘도 한 걸음씩,
              <br />
              <span style={{ color: "#E84B2E" }}>꿈따라</span> 나아가요
            </h1>
            {/* 학년 / 관심분야 수정 칩 — DB 최신값 기반 */}
            {child && (
              <button
                onClick={() => router.push("/student/edit")}
                className="
                  mt-2.5 inline-flex items-center gap-1.5
                  bg-base-card border border-base-border
                  rounded-full px-3 py-1.5 text-xs text-base-muted
                  active:opacity-70 transition-opacity
                "
              >
                {gradeLabel && (
                  <span className="font-semibold text-base-text">{gradeLabel}</span>
                )}
                {gradeLabel && (child.interests?.length ?? 0) > 0 && (
                  <span className="text-base-border">|</span>
                )}
                {(child.interests?.length ?? 0) > 0 && (
                  <span>
                    {child.interests
                      .slice(0, 2)
                      .map((f) => INTEREST_LABEL[f as InterestField])
                      .join(", ")}
                  </span>
                )}
                <span style={{ color: "#E84B2E" }} className="font-semibold ml-0.5">
                  수정 ›
                </span>
              </button>
            )}
          </div>

          {/* ══════════════════════════════════════════
              섹션 1 — 오늘의 미션
          ══════════════════════════════════════════ */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Zap
                  size={15}
                  strokeWidth={2}
                  style={{ color: "#E84B2E" }}
                />
                <h2 className="text-sm font-bold text-base-text">오늘의 미션</h2>
              </div>
              {chosenRoadmap && (
                <button
                  onClick={() => router.push(`/roadmap/${chosenRoadmapId}`)}
                  className="text-xs text-base-muted flex items-center gap-0.5"
                >
                  전체 보기 <ChevronRight size={12} />
                </button>
              )}
            </div>

            <div className="bg-white rounded-card-lg shadow-card overflow-hidden">
              {/* 로드맵 없음 */}
              {!chosenRoadmap ? (
                <button
                  onClick={() => router.push("/explore")}
                  className="w-full p-5 text-left hover:bg-base-off transition-colors"
                >
                  <p className="text-sm font-bold text-base-text">
                    아직 선택한 직업이 없어요
                  </p>
                  <p className="text-xs text-base-muted mt-1">
                    탭하여 관심 직업을 찾고 미션을 시작해 보세요
                  </p>
                  <div
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold"
                    style={{ color: "#E84B2E" }}
                  >
                    직업 탐색 시작 <ChevronRight size={13} />
                  </div>
                </button>
              ) : (
                <>
                  {/* 로드맵 진행 상태 바 */}
                  <div className="px-4 pt-4 pb-3 border-b border-base-border">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg leading-none">
                          {chosenRoadmap.occupationEmoji}
                        </span>
                        <span className="text-sm font-bold text-base-text">
                          {chosenRoadmap.occupationName}
                        </span>
                      </div>
                      <span className="text-xs font-semibold" style={{ color: "#E84B2E" }}>
                        {progressPct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-base-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progressPct}%`, backgroundColor: "#E84B2E" }}
                      />
                    </div>
                    <p className="text-xs text-base-muted mt-1">
                      {completedMissions.length}/{totalMissions}개 완료
                    </p>
                  </div>

                  {/* 미션 목록 */}
                  {todayMissions.length === 0 ? (
                    <div className="px-4 py-5 text-center">
                      <p className="text-sm font-bold text-base-text">
                        모든 미션을 완료했어요!
                      </p>
                      <p className="text-xs text-base-muted mt-1">
                        정말 대단해요. 다음 목표를 찾아볼까요?
                      </p>
                    </div>
                  ) : (
                    todayMissions.map((mission, idx) => (
                      <button
                        key={mission.id}
                        onClick={() => router.push(`/roadmap/${chosenRoadmapId}`)}
                        className={`
                          w-full px-4 py-3.5 flex items-start gap-3 text-left
                          hover:bg-base-off transition-colors
                          ${idx < todayMissions.length - 1 ? "border-b border-base-border" : ""}
                        `}
                      >
                        <Circle
                          size={18}
                          className="text-base-border mt-0.5 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-base-muted mb-0.5">
                            {mission.stageTitle}
                          </p>
                          <p className="text-sm font-medium text-base-text leading-snug">
                            {mission.text}
                          </p>
                        </div>
                        <ChevronRight size={14} className="text-base-muted shrink-0 mt-1" />
                      </button>
                    ))
                  )}
                </>
              )}
            </div>
          </section>

          {/* ══════════════════════════════════════════
              섹션 2 — 탐색 이어가기 / 추천 직업
          ══════════════════════════════════════════ */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Compass
                  size={15}
                  strokeWidth={2}
                  style={{ color: "#E84B2E" }}
                />
                <h2 className="text-sm font-bold text-base-text">
                  {child?.interests?.length ? "관심 분야 추천 직업" : "직업 탐색하기"}
                </h2>
              </div>
              <button
                onClick={() => router.push("/explore")}
                className="text-xs text-base-muted flex items-center gap-0.5"
              >
                더 보기 <ChevronRight size={12} />
              </button>
            </div>

            {/* 관심 분야 뱃지 */}
            {child?.interests?.length ? (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {child.interests.map((f) => (
                  <span
                    key={f}
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: "#FFF0EB", color: "#E84B2E" }}
                  >
                    {INTEREST_LABEL[f as InterestField]}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="flex flex-col gap-2.5">
              {recommendedOccupations.map((occ) => (
                <button
                  key={occ.id}
                  onClick={() => router.push(`/roadmap/${occ.id}`)}
                  className="
                    bg-white rounded-card-lg shadow-card px-4 py-3.5
                    flex items-center gap-3 text-left
                    hover:shadow-card-hover active:scale-[0.99] transition-all
                  "
                >
                  <span className="text-2xl leading-none shrink-0">{occ.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-base-text">{occ.name}</p>
                    <p className="text-xs text-base-muted mt-0.5">{occ.category}</p>
                  </div>
                  <ChevronRight size={15} className="text-base-muted shrink-0" />
                </button>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
