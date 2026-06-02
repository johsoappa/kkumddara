"use client";

// ====================================================
// 직업 탐색 페이지 (/explore)
// - 검색 + 카테고리 필터 + 직업 카드 리스트
// - 스켈레톤 로딩, 빈 결과 / 에러 처리
//
// [데이터 소스]
//   occupation_master (is_active=true, priority DESC) — 대표+세부 전체 로드
//   + occupation_summary (one_liner, is_current=true, published)
//   기본 목록: is_representative=true 항목만 렌더 (클라이언트 필터)
//   검색어 있을 때: 세부 직업(is_representative=false)도 결과에 포함
//
// [좋아요 (liked_occupations)]
//   - 로그인 + child_id 있으면 DB liked_occupations 테이블 사용
//   - 비로그인 또는 child_id 없으면 localStorage(kkumddara_liked) fallback
//   - 좋아요 필터: "❤️ 좋아요만 보기" 버튼으로 필터링
//
// [RLS 정책]
//   liked: parent 전체 권한, liked: student 전체 권한 — 수정 없음
// ====================================================

import { useState, useEffect, useMemo } from "react";
import { Heart } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";
import SearchBar from "@/components/explore/SearchBar";
import CategoryTabs from "@/components/explore/CategoryTabs";
import OccupationCard from "@/components/explore/OccupationCard";
import SkeletonCard from "@/components/explore/SkeletonCard";
import type { OccupationListItem, OccupationCategory, CategoryFilter } from "@/types/occupation";

const LIKED_LS_KEY = "kkumddara_liked";

// ── 관심 운동 키워드 감지 ─────────────────────────────────
// 검색어가 아래 키워드를 포함하면 관심 운동 탐색 CTA 안내 블록 표시
// occupation_master에 없는 운동선수 직업명 검색 시 빈 결과 대신 안내를 제공한다
const SPORT_INTEREST_SEARCH_KEYWORDS = [
  "축구", "축구선수",
  "야구", "야구선수",
  "농구", "농구선수",
  "배구", "배구선수",
  "수영", "수영선수",
  "태권도", "태권도선수", "태권도 선수", "무도",
  "줄넘기", "줄넘기선수", "줄넘기 선수", "음악줄넘기", "리듬줄넘기",
  "골프", "골프선수",
  "e스포츠", "이스포츠", "e스포츠 선수", "e스포츠선수", "프로게이머",
  "캠핑", "등산", "아웃도어", "트레킹", "레저",
];

