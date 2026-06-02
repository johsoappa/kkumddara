"use client";

/**
 * SportsInterestSelector
 *
 * /explore/interests/sports 화면에서 관심 운동 10개를 선택하고,
 * 선택된 운동에 연결된 직업 카드를 보여주는 컴포넌트.
 *
 * - 기본 선택: soccer (sportsInterestData[0])
 * - 단일 선택 방식 (MVP)
 * - 대표 꿈(representativeDream)은 텍스트로만 표시 — 링크 생성 없음
 * - 연결 직업: OCCUPATION_NAME_MAP에 존재하는 slug만 표시
 * - DB 없음 / API 없음 / sportsInterestData.ts 정적 데이터 사용
 *
 * 관련 데이터: src/data/sportsInterestData.ts
 * 작성일: 2026-05-26
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  sportsInterestData,
  type SportsInterestSlug,
} from "@/data/sportsInterestData";

// ──────────────────────────────────────────────────────────────────────────────
// 상수
// ──────────────────────────────────────────────────────────────────────────────

/** occupation slug → 한글 직업명 매핑 */
const OCCUPATION_NAME_MAP: Record<string, string> = {
  "sports-data-analyst":              "스포츠 데이터 분석가",
  "sports-tech-developer":            "스포츠 테크 개발자",
  "exercise-prescription-specialist": "운동처방사",
  "sports-content-planner":           "스포츠 콘텐츠 기획자",
  "sports-marketer":                  "스포츠 마케터",
  "youth-sports-coach":               "유소년 스포츠 지도자",
  "outdoor-leisure-planner":          "아웃도어 레저 기획자",
  "marine-leisure-specialist":        "해양레저 전문가",
  "sports-safety-manager":            "스포츠 안전관리자",
  "water-safety-lifeguard":           "수상안전요원",
  "after-school-teacher":             "방과후 강사",
};

/** 관심 운동 slug → 이모지 */
const SPORTS_EMOJI_MAP: Record<string, string> = {
  soccer:                  "⚽",
  baseball:                "⚾",
  basketball:              "🏀",
  volleyball:              "🏐",
  swimming:                "🏊",
  "taekwondo-martial-arts": "🥋",
  "jump-rope":             "🪢",
  golf:                    "⛳",
  esports:                 "🎮",
  outdoor:                 "🏕️",
};

/** careerLinks relationType → 한글 레이블 */
const RELATION_LABEL_MAP: Record<string, string> = {
  coaching:   "지도·교육",
  analysis:   "분석·데이터",
  technology: "기술·개발",
  health:     "건강·체력",
  content:    "콘텐츠",
  business:   "비즈니스",
  safety:     "안전 관리",
  leisure:    "레저·야외",
  education:  "교육",
};

// ──────────────────────────────────────────────────────────────────────────────
// 컴포넌트
// ──────────────────────────────────────────────────────────────────────────────

