"use client";

/**
 * SportsInterestCareerSection
 *
 * /explore/[id] 직업 상세 화면에서 현재 직업과 연결된 관심 운동 목록을 보여주는 섹션.
 *
 * - sportsInterestData에서 현재 직업 slug가 careerLinks에 포함된 관심 운동을 조회한다.
 * - 연결된 관심 운동이 없으면 null 반환(섹션 숨김).
 * - 현재 직업 자기 자신은 관련 직업 링크에서 제외한다.
 * - 관심 운동 최대 3개, 카드당 관련 직업 링크 최대 4개 표시(MVP 제한).
 * - DB 변경 없음 / API 호출 없음 / 순수 정적 데이터 기반.
 *
 * 관련 데이터: src/data/sportsInterestData.ts
 * 작성일: 2026-05-26
 */

import { useRouter } from "next/navigation";
import { getSportsInterestsByOccupationSlug } from "@/data/sportsInterestData";

// ──────────────────────────────────────────────────────────────────────────────
// 상수
// ──────────────────────────────────────────────────────────────────────────────

/** sportsInterestData careerLinks에 사용되는 slug → 한글 직업명 매핑 */
const OCCUPATION_NAME_MAP: Record<string, string> = {
  "sports-data-analyst":           "스포츠 데이터 분석가",
  "sports-tech-developer":         "스포츠 테크 개발자",
  "exercise-prescription-specialist": "운동처방사",
  "sports-content-planner":        "스포츠 콘텐츠 기획자",
  "sports-marketer":               "스포츠 마케터",
  "youth-sports-coach":            "유소년 스포츠 지도자",
  "outdoor-leisure-planner":       "아웃도어 레저 기획자",
  "marine-leisure-specialist":     "해양레저 전문가",
  "sports-safety-manager":         "스포츠 안전관리자",
  "water-safety-lifeguard":        "수상안전요원",
  "after-school-teacher":          "방과후 강사",
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

/** 한 페이지에 표시할 관심 운동 카드 최대 개수 */
const MAX_SPORTS = 3;

/** 카드당 관련 직업 링크 최대 개수 */
const MAX_RELATED_LINKS = 4;

// ──────────────────────────────────────────────────────────────────────────────
// 컴포넌트
// ──────────────────────────────────────────────────────────────────────────────

interface SportsInterestCareerSectionProps {
  /** 현재 직업의 occupation_master slug */
  occupationSlug: string;
}

export default function SportsInterestCareerSection({
  occupationSlug,
}: SportsInterestCareerSectionProps) {
  const router = useRouter();

  // 1. 현재 직업과 연결된 관심 운동 목록 조회
  const rawInterests = getSportsInterestsByOccupationSlug(occupationSlug);
  if (rawInterests.length === 0) return null;

  // 2. 각 관심 운동 카드 구성
  //    - 현재 직업 제외
  //    - OCCUPATION_NAME_MAP에 없는 slug 제외(안전성)
  //    - 최대 MAX_SPORTS 개 관심 운동
  //    - 카드당 최대 MAX_RELATED_LINKS 개 링크
  const cards = rawInterests
    .slice(0, MAX_SPORTS)
    .map((interest) => {
      const links = interest.careerLinks
        .filter(
          (link) =>
            link.occupationSlug !== occupationSlug &&
            OCCUPATION_NAME_MAP[link.occupationSlug] !== undefined
        )
        .slice(0, MAX_RELATED_LINKS);
      return { interest, links };
    })
    .filter(({ links }) => links.length > 0); // 관련 직업이 없는 카드 제외

  // 3. 유효한 카드가 없으면 섹션 숨김
  if (cards.length === 0) return null;

  return (
    <section className="card">
      {/* 섹션 헤더 */}
      <div className="mb-4">
        <p className="text-xs font-semibold text-brand-red mb-1">관심 운동 연결</p>
        <h3 className="text-sm font-bold text-base-text leading-snug">
          이런 운동을 좋아한다면 이 직업도 함께 볼 수 있어요
        </h3>
        <p className="mt-1 text-xs text-base-muted leading-relaxed">
          좋아하는 운동을 출발점으로 관련 직업을 넓게 살펴보세요.
        </p>
      </div>

      {/* 관심 운동 카드 목록 */}
      <div className="flex flex-col gap-3">
        {cards.map(({ interest, links }) => (
          <div
            key={interest.slug}
            className="rounded-xl border border-base-border bg-base-off p-4"
          >
            {/* 운동명 + 이모지 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl leading-none" aria-hidden="true">
                {SPORTS_EMOJI_MAP[interest.slug] ?? "🏅"}
              </span>
              <span className="text-sm font-bold text-base-text">
                {interest.nameKo}
              </span>
            </div>

            {/* 관련 직업 링크 칩 */}
            <div className="flex flex-wrap gap-2">
              {links.map((link) => {
                const name = OCCUPATION_NAME_MAP[link.occupationSlug]!;
                return (
                  <button
                    key={link.occupationSlug}
                    onClick={() =>
                      router.push(`/explore/${link.occupationSlug}`)
                    }
                    className="text-xs font-semibold text-brand-red bg-brand-light px-3 py-1.5 rounded-full hover:opacity-75 transition-opacity"
                    aria-label={`${name} 직업 상세 보기`}
                  >
                    {name} →
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
