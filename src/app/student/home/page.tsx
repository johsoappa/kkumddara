"use client";

// ====================================================
// 학생 홈 (/student/home)
//
// 데이터 소스:
//   - 추천 직업: occupation_master (is_active=true) + occupation_summary(one_liner)
//   - 관심분야 매칭: occupation_master.interest_fields ∩ child.interests
//   - 오늘의 미션: occupation_student_actions(stage_number=1, DB 우선)
//                  → DB 데이터 없으면 정적 ROADMAPS fallback
//   - 자녀 프로필: child 테이블 (학년/관심분야)
//
// [미션 DB 전환 범위]
//   occupation_master.legacy_occupation_id → occupation_student_actions 연결
//   grade_target(all/elementary/middle/high) 기준 학년 필터링
//   완료 추적은 localStorage 기반 유지 (UUID ↔ 레거시 ID 혼용 — /roadmap/[id] 에서 처리)
//
// 세션 처리:
//   - getUser() null → router.replace('/') 리다이렉트
//   - onAuthStateChange SIGNED_OUT → router.replace('/')
//   - 세션 만료 시 무한 로딩 또는 화이트 스크린 없음
//
// [MVP 주의] 오늘의 미션 섹션은 정적 ROADMAPS 기반 미션 ID 사용
//   DB 전환된 Stage 1 미션(prep-/action- UUID)과 ID 불일치 가능.
//   추천 직업 섹션만 DB 전환 완료. 미션 섹션 DB 전환은 후속 작업 예정.
// ====================================================

import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Compass,
  ChevronRight,
  Circle,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/auth";
import { getRoadmap } from "@/data/roadmaps";
import type { Child } from "@/types/family";
import { GRADE_LABEL, GRADE_LEVEL_LABEL, INTEREST_LABEL } from "@/types/family";
import type { Grade, GradeLevel, InterestField } from "@/types/family";

// ── DB 미션 타입 (occupation_student_actions) ────────────────
interface DbMission {
  id:         string;
  text:       string;
  stageTitle: string;
}

// ── grade_level → DB grade_group 변환 ────────────────────────
// occupation_student_actions.grade_target 기준: elementary|middle|high|all
function gradeGroupFromGradeLevel(
  gradeLevel: string | null | undefined
): "elementary" | "middle" | "high" | "all" {
  if (!gradeLevel) return "all";
  if (gradeLevel.startsWith("elementary")) return "elementary";
  if (gradeLevel.startsWith("middle"))     return "middle";
  if (gradeLevel.startsWith("high"))       return "high";
  return "all";
}

// ── DB 직업 타입 ────────────────────────────────────────────
interface DbOccupation {
  id:                   string;
  name_ko:              string;
  emoji:                string;
  category:             string;
  interest_fields:      string[];
  legacy_occupation_id: string | null;
  priority:             number;
  one_liner:            string | null;
}

// ── 카테고리별 탐색 제안 문구 (fallback용) ──────────────────
const CATEGORY_REASON: Record<string, string> = {
  "IT·기술":       "IT 관심사와 연결되는 직업이에요",
  "예술·디자인":   "예술·창작 관심사와 이어지는 직업이에요",
  "의료·과학":     "의료·과학을 좋아한다면 살펴볼 만해요",
  "비즈니스·경영": "비즈니스 관심사와 맞닿아 있는 직업이에요",
  "교육·사회":     "사람·사회에 관심 있다면 탐색해볼 만해요",
  "콘텐츠·미디어": "미디어·콘텐츠를 좋아한다면 어울릴 수 있어요",
  "공공·안전":     "정의·봉사에 관심 있다면 탐색해볼 만해요",
  "환경·미래산업": "미래 산업에 관심 있다면 주목할 직업이에요",
};

