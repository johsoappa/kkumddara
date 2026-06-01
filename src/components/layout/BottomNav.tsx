"use client";

// ====================================================
// 하단 네비게이션 바 컴포넌트
// - 5개 탭: 홈 / 탐색 / 로드맵 / 리포트(부모) or 내 활동(학생) / 설정
// - 활성 탭: 레드오렌지 색상
// - 비활성 탭: 미드 그레이
//
// [역할별 리포트 탭 분리]
//   parent → "리포트" (/report) : 부모 주간 리포트
//   student → "내 활동" (/student/activity) : 완료 미션 확인 전용 페이지
//
// [표시 role 결정 우선순위]
//   1. 실제 로그인 role (user_metadata.role)
//   2. 명시적 roleOverride prop
//   3. demo session role (체험 흐름, sessionStorage)
//   4. pathname fallback (/student·/demo/student → student / /parent·/demo/parent·/report → parent)
//   5. parent fallback (미로딩 깜빡임 방지)
//
//   ※ 학생 체험(/demo/student)에서 공용 /explore·/roadmap 으로 이동해도
//     데모 role이 유지되어 "리포트" 대신 "내 활동"이 노출된다.
//     단, 실제 로그인 role이 있으면 항상 실 role을 우선한다.
// ====================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, Search, Map, BarChart2, Settings, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

// 체험 모드 role 저장 키 (로그인 role이 없을 때만 보조 사용)
export const DEMO_ROLE_KEY = "kkumddara_demo_role";

type NavRole = "parent" | "student";

// pathname 기반 role 추정 (확정 불가 시 null)
function resolvePathnameRole(pathname: string): NavRole | null {
  if (pathname.startsWith("/student") || pathname.startsWith("/demo/student")) {
    return "student";
  }
  if (
    pathname.startsWith("/parent") ||
    pathname.startsWith("/demo/parent") ||
    pathname.startsWith("/report")
  ) {
    return "parent";
  }
  return null;
}

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

// 학생 탭 정의 — "리포트" 대신 "내 활동"
// 데모(비로그인 체험) 학생 모드와 실제 로그인 학생 모드에서 홈/내 활동 경로가 다르다.
//   실제 로그인: 홈 /student/home, 내 활동 /student/activity (보호 라우트)
//   데모 체험:   홈 /demo/student, 내 활동 /demo/student/activity (비보호 데모 라우트)
// 보호 라우트로 이동해 홈/랜딩으로 튕기는 것을 방지하기 위해 href를 분기한다.
function getStudentNavItems(homeHref: string, activityHref: string) {
  return [
    { href: homeHref,     label: "홈",     icon: Home     },
    { href: "/explore",   label: "탐색",   icon: Search   },
    { href: "/roadmap",   label: "로드맵", icon: Map      },
    { href: activityHref, label: "내 활동", icon: Zap      },
    { href: "/settings",  label: "설정",   icon: Settings },
  ];
}

interface BottomNavProps {
  /** 명시적 role 지정 (체험/특수 화면용). 실제 로그인 role이 있으면 무시됨. */
  roleOverride?: NavRole;
}

export default function BottomNav({ roleOverride }: BottomNavProps = {}) {
  const pathname = usePathname();
  const [loginRole, setLoginRole] = useState<NavRole | null>(null);
  const [demoRole,  setDemoRole]  = useState<NavRole | null>(null);

  // 실제 로그인 role 확인 — user_metadata.role 기준
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const r = user?.user_metadata?.role as NavRole | undefined;
      if (r === "parent" || r === "student") {
        setLoginRole(r);
        // 실제 로그인 role이 확정되면 데모 role 잔재 제거 (실 role 우선)
        try { sessionStorage.removeItem(DEMO_ROLE_KEY); } catch { /* noop */ }
        setDemoRole(null);
      } else {
        setLoginRole(null);
      }
    });
  }, []);

  // 데모 체험 role (sessionStorage) — 로그인 role이 없을 때만 보조 사용
  useEffect(() => {
    try {
      const d = sessionStorage.getItem(DEMO_ROLE_KEY);
      if (d === "parent" || d === "student") setDemoRole(d);
    } catch { /* sessionStorage 미사용 환경 무시 */ }
  }, [pathname]);

  // 표시 role 결정 (우선순위는 파일 상단 주석 참고)
  const resolvedRole: NavRole =
    loginRole ?? roleOverride ?? demoRole ?? resolvePathnameRole(pathname) ?? "parent";

  // 데모(비로그인 체험) 학생 모드 여부 — 보호 라우트 대신 데모 라우트로 분기
  //   실제 로그인 role이 있으면 항상 실제 학생 라우트(/student/*)를 사용한다.
  const isDemoStudent =
    !loginRole &&
    (demoRole === "student" || pathname.startsWith("/demo/student"));

  const studentHomeHref     = isDemoStudent ? "/demo/student"          : "/student/home";
  const studentActivityHref = isDemoStudent ? "/demo/student/activity" : "/student/activity";

  const navItems =
    resolvedRole === "student"
      ? getStudentNavItems(studentHomeHref, studentActivityHref)
      : PARENT_NAV_ITEMS;

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
              : href === "/demo/student"
              // 데모 학생 홈 탭: 정확히 일치할 때만 (하위 /demo/student/activity 와 중복 활성 방지)
              ? pathname === href
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
