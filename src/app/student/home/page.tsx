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
// [미션 DB 전환]
//   /roadmap/[occupationId] 와 동일하게
//     ① occupation_preparations(step_action) → prep-{uuid}
//     ② occupation_student_actions(stage_number=1) → action-{uuid}
//   두 소스를 병렬 조회, [...prep, ...action] 순서로 dbMissions 구성
//   파일럿 10개 직업(stage 1, published + is_current=true) → DB 우선
//   Phase 2 신규 직업 or DB miss → 정적 ROADMAPS fallback
//   기존 m1~m4 체크 기록 변환은 별도 작업 예정
//
// 세션 처리:
//   - getUser() null → router.replace('/') 리다이렉트
//   - onAuthStateChange SIGNED_OUT → router.replace('/')
//   - 세션 만료 시 무한 로딩 또는 화이트 스크린 없음
// ====================================================

import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import GuideModal from "@/components/common/GuideModal";
import StudentStartChecklistCard from "@/components/student/StudentStartChecklistCard";
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
  const [chosenRoadmapId, setChosen]      = useState<string | null>(null);
  const [completedMissions, setCompleted] = useState<string[]>([]);
  const [loading, setLoading]             = useState(true);
  /**
   * dbMissions — DB Stage 1 미션 목록 (prep + action 혼합)
   *   null  : 아직 조회 전 (로딩 중)
   *   []    : DB miss 또는 조회 오류 → static ROADMAPS fallback
   *   [...] : [prep-{uuid}..., action-{uuid}...] — /roadmap 페이지와 동일한 구성
   */
  const [dbMissions, setDbMissions]       = useState<{ id: string; text: string; stageTitle: string }[] | null>(null);
  /** GuideModal remount 트리거 — 증가 시 GuideModal 재마운트 → useEffect 재실행 */
  const [guideModalKey, setGuideModalKey] = useState(0);

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

        // 3. 선택된 로드맵 & 완료 미션
        // DB 우선: chosen=true 또는 가장 최근 last_visited_at 기준 직업 사용
        // localStorage는 DB 레코드가 없을 때만 보조 사용 (stale 값 오표시 방지)
        let resolvedRoadmapId: string | null = null;

        if (studentData?.child_id) {
          // DB 우선: chosen DESC → last_visited_at DESC 순으로 최신 선택 직업 결정
          // chosen 컬럼이 없으면 에러 → last_visited_at DESC 만으로 재시도
          const applyRoadmapData = (row: { occupation_id: string; checked_missions: unknown }) => {
            resolvedRoadmapId = row.occupation_id;
            setChosen(row.occupation_id);
            // localStorage를 DB 값으로 동기화 (stale 값 교정)
            localStorage.setItem("kkumddara_chosen_roadmap", row.occupation_id);
            const m = (row.checked_missions ?? {}) as Record<string, boolean>;
            setCompleted(Object.keys(m).filter((k) => m[k]));
          };

          const { data: chosenData, error: chosenErr } = await supabase
            .from("roadmap_progress")
            .select("occupation_id, checked_missions")
            .eq("child_id", studentData.child_id)
            .order("chosen", { ascending: false })
            .order("last_visited_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!chosenErr && chosenData) {
            applyRoadmapData(chosenData);
          } else if (chosenErr) {
            // chosen 컬럼 미존재 등 쿼리 오류 → last_visited_at DESC 로 재시도
            console.warn("[student/home] chosen 정렬 오류, last_visited_at fallback:", chosenErr.message);
            const { data: fallbackData } = await supabase
              .from("roadmap_progress")
              .select("occupation_id, checked_missions")
              .eq("child_id", studentData.child_id)
              .order("last_visited_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (fallbackData) applyRoadmapData(fallbackData);
          }
        }

        // localStorage fallback: DB에 로드맵 기록이 전혀 없을 때만 사용
        // 로그인 사용자의 최우선 값으로 쓰지 않음
        if (!resolvedRoadmapId) {
          const localChosen = localStorage.getItem("kkumddara_chosen_roadmap");
          if (localChosen) {
            resolvedRoadmapId = localChosen;
            setChosen(localChosen);
            const localProgress = localStorage.getItem(`kkumddara_roadmap_${localChosen}`);
            if (localProgress) {
              try { setCompleted(JSON.parse(localProgress)); } catch { /* 파싱 실패 무시 */ }
            }
          }
        }

        // 5. 오늘의 미션 — prep + action DB 우선, static fallback ──────────────
        //    /roadmap/[occupationId] 와 동일하게
        //      ① occupation_preparations(step_action) → prep-{uuid}
        //      ② occupation_student_actions(stage_number=1) → action-{uuid}
        //    두 소스를 병렬 조회해 [...prepMissions, ...actionMissions] 순서로 구성
        //    → checked_missions key가 prep-{uuid}든 action-{uuid}든 모두 비교 가능
        //    DB miss(Phase 2 신규 직업, is_active=false 등)는 [] → static fallback
        if (resolvedRoadmapId) {
          try {
            const { data: masterData } = await supabase
              .from("occupation_master")
              .select("id")
              .eq("legacy_occupation_id", resolvedRoadmapId)
              .eq("is_active", true)
              .maybeSingle();

            if (masterData?.id) {
              // roadmap 페이지와 동일한 병렬 조회
              const [{ data: prepRows }, { data: actionRows }] = await Promise.all([
                supabase
                  .from("occupation_preparations")
                  .select("id, content, display_order")
                  .eq("occupation_id", masterData.id)
                  .eq("is_current", true)
                  .eq("status", "published")
                  .eq("prep_type", "step_action")
                  .order("display_order", { ascending: true }),
                supabase
                  .from("occupation_student_actions")
                  .select("id, action_text, stage_title, display_order")
                  .eq("occupation_id", masterData.id)
                  .eq("stage_number", 1)
                  .eq("is_current", true)
                  .eq("is_active", true)
                  .eq("status", "published")
                  .order("display_order", { ascending: true }),
              ]);

              const prepMissions = (prepRows ?? []).map((r) => ({
                id:         `prep-${r.id}`,
                text:       r.content,
                stageTitle: "탐색하기",
              }));
              const actionMissions = (actionRows ?? []).map((r) => ({
                id:         `action-${r.id}`,
                text:       r.action_text,
                stageTitle: r.stage_title ?? "탐색하기",
              }));

              const allMissions = [...prepMissions, ...actionMissions];

              if (allMissions.length > 0) {
                setDbMissions(allMissions);
              } else {
                setDbMissions([]);
                console.warn("[student/home] DB 미션 없음 — static fallback:", resolvedRoadmapId);
              }
            } else {
              setDbMissions([]);
              console.warn("[student/home] occupation_master 없음 — static fallback:", resolvedRoadmapId);
            }
          } catch (err) {
            setDbMissions([]);
            console.error("[student/home] DB 미션 조회 오류:", err);
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

  // ── 오늘의 미션 — DB(prep + action) 우선, 정적 ROADMAPS fallback ──────────
  //
  // [데이터 흐름]
  //   dbMissions null  → loadData 진행 중 (loading=true 구간, useMemo는 [] 반환)
  //   dbMissions []    → DB miss or 조회 오류 → static ROADMAPS 기반 계산
  //   dbMissions [...] → [prep-{uuid}..., action-{uuid}...] 기준으로 completedMissions 비교
  //
  // [completedMissions 키 체계]
  //   DB 파일럿 직업: roadmap 페이지와 동일하게 prep-{uuid} / action-{uuid} 모두 비교 ✅
  //   static fallback: m1~m4 레거시 키 → static 완료 비교 (기존 동작 유지)

  /**
   * hasMissionData — 표시 가능한 미션 데이터가 존재하는지 여부
   *
   * [사용 목적]
   *   todayMissions === [] 일 때 "완료 상태"와 "데이터 미준비 상태"를 구분해
   *   잘못된 "모든 미션을 완료했어요!" 표시를 방지한다.
   */
  const hasMissionData = useMemo(() => {
    // DB 미션이 있으면 항상 데이터 있음
    if (dbMissions && dbMissions.length > 0) return true;
    // static ROADMAPS fallback 기준
    if (!chosenRoadmapId) return false;
    const roadmap = getRoadmap(chosenRoadmapId);
    if (!roadmap) return false;
    return roadmap.stages.flatMap((s) => s.missions).length > 0;
  }, [chosenRoadmapId, dbMissions]);

  // ── 오늘의 미션 — DB 우선 + static ROADMAPS fallback ──────────
  // DB 파일럿 직업: action-{uuid} 기준으로 완료 여부 비교
  // fallback:       m1~m4 정적 ID 기준 (기존 동작 유지)
  const todayMissions = useMemo(() => {
    if (!chosenRoadmapId) return [];

    const completedSet = new Set(completedMissions);

    // DB 미션 우선 (dbMissions가 null이면 로딩 중 → 빈 배열 반환해 깜빡임 방지)
    if (dbMissions && dbMissions.length > 0) {
      return dbMissions
        .filter((m) => !completedSet.has(m.id))
        .slice(0, 3);
    }

    // static ROADMAPS fallback (Phase 2 신규 직업 or DB miss)
    const roadmap = getRoadmap(chosenRoadmapId);
    if (!roadmap) return [];
    const allMissions = roadmap.stages.flatMap((s) =>
      s.missions.map((m) => ({ ...m, stageTitle: s.title }))
    );
    return allMissions.filter((m) => !completedSet.has(m.id)).slice(0, 3);
  }, [chosenRoadmapId, completedMissions, dbMissions]);

  // ── 내 활동 — 완료한 미션 상세 (최근 3개) ──────────────────
  // 학생 홈 "내 활동" 섹션에서 사용
  const completedMissionDetails = useMemo(() => {
    if (!completedMissions.length || !chosenRoadmapId) return [];
    const completedSet = new Set(completedMissions);

    // DB 미션 기준
    if (dbMissions && dbMissions.length > 0) {
      return dbMissions.filter((m) => completedSet.has(m.id)).slice(0, 3);
    }

    // static ROADMAPS fallback
    const roadmap = getRoadmap(chosenRoadmapId);
    if (!roadmap) return [];
    const all = roadmap.stages.flatMap((s) =>
      s.missions.map((m) => ({ id: m.id, text: m.text, stageTitle: s.title }))
    );
    return all.filter((m) => completedSet.has(m.id)).slice(0, 3);
  }, [completedMissions, chosenRoadmapId, dbMissions]);

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

  // ── 로드맵 진행률 ────────────────────────────────────────────
  // chosenRoadmap : 파일럿 10개 직업 (정적 ROADMAPS 존재) → 그대로 사용
  // dbChosenOcc   : 신규 DB 직업 (정적 ROADMAPS 없음) → occupation_master 기반 fallback
  const chosenRoadmap = chosenRoadmapId ? getRoadmap(chosenRoadmapId) : null;
  const dbChosenOcc   = chosenRoadmapId
    ? dbOccupations.find((o) => o.legacy_occupation_id === chosenRoadmapId) ?? null
    : null;
  const totalMissions = chosenRoadmap
    ? chosenRoadmap.stages.flatMap((s) => s.missions).length
    : (dbMissions?.length ?? 0);
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
      {/* ── 첫 방문 가이드 팝업 ─────────────────────────────────
          localStorage key: "kkumddara_student_guide_seen"
          최초 진입 시 1회만 노출. 닫으면 이후 미노출. */}
      <GuideModal
        key={guideModalKey}
        storageKey="kkumddara_student_guide_seen"
        title="꿈따라에 온 걸 환영해요"
        intro="꿈따라는 네가 좋아하는 것에서부터 미래의 일을 찾아보는 공간이에요."
        introSub="정답을 고르는 곳이 아니라, 내가 어떤 걸 좋아하는지 알아가는 곳이에요."
        stepsIntro="처음에는 이렇게 해보세요."
        steps={[
          { num: 1, heading: "내가 좋아하는 것을 골라요" },
          { num: 2, heading: "궁금한 직업을 눌러봐요" },
          { num: 3, heading: "마음에 드는 직업은 저장해요" },
        ]}
        ctaLabel="시작하기"
      />

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
              처음 하기 좋은 것 안내 카드
              - 단순 안내 카드 (체크 상태 저장 없음)
              - 추후 사용자 행동 데이터와 연결 예정
          ══════════════════════════════════════════ */}
          <StudentStartChecklistCard />

          {/* ══════════════════════════════════════════
              섹션 1 — 오늘의 미션
              (DB occupation_student_actions 우선,
               Phase 2 직업 등 DB miss 시 static ROADMAPS fallback)
          ══════════════════════════════════════════ */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Zap size={15} strokeWidth={2} style={{ color: "#E84B2E" }} />
                <h2 className="text-sm font-bold text-base-text">오늘의 미션</h2>
              </div>
              {chosenRoadmapId && (
                <button
                  onClick={() => router.push(`/roadmap/${chosenRoadmapId}`)}
                  className="text-xs text-base-muted flex items-center gap-0.5"
                >
                  전체 보기 <ChevronRight size={12} />
                </button>
              )}
            </div>

            <div className="bg-white rounded-card-lg shadow-card overflow-hidden">
              {!chosenRoadmapId ? (
                <button
                  onClick={() => router.push("/explore")}
                  className="w-full p-5 text-left hover:bg-base-off transition-colors"
                >
                  <p className="text-sm font-bold text-base-text">
                    아직 저장한 직업이 없어요. 첫 직업을 찾아볼까요?
                  </p>
                  <p className="text-xs text-base-muted mt-1">
                    관심 직업을 찾고 나만의 로드맵을 시작해 보세요.
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
                          {chosenRoadmap?.occupationEmoji ?? dbChosenOcc?.emoji ?? "📋"}
                        </span>
                        <span className="text-sm font-bold text-base-text">
                          {chosenRoadmap?.occupationName ?? dbChosenOcc?.name_ko ?? chosenRoadmapId ?? "선택한 직업"}
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
                    hasMissionData ? (
                      /* 미션 데이터는 있으나 모두 완료한 경우 */
                      <div className="px-4 py-5 text-center">
                        <p className="text-sm font-bold text-base-text">
                          모든 미션을 완료했어요!
                        </p>
                        <p className="text-xs text-base-muted mt-1">
                          정말 대단해요. 다음 목표를 찾아볼까요?
                        </p>
                      </div>
                    ) : (
                      /* 미션 데이터 자체가 없는 경우 (데이터 미준비) */
                      <div className="px-4 py-5 text-center">
                        <p className="text-sm font-bold text-base-text">
                          더 알찬 미션을 준비 중이에요! 곧 업데이트될 예정이니 기대해주세요.
                        </p>
                        <p className="text-xs text-base-muted mt-1">
                          직업 탐색과 로드맵 확인을 먼저 진행해 주세요.
                        </p>
                      </div>
                    )
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
              섹션 1.5 — 내 활동
              완료한 미션 중심으로 학생 스스로 확인.
              부모 주간 리포트와 분리된 학생 전용 활동 기록.
              - 완료 미션 있음: 개수 + 최근 3개 목록 + 로드맵 버튼
              - 완료 미션 없음: 빈 상태 안내 + 탐색 버튼
          ══════════════════════════════════════════ */}
          <section>
            <div className="flex items-center gap-1.5 mb-3">
              <Zap size={15} strokeWidth={2} style={{ color: "#E84B2E" }} />
              <h2 className="text-sm font-bold text-base-text">내 활동</h2>
            </div>

            <div className="bg-white rounded-card-lg shadow-card overflow-hidden">
              {completedMissions.length === 0 ? (
                /* 완료한 미션 없음 */
                <div className="px-4 py-5">
                  <p className="text-sm font-bold text-base-text mb-1">
                    아직 완료한 미션이 없어요.
                  </p>
                  <p className="text-xs text-base-muted leading-relaxed mb-3">
                    관심 있는 직업을 골라 작은 미션부터 시작해볼까요?
                  </p>
                  <button
                    onClick={() => router.push("/explore")}
                    className="inline-flex items-center gap-1 text-xs font-semibold"
                    style={{ color: "#E84B2E" }}
                  >
                    직업 탐색하러 가기 <ChevronRight size={13} />
                  </button>
                </div>
              ) : (
                /* 완료한 미션 있음 */
                <div>
                  <div className="px-4 pt-4 pb-3 border-b border-base-border">
                    <p className="text-sm font-bold text-base-text">
                      지금까지 {completedMissions.length}개의 미션을 완료했어요.
                    </p>
                    <p className="text-xs text-base-muted mt-0.5 leading-relaxed">
                      작은 활동이 모이면 내가 좋아하는 일을 더 잘 알 수 있어요.
                    </p>
                  </div>

                  {completedMissionDetails.length > 0 && (
                    <div className="px-4 py-3 border-b border-base-border">
                      <p className="text-xs font-semibold text-base-muted mb-2">최근 완료한 미션</p>
                      <div className="flex flex-col gap-1.5">
                        {completedMissionDetails.map((m) => (
                          <div key={m.id} className="flex items-start gap-2">
                            <span className="text-xs mt-0.5" style={{ color: "#E84B2E" }}>✓</span>
                            <p className="text-xs text-base-text leading-relaxed">{m.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="px-4 py-3">
                    <button
                      onClick={() => router.push(chosenRoadmapId ? `/roadmap/${chosenRoadmapId}` : "/explore")}
                      className="inline-flex items-center gap-1 text-xs font-semibold"
                      style={{ color: "#E84B2E" }}
                    >
                      로드맵 이어가기 <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
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

          {/* ── 사용 가이드 다시 보기 ── */}
          <div className="flex justify-center py-1">
            <button
              onClick={() => {
                localStorage.removeItem("kkumddara_student_guide_seen");
                setGuideModalKey((k) => k + 1);
              }}
              className="text-xs text-base-muted underline active:opacity-60 transition-opacity py-2 px-3"
            >
              사용 가이드 다시 보기
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
