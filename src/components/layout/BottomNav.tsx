"use client";

// ====================================================
// 하단 네비게이션 바 컴포넌트
// - 5개 탭: 홈 / 탐색 / 로드맵 / 리포트(부모) or 내 활동(학생) / 설정
// - 활성 탭: 레드오렌지 색상
// - 비활성 탭: 미드 그레이
//
// [역할별 리포트 탭 분리]
//   parent → "리포트" (/report) : 부모 주간 리포트
//   student → "내 활동" (/student/home) : 완료 미션 확인 흐름
//   미로딩 → "리포트" 기본값 유지 (깜빡임 방지)
// ====================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, Search, Map, BarChart2, Settings, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

// CS 페이지 목록 (설정 탭 활성화용)
const CS_PATHS = ["/settings", "/pricing", "/terms", "/privacy", "/refund", "/youth", "/faq", "/guide", "/contact"];

// 새싹 모드 경로 (홈 탭 활성화용)
const SPROUT_PATHS = ["/sprout"];

// 부모 탭 정의
const PARENT_NAV_ITEMS = [
  { href: "/home",     label: "홈",     icon: Home     },
  { href: "/explore",  label: "탐색",   icon: Search   },
  { href: "/roadmap",  label: "로드맵", icon: Map      },
  { href: "/report",   label: "리포트", icon: BarChart2 },
  { href: "/settings", label: "설정",   icon: Settings },
];

// 학생 탭 정의 — "리포트" 대신 "내 활동" (/student/home)
const STUDENT_NAV_ITEMS = [
  { href: "/student/home", label: "홈",     icon: Home     },
  { href: "/explore",      label: "탐색",   icon: Search   },
  { href: "/roadmap",      label: "로드맵", icon: Map      },
  { href: "/student/home", label: "내 활동", icon: Zap     },
  { href: "/settings",     label: "설정",   icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<"parent" | "student" | null>(null);

  // 사용자 역할 확인 — user_metadata.role 기준
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const r = user?.user_metadata?.role as "parent" | "student" | undefined;
      setRole(r ?? null);
    });
  }, []);

  // 역할에 따라 탭 선택 (미로딩 상태는 부모 기본값)
  const navItems = role === "student" ? STUDENT_NAV_ITEMS : PARENT_NAV_ITEMS;

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
          // 탭별 활성 판별
          const isActive =
            href === "/settings"
              // 설정 탭: CS 페이지 전체에서 활성화
              ? CS_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
              : href === "/home"
              // 홈 탭: /home + /sprout/* 경로에서 활성화
              ? pathname === href ||
                pathname.startsWith(href + "/") ||
                SPROUT_PATHS.some(
                  (p) => pathname === p || pathname.startsWith(p + "/")
                )
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
