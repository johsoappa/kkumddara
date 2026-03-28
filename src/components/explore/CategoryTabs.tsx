"use client";

// ====================================================
// 카테고리 필터 탭 (가로 스크롤 + 좌우 화살표)
//
// 화살표 가시성을 React 상태 대신 직접 DOM 조작으로 처리.
// - ResizeObserver / scroll 이벤트에서 ref에 직접 style 적용
// - React 재렌더링 없이 즉시 반영 → 깜빡임 없음
// ====================================================

import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryFilter } from "@/types/occupation";

const CATEGORIES: CategoryFilter[] = [
  "전체",
  "IT·기술",
  "의료·과학",
  "예술·디자인",
  "비즈니스",
  "교육·사회",
];

const SCROLL_AMOUNT = 120;

interface CategoryTabsProps {
  active: CategoryFilter;
  onChange: (category: CategoryFilter) => void;
}

export default function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const leftRef   = useRef<HTMLButtonElement>(null);
  const rightRef  = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el    = scrollRef.current;
    const left  = leftRef.current;
    const right = rightRef.current;
    if (!el || !left || !right) return;

    // 화살표 표시/숨김 DOM 직접 조작
    const update = () => {
      const { scrollLeft, clientWidth, scrollWidth } = el;
      const showLeft  = scrollLeft > 0;
      const showRight = scrollLeft + clientWidth < scrollWidth - 1;

      left.style.opacity       = showLeft  ? "1" : "0";
      left.style.pointerEvents = showLeft  ? "auto" : "none";
      left.tabIndex            = showLeft  ? 0 : -1;

      right.style.opacity       = showRight ? "1" : "0";
      right.style.pointerEvents = showRight ? "auto" : "none";
      right.tabIndex            = showRight ? 0 : -1;
    };

    // 초기 측정
    update();

    // 스크롤 이벤트
    el.addEventListener("scroll", update, { passive: true });

    // 컨테이너 크기 변경 감지 (초기 레이아웃 완료 포함)
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative flex items-center">

      {/* ---- 왼쪽 화살표 (초기: 숨김) ---- */}
      <button
        ref={leftRef}
        onClick={() =>
          scrollRef.current?.scrollBy({ left: -SCROLL_AMOUNT, behavior: "smooth" })
        }
        aria-label="왼쪽으로 스크롤"
        tabIndex={-1}
        style={{ opacity: 0, pointerEvents: "none" }}
        className="
          absolute left-0 z-10
          w-8 h-8 flex items-center justify-center
          bg-white rounded-full shadow-card text-brand-red
          transition-opacity duration-200
        "
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
      </button>

      {/* ---- 탭 스크롤 영역 ---- */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto w-full"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollBehavior: "smooth",
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium",
              "transition-colors whitespace-nowrap",
              active === cat
                ? "bg-brand-red text-white shadow-sm"
                : "bg-base-card text-base-muted hover:bg-base-border"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ---- 오른쪽 화살표 (초기: 숨김, ResizeObserver 후 갱신) ---- */}
      <button
        ref={rightRef}
        onClick={() =>
          scrollRef.current?.scrollBy({ left: SCROLL_AMOUNT, behavior: "smooth" })
        }
        aria-label="오른쪽으로 스크롤"
        tabIndex={-1}
        style={{ opacity: 0, pointerEvents: "none" }}
        className="
          absolute right-0 z-10
          w-8 h-8 flex items-center justify-center
          bg-white rounded-full shadow-card text-brand-red
          transition-opacity duration-200
        "
      >
        <ChevronRight size={18} strokeWidth={2.5} />
      </button>

    </div>
  );
}