export default function StudentHomePage() {
  const router = useRouter();

  const [child, setChild]               = useState<Child | null>(null);
  const [dbOccupations, setDbOccs]        = useState<DbOccupation[]>([]);
  const [dbMissions, setDbMissions]       = useState<DbMission[]>([]);
  const [chosenRoadmapId, setChosen]      = useState<string | null>(null);
  const [completedMissions, setCompleted] = useState<string[]>([]);
  const [loading, setLoading]             = useState(true);

  // ── 세션 만료 감지 리스너 ───────────────────────────────────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
          router.replace("/");
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [router]);

  // ── 데이터 로드 ───────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        // 1. 인증 확인 — 세션 만료 시 랜딩 리다이렉트
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/");
          return;
        }

        // 2. student → child 로드
        const { data: studentData } = await supabase
          .from("student")
          .select("child_id")
          .eq("user_id", user.id)
          .maybeSingle();

        // 로컬 변수로 child 추적 (step 5 DB 미션 조회에 사용)
        let resolvedChild: Child | null = null;

        if (studentData?.child_id) {
          const { data: childData } = await supabase
            .from("child")
            .select("*")
            .eq("id", studentData.child_id)
            .maybeSingle();

          if (childData) {
            resolvedChild = childData as Child;
            setChild(resolvedChild);
          }
        }

        // 3. 선택된 로드맵 & 완료 미션 (localStorage 캐시 우선, DB 폴백)
        // 로컬 변수로 roadmapId 추적 (step 5 DB 미션 조회에 사용)
        let resolvedRoadmapId: string | null = null;

        const localChosen = localStorage.getItem("kkumddara_chosen_roadmap");
        if (localChosen) {
          resolvedRoadmapId = localChosen;
          setChosen(localChosen);
          const localProgress = localStorage.getItem(`kkumddara_roadmap_${localChosen}`);
          if (localProgress) {
            try { setCompleted(JSON.parse(localProgress)); } catch { /* 파싱 실패 무시 */ }
          }
        } else if (studentData?.child_id) {
          const { data: roadmapData } = await supabase
            .from("roadmap_progress")
            .select("occupation_id, checked_missions")
            .eq("child_id", studentData.child_id)
            .eq("chosen", true)
            .maybeSingle();

          if (roadmapData) {
            resolvedRoadmapId = roadmapData.occupation_id;
            setChosen(roadmapData.occupation_id);
            const missions = roadmapData.checked_missions as Record<string, boolean>;
            setCompleted(Object.keys(missions).filter((k) => missions[k]));
          }
        }

        // 5. DB 미션 로드 (occupation_student_actions stage 1) ──────────────
        //    legacy_occupation_id → occupation_master.id → student_actions
        //    조회 실패 or 데이터 없으면 정적 ROADMAPS fallback 자동 적용
        if (resolvedRoadmapId) {
          try {
            const gradeGroup = gradeGroupFromGradeLevel(resolvedChild?.grade_level);

            const { data: masterRow } = await supabase
              .from("occupation_master")
              .select("id")
              .eq("legacy_occupation_id", resolvedRoadmapId)
              .eq("is_active", true)
              .maybeSingle();

            if (masterRow) {
              const { data: actionRows } = await supabase
                .from("occupation_student_actions")
                .select("id, stage_title, action_text")
                .eq("occupation_id", masterRow.id)
                .eq("stage_number", 1)
                .in("grade_target", [gradeGroup, "all"])
                .eq("is_current", true)
                .eq("is_active", true)
                .eq("status", "published")
                .order("display_order", { ascending: true })
                .limit(5);

              if (actionRows && actionRows.length > 0) {
                setDbMissions(
                  actionRows.map((a) => ({
                    id:         a.id,
                    text:       a.action_text,
                    stageTitle: a.stage_title,
                  }))
                );
              }
            }
          } catch (err) {
            // DB 미션 로드 실패 시 정적 ROADMAPS fallback 자동 적용 — 사용자 영향 없음
            console.warn(
              "[student/home] DB 미션 조회 오류 (정적 fallback 적용):",
              err instanceof Error ? err.message : String(err)
            );
          }
        }

        // 6. 추천 직업 DB 로드 ────────────────────────────────
        //    Query 1: occupation_master (is_active=true, priority DESC)
        const { data: occRows, error: occErr } = await supabase
          .from("occupation_master")
          .select("id, name_ko, emoji, category, interest_fields, legacy_occupation_id, priority")
          .eq("is_active", true)
          .order("priority", { ascending: false });

        if (occErr) {
          console.warn("[student/home] occupation_master 조회 오류:", occErr.message);
        }

        if (occRows && occRows.length > 0) {
          //    Query 2: occupation_summary (one_liner) — 직업 소개 1줄
          const occIds = occRows.map((r) => r.id);
          const { data: summaryRows } = await supabase
            .from("occupation_summary")
            .select("occupation_id, content")
            .in("occupation_id", occIds)
            .eq("content_type", "one_liner")
            .eq("is_current", true)
            .eq("status", "published");

          const summaryMap: Record<string, string> = {};
          (summaryRows ?? []).forEach((s) => {
            summaryMap[s.occupation_id] = s.content;
          });

          setDbOccs(
            occRows.map((o) => ({
              id:                   o.id,
              name_ko:              o.name_ko,
              emoji:                o.emoji,
              category:             o.category,
              interest_fields:      (o.interest_fields ?? []) as string[],
              legacy_occupation_id: o.legacy_occupation_id as string | null,
              priority:             o.priority ?? 0,
              one_liner:            summaryMap[o.id] ?? null,
            }))
          );
        }
      } catch (err) {
        console.error("[student/home] loadData 오류:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // ── 오늘의 미션 — DB(occupation_student_actions) 우선, 정적 ROADMAPS fallback ──
  // DB 미션: UUID ID → completedMissions(레거시 "m1" 등)와 불일치 → 항상 미완료로 표시
  //          (클릭 시 /roadmap/[id]로 이동하며 static 완료 추적 계속 동작)
  // Fallback: DB 데이터 없는 직업이거나 조회 실패 시 정적 ROADMAPS 사용
  const todayMissions = useMemo(() => {
    // DB 미션 우선
    if (dbMissions.length > 0) {
      return dbMissions.filter((m) => !completedMissions.includes(m.id)).slice(0, 3);
    }
    // fallback: 정적 ROADMAPS
    if (!chosenRoadmapId) return [];
    const roadmap = getRoadmap(chosenRoadmapId);
    if (!roadmap) return [];
    const allMissions = roadmap.stages.flatMap((s) =>
      s.missions.map((m) => ({ ...m, stageTitle: s.title }))
    );
    return allMissions.filter((m) => !completedMissions.includes(m.id)).slice(0, 3);
  }, [chosenRoadmapId, completedMissions, dbMissions]);

  // ── 추천 직업 — 관심분야 교집합 매칭 ────────────────────────
  const recommendedOccupations = useMemo((): DbOccupation[] => {
    if (!dbOccupations.length) return [];
    if (!child?.interests?.length) return dbOccupations.slice(0, 3);

    const interestSet = new Set(child.interests as string[]);
    const matched = dbOccupations.filter((o) =>
      o.interest_fields.some((f) => interestSet.has(f))
    );

    return (matched.length > 0 ? matched : dbOccupations).slice(0, 3);
  }, [dbOccupations, child]);

  // ── 로드맵 진행률 (정적 ROADMAPS 기반) ─────────────────────
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

  // grade_level(초1~고3) 우선, school_grade(초3~고3) fallback
  // 초1·초2 자녀는 grade_level에만 값이 있으므로 반드시 grade_level을 먼저 확인
  const gradeLabel =
    (child?.grade_level && GRADE_LEVEL_LABEL[child.grade_level as GradeLevel])
    ?? (child?.school_grade ? GRADE_LABEL[child.school_grade as Grade] : null)
    ?? null;

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-base-off">

        {/* ── 헤더 ─────────────────────────────────── */}
        <header className="sticky top-0 z-10 bg-white border-b border-base-border px-5 h-14 flex items-center justify-between">
          <Image
            src="/logo.png"
            alt="꿈따라"
            width={66}
            height={28}
            priority
            style={{ objectFit: "contain", objectPosition: "left center" }}
          />
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
              섹션 1 — 오늘의 미션 (정적 ROADMAPS 기반)
          ══════════════════════════════════════════ */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Zap size={15} strokeWidth={2} style={{ color: "#E84B2E" }} />
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
                        <Circle size={18} className="text-base-border mt-0.5 shrink-0" />
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
              섹션 2 — 추천 직업 (DB 기반)
          ══════════════════════════════════════════ */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Compass size={15} strokeWidth={2} style={{ color: "#E84B2E" }} />
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

            {/* 추천 직업 카드 */}
            {recommendedOccupations.length === 0 ? (
              <div className="bg-white rounded-card-lg shadow-card px-4 py-5 text-center">
                <p className="text-sm text-base-muted">
                  추천 직업을 불러오는 중이에요
                </p>
                <button
                  onClick={() => router.push("/explore")}
                  className="mt-2 text-xs font-semibold"
                  style={{ color: "#E84B2E" }}
                >
                  직업 탐색하러 가기 →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {recommendedOccupations.map((occ) => {
                  // legacy_occupation_id가 있으면 라우팅 키로 사용, 없으면 slug로 fallback
                  const roadmapKey = occ.legacy_occupation_id ?? occ.id;
                  const description =
                    occ.one_liner ?? CATEGORY_REASON[occ.category] ?? "탐색해보면 의외로 잘 맞을 수 있어요";

                  return (
                    <button
                      key={occ.id}
                      onClick={() => router.push(`/explore/${roadmapKey}`)}
                      className="
                        bg-white rounded-card-lg shadow-card px-4 py-3.5
                        flex items-start gap-3 text-left
                        hover:shadow-card-hover active:scale-[0.99] transition-all
                      "
                    >
                      <span className="text-2xl leading-none shrink-0 mt-0.5">{occ.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-base-text">{occ.name_ko}</p>
                        <p className="text-xs text-base-muted mt-0.5 leading-relaxed line-clamp-2">
                          {description}
                        </p>
                      </div>
                      <ChevronRight size={15} className="text-base-muted shrink-0 mt-0.5" />
                    </button>
                  );
                })}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
