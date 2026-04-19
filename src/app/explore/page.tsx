"use client";

// ====================================================
// 직업 탐색 페이지 (/explore)
// - 검색 + 카테고리 필터 + 직업 카드 리스트
// - 스켈레톤 로딩, 빈 결과 / 에러 처리
//
// [데이터 소스]
//   occupation_master (is_active=true, priority DESC)
//   + occupation_summary (one_liner, is_current=true, published)
//
// [다음 단계]
//   /explore/[id] 상세 페이지 DB 전환 (현재는 static 유지)
// ====================================================

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";
import SearchBar from "@/components/explore/SearchBar";
import CategoryTabs from "@/components/explore/CategoryTabs";
import OccupationCard from "@/components/explore/OccupationCard";
import SkeletonCard from "@/components/explore/SkeletonCard";
import type { OccupationListItem, OccupationCategory, CategoryFilter } from "@/types/occupation";

export default function ExplorePage() {
  const [search,      setSearch]      = useState("");
  const [category,    setCategory]    = useState<CategoryFilter>("전체");
  const [liked,       setLiked]       = useState<Set<string>>(new Set());
  const [occupations, setOccupations] = useState<OccupationListItem[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  // ── DB fetch ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadOccupations() {
      setIsLoading(true);
      setError(null);

      try {
        // 1단계: occupation_master — is_active=true, priority 내림차순
        // legacy_occupation_id: static /explore/[id] 상세 페이지 라우팅 호환용
        const { data: masters, error: masterErr } = await supabase
          .from("occupation_master")
          .select("id, slug, name_ko, emoji, category, interest_fields, priority, legacy_occupation_id")
          .eq("is_active", true)
          .order("priority", { ascending: false });

        if (masterErr) throw masterErr;

        if (!masters || masters.length === 0) {
          if (!cancelled) {
            setOccupations([]);
            setIsLoading(false);
          }
          return;
        }

        // 2단계: one_liner 조회 — service layer, is_current=true, published
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

        // 3단계: 병합 — occupation_id 기준 one_liner 매핑
        const summaryMap = new Map(
          (summaries ?? []).map((s) => [s.occupation_id, s.content])
        );

        const items: OccupationListItem[] = masters.map((m) => ({
          // id: static /explore/[id] 상세 호환 — legacy_occupation_id 우선, 없으면 slug
          // 상세 페이지 DB 전환 완료 후 slug로 교체 예정
          id:           m.legacy_occupation_id ?? m.slug,
          slug:         m.slug,
          name:         m.name_ko,
          emoji:        m.emoji,
          category:     m.category as OccupationCategory,
          description:  summaryMap.get(m.id) ?? "",
          relatedMajors: [],           // [추후] occupation_traits DB 연결 예정
          skills:       m.interest_fields ?? [],
        }));

        if (!cancelled) setOccupations(items);
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

  // ── localStorage 찜 목록 복원 ─────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("kkumddara_liked");
    if (stored) {
      setLiked(new Set(JSON.parse(stored) as string[]));
    }
  }, []);

  // ── 찜 토글 + localStorage 동기화 ────────────────────────
  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("kkumddara_liked", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // ── 검색 + 카테고리 필터 (메모이제이션) ──────────────────
  const filtered = useMemo(() => {
    return occupations.filter((occ) => {
      const matchCategory = category === "전체" || occ.category === category;
      const q = search.trim();
      const matchSearch =
        q === "" ||
        occ.name.includes(q) ||
        occ.description.includes(q) ||
        occ.skills.some((s) => s.includes(q));
      return matchCategory && matchSearch;
    });
  }, [search, category, occupations]);

  // ── 렌더 ─────────────────────────────────────────────────
  return (
    <AppShell headerTitle="직업 탐색">
      <div className="px-4 pt-4 pb-4 flex flex-col gap-3">
        <SearchBar value={search} onChange={setSearch} />
        <CategoryTabs active={category} onChange={setCategory} />

        <div className="flex flex-col gap-3 mt-1">
          {isLoading ? (
            // 스켈레톤 로딩
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)

          ) : error ? (
            // DB 오류
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-4xl mb-3">😢</p>
              <p className="text-base font-bold text-base-text">{error}</p>
              <p className="text-sm text-base-muted mt-1.5">잠시 후 다시 시도해주세요.</p>
            </div>

          ) : filtered.length === 0 ? (
            // 검색 결과 없음 또는 DB에 is_active 직업 없음
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-4xl mb-3">😢</p>
              <p className="text-base font-bold text-base-text">
                {occupations.length === 0 ? "아직 탐색할 직업이 없어요" : "찾는 직업이 없어요"}
              </p>
              <p className="text-sm text-base-muted mt-1.5">
                {occupations.length === 0
                  ? "곧 다양한 직업이 추가될 예정이에요"
                  : "다른 검색어나 카테고리를 시도해보세요"}
              </p>
            </div>

          ) : (
            // 직업 카드 리스트
            filtered.map((occ) => (
              <OccupationCard
                key={occ.id}
                occupation={occ}
                liked={liked.has(occ.id)}
                onLikeToggle={toggleLike}
              />
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
