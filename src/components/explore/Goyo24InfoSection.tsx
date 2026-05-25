"use client";

// ====================================================
// Goyo24InfoSection — 미래를 그리는 참고 지표
//
// [표시 조건]
//   - occupation_goyo24_profile row가 있을 때 데이터 표시
//   - profile === null → "참고 지표 준비 중" 안내 (뱃지 없음)
//
// [source 기반 뱃지/출처 분기]
//   source = 'goyo24' | 'api' | 'goyo24_api'
//     → "고용24 제공" 뱃지 + "출처: 고용24" + 동기화 날짜
//   source = 'manual' (또는 기타)
//     → "참고 데이터" 뱃지 + "출처: 공개 참고 정보" + 동기화 날짜 없음
//
// [표시 항목 순서]
//   ① 고용 전망 (prospect_label 또는 prospect_raw 있을 때)
//   ② 관련 학과 예시 (related_majors 1개 이상)
//   ③ 임금 참고 정보 (salary_median 있을 때)
//   ④ 공통 안내 문구 (항상 표시)
//   ⑤ 출처 (source에 따라 문구 분기)
//
// [금지 문구]
//   추천 대학 / 추천 학과 / 상위 대학 / 인기 대학 / 합격 가능 대학
//   취업 보장 / 고소득 보장 / 미래 보장 / 평균 연봉 / 평균 임금
// ====================================================

import type { OccupationGoyo24Profile } from "@/types/goyo24";

// ─── 보조 ────────────────────────────────────────────────────

/** 숫자에 천단위 콤마 (예: 6550 → "6,550") */
function formatManwon(value: number): string {
  return value.toLocaleString("ko-KR");
}

/** prospect_label → 이모지 매핑 */
const PROSPECT_EMOJI: Record<string, string> = {
  "증가":     "📈",
  "다소 증가": "📈",
  "유지":     "➡️",
  "다소 감소": "📉",
  "감소":     "📉",
};

/**
 * prospect_label → 설명 문구
 * [2026-05-10 보정] 단정적 표현 → 예측 기반 표현으로 변경
 * 금지: "반드시 늘어난다", "취업 보장", "미래 보장"
 */
const PROSPECT_DESC: Record<string, string> = {
  "증가":     "향후 인력 수요가 활발할 것으로 예측되는 분야예요.",
  "다소 증가": "향후 인력 수요가 활발할 것으로 예측되는 분야예요.",
  "유지":     "현재 수준의 일자리 수요가 이어질 것으로 예측되는 분야예요.",
  "다소 감소": "일자리 수요가 줄어들 수 있어, 관련 역량을 넓게 준비하는 것이 중요해요.",
  "감소":     "일자리 수요가 줄어들 수 있어, 관련 역량을 넓게 준비하는 것이 중요해요.",
};

// ─── 컴포넌트 ─────────────────────────────────────────────────

interface Goyo24InfoSectionProps {
  profile: OccupationGoyo24Profile | null;
}

