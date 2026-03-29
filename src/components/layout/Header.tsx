"use client";

// ====================================================
// 상단 헤더 컴포넌트
// - 흰 배경 + 꿈따라 로고 (레드오렌지)
// - showBack=true: 왼쪽 뒤로가기 버튼 표시
// - 알림 버튼 (우측)
// ====================================================

import { Bell, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title?: string;       // 페이지별 제목 (없으면 로고 표시)
  showBack?: boolean;   // 뒤로가기 버튼 표시 여부
  backHref?: string;    // 뒤로가기 목적지 (없으면 router.back())
  backLabel?: string;   // 뒤로가기 버튼 텍스트 (없으면 아이콘만)
}

export default function Header({
  title,
  showBack = false,
  backHref,
  backLabel,
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) router.push(backHref);
    else router.back();
  };

  return (
    <header
      className="
        fixed top-0 left-1/2 -translate-x-1/2
        w-full max-w-mobile
        bg-white border-b border-base-border
        z-50
      "
    >
      <div className="flex items-center justify-between px-5 py-4 h-14">

        {/* 왼쪽: 뒤로가기 or 로고/제목 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {showBack && (
            <button
              onClick={handleBack}
              className="
                flex items-center gap-0.5 -ml-1.5 mr-1
                text-base-muted active:opacity-60
                transition-opacity flex-shrink-0
              "
              aria-label="뒤로가기"
            >
              <ChevronLeft size={20} strokeWidth={2.2} />
              {backLabel && (
                <span className="text-sm font-semibold">{backLabel}</span>
              )}
            </button>
          )}

          {title ? (
            <h1 className="text-base font-bold text-base-text truncate">
              {title}
            </h1>
          ) : (
            <div className="flex items-center gap-1">
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
        </div>

        {/* 우측 알림 버튼 */}
        <button
          className="
            flex-shrink-0 w-9 h-9 flex items-center justify-center
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
