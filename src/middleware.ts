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
//   /admin/*     → 세션 쿠키 갱신만 수행 (redirect·role 판정 없음).
//                  실제 허용/차단은 서버 컴포넌트·Route Handler의
//                  requireOperator()/requireAdmin()이 담당한다.
//                  (src/lib/admin-auth.ts, docs/admin-access-control-design.md §6·§7)
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
  // 인증 완료 + 온보딩 완료 + role 확정 → role-home으로 이동
  if (pathname === "/") {
    if (user && onboardingCompleted && role) {
      return redirectTo(role === "parent" ? "/parent/home" : "/student/home");
    }
    // role 미설정 사용자는 랜딩 유지 (student fallback 금지)
    return response;
  }

  // ── /home ─────────────────────────────────────────
  // role 기반 redirect
  if (pathname === "/home") {
    if (!user) return redirectTo("/");
    // role 미설정 시 랜딩으로 (student fallback 하드코딩 금지)
    // 조용한 fallback 금지 — /auth/callback과 동일한 role_required 안내를 재사용
    if (!role) {
      console.error("[middleware] /home — role 미설정, userId:", user.id);
      return redirectTo("/?error=role_required");
    }
    const dest = role === "parent" ? "/parent/home" : "/student/home";
    return redirectTo(dest);
  }

  // ── /onboarding (구 경로, 상태 분기 redirect) ───────
  if (pathname === "/onboarding") {
    if (!user) return redirectTo("/");
    // role 미설정 시 랜딩으로 (student fallback 금지)
    if (!role) return redirectTo("/");
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

  // ── /admin/* ──────────────────────────────────────
  // 1차 방어는 세션 쿠키 갱신뿐이다(위 getUser() 호출로 이미 처리됨).
  // admin_users 조회, role 판정, service role 사용, user_metadata/
  // app_metadata 참조는 여기서 하지 않는다 — 전부 requireOperator()/
  // requireAdmin()의 책임이다. redirect도 하지 않는다(관리자 화면
  // 존재 자체를 노출하지 않기 위해 무권한 접근은 항상 404로만 응답).
  if (pathname.startsWith("/admin")) {
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
    "/admin/:path*",
  ],
};
