"use client";

// ====================================================
// 하단 네비게이션 바 컴포넌트
// - 4개 탭: 홈 / 탐색 / 로드맵 / 리포트
// - 활성 탭: 레드오렌지 색상
// - 비활성 탭: 미드 그레이
// ====================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Map, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// CS 페이지 목록 (설정 탭 활성화용)
const CS_PATHS = ["/settings", "/terms", "/privacy", "/refund", "/youth", "/faq", "/guide", "/contact"];

// 탭 메뉴 정의
const navItems = [
  { href: "/home",     label: "홈",     icon: Home     },
  { href: "/explore",  label: "탐색",   icon: Search   },
  { href: "/roadmap",  label: "로드맵", icon: Map      },
  { href: "/report",   label: "리포트", icon: BarChart2 },
  { href: "/settings", label: "설정",   icon: Settings },
];

export default function BottomNav() {
  // 현재 경로를 가져와서 활성 탭 판별
  const pathname = usePathname();

  return (
    <nav
      className="
        fixed bottom-0 left-1/2 -translate-x-1/2
        w-full max-w-mobile
        bg-white border-t border-base-border
        shadow-nav z-50 safe-bottom
      "
      // [확인 포인트] safe-bottom 클래스로 iPhone 홈 버튼 영역 확보
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          // 설정 탭: CS 페이지 전체에서 활성화
          const isActive =
            href === "/settings"
              ? CS_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
              : pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              className="
                flex flex-col items-center justify-center
                gap-1 py-1 px-3 rounded-xl
                min-w-[60px] min-h-[52px]
                transition-colors
              "
            >
              {/* 아이콘 */}
              <Icon
                size={22}
                className={cn(
                  "transition-colors",
                  isActive ? "text-brand-red" : "text-base-muted"
                )}
                // 활성: 레드오렌지, 비활성: 미드 그레이
                strokeWidth={isActive ? 2.5 : 1.8}
              />

              {/* 탭 라벨 */}
              <span
                className={cn(
                  "text-[11px] font-medium transition-colors",
                  isActive ? "text-brand-red" : "text-base-muted"
                )}
              >
                {label}
              </span>

              {/* 활성 탭 인디케이터 (작은 점) */}
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-red" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