export default function ExplorePage() {
  const [search,        setSearch]        = useState("");
  const [category,      setCategory]      = useState<CategoryFilter>("전체");
  const [showLikedOnly, setShowLikedOnly] = useState(false);
  const [liked,         setLiked]         = useState<Set<string>>(new Set());
  const [childId,       setChildId]       = useState<string | null>(null); // DB 연동 기준
  const [occupations,   setOccupations]   = useState<OccupationListItem[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  // ── 세션 + child_id 감지 ───────────────────────────────────
  // student: student.child_id
  // parent:  child 테이블 첫 번째 active 자녀
  // 비로그인: null → localStorage fallback
  useEffect(() => {
    async function resolveChildId() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // student 먼저 시도
        const { data: studentRow } = await supabase
          .from("student")
          .select("child_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (studentRow?.child_id) {
          setChildId(studentRow.child_id);
          return;
        }

        // parent → 첫 번째 active 자녀
        const { data: parentRow } = await supabase
          .from("parent")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (parentRow?.id) {
          const { data: childRow } = await supabase
            .from("child")
            .select("id")
            .eq("parent_id", parentRow.id)
            .eq("profile_status", "active")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (childRow?.id) setChildId(childRow.id);
        }
      } catch (err) {
        console.error("[explore] child_id 조회 오류:", err);
      }
    }

    resolveChildId();
  }, []);

  // ── liked 상태 초기 로드 ──────────────────────────────────
  // child_id 확정 후 DB 조회, 없으면 localStorage
  useEffect(() => {
    async function loadLiked() {
      if (childId) {
        // DB 우선
        const { data, error: likedErr } = await supabase
          .from("liked_occupations")
          .select("occupation_id")
          .eq("child_id", childId);

        if (!likedErr && data) {
          setLiked(new Set(data.map((r) => r.occupation_id)));
          return;
        }
      }
      // fallback: localStorage
      const stored = localStorage.getItem(LIKED_LS_KEY);
      if (stored) {
        try { setLiked(new Set(JSON.parse(stored) as string[])); } catch { /* ignore */ }
      }
    }

    loadLiked();
  }, [childId]);

  // ── 직업 목록 DB fetch ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadOccupations() {
      setIsLoading(true);
      setError(null);

      try {
        // 1단계: occupation_master — 활성 직업 전체 (대표 + 세부)
        // 기본 목록은 클라이언트 필터(is_representative)로 분기
        const { data: masters, error: masterErr } = await supabase
          .from("occupation_master")
          .select("id, slug, name_ko, emoji, category, interest_fields, priority, legacy_occupation_id, parent_occupation_id, is_representative")
          .eq("is_active", true)
          .order("priority", { ascending: false });

        if (masterErr) throw masterErr;

        if (!masters || masters.length === 0) {
          if (!cancelled) { setOccupations([]); setIsLoading(false); }
          return;
        }

        // 2단계: one_liner 조회 (대표 + 세부 모두 포함)
        const masterIds = masters.map((m) => m.id);
        const { data: summaries, error: sumErr } = await supabase
          .from("occupation_summary")
          .select("occupation_id, content")
          .eq("layer", "service")
          .eq("content_type", "one_liner")
          .eq("is_current", true)
          .eq("status", "published")
          .in("occupation_id", masterIds);

        if (sumErr) throw sumErr;

        const summaryMap = new Map(
          (summaries ?? []).map((s) => [s.occupation_id, s.content])
        );

        // 대표 직업 UUID → name_ko 맵 (세부 직업의 parent 이름 조회용)
        const parentNameMap = new Map<string, string>();
        for (const m of masters) {
          if (m.is_representative) parentNameMap.set(m.id, m.name_ko);
        }

        const items: OccupationListItem[] = masters.map((m) => ({
          id:              m.legacy_occupation_id ?? m.slug,
          slug:            m.slug,
          name:            m.name_ko,
          emoji:           m.emoji,
          category:        m.category as OccupationCategory,
          description:     summaryMap.get(m.id) ?? "",
          relatedMajors:   [],
          skills:          m.interest_fields ?? [],
          isRepresentative: m.is_representative ?? false,
          parentName:      m.parent_occupation_id
            ? (parentNameMap.get(m.parent_occupation_id) ?? null)
            : null,
        }));

        // 동일 직업명(name_ko) 중복 제거 — DB occupation_master에 같은 이름 행이
        // 둘 이상 있을 때(예: 외부 sync 원본 + 신규 seed) 검색 결과에 같은 이름 카드가
        // 2개 노출되는 것을 방지한다. 유지 기준: 대표 직업 우선 → 소개(one_liner) 있는
        // 최신 상세 우선 → (그 외) priority 높은 먼저 등장 행 유지.
        // ※ 이름이 다른 직업은 그대로 유지되어 검색에서 사라지지 않는다.
        const dedupedByName = new Map<string, OccupationListItem>();
        for (const it of items) {
          const prev = dedupedByName.get(it.name);
          if (!prev) { dedupedByName.set(it.name, it); continue; }
          const better =
            (it.isRepresentative && !prev.isRepresentative) ||
            (it.isRepresentative === prev.isRepresentative &&
              it.description.trim().length > 0 && prev.description.trim().length === 0);
          if (better) dedupedByName.set(it.name, it);
        }
        const deduped = Array.from(dedupedByName.values());

        if (!cancelled) setOccupations(deduped);
      } catch (err) {
        console.error("[explore] occupation fetch 실패:", err);
        if (!cancelled) setError("직업 목록을 불러오지 못했어요.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadOccupations();
    return () => { cancelled = true; };
  }, []);

  // ── 찜 토글 ──────────────────────────────────────────────
  const toggleLike = async (id: string) => {
    const isLiked = liked.has(id);

    // optimistic update
    setLiked((prev) => {
      const next = new Set(prev);
      isLiked ? next.delete(id) : next.add(id);
      return next;
    });

    if (childId) {
      // DB 동기화
      if (isLiked) {
        await supabase
          .from("liked_occupations")
          .delete()
          .eq("child_id", childId)
          .eq("occupation_id", id);
      } else {
        await supabase
          .from("liked_occupations")
          .insert({ child_id: childId, occupation_id: id });
      }
    } else {
      // localStorage fallback
      setLiked((prev) => {
        localStorage.setItem(LIKED_LS_KEY, JSON.stringify(Array.from(prev)));
        return prev;
      });
    }
  };

  // ── 필터링 (검색 + 카테고리 + 좋아요) ────────────────────
  // 검색어 없음 → is_representative=true 항목만 표시 (기본 목록 정책)
  // 검색어 있음 → 대표 + 세부 전체 검색 (세부 직업 포함)
  const filtered = useMemo(() => {
    const q = search.trim();
    const isSearching = q.length > 0;
    // 공백 정규화 검색: "물류관리사" → "물류 관리사" 매칭 지원
    const qNorm = q.replace(/\s+/g, "");

    return occupations.filter((occ) => {
      if (showLikedOnly && !liked.has(occ.id)) return false;
      // 검색어 없을 때: 대표 직업만 표시
      if (!isSearching && !occ.isRepresentative) return false;
      const matchCategory = category === "전체" || occ.category === category;
      const matchSearch =
        !isSearching ||
        occ.name.includes(q) ||
        occ.description.includes(q) ||
        occ.skills.some((s) => s.includes(q)) ||
        // 공백 제거 후 비교: "물류관리사" ↔ "물류 관리사" 매칭
        (qNorm.length >= 2 && occ.name.replace(/\s+/g, "").includes(qNorm));
      return matchCategory && matchSearch;
    });
  }, [search, category, occupations, showLikedOnly, liked]);

  // ── 관심 운동 키워드 검색 여부 ────────────────────────────
  // 2글자 이상이고 SPORT_INTEREST_SEARCH_KEYWORDS와 일치하면 true
  const hasSportsInterestSearchHint =
    search.trim().length >= 2 &&
    SPORT_INTEREST_SEARCH_KEYWORDS.some((kw) =>
      search.trim().toLowerCase().includes(kw.toLowerCase())
    );

  // ── 렌더 ────────────────────────────────────────────────
  return (
    <AppShell headerTitle="직업 탐색">
      <div className="px-4 pt-4 pb-4 flex flex-col gap-3">
        <SearchBar value={search} onChange={setSearch} />

        {/* ── 관심 운동 진로 탐색 CTA ── */}
        <Link
          href="/explore/interests/sports"
          className="flex items-center gap-3 rounded-xl border border-base-border bg-base-off px-4 py-3 hover:border-brand-red/40 transition-colors"
        >
          <span className="text-2xl leading-none" aria-hidden="true">🏅</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-brand-red mb-0.5">
              좋아하는 운동으로 직업 찾기
            </p>
            <p className="text-xs text-base-muted leading-relaxed">
              축구, 줄넘기, 수영처럼 좋아하는 운동에서 연결된 직업을 찾아보세요.
            </p>
          </div>
          <span className="text-brand-red text-sm font-bold shrink-0" aria-hidden="true">→</span>
        </Link>

        <CategoryTabs active={category} onChange={(cat) => { setCategory(cat); setShowLikedOnly(false); }} />

        {/* ── 좋아요 필터 버튼 ── */}
        <button
          onClick={() => {
            setShowLikedOnly((v) => !v);
            if (!showLikedOnly) { setCategory("전체"); setSearch(""); }
          }}
          className="flex items-center gap-1.5 self-start px-3.5 py-2 rounded-full text-sm font-medium transition-colors"
          style={
            showLikedOnly
              ? { backgroundColor: "#E84B2E", color: "#fff" }
              : { backgroundColor: "#FFF0EB", color: "#E84B2E" }
          }
        >
          <Heart
            size={14}
            className={showLikedOnly ? "fill-white text-white" : "fill-brand-red text-brand-red"}
          />
          좋아요한 직업
        </button>

        <div className="flex flex-col gap-3 mt-1">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)

          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-4xl mb-3">😢</p>
              <p className="text-base font-bold text-base-text">{error}</p>
              <p className="text-sm text-base-muted mt-1.5">잠시 후 다시 시도해주세요.</p>
            </div>

          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              {showLikedOnly ? (
                <>
                  <p className="text-4xl mb-3">🤍</p>
                  <p className="text-base font-bold text-base-text">
                    아직 좋아요한 직업이 없어요
                  </p>
                  <p className="text-sm text-base-muted mt-1.5 leading-relaxed">
                    관심 있는 직업의 하트를 눌러<br />모아보세요.
                  </p>
                  <button
                    onClick={() => setShowLikedOnly(false)}
                    className="mt-4 text-sm font-semibold"
                    style={{ color: "#E84B2E" }}
                  >
                    전체 직업 보기 →
                  </button>
                </>
              ) : search.trim().length > 0 ? (
                /* 검색어 있는데 결과 없음 */
                hasSportsInterestSearchHint ? (
                  /* 관심 운동 키워드 검색 → 안내 블록 */
                  <div className="flex flex-col gap-3 w-full text-left">
                    <Link
                      href="/explore/interests/sports"
                      className="flex items-center gap-3 rounded-xl border border-base-border bg-base-off px-4 py-3 hover:border-brand-red/40 transition-colors"
                    >
                      <span className="text-2xl leading-none" aria-hidden="true">🏅</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-brand-red mb-0.5">
                          좋아하는 운동과 연결된 직업을 볼 수 있어요
                        </p>
                        <p className="text-xs text-base-muted leading-relaxed">
                          축구, 줄넘기, 수영처럼 좋아하는 운동에서 연결된 다양한 직업을 찾아보세요.
                        </p>
                      </div>
                      <span className="text-brand-red text-sm font-bold shrink-0" aria-hidden="true">→</span>
                    </Link>
                    <p className="text-xs text-base-muted text-center leading-relaxed">
                      직업명으로 검색하면 더 많은 결과를 볼 수 있어요<br />
                      예: 스포츠 데이터 분석가, 유소년 지도자, 운동처방사
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-4xl mb-3">🔍</p>
                    <p className="text-base font-bold text-base-text">
                      검색 결과가 아직 없어요
                    </p>
                    <p className="text-sm text-base-muted mt-1.5 leading-relaxed">
                      다른 표현으로 다시 검색하거나,<br />대표 직업을 먼저 살펴보세요.
                    </p>
                    <p className="text-xs text-base-muted mt-2">
                      예: 의사, 경찰, 철도, 영상, 사이버, 소아
                    </p>
                  </>
                )
              ) : (
                /* 검색어 없음 / 데이터 없음 / 카테고리 빈 결과 */
                <>
                  <p className="text-4xl mb-3">😢</p>
                  <p className="text-base font-bold text-base-text">
                    {occupations.length === 0 ? "아직 탐색할 직업이 없어요" : "찾는 직업이 없어요"}
                  </p>
                  <p className="text-sm text-base-muted mt-1.5">
                    {occupations.length === 0
                      ? "곧 다양한 직업이 추가될 예정이에요"
                      : "다른 카테고리를 선택하거나 검색어로 찾아보세요"}
                  </p>
                </>
              )}
            </div>

          ) : (
            <>
              {filtered.map((occ) => (
                <OccupationCard
                  key={occ.id}
                  occupation={occ}
                  liked={liked.has(occ.id)}
                  onLikeToggle={toggleLike}
                  showTypeLabel={search.trim().length > 0}
                />
              ))}
              {/* 검색 결과 있어도 관심 운동 키워드면 안내 블록 추가 표시 */}
              {hasSportsInterestSearchHint && (
                <Link
                  href="/explore/interests/sports"
                  className="flex items-center gap-3 rounded-xl border border-base-border bg-base-off px-4 py-3 hover:border-brand-red/40 transition-colors"
                >
                  <span className="text-2xl leading-none" aria-hidden="true">🏅</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-brand-red mb-0.5">
                      좋아하는 운동과 연결된 직업을 볼 수 있어요
                    </p>
                    <p className="text-xs text-base-muted leading-relaxed">
                      운동 종목을 출발점으로 관련된 다양한 직업을 함께 탐색해보세요.
                    </p>
                  </div>
                  <span className="text-brand-red text-sm font-bold shrink-0" aria-hidden="true">→</span>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
