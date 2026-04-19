"use client";

// ====================================================
// 직업 상세 페이지 (/explore/[id])
//
// [데이터 소스 — 이중 모드]
//   DB 모드  : occupation_master (legacy_occupation_id = params.id)
//              + occupation_summary (one_liner / easy_description / why_this_job)
//              + occupation_preparations (mission_hint / step_action)
//   정적 폴백: DB 미등록 직업 → OCCUPATIONS 정적 데이터 유지
//
// [라우팅 호환]
//   params.id = legacy_occupation_id (A안 브리지)
//   /explore 카드 → legacy_occupation_id ?? slug 기준으로 진입
//
// [섹션 구성 — DB 모드]
//   ① 직업 소개  : one_liner(강조) + easy_description
//   ② 왜 이 직업?: why_this_job
//   ③ 관심 분야  : interest_fields (코드 → 한국어 레이블)
//   ④ 지금 할 수 있는 준비: mission_hint(강조박스) + step_action(체크리스트)
//   ⑤ 퀴즈      : 정적 QUIZ_DATA 유지
//   [숨김] 관련 학과·추천 대학, 직업 전망 (DB 미지원)
//
// [섹션 구성 — 정적 폴백]
//   기존 5개 섹션 전부 유지 (역량·학과·준비·전망·퀴즈)
// ====================================================

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Heart, TrendingUp, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { OCCUPATIONS } from "@/data/occupations";
import OccupationQuiz from "@/components/quiz/OccupationQuiz";
import { QUIZ_DATA } from "@/data/quizData";
import type { Occupation } from "@/types/occupation";

// ── 상수 ────────────────────────────────────────────────
const LIKED_KEY    = "kkumddara_liked";
const SALARY_MAX_REF = 10000; // 연봉 바 기준 (만원)

// interest_fields 코드 → 한국어 레이블 매핑
const INTEREST_LABELS: Record<string, string> = {
  it:        "IT·기술",
  art:       "예술·창작",
  medical:   "의료·과학",
  business:  "경영·비즈니스",
  education: "교육·사람",
};

// ── 타입 ────────────────────────────────────────────────
interface DbMaster {
  id:              string;
  slug:            string;
  name_ko:         string;
  emoji:           string;
  category:        string;
  interest_fields: string[];
}

// 페이지 렌더 모드 (discriminated union)
type PageState =
  | { mode: "loading" }
  | {
      mode: "db";
      master:      DbMaster;
      summaries:   Record<string, string>; // content_type → content
      missionHint: string | null;
      stepActions: string[];
    }
  | { mode: "static"; occupation: Occupation }
  | { mode: "not-found" };

