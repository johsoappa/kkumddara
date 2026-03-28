"use client";

// ====================================================
// 직업 탐색 페이지 (/explore)
// - 검색 + 카테고리 필터 + 직업 카드 리스트
// - 스켈레톤 로딩, 빈 결과 처리
// ====================================================

import { useState, useEffect, useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import SearchBar from "@/components/explore/SearchBar";
import CategoryTabs from "@/components/explore/CategoryTabs";
import OccupationCard from "@/components/explore/OccupationCard";
import SkeletonCard from "@/components/explore/SkeletonCard";
import { OCCUPATIONS } from "@/data/occupations";
import type { CategoryFilter } from "@/types/occupation";

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("전체");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // 스켈레톤 로딩 시뮬레이션
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  // localStorage에서 찜 목록 복원
  useEffect(() => {
    const stored = localStorage.getItem("kkumddara_liked");
    if (stored) {
      setLiked(new Set(JSON.parse(stored) as string[]));
    }
  }, []);

  // 찜 토글 + localStorage 동기화
  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("kkumddara_liked", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // 검색 + 카테고리 필터 (메모이제이션)
  const filtered = useMemo(() => {
    return OCCUPATIONS.filter((occ) => {
      const matchCategory = category === "전체" || occ.category === category;
      const q = search.trim();
      const matchSearch =
        q === "" ||
        occ.name.includes(q) ||
        occ.description.includes(q) ||
        occ.skills.some((s) => s.includes(q));
      return matchCategory && matchSearch;
    });
  }, [search, category]);

  return (
    <AppShell headerTitle="직업 탐색">
      <div className="px-4 pt-4 pb-4 flex flex-col gap-3">
        <SearchBar value={search} onChange={setSearch} />
        <CategoryTabs active={category} onChange={setCategory} />

        <div className="flex flex-col gap-3 mt-1">
          {isLoading ? (
            // 스켈레톤 로딩
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filtered.length === 0 ? (
            // 검색 결과 없음
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-4xl mb-3">😢</p>
              <p className="text-base font-bold text-base-text">
                찾는 직업이 없어요
              </p>
              <p className="text-sm text-base-muted mt-1.5">
                다른 검색어나 카테고리를 시도해보세요
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