export default function SportsInterestSelector() {
  const router = useRouter();

  // 기본 선택: 첫 번째 관심 운동 (soccer)
  const [selectedSlug, setSelectedSlug] = useState<SportsInterestSlug>(
    sportsInterestData[0].slug
  );

  // 선택된 운동 데이터
  const selectedInterest = sportsInterestData.find(
    (item) => item.slug === selectedSlug
  )!;

  // 유효한 연결 직업만 표시 (OCCUPATION_NAME_MAP에 있는 slug)
  const validLinks = selectedInterest.careerLinks.filter(
    (link) => OCCUPATION_NAME_MAP[link.occupationSlug] !== undefined
  );

  return (
    <div className="px-4 pt-4 pb-8 flex flex-col gap-6">

      {/* ── 히어로 영역 ─────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-brand-red mb-1">
          관심 운동 진로 탐색
        </p>
        <h1 className="text-base font-bold text-base-text leading-snug">
          좋아하는 운동으로 찾는 직업
        </h1>
        <p className="mt-1.5 text-xs text-base-muted leading-relaxed">
          운동을 좋아한다고 해서 꼭 선수만 길은 아니에요.
          좋아하는 운동을 출발점으로 관련된 여러 직업을 탐색해보세요.
        </p>
      </div>

      {/* ── 관심 운동 선택 그리드 ──────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-base-muted mb-2">
          관심 있는 운동을 선택하세요
        </p>
        <div className="grid grid-cols-2 gap-2">
          {sportsInterestData.map((item) => {
            const isSelected = item.slug === selectedSlug;
            return (
              <button
                key={item.slug}
                onClick={() => setSelectedSlug(item.slug)}
                aria-pressed={isSelected}
                aria-label={`${item.nameKo} 선택`}
                className={[
                  "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left",
                  "transition-all active:scale-[0.97]",
                  isSelected
                    ? "border-brand-red bg-brand-light"
                    : "border-base-border bg-white hover:border-brand-red/40",
                ].join(" ")}
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  {SPORTS_EMOJI_MAP[item.slug] ?? "🏅"}
                </span>
                <span
                  className={`text-xs font-semibold leading-tight ${
                    isSelected ? "text-brand-red" : "text-base-text"
                  }`}
                >
                  {item.nameKo}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 선택된 운동 상세 + 연결 직업 ─────────────────────────── */}
      <section className="card">

        {/* 선택 운동 요약 */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl leading-none" aria-hidden="true">
              {SPORTS_EMOJI_MAP[selectedInterest.slug] ?? "🏅"}
            </span>
            <div>
              <p className="text-sm font-bold text-base-text leading-tight">
                {selectedInterest.nameKo}
              </p>
              <p className="text-xs text-base-muted">
                대표 꿈: {selectedInterest.representativeDream}
              </p>
            </div>
          </div>

          <p className="text-xs text-base-muted leading-relaxed">
            {selectedInterest.description}
          </p>

          {/* 키워드 칩 */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedInterest.keywords.slice(0, 5).map((kw) => (
              <span
                key={kw}
                className="text-xs font-medium text-base-muted bg-base-off border border-base-border rounded-full px-2 py-0.5"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* ── 선수의 길도 살펴볼 수 있어요 (정보 카드, /explore 링크 없음) ── */}
        {selectedInterest.athletePath && (
          <div className="mb-4 rounded-xl border border-brand-red/30 bg-brand-light p-3.5">
            <p className="text-xs font-bold text-brand-red mb-1">
              선수의 길도 살펴볼 수 있어요
            </p>
            <p className="text-[11px] text-base-muted leading-relaxed mb-3">
              이 운동을 좋아한다면 선수라는 길도 자연스럽게 떠올릴 수 있어요. 다만 좋아하는 운동은
              선수뿐 아니라 코치, 분석가, 기획자, 안전관리자 같은 다양한 직업으로도 이어질 수 있습니다.
            </p>

            <div className="rounded-xl bg-white border border-base-border p-3">
              {/* 선수 직업명 */}
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xl leading-none" aria-hidden="true">
                  {SPORTS_EMOJI_MAP[selectedInterest.slug] ?? "🏅"}
                </span>
                <span className="text-sm font-bold text-base-text">
                  {selectedInterest.athletePath.title}
                </span>
              </div>

              {/* 설명 */}
              <p className="text-xs text-base-muted leading-relaxed mb-2.5">
                {selectedInterest.athletePath.description}
              </p>

              {/* 필요한 힘 */}
              <p className="text-[11px] font-semibold text-base-text mb-1">필요한 힘</p>
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {selectedInterest.athletePath.strengths.map((s) => (
                  <span
                    key={s}
                    className="text-xs font-medium text-brand-red bg-brand-light rounded-full px-2 py-0.5"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* 지금 해볼 수 있는 작은 활동 */}
              <p className="text-[11px] font-semibold text-base-text mb-1">
                지금 해볼 수 있는 작은 활동
              </p>
              <ul className="flex flex-col gap-1 mb-2">
                {selectedInterest.athletePath.starterActions.map((a) => (
                  <li key={a} className="flex items-start gap-1.5 text-xs text-base-text leading-relaxed">
                    <span className="text-brand-red mt-0.5 shrink-0">✓</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>

              {/* 안전/균형 문구 */}
              {selectedInterest.athletePath.safetyNote && (
                <p className="text-[11px] text-base-muted leading-relaxed mt-1.5 pt-1.5 border-t border-base-border">
                  💡 {selectedInterest.athletePath.safetyNote}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 연결 직업 목록 */}
        <div>
          <p className="text-xs font-semibold text-brand-red mb-2">
            연결 직업 {validLinks.length}개
          </p>

          <div className="flex flex-col gap-2">
            {validLinks.map((link) => {
              const name = OCCUPATION_NAME_MAP[link.occupationSlug]!;
              const typeLabel =
                RELATION_LABEL_MAP[link.relationType] ?? link.relationType;

              return (
                <div
                  key={link.occupationSlug}
                  className="rounded-xl border border-base-border bg-base-off p-3"
                >
                  {/* 직업명 + 연결 유형 뱃지 */}
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-base-text">
                      {name}
                    </span>
                    <span className="text-xs font-medium text-brand-red bg-brand-light rounded-full px-1.5 py-0.5">
                      {typeLabel}
                    </span>
                  </div>

                  {/* 연결 이유 */}
                  <p className="text-xs text-base-muted leading-relaxed mb-2">
                    {link.reason}
                  </p>

                  {/* 직업 상세 이동 버튼 */}
                  <button
                    onClick={() =>
                      router.push(`/explore/${link.occupationSlug}`)
                    }
                    className="text-xs font-semibold text-brand-red hover:opacity-75 transition-opacity"
                    aria-label={`${name} 직업 상세 보기`}
                  >
                    직업 상세 보기 →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
