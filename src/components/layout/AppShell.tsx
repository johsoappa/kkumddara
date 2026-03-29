"use client";

// ====================================================
// 앱 공통 레이아웃 래퍼
// - 헤더 + 컨텐츠 영역 + 하단 네비게이션
// - 모바일 최대 너비 430px, 데스크톱은 가운데 정렬
// ====================================================

import Header from "./Header";
import BottomNav from "./BottomNav";

interface AppShellProps {
  children: React.ReactNode;
  headerTitle?: string;    // 페이지별 헤더 제목
  showNav?: boolean;       // 하단 네비게이션 표시 여부 (기본값: true)
  showBack?: boolean;      // 헤더 뒤로가기 버튼 표시 여부
  backHref?: string;       // 뒤로가기 목적지 (없으면 router.back())
}

export default function AppShell({
  children,
  headerTitle,
  showNav = true,
  showBack = false,
  backHref,
}: AppShellProps) {
  return (
    // 전체 화면 가운데 정렬 컨테이너
    <div className="min-h-screen bg-base-off flex justify-center">
      {/* 모바일 영역 */}
      <div className="relative w-full max-w-mobile bg-base-off">
        {/* 상단 헤더 */}
        <Header title={headerTitle} showBack={showBack} backHref={backHref} />

        {/* 메인 컨텐츠 */}
        {/* [확인 포인트] pt-14: 헤더 높이만큼 상단 패딩, pb-20: 하단 네비 높이 */}
        <main
          className={`
            pt-14 min-h-screen
            ${showNav ? "pb-20" : "pb-4"}
          `}
        >
          {children}
        </main>

        {/* 하단 네비게이션 */}
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}