export default function Goyo24InfoSection({ profile }: Goyo24InfoSectionProps) {
  // 프로필이 없으면 "준비 중" 안내 표시 (고용24 제공 뱃지 없이)
  if (!profile) {
    return (
      <section className="card" aria-label="미래를 그리는 참고 지표">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-bold text-base-text">미래를 그리는 참고 지표</h3>
        </div>
        <div className="flex flex-col items-center py-6 gap-2 text-center">
          <p className="text-2xl">📊</p>
          <p className="text-sm font-semibold text-base-text">참고 지표 준비 중이에요</p>
          <p className="text-xs text-base-muted leading-relaxed">
            이 직업의 고용 전망·관련 학과·임금 정보를
            <br />
            곧 업데이트할 예정이에요.
          </p>
        </div>
      </section>
    );
  }

  const hasSalary   = profile.salary_median != null;
  const hasProspect = profile.prospect_label != null || profile.prospect_raw != null;
  const hasMajors   = profile.related_majors.length > 0;

  // 표시할 데이터가 하나도 없으면 섹션 자체 숨김
  if (!hasSalary && !hasProspect && !hasMajors) return null;

  // ── source 기반 뱃지·출처 분기 ──────────────────────────────
  // goyo24 API sync 데이터: "고용24 제공" 뱃지 + "출처: 고용24"
  // manual 수동 입력 데이터: "참고 데이터" 뱃지 + "출처: 공개 참고 정보"
  const isGoyo24Provided =
    profile.source === "goyo24" ||
    profile.source === "api"    ||
    profile.source === "goyo24_api";

  // 관련 학과 최대 5개 표시
  const displayMajors = profile.related_majors.slice(0, 5);

  // 임금 기준 연도 문자열 (source에 따라 문구 분기)
  const surveyYearStr = profile.salary_survey_year
    ? isGoyo24Provided
      ? `${profile.salary_survey_year}년 고용24 조사 기준`
      : `${profile.salary_survey_year}년 공개 통계 기준`
    : null;

  // 최근 동기화 날짜 — goyo24 sync 데이터만 표시
  const syncedAtStr =
    isGoyo24Provided && profile.synced_at
      ? (() => {
          const d = new Date(profile.synced_at);
          return `최근 동기화: ${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
        })()
      : null;

  return (
    <section className="card" aria-label="미래를 그리는 참고 지표">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-bold text-base-text">미래를 그리는 참고 지표</h3>
        {isGoyo24Provided ? (
          <span className="text-[10px] text-base-muted bg-base-card px-2 py-0.5 rounded-full">
            고용24 제공
          </span>
        ) : (
          <span className="text-[10px] text-base-muted bg-base-card px-2 py-0.5 rounded-full">
            참고 데이터
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">

        {/* ① 고용 전망 */}
        {hasProspect && (
          <div>
            <p className="text-xs font-semibold text-base-text mb-1.5">
              {PROSPECT_EMOJI[profile.prospect_label ?? ""] ?? "📊"} 고용 전망
            </p>
            <div className="bg-base-card rounded-lg px-4 py-3">
              {profile.prospect_label ? (
                <>
                  <p className="text-sm font-semibold text-base-text">
                    {profile.prospect_label}
                  </p>
                  <p className="text-xs text-base-muted mt-1 leading-relaxed">
                    {PROSPECT_DESC[profile.prospect_label] ??
                      "고용24 조사 기준으로 이 직업의 일자리 흐름을 참고할 수 있어요."}
                  </p>
                </>
              ) : (
                <p className="text-xs text-base-muted leading-relaxed">
                  고용24 조사 기준으로 이 직업의 일자리 흐름을 참고할 수 있어요.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ② 관련 학과 예시 */}
        {hasMajors && (
          <div>
            <p className="text-xs font-semibold text-base-text mb-1.5">
              🎓 관련 학과 예시
            </p>
            <p className="text-[11px] text-base-muted mb-2">
              이 직업과 맞닿아 있는 전공들이에요.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {displayMajors.map((major) => (
                <span
                  key={major}
                  className="px-3 py-1.5 bg-brand-light text-brand-red text-xs font-medium rounded-full"
                >
                  {major}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-base-muted leading-relaxed">
              꼭 이 전공만 선택해야 하는 것은 아니며, 관심 분야를 넓혀보는 참고 정보로 활용해보세요.
            </p>
          </div>
        )}

        {/* ③ 임금 참고 정보 */}
        {hasSalary && (
          <div>
            {/* 제목 + 정보 아이콘 (title 툴팁) */}
            <p
              className="text-xs font-semibold text-base-text mb-1.5 flex items-center gap-1.5"
            >
              💰 임금 참고 정보
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-base-muted text-[9px] text-base-muted cursor-default select-none"
                title="정기 통계 조사 결과로, 실제 시장 임금과 차이가 있을 수 있습니다."
                aria-label="임금 정보 안내"
              >
                i
              </span>
            </p>
            <div className="bg-base-card rounded-lg px-4 py-3">
              {/* 레이블 */}
              <p className="text-[11px] text-base-muted mb-0.5">중위 임금</p>
              {/* 금액 강조 */}
              <p className="text-lg font-bold text-brand-red leading-snug">
                연 약 {formatManwon(profile.salary_median!)}만 원
              </p>
              {/* 하위/상위 보조 정보 */}
              {profile.salary_lower != null && profile.salary_upper != null && (
                <p className="text-xs text-base-muted mt-1.5">
                  하위 25% {formatManwon(profile.salary_lower)}만 원 ·{" "}
                  상위 25% {formatManwon(profile.salary_upper)}만 원
                </p>
              )}
              {/* 기준연도 안내 */}
              <p className="text-[11px] text-base-muted mt-2 leading-relaxed">
                {surveyYearStr
                  ? `${surveyYearStr} 참고값입니다.`
                  : isGoyo24Provided
                  ? "고용24 조사 기준 참고값입니다."
                  : "공개 통계 기준 참고값입니다."}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* ④ 공통 안내 문구 */}
      <p className="text-xs text-base-muted mt-4 leading-relaxed">
        실제 임금 및 고용 상황은 경력, 지역, 경제 상황에 따라 달라질 수 있습니다.
      </p>

      {/* ⑤ 출처 (source에 따라 분기) */}
      <div className="mt-2 pt-3 border-t border-base-border">
        <p className="text-[10px] text-base-muted">
          {isGoyo24Provided ? "출처: 고용24" : "출처: 공개 참고 정보"}
        </p>
        {syncedAtStr && (
          <p className="text-[10px] text-base-muted mt-0.5">{syncedAtStr}</p>
        )}
      </div>
    </section>
  );
}
