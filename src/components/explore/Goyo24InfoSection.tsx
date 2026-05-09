"use client";

// ====================================================
// Goyo24InfoSection — 고용24 직업 참고 정보 섹션
//
// [표시 조건]
//   - occupation_goyo24_profile row가 있는 경우에만 표시
//   - 데이터가 없으면 섹션 자체 null 반환 (화면 깨짐 없음)
//
// [표시 항목]
//   ① 임금 참고 정보 (salary_median 있을 때)
//   ② 고용 전망 (prospect_label 또는 prospect_raw 있을 때)
//   ③ 관련 학과 예시 (related_majors 1개 이상)
//   ④ 출처: 고용24 (항상 표시)
//
// [금지 문구]
//   추천 대학 / 추천 학과 / 상위 대학 / 인기 대학 / 합격 가능 대학
//   취업 보장 / 고소득 보장 / 미래 보장
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

/** prospect_label → 자연스러운 한국어 표현 */
const PROSPECT_DESC: Record<string, string> = {
  "증가":     "앞으로 이 분야의 일자리가 늘어날 것으로 전망돼요.",
  "다소 증가": "앞으로 이 분야의 일자리가 다소 늘어날 것으로 전망돼요.",
  "유지":     "현재 수준을 유지할 것으로 전망돼요.",
  "다소 감소": "일자리 수가 다소 줄어들 수 있다는 전망도 있어요.",
  "감소":     "일자리 수가 감소할 수 있다는 전망도 있어요.",
};

// ─── 컴포넌트 ─────────────────────────────────────────────────

interface Goyo24InfoSectionProps {
  profile: OccupationGoyo24Profile | null;
}

export default function Goyo24InfoSection({ profile }: Goyo24InfoSectionProps) {
  // 프로필이 없으면 섹션 미표시
  if (!profile) return null;

  const hasSalary   = profile.salary_median != null;
  const hasProspect = profile.prospect_label != null || profile.prospect_raw != null;
  const hasMajors   = profile.related_majors.length > 0;

  // 표시할 데이터가 하나도 없으면 섹션 자체 숨김
  if (!hasSalary && !hasProspect && !hasMajors) return null;

  // 관련 학과 최대 5개 표시
  const displayMajors = profile.related_majors.slice(0, 5);

  // 출처 날짜 문자열 생성
  const surveyYearStr  = profile.salary_survey_year
    ? `${profile.salary_survey_year}년 기준`
    : null;
  const syncedAtStr = profile.synced_at
    ? (() => {
        const d = new Date(profile.synced_at);
        return `최근 동기화: ${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
      })()
    : null;

  return (
    <section className="card" aria-label="고용24 직업 참고 정보">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-bold text-base-text">직업 참고 정보</h3>
        <span className="text-[10px] text-base-muted bg-base-card px-2 py-0.5 rounded-full">
          고용24 제공
        </span>
      </div>

      <div className="flex flex-col gap-4">

        {/* ① 임금 참고 정보 */}
        {hasSalary && (
          <div>
            <p className="text-xs font-semibold text-base-text mb-1.5 flex items-center gap-1.5">
              💰 임금 참고 정보
            </p>
            <div className="bg-base-card rounded-lg px-4 py-3">
              <p className="text-sm text-base-text leading-snug">
                고용24 기준 중위 임금은 연 약{" "}
                <span className="font-bold text-brand-red">
                  {formatManwon(profile.salary_median!)}만 원
                </span>
                입니다.
              </p>
              {profile.salary_lower != null && profile.salary_upper != null && (
                <p className="text-xs text-base-muted mt-1">
                  하위 25% {formatManwon(profile.salary_lower)}만 원 ·
                  상위 25% {formatManwon(profile.salary_upper)}만 원
                </p>
              )}
              <p className="text-[11px] text-base-muted mt-2 leading-relaxed">
                실제 임금은 경력, 지역, 회사 규모에 따라 달라질 수 있습니다.
              </p>
            </div>
          </div>
        )}

        {/* ② 고용 전망 */}
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
                      "고용24 기준으로 이 직업의 일자리 전망을 참고할 수 있어요."}
                  </p>
                </>
              ) : (
                <p className="text-xs text-base-muted leading-relaxed">
                  고용24 기준으로 이 직업의 일자리 전망을 참고할 수 있어요.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ③ 관련 학과 예시 */}
        {hasMajors && (
          <div>
            <p className="text-xs font-semibold text-base-text mb-1.5">
              🎓 관련 학과 예시
            </p>
            <p className="text-[11px] text-base-muted mb-2">
              이 분야와 연결되는 학과 예시입니다.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {displayMajors.map((major) => (
                <span
                  key={major}
                  className="px-3 py-1.5 bg-brand-light text-brand-red text-xs font-medium rounded-full"
                >
                  {major}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ④ 출처 */}
      <div className="mt-4 pt-3 border-t border-base-border">
        <p className="text-[10px] text-base-muted">
          출처: 고용24
          {surveyYearStr && ` · ${surveyYearStr}`}
        </p>
        {syncedAtStr && (
          <p className="text-[10px] text-base-muted mt-0.5">{syncedAtStr}</p>
        )}
      </div>
    </section>
  );
}