// ── 컴포넌트 ─────────────────────────────────────────────
export default function OccupationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [pageState,    setPageState]    = useState<PageState>({ mode: "loading" });
  const [liked,        setLiked]        = useState(false);
  const [checkedPreps, setCheckedPreps] = useState<Set<number>>(new Set());

  // 퀴즈는 항상 정적 데이터 (DB 모드/정적 모드 공통)
  const quizData = QUIZ_DATA.find((q) => q.occupationId === id);

  // ── localStorage 찜 상태 복원 ──────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem(LIKED_KEY);
    if (stored) {
      const likedIds: string[] = JSON.parse(stored);
      setLiked(likedIds.includes(id));
    }
  }, [id]);

  // ── DB fetch ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      setPageState({ mode: "loading" });
      setCheckedPreps(new Set());

      try {
        // 1단계: occupation_master — legacy_occupation_id = params.id
        // (A안: 카드가 legacy_occupation_id로 라우팅했으므로 동일 값으로 조회)
        const { data: master, error: masterErr } = await supabase
          .from("occupation_master")
          .select("id, slug, name_ko, emoji, category, interest_fields")
          .eq("legacy_occupation_id", id)
          .eq("is_active", true)
          .maybeSingle();

        if (masterErr) throw masterErr;

        // DB 미등록 직업 → 정적 폴백
        if (!master) {
          const staticOcc = OCCUPATIONS.find((o) => o.id === id);
          if (!cancelled) {
            setPageState(
              staticOcc
                ? { mode: "static", occupation: staticOcc }
                : { mode: "not-found" }
            );
          }
          return;
        }

        // 2단계: occupation_summary (one_liner / easy_description / why_this_job)
        const { data: summaryRows, error: sumErr } = await supabase
          .from("occupation_summary")
          .select("content_type, content")
          .eq("occupation_id", master.id)
          .eq("layer", "service")
          .eq("is_current", true)
          .eq("status", "published")
          .in("content_type", ["one_liner", "easy_description", "why_this_job"]);

        if (sumErr) throw sumErr;

        const summaries: Record<string, string> = {};
        for (const row of summaryRows ?? []) {
          summaries[row.content_type] = row.content;
        }

        // 3단계: occupation_preparations (mission_hint / step_action)
        // display_order ASC 정렬 → 순서 보장
        const { data: prepRows, error: prepErr } = await supabase
          .from("occupation_preparations")
          .select("prep_type, content, display_order")
          .eq("occupation_id", master.id)
          .eq("layer", "service")
          .eq("is_current", true)
          .eq("status", "published")
          .in("prep_type", ["mission_hint", "step_action"])
          .order("prep_type",     { ascending: true })
          .order("display_order", { ascending: true });

        if (prepErr) throw prepErr;

        const missionHint =
          prepRows?.find((p) => p.prep_type === "mission_hint")?.content ?? null;
        const stepActions =
          prepRows
            ?.filter((p) => p.prep_type === "step_action")
            .map((p) => p.content) ?? [];

        if (!cancelled) {
          setPageState({ mode: "db", master, summaries, missionHint, stepActions });
        }
      } catch (err) {
        console.error("[explore/[id]] detail fetch 실패:", err);
        // fetch 실패 시에도 정적 폴백 시도
        const staticOcc = OCCUPATIONS.find((o) => o.id === id);
        if (!cancelled) {
          setPageState(
            staticOcc
              ? { mode: "static", occupation: staticOcc }
              : { mode: "not-found" }
          );
        }
      }
    }

    loadDetail();
    return () => { cancelled = true; };
  }, [id]);

  // ── 찜 토글 + localStorage 동기화 ─────────────────────
  const toggleLike = () => {
    const stored  = localStorage.getItem(LIKED_KEY);
    const likedIds: string[] = stored ? JSON.parse(stored) : [];
    const next    = liked
      ? likedIds.filter((l) => l !== id)
      : [...likedIds, id];
    localStorage.setItem(LIKED_KEY, JSON.stringify(next));
    setLiked(!liked);
  };

  // ── 준비 항목 체크 토글 ───────────────────────────────
  const togglePrep = (idx: number) => {
    setCheckedPreps((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  // ── 로딩 ─────────────────────────────────────────────
  if (pageState.mode === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-off">
        <p className="text-sm text-base-muted animate-pulse">불러오는 중…</p>
      </div>
    );
  }

  // ── 직업 없음 ─────────────────────────────────────────
  if (pageState.mode === "not-found") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-off">
        <div className="text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-base font-bold text-base-text">
            직업 정보를 찾을 수 없어요
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm text-brand-red font-semibold"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // ====================================================
  // ── DB 모드 렌더 ─────────────────────────────────────
  // ====================================================
  if (pageState.mode === "db") {
    const { master, summaries, missionHint, stepActions } = pageState;

    return (
      <div className="min-h-screen bg-base-off flex justify-center">
        <div className="w-full max-w-mobile bg-base-off pb-28">

          {/* ---- 상단 헤더 ---- */}
          <div className="sticky top-0 z-50 bg-white border-b border-base-border">
            <div className="flex items-center justify-between px-4 h-14">
              <button
                onClick={() => router.back()}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-off transition-colors"
                aria-label="뒤로가기"
              >
                <ArrowLeft size={20} className="text-base-text" />
              </button>
              <h1 className="text-sm font-bold text-base-text">직업 상세</h1>
              <button
                onClick={toggleLike}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-off transition-colors"
                aria-label={liked ? "찜 해제" : "찜하기"}
              >
                <Heart
                  size={20}
                  className={cn(
                    "transition-colors",
                    liked ? "fill-brand-red text-brand-red" : "text-base-muted"
                  )}
                />
              </button>
            </div>
          </div>

          {/* ---- 히어로 ---- */}
          <div className="bg-white px-5 py-8 flex flex-col items-center text-center border-b border-base-border">
            <span className="text-6xl mb-4 leading-none">{master.emoji}</span>
            <h2 className="text-2xl font-bold text-base-text">{master.name_ko}</h2>
            <span className="mt-1.5 text-xs font-medium text-white bg-brand-red px-3 py-1 rounded-full">
              {master.category}
            </span>
          </div>

          {/* ---- 카드 섹션 목록 ---- */}
          <div className="px-4 py-4 flex flex-col gap-3">

            {/* ① 직업 소개: one_liner(강조) + easy_description */}
            {(summaries.one_liner || summaries.easy_description) && (
              <section className="card">
                <h3 className="text-sm font-bold text-base-text mb-2">직업 소개</h3>
                {summaries.one_liner && (
                  <p className="text-sm font-semibold text-brand-red mb-2 leading-snug">
                    {summaries.one_liner}
                  </p>
                )}
                {summaries.easy_description && (
                  <p className="text-sm text-base-muted leading-relaxed">
                    {summaries.easy_description}
                  </p>
                )}
              </section>
            )}

            {/* ② 왜 이 직업인가요? */}
            {summaries.why_this_job && (
              <section className="card">
                <h3 className="text-sm font-bold text-base-text mb-2">왜 이 직업인가요?</h3>
                <p className="text-sm text-base-muted leading-relaxed">
                  {summaries.why_this_job}
                </p>
              </section>
            )}

            {/* ③ 관심 분야: interest_fields 코드 → 한국어 태그 */}
            {master.interest_fields.length > 0 && (
              <section className="card">
                <h3 className="text-sm font-bold text-base-text mb-3">관심 분야</h3>
                <div className="flex flex-wrap gap-2">
                  {master.interest_fields.map((field) => (
                    <span
                      key={field}
                      className="px-3 py-1.5 bg-brand-light text-brand-red text-xs font-semibold rounded-full"
                    >
                      {INTEREST_LABELS[field] ?? field}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* ④ 지금 할 수 있는 준비 */}
            {(missionHint || stepActions.length > 0) && (
              <section className="card">
                <h3 className="text-sm font-bold text-base-text mb-3">
                  지금 할 수 있는 준비
                </h3>

                {/* mission_hint: 강조 박스 */}
                {missionHint && (
                  <div className="bg-brand-light rounded-lg px-3 py-3 mb-3">
                    <p className="text-xs font-bold text-brand-red mb-1">
                      💡 시작하기 전에
                    </p>
                    <p className="text-sm text-base-text leading-relaxed">
                      {missionHint}
                    </p>
                  </div>
                )}

                {/* step_actions: 체크리스트 */}
                {stepActions.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {stepActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => togglePrep(idx)}
                        className="flex items-center gap-3 text-left w-full"
                      >
                        <span
                          className={cn(
                            "w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all",
                            checkedPreps.has(idx)
                              ? "bg-brand-red border-brand-red"
                              : "border-base-border"
                          )}
                        >
                          {checkedPreps.has(idx) && (
                            <span className="text-white text-[10px] font-bold leading-none">
                              ✓
                            </span>
                          )}
                        </span>
                        <span
                          className={cn(
                            "text-sm transition-colors",
                            checkedPreps.has(idx)
                              ? "text-base-muted line-through"
                              : "text-base-text"
                          )}
                        >
                          {action}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ⑤ 퀴즈 (정적 QUIZ_DATA 유지) */}
            {quizData && (
              <section>
                <OccupationQuiz quizData={quizData} />
              </section>
            )}

          </div>

          {/* ---- 하단 고정 버튼 ---- */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile px-4 py-4 bg-white border-t border-base-border safe-bottom z-50">
            <button
              onClick={() => {
                localStorage.setItem("kkumddara_chosen_roadmap", id);
                router.push(`/roadmap/${id}`);
              }}
              className="btn-primary"
            >
              이 직업으로 로드맵 만들기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // ── 정적 폴백 모드 렌더 (DB 미등록 직업) ──────────────
  // ====================================================
  const { occupation } = pageState; // mode === "static"

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-base-off pb-28">

        {/* ---- 상단 헤더 ---- */}
        <div className="sticky top-0 z-50 bg-white border-b border-base-border">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-off transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeft size={20} className="text-base-text" />
            </button>
            <h1 className="text-sm font-bold text-base-text">직업 상세</h1>
            <button
              onClick={toggleLike}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-off transition-colors"
              aria-label={liked ? "찜 해제" : "찜하기"}
            >
              <Heart
                size={20}
                className={cn(
                  "transition-colors",
                  liked ? "fill-brand-red text-brand-red" : "text-base-muted"
                )}
              />
            </button>
          </div>
        </div>

        {/* ---- 히어로 ---- */}
        <div className="bg-white px-5 py-8 flex flex-col items-center text-center border-b border-base-border">
          <span className="text-6xl mb-4 leading-none">{occupation.emoji}</span>
          <h2 className="text-2xl font-bold text-base-text">{occupation.name}</h2>
          <span className="mt-1.5 text-xs font-medium text-white bg-brand-red px-3 py-1 rounded-full">
            {occupation.category}
          </span>
        </div>

        {/* ---- 카드 섹션 목록 ---- */}
        <div className="px-4 py-4 flex flex-col gap-3">

          {/* ① 직업 소개 */}
          <section className="card">
            <h3 className="text-sm font-bold text-base-text mb-2">직업 소개</h3>
            <p className="text-sm text-base-muted leading-relaxed">
              {occupation.description}
            </p>
          </section>

          {/* ② 필요 역량 */}
          <section className="card">
            <h3 className="text-sm font-bold text-base-text mb-3">필요 역량</h3>
            <div className="flex flex-wrap gap-2">
              {occupation.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 bg-brand-light text-brand-red text-xs font-semibold rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          {/* ③ 관련 학과 및 추천 대학 */}
          <section className="card">
            <h3 className="text-sm font-bold text-base-text mb-3">
              관련 학과 및 추천 대학
            </h3>
            <div className="flex flex-col gap-4">
              {occupation.relatedMajors.map((major) => (
                <div key={major.name}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red flex-shrink-0" />
                    <span className="text-sm font-semibold text-base-text">
                      {major.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-3.5">
                    {major.universities.map((univ) => (
                      <span
                        key={univ}
                        className="text-xs bg-base-card text-base-muted px-2.5 py-1 rounded-full"
                      >
                        {univ}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ④ 지금 할 수 있는 준비 */}
          <section className="card">
            <h3 className="text-sm font-bold text-base-text mb-3">
              지금 할 수 있는 준비
            </h3>
            <div className="flex flex-col gap-3">
              {occupation.preparations.map((prep, idx) => (
                <button
                  key={idx}
                  onClick={() => togglePrep(idx)}
                  className="flex items-center gap-3 text-left w-full"
                >
                  <span
                    className={cn(
                      "w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all",
                      checkedPreps.has(idx)
                        ? "bg-brand-red border-brand-red"
                        : "border-base-border"
                    )}
                  >
                    {checkedPreps.has(idx) && (
                      <span className="text-white text-[10px] font-bold leading-none">
                        ✓
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      checkedPreps.has(idx)
                        ? "text-base-muted line-through"
                        : "text-base-text"
                    )}
                  >
                    {prep}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* ⑤ 직업 전망 */}
          <section className="card">
            <h3 className="text-sm font-bold text-base-text mb-4">직업 전망</h3>

            {/* 예상 연봉 바 그래프 */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-base-muted">예상 연봉 범위</span>
                <span className="text-xs font-semibold text-base-text">
                  {occupation.salaryMin.toLocaleString()}
                  <span className="text-base-muted font-normal">~</span>
                  {occupation.salaryMax.toLocaleString()}만원
                </span>
              </div>
              <div className="relative h-2.5 bg-base-border rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-transparent"
                  style={{
                    width: `${(occupation.salaryMin / SALARY_MAX_REF) * 100}%`,
                  }}
                />
                <div
                  className="absolute inset-y-0 rounded-full"
                  style={{
                    left: `${(occupation.salaryMin / SALARY_MAX_REF) * 100}%`,
                    width: `${
                      ((occupation.salaryMax - occupation.salaryMin) / SALARY_MAX_REF) * 100
                    }%`,
                    background: "linear-gradient(90deg, #E84B2E, #FF7043)",
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-base-muted">0</span>
                <span className="text-[10px] text-base-muted">1억원</span>
              </div>
            </div>

            {/* 연간 성장률 */}
            <div className="flex items-center justify-between py-3 border-t border-base-border">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-brand-red" />
                <span className="text-sm text-base-text">연간 성장률</span>
              </div>
              <span className="text-sm font-bold text-brand-red">
                +{occupation.growthRate}%
              </span>
            </div>

            {/* 미래 유망도 */}
            <div className="flex items-center justify-between py-3 border-t border-base-border">
              <span className="text-sm text-base-text">미래 유망도</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < occupation.futureRating
                        ? "fill-brand-orange text-brand-orange"
                        : "text-base-border"
                    }
                  />
                ))}
              </div>
            </div>
          </section>

          {/* ⑥ 직업 연계 퀴즈 */}
          {quizData && (
            <section>
              <OccupationQuiz quizData={quizData} />
            </section>
          )}

        </div>

        {/* ---- 하단 고정 버튼 ---- */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile px-4 py-4 bg-white border-t border-base-border safe-bottom z-50">
          <button
            onClick={() => {
              localStorage.setItem("kkumddara_chosen_roadmap", id);
              router.push(`/roadmap/${id}`);
            }}
            className="btn-primary"
          >
            이 직업으로 로드맵 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
