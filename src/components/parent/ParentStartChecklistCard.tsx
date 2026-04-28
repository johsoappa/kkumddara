"use client";

// ====================================================
// ParentStartChecklistCard — 학부모 시작 체크리스트 카드
// src/app/parent/home/page.tsx 에서만 사용
//
// [설계]
//   - 단순 안내 카드 (체크 상태 저장 없음)
//   - DB / localStorage 체크 상태 저장 없음
//   - 사용자 행동 데이터와 연결은 추후 별도 작업 예정
//   - CTA → /explore (직업 탐색 페이지)
//
// [금지]
//   - 결제 / 요금제 문구 없음
//   - AI_CONSULT_ENABLED 관련 문구 없음
//   - "AI 코칭 사용하기" 등 현재 비활성 기능 유도 없음
// ====================================================

import { useRouter } from "next/navigation";

// ─── 색상 상수 ────────────────────────────────────────
const ACCENT    = "#E84B2E";
const ACCENT_BG = "#FFF0EB";

// ─── 체크리스트 항목 ──────────────────────────────────
const CHECKLIST_ITEMS = [
  {
    num:     1,
    heading: "아이 정보 확인하기",
    body:    "학년, 관심사, 좋아하는 활동을 기준으로 진로 탐색이 시작됩니다.",
  },
  {
    num:     2,
    heading: "관심 직업 살펴보기",
    body:    "아이와 연결될 수 있는 직업을 둘러보고 대화 주제를 찾아보세요.",
  },
  {
    num:     3,
    heading: "마음에 드는 직업 저장하기",
    body:    "아이가 흥미를 보이는 직업을 저장해두면 진로 흐름을 이어가기 좋습니다.",
  },
  {
    num:     4,
    heading: "부모 대화 질문 확인하기",
    body:    "아이에게 바로 물어볼 수 있는 질문으로 진로 대화를 시작해보세요.",
  },
] as const;

// ─── 컴포넌트 ─────────────────────────────────────────
export default function ParentStartChecklistCard() {
  const router = useRouter();

  return (
    <div className="bg-white rounded-card-lg shadow-card p-5">

      {/* ── 제목 + 설명 ── */}
      <h2 className="text-sm font-bold text-base-text mb-1">
        꿈따라 시작 체크리스트
      </h2>
      <p className="text-xs text-base-muted leading-relaxed mb-4">
        아이의 진로 탐색을 시작하려면 아래 순서대로 진행해보세요.<br />
        처음에는 전부 완벽하게 입력하지 않아도 괜찮습니다.
      </p>

      {/* ── 항목 목록 ── */}
      <div className="flex flex-col gap-3.5 mb-5">
        {CHECKLIST_ITEMS.map((item) => (
          <div key={item.num} className="flex gap-3 items-start">
            {/* 번호 배지 */}
            <span
              className="w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5"
              style={{ backgroundColor: ACCENT_BG, color: ACCENT }}
            >
              {item.num}
            </span>

            {/* 내용 */}
            <div>
              <p className="text-sm font-semibold text-base-text leading-snug">
                {item.heading}
              </p>
              <p className="text-xs text-base-muted leading-relaxed mt-0.5">
                {item.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── CTA ── */}
      <button
        onClick={() => router.push("/explore")}
        className="w-full py-2.5 rounded-button text-sm font-semibold active:opacity-80 transition-opacity"
        style={{ backgroundColor: ACCENT_BG, color: ACCENT }}
      >
        진로 탐색 시작하기
      </button>

    </div>
  );
}
