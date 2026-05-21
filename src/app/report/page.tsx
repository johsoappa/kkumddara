"use client";

// ====================================================
// 부모 주간 리포트 (/report) — 베타 v3
// [2026-05] 그래프/시각 요약 보정
//
// [추가된 시각 요소]
//   - 이번 주 관심 요약 카드 3개 (관심 직업 수 / 가장 많이 본 분야 / 추천 대화)
//   - 관심 분야 분포 막대 그래프 (CSS/Tailwind 기반, 차트 라이브러리 미사용)
//   - 추천 활동 체크형 카드 (시각용 표시, 저장 기능 미포함)
//
// [데이터 변경]
//   occupation_master 매칭 범위: top3 → 최대 20개 (그래프 계산용)
//   추가 테이블 없음 / migration 없음 / RLS 변경 없음
//
// [변경하지 않은 것]
//   DB schema / RLS / auth / AI 상담 API / 명따라 / 요금제 / 직업 데이터
// ====================================================

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { supabase } from "@/lib/supabase";
import { ChevronRight, MessageSquare, BookOpen } from "lucide-react";

// ── 날짜 헬퍼 ─────────────────────────────────────────────

function getDateRange(): string {
  const now  = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 6);
  const fmt = (d: Date) => `${d.getMonth() + 1}월 ${d.getDate()}일`;
  return `${fmt(from)} ~ ${fmt(now)}`;
}

function get7DaysAgoISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

// ── 타입 ───────────────────────────────────────────────────

type LikedOcc = {
  occupationId: string;   // liked_occupations.occupation_id
  masterId:     string;   // occupation_master.id (UUID)
  name:         string;
  emoji:        string | null;
  category:     string | null;
};

type CategoryEntry = {
  category: string;
  count:    number;
  barPct:   number;  // 0–100, max 기준 상대 비율 (시각용)
};

type ReportData = {
  childName:          string;
  likedOccs:          LikedOcc[];  // 화면 표시용 top 3
  allMatchedOccs:     LikedOcc[];  // 그래프 계산용 최대 20개
  totalLikedCount:    number;      // 전체 좋아요 수 (요약 카드용)
  displayTotal:       number;      // 표시 대상 총 개수 (7일 or 전체)
  isRecent7Days:      boolean;
  recommendedAction:  string | null;
  recommendedOccName: string | null;
};

// ── 관심 분야 분포 계산 ────────────────────────────────────
// 최대 4개 분야, count 내림차순, 막대 너비 = max 대비 상대 비율

function computeCategoryDist(occs: LikedOcc[]): CategoryEntry[] {
  if (occs.length === 0) return [];
  const freq: Record<string, number> = {};
  for (const occ of occs) {
    const cat = occ.category?.trim() || "기타";
    freq[cat] = (freq[cat] ?? 0) + 1;
  }
  const sorted = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const maxCount = sorted[0]?.[1] ?? 1;
  return sorted.map(([cat, cnt]) => ({
    category: cat,
    count:    cnt,
    barPct:   Math.round((cnt / maxCount) * 100),
  }));
}

// ── 대화 질문 템플릿 ───────────────────────────────────────

function buildConversationQuestions(occs: LikedOcc[]): string[] {
  if (occs.length === 0) {
    return [
      "요즘 가장 재미있게 본 영상이나 책은 뭐야?",
      "어떤 일을 할 때 시간이 빨리 가?",
      "사람을 돕는 일, 만드는 일, 설명하는 일 중 어떤 게 더 재미있어?",
    ];
  }
  if (occs.length === 1) {
    const name = occs[0].name;
    return [
      `"${name}에서 어떤 점이 가장 멋있어 보였어?"`,
      `"이 일을 하는 사람은 어떤 책임을 가지고 있을까?"`,
      `"이번 주에 이 직업과 관련해서 안전하게 해볼 수 있는 작은 활동은 무엇일까?"`,
    ];
  }
  const a = occs[0].name;
  const b = occs[1].name;
  return [
    `"${a}와 ${b} 중 어떤 직업이 더 궁금해?"`,
    `"두 직업은 어떤 점이 비슷하고 어떤 점이 다를까?"`,
    `"실제로 해본다면 어떤 활동부터 해보고 싶어?"`,
  ];
}

// ── FadeInSection ──────────────────────────────────────────

function FadeInSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref     = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────

