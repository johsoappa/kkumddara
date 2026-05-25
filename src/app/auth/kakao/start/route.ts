// ====================================================
// 카카오 OAuth 시작 — 서버 Route Handler
// /auth/kakao/start?role=parent|student
//
// [문제 배경]
//   client-side signInWithOAuth는 아래 원인으로 불안정:
//     1. NEXT_PUBLIC_SITE_URL 불일치 시 잘못된 redirectTo 생성
//     2. 비동기 실행 중 기존 세션 초기화 race condition
//     3. 모바일 브라우저 async navigation 제한
//
// [해결]
//   버튼 클릭 → window.location.href = /auth/kakao/start?role=parent
//   → 전체 페이지 이동 (race condition 없음)
//   → 서버에서 requestUrl.origin 기준으로 redirectTo 생성
//     (NEXT_PUBLIC_SITE_URL 의존 없음 → 도메인 불일치 불가)
//   → createServerClient로 signInWithOAuth (skipBrowserRedirect: true)
//   → PKCE verifier 쿠키를 response에 세팅
//   → Supabase OAuth URL로 redirect
//   → accounts.kakao.com → /auth/callback?role=parent
//
// [보안]
//   - role 파라미터는 "parent" | "student" 만 허용
//   - 그 외 값은 "parent" 기본값으로 처리
//   - PKCE verifier 원문은 로그에 출력하지 않음
// ====================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const rawRole = requestUrl.searchParams.get("role");

  // role 검증: "parent" | "student" 만 허용
  const role: "parent" | "student" =
    rawRole === "parent" || rawRole === "student" ? rawRole : "parent";

  // redirectTo: 요청이 들어온 origin 기준으로 생성
  // NEXT_PUBLIC_SITE_URL 사용하지 않음 → 도메인 불일치 발생 불가
  const redirectTo = `${requestUrl.origin}/auth/callback?role=${role}`;

  console.info("[auth/kakao/start] ① OAuth 시작 요청", {
    role,
    origin: requestUrl.origin,
    // redirectTo URL 전체 출력 (민감 정보 없음)
    redirectTo,
  });

  const cookieStore = cookies();

  // setAll 호출 시 수집된 쿠키 (response 생성 전에 호출될 수 있으므로 별도 수집)
  // Supabase SDK가 PKCE verifier 등을 쿠키에 저장할 때 호출됨
  const pendingCookies: Array<{
    name: string;
    value: string;
    options: Parameters<ReturnType<typeof cookies>["set"]>[2];
  }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // cookieStore에도 세팅 (Next.js 내부 캐시)
            cookieStore.set(name, value, options);
            // response에 세팅하기 위해 수집
            pendingCookies.push({ name, value, options });
          });
        },
      },
    }
  );

  // skipBrowserRedirect: true → 서버에서 직접 redirect 처리
  // scopes: Supabase 기본 scope에서 account_email 제거 (KOE205 방지)
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      scopes: "profile_nickname profile_image",
    },
  });

  if (error || !data.url) {
    console.error("[auth/kakao/start] ❌ signInWithOAuth 실패:", error?.message ?? "data.url 없음");
    return NextResponse.redirect(
      new URL("/?error=kakao_start_failed", requestUrl.origin)
    );
  }

  console.info("[auth/kakao/start] ✅ OAuth URL 생성 완료 → Supabase로 redirect (쿠키:", pendingCookies.length, "개)");

  // 응답: Supabase OAuth URL로 redirect
  const response = NextResponse.redirect(data.url);

  // PKCE verifier 등 쿠키를 redirect response에도 세팅
  // → 브라우저가 이 쿠키를 갖고 Kakao 인증 후 /auth/callback으로 복귀
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
