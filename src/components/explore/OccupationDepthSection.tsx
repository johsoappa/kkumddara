"use client";

// ====================================================
// OccupationDepthSection — "이 직업을 조금 더 깊이 알아볼까요?"
//
// 직업 상세의 체감 깊이를 보강하는 심화 섹션.
// 프론트 정적 seed(occupationDepthSeed.ts) 기반 — DB/API 호출 없음.
//
// [표시 조건]
//   occupationId가 OCCUPATION_DEPTH_SEED에 있으면 표시, 없으면 미노출.
//   (1차: webtoon-artist / creator / veterinarian 3개만 데이터 존재)
//
// [배치]
//   직업 상세 — DB 모드와 정적 폴백 모드 양쪽에서 직업 설명 아래에 삽입.
//   모바일에서 길어지지 않도록 항목별 카드로 분리.
//
// [문구 원칙]
//   아이용 정보(하루/잘 맞는 사람/미션)와 부모 대화 질문을 시각적으로 구분.
//   직업 강요/단정 표현 금지.
// ====================================================

import { getOccupationDepth } from "@/data/occupationDepthSeed";

interface OccupationDepthSectionProps {
  occupationId: string;
}

export default function OccupationDepthSection({ occupationId }: OccupationDepthSectionProps) {
  const depth = getOccupationDepth(occupationId);
  if (!depth) return null;

  return (
    <>
      {/* 섹션 헤더 */}
      <div className="px-1">
        <h3 className="text-sm font-bold text-base-text">
          이 직업을 조금 더 깊이 알아볼까요?
        </h3>
        <p className="text-xs text-base-muted mt-1 leading-relaxed">
          직업이 실제로 어떤 일을 하는지 살펴보고, 아이와 함께 이야기할 질문을 찾아보세요.
        </p>
      </div>

      {/* ① 이 직업의 하루 */}
      <section className="card" aria-label="이 직업의 하루">
        <h4 className="text-sm font-bold text-base-text mb-2">🕐 이 직업의 하루</h4>
        <p className="text-sm text-base-muted leading-relaxed whitespace-pre-line">
          {depth.dayInLife}
        </p>
      </section>

      {/* ② 이런 걸 좋아하면 잘 맞아요 */}
      <section className="card" aria-label="이런 걸 좋아하면 잘 맞아요">
        <h4 className="text-sm font-bold text-base-text mb-2">💗 이런 걸 좋아하면 잘 맞아요</h4>
        <p className="text-sm text-base-muted leading-relaxed whitespace-pre-line">
          {depth.goodFit}
        </p>
      </section>

      {/* ③ 지금 해볼 수 있는 작은 미션 */}
      <section className="card" aria-label="지금 해볼 수 있는 작은 미션">
        <h4 className="text-sm font-bold text-base-text mb-3">🎯 지금 해볼 수 있는 작은 미션</h4>
        <div className="flex flex-col gap-3">
          {depth.missions.map((m) => (
            <div key={m.label} className="rounded-lg bg-base-card px-3 py-3">
              <p className="text-xs font-bold text-brand-red mb-1">{m.label}</p>
              <p className="text-sm text-base-text leading-relaxed whitespace-pre-line">
                {m.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ④ 부모 대화 질문 — 부모용 톤(연한 강조 배경) */}
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
          {depth.parentQuestions.map((q, i) => (
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
    </>
  );
}
