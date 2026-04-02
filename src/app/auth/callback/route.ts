// ====================================================
// OAuth 콜백 핸들러 — /auth/callback
// 카카오 등 OAuth 인증 코드를 세션으로 교환
//
// 흐름:
//   1. ?code → exchangeCodeForSession (세션 쿠키 발급)
//   2. 신규 OAuth 사용자 + role 없음 → ?role 파라미터로 설정
//   3. role=parent → parent + subscription_plan 레코드 생성 (없을 때만)
//   4. role=student → student 레코드 생성 (없을 때만)
//   5. /home redirect → 미들웨어가 role/onboarding 기반 최종 분기
//
// [주의] parent/student INSERT는 DB RLS INSERT 정책이 필요:
//   "parent: 본인 생성" / "student: 본인 생성" / "subscription: parent 생성"
//   → Supabase Dashboard SQL Editor에서 별도 실행 필요 (README 참고)
// ====================================================

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const role = (requestUrl.searchParams.get("role") ?? "") as "parent" | "student" | "";

  if (!code) {
    // code 없이 진입한 경우 → 랜딩으로 fallback
    return NextResponse.redirect(new URL("/", requestUrl.origin));
  }

  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Route Handler에서는 setAll 정상 동작.
            // Server Component에서 호출 시 이 catch 블록에 진입하나 무해함.
          }
        },
      },
    }
  );

  // 1. 코드 → 세션 교환
  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !session?.user) {
    console.error("[auth/callback] exchangeCodeForSession 실패:", error?.message);
    return NextResponse.redirect(new URL("/", requestUrl.origin));
  }

  const userId = session.user.id;
  const existingRole = session.user.user_metadata?.role as "parent" | "student" | undefined;
  const finalRole = existingRole || (role as "parent" | "student") || undefined;

  // 2. 신규 OAuth 사용자 — role 설정 (이메일 가입과 달리 trigger가 role을 모름)
  if (!existingRole && finalRole) {
    await supabase.auth.updateUser({ data: { role: finalRole } });
  }

  // 3. parent 레코드 + subscription_plan 생성
  //    (handle_new_user 트리거는 INSERT 시점에만 실행되므로 OAuth 신규 유저는 직접 생성)
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

  // 5. /home → 미들웨어가 role + onboarding 기반 최종 분기
  return NextResponse.redirect(new URL("/home", requestUrl.origin));
}
