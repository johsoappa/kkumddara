"use client";

// ====================================================
// OccupationDepthTabs — 심화 콘텐츠 4탭 UI (전 모드 공통, Dream Map 기능과 무관)
//
// [G1.7-A2-PRE2]
//   OCCUPATION_DEPTH_SEED가 있는 직업은 씨앗·새싹·나침반 모드와
//   NEXT_PUBLIC_DREAM_MAP_ENABLED / DREAM_MAP_OCCUPATION_IDS 게이트와 무관하게
//   항상 동일한 4탭(하는 일/필요한 힘/하루 모습/해보기) UI로 표시되어야 한다.
//
// [DreamMapHub와의 차이 — 의도적으로 분리]
//   - DreamMapHub는 feature flag + slug 화이트리스트 + 나침반모드 확정 시에만
//     렌더되는 "Dream Map 기능" 자체이며, 히어로 카드·CTA·mode="compass" 고정
//     analytics를 포함한다. 이 컴포넌트를 그대로 재사용하면 씨앗/새싹 모드에서도
//     analytics가 "compass"로 잘못 기록되므로 재사용하지 않는다.
//   - 이 컴포넌트는 히어로 카드·CTA·Dream Map 전용 analytics를 포함하지 않는
//     순수 탭 전환 UI다. 다음 미션 CTA는 페이지의 기존 하단 고정 버튼을 그대로 쓴다.
//
// [부모 대화 질문]
//   4탭에는 포함하지 않는다(GOAL 계약상 정확히 4개 탭). 기존
//   OccupationDepthSection과 동일하게 탭 아래 별도 섹션으로 유지해 콘텐츠
//   손실이 없도록 한다.
//
// [G1.7-A3]
//   "다음 미션"은 4탭과 별개의 5번째 콘텐츠 축(탐색 행동 1개)이다.
//   탭 개수는 변경하지 않고, 탭 아래 별도의 안내 카드로 노출한다.
//   기존 로드맵/미션 저장·진행률 로직과는 무관한 순수 안내 텍스트다.
// ====================================================

import { useRef, useState, type ReactNode } from "react";

export interface DepthTab {
  id: string;
  label: string;
  panel: ReactNode;
}

interface OccupationDepthTabsProps {
  occupationId: string;
  occupationName: string;
  tabs: [DepthTab, DepthTab, DepthTab, DepthTab];
  nextMission: string;
  parentQuestions: string[];
}

export default function OccupationDepthTabs({
  occupationId,
  occupationName,
  tabs,
  nextMission,
  parentQuestions,
}: OccupationDepthTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    else return;
    e.preventDefault();
    tabRefs.current[nextIndex]?.focus();
    setActiveIndex(nextIndex);
  };

  const activeTab = tabs[activeIndex];

  return (
    <div className="flex flex-col gap-3">
      {/* 콘텐츠 탭 4개 — 모바일 2x2 그리드 / md 이상 십자형 배치 (DreamMapHub와 동일 시각 패턴) */}
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
              aria-controls={`occupation-depth-panel-${occupationId}`}
              id={`occupation-depth-tab-${occupationId}-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveIndex(index)}
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
        id={`occupation-depth-panel-${occupationId}`}
        aria-labelledby={`occupation-depth-tab-${occupationId}-${activeTab.id}`}
        className="card"
      >
        {activeTab.panel}
      </section>

      {/* 다음 미션 — 탭이 아닌 별도 상시 안내 카드(5번째 콘텐츠 축) */}
      {nextMission.trim().length > 0 && (
        <section
          className="rounded-card-lg p-4"
          style={{ backgroundColor: "#F2F8FF", border: "1px solid #CFE3FB" }}
          aria-label="다음 미션"
        >
          <h4 className="text-sm font-bold text-base-text mb-1">🎯 다음 미션</h4>
          <p className="text-sm text-base-text leading-relaxed whitespace-pre-line">
            {nextMission}
          </p>
        </section>
      )}

      {/* 부모 대화 질문 — 탭이 아닌 별도 상시 섹션(OccupationDepthSection과 동일 배치) */}
      {parentQuestions.length > 0 && (
        <section
          className="rounded-card-lg p-4"
          style={{ backgroundColor: "#FFF7F4", border: "1px solid #FBD9CD" }}
          aria-label="부모 대화 질문"
        >
          <h4 className="text-sm font-bold text-base-text mb-1">💬 부모 대화 질문</h4>
          <p className="text-xs text-base-muted mb-3 leading-relaxed">
            아이와 가볍게 이야기 나눠보세요. 정답을 찾기보다 생각을 들어보는 것이 목적이에요.
          </p>
          <ul className="flex flex-col gap-2.5">
            {parentQuestions.map((q, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: "#FFE3D8", color: "#E84B2E" }}
                >
                  {i + 1}
                </span>
                <p className="text-sm text-base-text leading-relaxed">
                  &ldquo;{q}&rdquo;
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