export default function ReportPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [noChild, setNoChild] = useState(false);
  const [report,  setReport]  = useState<ReportData | null>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        // ── 1. 인증 ───────────────────────────────────────
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.replace("/"); return; }

        // ── 2. parent 확인 ────────────────────────────────
        const { data: parentData } = await supabase
          .from("parent")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!parentData) { router.replace("/"); return; }

        // ── 3. 첫 번째 active child ───────────────────────
        const { data: childData } = await supabase
          .from("child")
          .select("id, name")
          .eq("parent_id", parentData.id)
          .eq("profile_status", "active")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (!childData) { setNoChild(true); setLoading(false); return; }

        const childId   = childData.id   as string;
        const childName = childData.name as string;

        // ── 4. 최근 7일 + 전체 liked_occupations (병렬) ───
        const sevenDaysAgo = get7DaysAgoISO();
        const [recentRes, allRes] = await Promise.all([
          supabase
            .from("liked_occupations")
            .select("occupation_id")
            .eq("child_id", childId)
            .gte("liked_at", sevenDaysAgo)
            .order("liked_at", { ascending: false }),
          supabase
            .from("liked_occupations")
            .select("occupation_id")
            .eq("child_id", childId)
            .order("liked_at", { ascending: false }),
        ]);

        const recentRows      = recentRes.data ?? [];
        const allRows         = allRes.data    ?? [];
        const isRecent7       = recentRows.length > 0;
        const displayRows     = isRecent7 ? recentRows : allRows;
        const displayTotal    = displayRows.length;
        const totalLikedCount = allRows.length;

        // ── 5. occupation_master 매칭 (그래프用: 최대 20개) ─
        //   top3 표시 + 최대 20개 그래프 계산을 한 번에 처리
        const graphIds = displayRows
          .slice(0, 20)
          .map((r) => r.occupation_id as string);

        type MasterRow = {
          id:                   string;
          slug:                 string;
          name_ko:              string;
          emoji:                string | null;
          category:             string | null;
          legacy_occupation_id: string | null;
        };

        let allMatchedOccs: LikedOcc[] = [];

        if (graphIds.length > 0) {
          // legacy_occupation_id 우선 조회
          const { data: byLegacy } = await supabase
            .from("occupation_master")
            .select("id, slug, name_ko, emoji, category, legacy_occupation_id")
            .in("legacy_occupation_id", graphIds)
            .eq("is_active", true);

          const foundLegacyIds = new Set(
            (byLegacy ?? []).map((m) => m.legacy_occupation_id as string)
          );
          const unmatchedIds = graphIds.filter((id) => !foundLegacyIds.has(id));

          let bySlug: MasterRow[] = [];
          if (unmatchedIds.length > 0) {
            const { data } = await supabase
              .from("occupation_master")
              .select("id, slug, name_ko, emoji, category, legacy_occupation_id")
              .in("slug", unmatchedIds)
              .eq("is_active", true);
            bySlug = (data ?? []) as MasterRow[];
          }

          const masterMap = new Map<
            string,
            { masterId: string; name: string; emoji: string | null; category: string | null }
          >();
          for (const m of [...(byLegacy ?? []), ...bySlug] as MasterRow[]) {
            const key = (m.legacy_occupation_id ?? m.slug) as string;
            masterMap.set(key, {
              masterId: m.id,
              name:     m.name_ko,
              emoji:    m.emoji,
              category: m.category,
            });
          }

          // graphIds 순서 유지 (liked_at desc 순)
          allMatchedOccs = graphIds
            .map((id) => {
              const info = masterMap.get(id);
              if (!info) return null;
              return {
                occupationId: id,
                masterId:     info.masterId,
                name:         info.name,
                emoji:        info.emoji,
                category:     info.category,
              } satisfies LikedOcc;
            })
            .filter((x): x is LikedOcc => x !== null);
        }

        const likedOccs = allMatchedOccs.slice(0, 3);

        // ── 6. 추천 활동 (첫 번째 관심 직업, stage_number=1) ─
        let recommendedAction:  string | null = null;
        let recommendedOccName: string | null = null;

        if (likedOccs.length > 0) {
          recommendedOccName = likedOccs[0].name;
          const { data: actionRow } = await supabase
            .from("occupation_student_actions")
            .select("action_text")
            .eq("occupation_id", likedOccs[0].masterId)
            .eq("stage_number", 1)
            .eq("is_current", true)
            .eq("is_active", true)
            .eq("status", "published")
            .order("display_order", { ascending: true })
            .limit(1)
            .maybeSingle();
          recommendedAction = actionRow?.action_text ?? null;
        }

        setReport({
          childName,
          likedOccs,
          allMatchedOccs,
          totalLikedCount,
          displayTotal,
          isRecent7Days: isRecent7,
          recommendedAction,
          recommendedOccName,
        });
      } catch (err) {
        console.error("[report] loadReport 오류:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [router]);

  // ── 로딩 ─────────────────────────────────────────────────
  if (loading) {
    return (
      <AppShell headerTitle="주간 리포트">
        <div className="px-4 pt-4 pb-6 flex flex-col gap-4">
          <div className="h-28 bg-base-border rounded-lg animate-pulse" />
          <div className="h-16 bg-base-border rounded-lg animate-pulse" />
          <div className="h-40 bg-base-border rounded-lg animate-pulse" />
          <div className="h-32 bg-base-border rounded-lg animate-pulse" />
        </div>
      </AppShell>
    );
  }

  // ── 자녀 없음 ─────────────────────────────────────────────
  if (noChild) {
    return (
      <AppShell headerTitle="주간 리포트">
        <div className="px-4 pt-6 pb-6 flex flex-col gap-4">
          <div className="card text-center py-10 px-4">
            <p className="text-3xl mb-3">👨‍👩‍👧</p>
            <p className="text-sm font-bold text-base-text mb-2">
              아직 등록된 자녀 정보가 없어요
            </p>
            <p className="text-xs text-base-muted leading-relaxed mb-4">
              자녀 정보를 먼저 등록하면 주간 리포트를 확인할 수 있어요.
            </p>
            <button
              onClick={() => router.push("/parent/family")}
              className="btn-primary"
            >
              가족 설정으로 이동
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── 에러 ─────────────────────────────────────────────────
  if (error || !report) {
    return (
      <AppShell headerTitle="주간 리포트">
        <div className="px-4 pt-6 pb-6 flex flex-col gap-4">
          <div className="card text-center py-8 px-4">
            <p className="text-3xl mb-3">😓</p>
            <p className="text-sm font-bold text-base-text mb-2">
              주간 리포트를 불러오지 못했어요
            </p>
            <p className="text-xs text-base-muted leading-relaxed mb-4">
              잠시 후 다시 확인해 주세요.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => router.push("/explore")} className="btn-primary">
                직업 탐색으로 이동
              </button>
              <button
                onClick={() => router.push("/parent/home")}
                className="text-sm text-base-muted underline mt-1"
              >
                부모 홈으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── 렌더링용 계산 ─────────────────────────────────────────
  const {
    childName, likedOccs, allMatchedOccs,
    totalLikedCount, displayTotal,
    isRecent7Days, recommendedAction, recommendedOccName,
  } = report;

  const categoryDist          = computeCategoryDist(allMatchedOccs);
  const topCategory           = categoryDist[0]?.category ?? null;
  const conversationQuestions = buildConversationQuestions(likedOccs);
  const remainingCount        = Math.max(0, displayTotal - 3);

  // 추천 활동 fallback — 단일 따옴표 사용 (curly quote 인코딩 회피)
  const fallbackActivity =
    "관심 있는 직업 하나를 고르고 '이 일을 하는 사람은 누구를 도와줄까?'를 함께 이야기해보세요.";

  return (
    <AppShell headerTitle="주간 리포트">
      <div className="px-4 pt-4 pb-10 flex flex-col gap-4">

        {/* ① 상단 헤더 */}
        <FadeInSection delay={0}>
          <div className="card">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-bold text-brand-red">주간 리포트</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-base-card text-base-muted">
                베타
              </span>
            </div>
            <h1 className="text-base font-bold text-base-text leading-snug mb-1">
              이번 주 {childName}의 관심 직업 리포트
            </h1>
            <p className="text-xs text-base-muted">{getDateRange()} 기준</p>
            <p className="text-xs text-base-muted mt-1 leading-relaxed">
              아이가 좋아요한 직업을 바탕으로 부모 대화를 시작해보세요.
            </p>
            <p className="text-[11px] text-base-muted mt-2 opacity-70 leading-relaxed">
              베타 기능입니다. 데이터가 적을 경우 최근 관심 직업 기준으로 표시됩니다.
            </p>
          </div>
        </FadeInSection>

        {/* ② 이번 주 관심 요약 카드 3개 */}
        <FadeInSection delay={40}>
          <div className="grid grid-cols-3 gap-2">

            {/* 카드 1: 관심 직업 수 */}
            <div className="bg-white rounded-card shadow-card p-3 flex flex-col items-center text-center gap-0.5">
              <p className="text-[10px] text-base-muted leading-tight">관심 직업</p>
              <p
                className="text-2xl font-bold leading-none"
                style={{ color: "#E84B2E" }}
              >
                {totalLikedCount}
              </p>
              <p className="text-[10px] text-base-muted">개</p>
            </div>

            {/* 카드 2: 가장 많이 본 분야 */}
            <div className="bg-white rounded-card shadow-card p-3 flex flex-col items-center text-center gap-0.5">
              <p className="text-[10px] text-base-muted leading-tight">관심 분야</p>
              <p className="text-[11px] font-bold text-base-text leading-snug mt-0.5 px-0.5">
                {topCategory ?? "아직 없음"}
              </p>
            </div>

            {/* 카드 3: 추천 대화 */}
            <div className="bg-white rounded-card shadow-card p-3 flex flex-col items-center text-center gap-0.5">
              <p className="text-[10px] text-base-muted leading-tight">추천 대화</p>
              <p
                className="text-2xl font-bold leading-none"
                style={{ color: "#E84B2E" }}
              >
                3
              </p>
              <p className="text-[10px] text-base-muted">개</p>
            </div>

          </div>
        </FadeInSection>

        {/* ③ 이번 주 관심 직업 */}
        <FadeInSection delay={80}>
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-base-text">
                {isRecent7Days ? "최근 7일 관심 직업" : "관심 직업"}
              </h2>
              {!isRecent7Days && likedOccs.length > 0 && (
                <span className="text-[10px] text-base-muted text-right leading-relaxed">
                  최근 7일 관심 직업이 없어
                  <br />전체 기준으로 보여드려요.
                </span>
              )}
            </div>

            {likedOccs.length === 0 ? (
              /* 좋아요 없음 */
              <div className="text-center py-6">
                <p className="text-2xl mb-2">🤍</p>
                <p className="text-sm font-semibold text-base-text mb-1">
                  아직 좋아요한 직업이 없어요
                </p>
                <p className="text-xs text-base-muted leading-relaxed mb-3">
                  자녀와 함께 직업 탐색을 보면서
                  <br />관심 있는 직업의 하트를 눌러보세요.
                </p>
                <button
                  onClick={() => router.push("/explore")}
                  className="text-sm font-semibold px-4 py-2 rounded-full"
                  style={{ backgroundColor: "#FFF0EB", color: "#E84B2E" }}
                >
                  직업 탐색하러 가기
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col divide-y divide-base-border">
                  {likedOccs.map((occ) => (
                    <button
                      key={occ.occupationId}
                      onClick={() => router.push(`/explore/${occ.occupationId}`)}
                      className="flex items-center gap-3 py-3 text-left hover:opacity-70 transition-opacity w-full"
                    >
                      <span className="text-xl leading-none w-8 text-center shrink-0">
                        {occ.emoji ?? "🎯"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-base-text">{occ.name}</p>
                        {occ.category && (
                          <p className="text-xs text-base-muted">{occ.category}</p>
                        )}
                      </div>
                      <ChevronRight size={14} className="text-base-muted shrink-0" />
                    </button>
                  ))}
                </div>

                {remainingCount > 0 && (
                  <p className="text-xs text-base-muted text-center mt-2 pb-1">
                    외 {remainingCount}개 관심 직업이 더 있어요.
                  </p>
                )}

                <div className="mt-3 pt-3 border-t border-base-border">
                  <button
                    onClick={() => router.push("/explore")}
                    className="w-full text-sm font-semibold py-2.5 rounded-button"
                    style={{ backgroundColor: "#FFF0EB", color: "#E84B2E" }}
                  >
                    직업 탐색에서 더 보기
                  </button>
                </div>
              </>
            )}
          </div>
        </FadeInSection>

        {/* ④ 관심 분야 분포 그래프 */}
        <FadeInSection delay={120}>
          <div className="card">
            <h2 className="text-sm font-bold text-base-text mb-1">관심 분야 분포</h2>
            <p className="text-[11px] text-base-muted mb-3 leading-relaxed">
              좋아요한 직업 기준으로 본 관심 흐름입니다. 아직 데이터가 적어 참고용으로만 봐주세요.
            </p>

            {categoryDist.length === 0 ? (
              /* 그래프 빈 상태 */
              <div
                className="flex flex-col items-center justify-center py-5 rounded-button gap-2"
                style={{ backgroundColor: "#F9FAFB" }}
              >
                <p className="text-base">📊</p>
                <p className="text-xs text-base-muted text-center leading-relaxed">
                  좋아요한 직업이 생기면
                  <br />분야별 분포가 표시돼요.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {categoryDist.map((entry) => (
                  <div key={entry.category}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-base-text truncate max-w-[70%]">
                        {entry.category}
                      </span>
                      <span className="text-[11px] text-base-muted shrink-0 ml-2">
                        {entry.count}개
                      </span>
                    </div>
                    {/* 막대 그래프 — CSS 기반, 차트 라이브러리 미사용 */}
                    <div className="h-2 bg-base-off rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width:           `${entry.barPct}%`,
                          backgroundColor: "#E84B2E",
                          opacity:         entry.barPct === 100 ? 1 : 0.65,
                          transition:      "width 0.7s ease",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[11px] text-base-muted mt-3 pt-3 border-t border-base-border leading-relaxed">
              💡 성향이나 적성을 단정하기보다는 탐색 중인 관심사로 바라봐주세요.
            </p>
          </div>
        </FadeInSection>

        {/* ⑤ 이번 주 대화 질문 */}
        <FadeInSection delay={160}>
          <div className="card">
            <h2 className="text-sm font-bold text-base-text mb-3">이번 주 대화 질문</h2>
            <div className="flex flex-col gap-3">
              {conversationQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: "#FFF0EB", color: "#E84B2E" }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm text-base-text leading-relaxed">{q}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-base-muted mt-3 pt-3 border-t border-base-border leading-relaxed">
              💡 정답이 없는 질문이에요. 자녀가 자유롭게 이야기할 수 있도록 열린 분위기로 물어봐주세요.
            </p>
          </div>
        </FadeInSection>

        {/* ⑥ 이번 주 추천 활동 — 체크형 카드 (시각용, 저장 기능 없음) */}
        <FadeInSection delay={200}>
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={15} className="text-brand-red shrink-0" />
              <h2 className="text-sm font-bold text-base-text">이번 주 추천 활동</h2>
            </div>

            {/* 체크형 활동 행 */}
            <div
              className="flex items-start gap-3 p-3 rounded-button"
              style={{ backgroundColor: "#F9FAFB" }}
            >
              {/* 체크박스 — 시각 표시용, 클릭 동작 없음 */}
              <div
                className="w-5 h-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center"
                style={{ borderColor: "#D1D5DB", backgroundColor: "#fff" }}
                aria-hidden="true"
              />
              <p className="text-sm text-base-text leading-relaxed flex-1">
                {recommendedAction ?? fallbackActivity}
              </p>
            </div>

            {recommendedOccName && recommendedAction && (
              <p className="text-xs text-base-muted mt-2">
                관련 직업: {recommendedOccName}
              </p>
            )}

            <p className="text-[11px] text-base-muted mt-2 leading-relaxed">
              💡 부모와 함께 안전하게 할 수 있는 활동입니다.
            </p>
            <p className="text-[10px] text-base-muted mt-1 opacity-60">
              완료 체크 저장 기능은 준비 중이에요.
            </p>
          </div>
        </FadeInSection>

        {/* ⑦ AI 상담 CTA */}
        <FadeInSection delay={240}>
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={15} className="text-brand-red shrink-0" />
              <h2 className="text-sm font-bold text-base-text">AI 진로 상담으로 이어가기</h2>
            </div>
            <p className="text-xs text-base-muted leading-relaxed mb-3">
              아이의 관심을 바탕으로 부모 대화 질문을 더 받아보세요.
            </p>
            <button
              onClick={() => router.push("/parent/counseling")}
              className="w-full py-3 rounded-button text-sm font-bold flex items-center justify-center gap-2"
              style={{ backgroundColor: "#FFF0EB", color: "#E84B2E" }}
            >
              <MessageSquare size={14} />
              AI 진로 상담으로 이동
            </button>
          </div>
        </FadeInSection>

        {/* ⑧ 하단 안내 */}
        <FadeInSection delay={280}>
          <p className="text-[11px] text-base-muted text-center leading-relaxed px-2">
            이 리포트는 자녀의 진로를 단정하지 않습니다.
            <br />아이와 이런 대화를 시작해볼 수 있어요라는 안내로 봐주세요.
            <br />주간 리포트는 현재 베타 운영 중입니다.
          </p>
        </FadeInSection>

        {/* 부모 홈 복귀 */}
        <FadeInSection delay={320}>
          <button
            onClick={() => router.push("/parent/home")}
            className="w-full text-center text-xs text-base-muted py-2 underline"
          >
            부모 홈으로 돌아가기
          </button>
        </FadeInSection>

      </div>
    </AppShell>
  );
}
