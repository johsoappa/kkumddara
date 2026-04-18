"use client";

// ====================================================
// 게스트 로그인 유도 모달
// 저장이 필요한 액션 직전에 표시
// ====================================================

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface GuestLoginPromptProps {
  onClose: () => void;
}

export default function GuestLoginPrompt({ onClose }: GuestLoginPromptProps) {
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-mobile bg-white rounded-t-2xl px-6 pt-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-2xl leading-none">🌟</span>
          <button
            onClick={onClose}
            className="p-1 text-base-muted hover:text-base-text transition-colors"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* 본문 */}
        <h3 className="text-base font-bold text-base-text mb-2">
          탐색한 내용을 저장해 두세요
        </h3>
        <p className="text-sm text-base-muted leading-relaxed mb-1">
          로그인하면 아이의 관심 직업, 미션 진행, 대화 주제를
        </p>
        <p className="text-sm text-base-muted leading-relaxed mb-7">
          이어서 관리하고 기록할 수 있어요. 무료로 시작할 수 있어요.
        </p>

        {/* CTA */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => router.push("/")}
            className="w-full py-3.5 rounded-button text-sm font-bold text-white"
            style={{ backgroundColor: "#E84B2E" }}
          >
            무료로 시작하기
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-button text-sm font-semibold text-base-muted border border-base-border"
          >
            계속 둘러보기
          </button>
        </div>
      </div>
    </div>
  );
}
