"use client";

// ====================================================
// StudentStartChecklistCard — 학생 시작 안내 카드
// src/app/student/home/page.tsx 에서만 사용
//
// [설계]
//   - 단순 안내 카드 (체크 상태 저장 없음)
//   - DB / localStorage 체크 상태 저장 없음
//   - 사용자 행동 데이터와 연결은 추후 별도 작업 예정
//   - CTA → /explore (직업 탐색 페이지, student/home 내에서도 사용 중)
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
    heading: "내가 좋아하는 것 확인하기",
    body:    "관심사와 좋아하는 활동을 다시 살펴봐요.",
  },
  {
    num:     2,
    heading: "궁금한 직업 둘러보기",
    body:    "재미있어 보이는 직업을 눌러보고 어떤 일을 하는지 알아봐요.",
  },
  {
    num:     3,
    heading: "마음에 드는 직업 저장하기",
    body:    "나중에 다시 보고 싶은 직업은 저장해두세요.",
  },
  {
    num:     4,
    heading: "오늘의 미션 해보기",
    body:    "작은 미션을 하나씩 해보며 내 관심사를 더 알아가요.",
  },
] as const;

// ─── 컴포넌트 ─────────────────────────────────────────
export default function StudentStartChecklistCard() {
  const router = useRouter();

  return (
    <div className="bg-white rounded-card-lg shadow-card p-5">

      {/* ── 제목 + 설명 ── */}
      <h2 className="text-sm font-bold text-base-text mb-1">
        처음 하기 좋은 것
      </h2>
      <p className="text-xs text-base-muted leading-relaxed mb-4">
        꿈따라는 정답을 고르는 곳이 아니라, 내가 좋아하는 것을 하나씩 찾아가는 공간이에요.<br />
        아래 순서대로 가볍게 시작해보세요.
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
        직업 둘러보기
      </button>

    </div>
  );
}
