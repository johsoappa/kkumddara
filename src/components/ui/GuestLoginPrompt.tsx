"use client";

// ====================================================
// 게스트 로그인 유도 모달 — 중앙 모달 패턴
// 체험 중 액션 직전에 표시
//
// [문구 원칙]
//   - "저장" 표현 금지 (실제 저장 기능 없음)
//   - "무료" 표현 금지 (과장 기대 유발)
//   - 실제 가능한 행동만 설명
//   - role에 따라 학부모/학생 문구 분리
//
// [레이아웃]
//   - 화면 중앙 정렬 (items-center)
//   - max-w-sm (384px) 고정 — 모바일/데스크톱 균형
//   - 상단: 이모지 + 닫기 버튼
//   - 중단: 제목 + 설명
//   - 하단: 메인 CTA + 보조 버튼
// ====================================================

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface GuestLoginPromptProps {
  onClose: () => void;
  /** 데모 맥락 역할 — 전달 시 해당 역할의 auth 화면으로 직접 진입 */
  role?: "parent" | "student";
}

// ── 역할별 문구 ────────────────────────────────────────────────
const COPY = {
  parent: {
    emoji:       "👨‍👩‍👧",
    title:       "내 아이 탐색을 이어서 시작해보세요",
    description: "로그인하면 자녀 프로필을 만들고 관심 분야에 맞는 진로 탐색을 이어갈 수 있어요.",
    cta:         "로그인하고 내 아이 프로필 만들기",
  },
  student: {
    emoji:       "🎯",
    title:       "내 진로 탐색을 이어서 시작해보세요",
    description: "로그인하면 내 관심 분야와 탐색 기록을 바탕으로 진로 탐색을 이어갈 수 있어요.",
    cta:         "로그인하고 내 진로 기록 시작하기",
  },
  default: {
    emoji:       "🌟",
    title:       "진로 탐색을 이어서 시작해보세요",
    description: "로그인하면 관심 분야에 맞는 진로 탐색을 이어갈 수 있어요.",
    cta:         "로그인하고 시작하기",
  },
} as const;

export default function GuestLoginPrompt({ onClose, role }: GuestLoginPromptProps) {
  const router = useRouter();

  const authUrl = role ? `/?role=${role}&step=auth` : "/";
  const copy    = role ? COPY[role] : COPY.default;

  return (
    // ── 오버레이 — 화면 중앙 정렬 ──────────────────────────
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ backgroundColor: "rgba(0,0,0,0.52)" }}
      onClick={onClose}
    >
      {/* ── 모달 패널 ─────────────────────────────────────── */}
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단: 이모지 + 닫기 */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <span className="text-3xl leading-none">{copy.emoji}</span>
          <button
            onClick={onClose}
            className="p-1 -mr-1 text-base-muted hover:text-base-text transition-colors"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {/* 중단: 제목 + 설명 */}
        <div className="px-6 pb-6">
          <h3 className="text-lg font-bold text-base-text leading-snug mb-3">
            {copy.title}
          </h3>
          <p className="text-sm text-base-muted leading-relaxed">
            {copy.description}
          </p>
        </div>

        {/* 하단: 버튼 영역 */}
        <div className="px-6 pb-7 flex flex-col gap-2.5">
          {/* 메인 CTA */}
          <button
            onClick={() => router.push(authUrl)}
            className="w-full py-3.5 rounded-button text-sm font-bold text-white transition-opacity active:opacity-80"
            style={{ backgroundColor: "#E84B2E" }}
          >
            {copy.cta}
          </button>

          {/* 보조 버튼 */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-button text-sm font-semibold text-base-muted border border-base-border transition-colors hover:bg-base-off"
          >
            계속 둘러보기
          </button>
        </div>
      </div>
    </div>
  );
}
