// ====================================================
// OAuth 콜백 핸들러 — /auth/callback
// 카카오 등 OAuth 인증 코드를 세션으로 교환
//
// 흐름:
//   1. ?code → exchangeCodeForSession (세션 쿠키 발급)
//   2. ?role(URL param) 우선으로 finalRole 결정
//      - requestedRole(URL) vs existingRole(DB) 불일치 → 명시적 에러 redirect
//      - role 확정 불가 → /?error=role_required redirect (조용한 student fallback 금지)
//   3. role=parent → parent + subscription_plan 레코드 생성 (없을 때만)
//   4. role=student → student 레코드 생성 (없을 때만)
//   5. /home redirect → 미들웨어가 role/onboarding 기반 최종 분기
//
// [보안]
//   requestedRole(URL param) 우선 정책:
//   - 학부모가 "학부모로 시작하기" → signInWithKakao("parent") →
//     ?role=parent가 끝까지 유지되어야 한다.
//   - existingRole이 다른 값이면 role_mismatch 에러로 차단.
//
// [수정] response 객체를 먼저 생성 후 setAll에서 response.cookies에도 세팅
//        → 세션 쿠키가 redirect 응답에 포함되어 미들웨어 정상 인식
// ====================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const role = (requestUrl.searchParams.get("role") ?? "") as "parent" | "student" | "";

  // ── [ROLE-TRACE] 진단 로그 — Vercel 로그에서 확인 후 제거 ──
  console.log("[ROLE-TRACE] ① callback 진입");
  console.log("[ROLE-TRACE]   full URL   :", requestUrl.toString());
  console.log("[ROLE-TRACE]   code 존재  :", !!code);
  console.log("[ROLE-TRACE]   role param :", JSON.stringify(role)); // ""·"parent"·"student" 구분
  // ─────────────────────────────────────────────────────────────

  if (!code) {
    console.log("[ROLE-TRACE] ❌ code 없음 → / redirect");
    return NextResponse.redirect(new URL("/", requestUrl.origin));
  }

  const cookieStore = cookies();

  // ✅ 수정: redirect 응답을 먼저 생성
  const response = NextResponse.redirect(new URL("/home", requestUrl.origin));

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
            cookieStore.set(name, value, options);
            response.cookies.set(name, value, options); // ✅ 수정: 응답에도 동시 세팅
          });
        },
      },
    }
  );

  // 1. 코드 → 세션 교환
  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !session?.user) {
    console.error("[auth/callback] exchangeCodeForSession 실패:", error?.message);
    console.log("[ROLE-TRACE] ❌ 세션 교환 실패 → / redirect");
    return NextResponse.redirect(new URL("/", requestUrl.origin));
  }

  const userId = session.user.id;
  const existingRole = session.user.user_metadata?.role as "parent" | "student" | undefined;

  // 2. role 결정 — URL param 우선, fallback existingRole
  //    [원칙] "학부모로 시작하기" 클릭 시 requestedRole=parent 가 끝까지 유지되어야 함.
  //    existingRole || role (이전 방식) → existingRole 이 항상 우선되어 URL param 무시됨 → BUG
  const requestedRole = (role === "parent" || role === "student") ? role : undefined;
  const finalRole = requestedRole ?? existingRole;

  // ── [ROLE-TRACE] 핵심 값 출력 ──────────────────────────────
  console.log("[ROLE-TRACE] ② role 결정");
  console.log("[ROLE-TRACE]   userId        :", userId);
  console.log("[ROLE-TRACE]   existingRole  :", JSON.stringify(existingRole));  // DB metadata 값
  console.log("[ROLE-TRACE]   requestedRole :", JSON.stringify(requestedRole)); // URL param 값
  console.log("[ROLE-TRACE]   finalRole     :", JSON.stringify(finalRole));     // 최종 결정값
  console.log("[ROLE-TRACE]   user_metadata :", JSON.stringify(session.user.user_metadata));
  // ─────────────────────────────────────────────────────────────

  // role 확정 불가: 명시적 에러 redirect (조용한 student fallback 금지)
  if (!finalRole) {
    console.error("[auth/callback] role 결정 실패 — requestedRole:", requestedRole,
      "existingRole:", existingRole, "userId:", userId);
    console.log("[ROLE-TRACE] ❌ finalRole 없음 → /?error=role_required");
    return NextResponse.redirect(new URL("/?error=role_required", requestUrl.origin));
  }

  // role 불일치 감지 (정책 위반): 기존 role ≠ 요청 role → 에러 redirect
  // 예: 이전에 student 로 가입된 카카오 계정으로 parent 로그인 시도
  if (requestedRole && existingRole && requestedRole !== existingRole) {
    console.error(
      `[auth/callback] role 불일치 — existingRole=${existingRole}, requestedRole=${requestedRole}, userId=${userId}`
    );
    console.log("[ROLE-TRACE] ❌ role 불일치 → /?error=role_mismatch");
    return NextResponse.redirect(
      new URL(`/?error=role_mismatch&existingRole=${existingRole}`, requestUrl.origin)
    );
  }

  // role 저장: 신규 사용자이거나 기존 role과 다를 경우 (정상적인 교정 포함)
  if (finalRole !== existingRole) {
    console.log("[ROLE-TRACE] ③ updateUser 호출 — role:", finalRole);
    const { error: updateErr } = await supabase.auth.updateUser({ data: { role: finalRole } });
    if (updateErr) {
      console.error("[auth/callback] updateUser 실패:", updateErr.message, "userId:", userId);
      console.log("[ROLE-TRACE] ❌ updateUser 실패 → /?error=auth_failed");
      return NextResponse.redirect(new URL("/?error=auth_failed", requestUrl.origin));
    }
    console.log("[ROLE-TRACE] ③ updateUser 성공");
  } else {
    console.log("[ROLE-TRACE] ③ updateUser 생략 (role 동일)");
  }

  // 3. parent 레코드 + subscription_plan 생성
  console.log("[ROLE-TRACE] ④ DB row 분기 — finalRole:", finalRole);
  if (finalRole === "parent") {
    const { data: existingParent } = await supabase
      .from("parent")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingParent) {
      const kakaoName = (
        (session.user.user_metadata?.full_name as string) ??
        (session.user.user_metadata?.name as string) ??
        ""
      );

      const { data: newParent, error: parentErr } = await supabase
        .from("parent")
        .insert({ user_id: userId, display_name: kakaoName })
        .select("id")
        .maybeSingle();

      if (parentErr) {
        console.error("[auth/callback] parent INSERT 실패:", parentErr.message);
      } else if (newParent) {
        const { error: planErr } = await supabase
          .from("subscription_plan")
          .insert({ parent_id: newParent.id, plan_name: "basic", child_limit: 1 });
        if (planErr) {
          console.error("[auth/callback] subscription_plan INSERT 실패:", planErr.message);
        }
      }
    }
  }

  // 4. student 레코드 생성
  if (finalRole === "student") {
    const { data: existingStudent } = await supabase
      .from("student")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingStudent) {
      const kakaoNickname = (
        (session.user.user_metadata?.full_name as string) ??
        (session.user.user_metadata?.name as string) ??
        ""
      );

      const { error: studentErr } = await supabase
        .from("student")
        .insert({ user_id: userId, nickname: kakaoNickname });

      if (studentErr) {
        console.error("[auth/callback] student INSERT 실패:", studentErr.message);
      }
    }
  }

  // 5. ✅ 수정: 쿠키가 실린 response 반환
  console.log("[ROLE-TRACE] ⑤ 최종 → /home redirect (finalRole:", finalRole, ")");
  return response;
}
