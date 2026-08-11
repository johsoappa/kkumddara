"use client";

// ====================================================
// DreamMapHub — 꿈 지도형 요약 UI (프로토타입, 1개 직업 한정)
//
// [배경]
//   직업 상세 화면의 텍스트 우선순위 문제를 완화하기 위해
//   중앙 카드 + 콘텐츠 탭 4개(하는 일/필요한 힘/하루 모습/해보기) +
//   탭과 분리된 독립 CTA(다음 미션)로 구성한 요약 허브.
//   docs/occupation-content-axis-standard.md 참고.
//
// [범위]
//   feature flag + slug 화이트리스트로 게이팅된 직업 1개에만 사용.
//   기존 문장은 삭제하지 않고 탭 패널로 재배치한다 — 신규 카피 작성 없음
//   (센터 카드 1문장 요약은 기존 one_liner/description 원문 그대로 사용).
//
// [접근성]
//   role="tablist"/"tab"/"tabpanel" 패턴. 방향키로 탭 이동, Enter/Space 선택.
//   "다음 미션" CTA는 tablist 밖의 독립 버튼 — role="tab"으로 만들지 않는다.
// ====================================================

import { useEffect, useRef, useState, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import { childModeToGradeRange } from "@/lib/child-mode";

export interface DreamMapTab {
  id: string;
  label: string;
  panel: ReactNode;
}

interface DreamMapHubProps {
  occupationId: string;
  occupationName: string;
  /** 중앙 카드에 쓸 기존 원문 1문장 (신규 작성 아님) */
  heroSummary: string;
  /** 콘텐츠 탭 4개 고정 (하는 일/필요한 힘/하루 모습/해보기) */
  tabs: [DreamMapTab, DreamMapTab, DreamMapTab, DreamMapTab];
  ctaLabel: string;
  onCtaClick: () => void;
}

const VIEWED_KEY_PREFIX = "kkumddara_dream_map_viewed_";

export default function DreamMapHub({
  occupationId,
  occupationName,
  heroSummary,
  tabs,
  ctaLabel,
  onCtaClick,
}: DreamMapHubProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hubRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const viewedTrackedRef = useRef(false);

  // ── dream_map_viewed: 영역 50% 노출 시 세션당 1회 ──────────
  useEffect(() => {
    const key = `${VIEWED_KEY_PREFIX}${occupationId}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(key)) {
      viewedTrackedRef.current = true;
    }

    const node = hubRef.current;
    if (!node || viewedTrackedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !viewedTrackedRef.current) {
            viewedTrackedRef.current = true;
            sessionStorage.setItem(key, "1");
            track("dream_map_viewed", { occupation_id: occupationId });
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [occupationId]);

  const selectTab = (index: number) => {
    setActiveIndex(index);
    const tab = tabs[index];
    track("dream_map_branch_selected", {
      occupation_slug: occupationId,
      occupation_name: occupationName,
      branch_id: tab.id,
      branch_label: tab.label,
      source_page: "explore_detail",
      // G1.3: 이 컴포넌트는 isDreamMapActive(나침반모드 확정) 시에만 렌더되므로 mode는 항상 compass
      mode: "compass",
      grade_range: childModeToGradeRange("compass"),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    else return;
    e.preventDefault();
    tabRefs.current[nextIndex]?.focus();
    selectTab(nextIndex);
  };

  const handleCtaClick = () => {
    track("dream_map_cta_clicked", {
      occupation_slug: occupationId,
      occupation_name: occupationName,
      destination: `/roadmap/${occupationId}`,
      source_page: "explore_detail",
      mode: "compass",
      grade_range: childModeToGradeRange("compass"),
    });
    onCtaClick();
  };

  const activeTab = tabs[activeIndex];

  return (
    <div ref={hubRef} className="flex flex-col gap-3">
      {/* 중앙 카드 — 직업명 + 기존 원문 1문장 */}
      <section className="card text-center">
        <p className="text-sm font-bold text-base-text">{occupationName}</p>
        <p className="mt-1 text-xs text-base-muted leading-relaxed">{heroSummary}</p>
      </section>

      {/* 콘텐츠 탭 4개 — 모바일 2x2 그리드 / md 이상 십자형 배치 */}
      <div
        role="tablist"
        aria-label={`${occupationName} 정보 탐색 탭`}
        className="grid grid-cols-2 gap-2 md:mx-auto md:max-w-[720px] md:grid-cols-4"
      >
        {tabs.map((tab, index) => {
          const selected = index === activeIndex;
          return (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[index] = el; }}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`dream-map-panel-${occupationId}`}
              id={`dream-map-tab-${occupationId}-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`min-h-[44px] rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors ${
                selected
                  ? "border-brand-red bg-brand-light text-brand-red"
                  : "border-base-border bg-white text-base-text hover:bg-base-off"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 상세 패널 — 한 번에 한 항목만 표시 */}
      <section
        role="tabpanel"
        id={`dream-map-panel-${occupationId}`}
        aria-labelledby={`dream-map-tab-${occupationId}-${activeTab.id}`}
        className="card"
      >
        {activeTab.panel}
      </section>

      {/* 독립 CTA — tablist 밖, role="tab" 아님 */}
      <button type="button" onClick={handleCtaClick} className="btn-primary">
        {ctaLabel}
      </button>
    </div>
  );
}
