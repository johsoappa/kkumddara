// ====================================================
// Next.js Middleware — role 기반 라우팅 보호
//
// 규칙:
//   /            → 인증+온보딩 완료 시 role-home으로 redirect
//   /home        → role 기반 redirect (/parent/home | /student/home)
//   /onboarding  → role 기반 redirect (/onboarding/parent | /onboarding/student)
//   /parent/*    → role=parent 필요, 없으면 /로
//   /student/*   → role=student 필요, 없으면 /로
//   /onboarding/parent  → role=parent 필요
//   /onboarding/student → role=student 필요
// ====================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser()는 매 요청마다 서버에서 토큰 검증 (getSession보다 안전)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as "parent" | "student" | undefined;
  const onboardingCompleted = user?.user_metadata?.onboarding_completed === true;
  const { pathname } = request.nextUrl;

  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, request.url));

  // ── / (랜딩) ──────────────────────────────────────
  // 인증 완료 + 온보딩 완료 → role-home으로 이동
  if (pathname === "/") {
    if (user && onboardingCompleted) {
      return redirectTo(role === "parent" ? "/parent/home" : "/student/home");
    }
    return response;
  }

  // ── /home ─────────────────────────────────────────
  // role 기반 redirect
  if (pathname === "/home") {
    if (!user) return redirectTo("/");
    return redirectTo(role === "parent" ? "/parent/home" : "/student/home");
  }

  // ── /onboarding (구 경로, 상태 분기 redirect) ───────
  if (pathname === "/onboarding") {
    if (!user) return redirectTo("/");
    return redirectTo(
      role === "parent" ? "/onboarding/parent" : "/onboarding/student"
    );
  }

  // ── /onboarding/parent ────────────────────────────
  if (pathname.startsWith("/onboarding/parent")) {
    if (!user || role !== "parent") return redirectTo("/");
    // 온보딩 완료 여부는 미들웨어에서 redirect하지 않음.
    // parent/home에서 "자녀 추가" 버튼이 이 경로로 진입하므로
    // onboarding_completed=true여도 폼을 다시 보여줘야 한다.
    // 폼 제출 후 parent/home으로 이동하는 것은 컴포넌트가 직접 처리.
    return response;
  }

  // ── /onboarding/student ───────────────────────────
  if (pathname.startsWith("/onboarding/student")) {
    if (!user || role !== "student") return redirectTo("/");
    // 온보딩 이미 완료 → student home으로
    if (onboardingCompleted) return redirectTo("/student/home");
    return response;
  }

  // ── /parent/* ─────────────────────────────────────
  if (pathname.startsWith("/parent")) {
    if (!user || role !== "parent") return redirectTo("/");
    // 온보딩 미완료 → 온보딩으로
    if (!onboardingCompleted) return redirectTo("/onboarding/parent");
    return response;
  }

  // ── /student/* ────────────────────────────────────
  if (pathname.startsWith("/student")) {
    if (!user || role !== "student") return redirectTo("/");
    if (!onboardingCompleted) return redirectTo("/onboarding/student");
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/home",
    "/onboarding",
    "/onboarding/:path*",
    "/parent/:path*",
    "/student/:path*",
  ],
};
