"use client";

// ====================================================
// 상단 헤더 컴포넌트
// - 흰 배경 + 꿈따라 로고 (레드오렌지)
// - 알림 버튼 (우측)
// ====================================================

import { Bell } from "lucide-react";

interface HeaderProps {
  title?: string;       // 페이지별 제목 (없으면 로고 표시)
  showBack?: boolean;   // 뒤로가기 버튼 표시 여부 (추후 사용)
}

export default function Header({ title, showBack = false }: HeaderProps) {
  return (
    <header
      className="
        fixed top-0 left-1/2 -translate-x-1/2
        w-full max-w-mobile
        bg-white border-b border-base-border
        z-50
      "
      // [확인 포인트] z-50이 있어야 스크롤 시 헤더가 위에 유지됩니다
    >
      <div className="flex items-center justify-between px-5 py-4 h-14">
        {/* 로고 또는 페이지 제목 */}
        {title ? (
          <h1 className="text-base font-bold text-base-text">{title}</h1>
        ) : (
          <div className="flex items-center gap-1">
            {/* 꿈따라 로고 텍스트 */}
            <span className="text-xl font-bold text-brand-red">꿈따라</span>
            <span
              className="
                text-xs font-medium text-white
                bg-brand-red px-1.5 py-0.5 rounded-full
                ml-1
              "
            >
              BETA
            </span>
          </div>
        )}

        {/* 우측 알림 버튼 */}
        <button
          className="
            w-9 h-9 flex items-center justify-center
            rounded-full hover:bg-base-off
            transition-colors
          "
          aria-label="알림"
        >
          <Bell size={20} className="text-base-muted" />
        </button>
      </div>
    </header>
  );
}
