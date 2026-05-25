// ====================================================
// OAuth 콜백 핸들러 — /auth/callback
// 카카오 등 OAuth 인증 코드를 세션으로 교환
//
// [흐름]
//   1. ?code → exchangeCodeForSession (세션 쿠키 발급)
//   2. finalRole 결정 (우선순위: URL query → oauth_role 쿠키 → user_metadata.role)
//      - role 확정 불가 → /?error=role_required (조용한 fallback 금지)
//      - requestedRole ≠ existingRole → /?error=role_mismatch (정책 위반 차단)
//   3. role=parent → parent + subscription_plan 레코드 생성 (없을 때만)
//   4. role=student → student 레코드 생성 (없을 때만)
//   5. /home redirect → 미들웨어가 role/onboarding 기반 최종 분기
//
// [role 결정 설계]
//   1순위: URL query ?role=     (이메일 로그인 호환)
//   2순위: oauth_role 쿠키      (카카오 OAuth — /auth/kakao/start에서 세팅)
//   3순위: user_metadata.role  (기존 계정 재로그인)
//   oauth_role 쿠키는 callback 완료 후 즉시 삭제
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
  const code  = requestUrl.searchParams.get("code");

  // role 결정 소스
  const roleQuery  = requestUrl.searchParams.get("role") ?? "";
  const roleCookie = request.cookies.get("oauth_role")?.value ?? "";

  if (!code) {
    console.error("[auth/callback] code 없음 → / redirect");
    return NextResponse.redirect(new URL("/", requestUrl.origin));
  }

  const cookieStore = cookies();

  // redirect 응답을 먼저 생성 (setAll에서 response.cookies에 동시 세팅하기 위함)
  const response = NextResponse.redirect(new URL("/home", requestUrl.origin));

  // oauth_role 쿠키 즉시 삭제 (role 복원 완료, 이후 불필요)
  response.cookies.delete("oauth_role");

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
            response.cookies.set(name, value, options);
          });
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

  const userId      = session.user.id;
  const existingRole = session.user.user_metadata?.role as "parent" | "student" | undefined;

  // 2. role 결정 — URL query → oauth_role 쿠키 → user_metadata.role
  const requestedRole =
    roleQuery  === "parent" || roleQuery  === "student" ? roleQuery  :
    roleCookie === "parent" || roleCookie === "student" ? roleCookie :
    undefined;
  const finalRole = requestedRole ?? existingRole;

  console.info("[auth/callback] role 결정", {
    requestedRole: requestedRole ?? null,
    existingRole:  existingRole  ?? null,
    finalRole:     finalRole     ?? null,
    source: roleQuery ? "query" : roleCookie ? "cookie" : "metadata",
  });

  // role 확정 불가: 명시적 에러 redirect (조용한 fallback 금지)
  if (!finalRole) {
    console.error("[auth/callback] role 결정 실패 — userId:", userId);
    return NextResponse.redirect(new URL("/?error=role_required", requestUrl.origin));
  }

  // role 불일치 감지 (정책 위반): 기존 role ≠ 요청 role → 에러 redirect
  // 예: student 계정으로 parent 로그인 시도
  if (requestedRole && existingRole && requestedRole !== existingRole) {
    console.error("[auth/callback] role 불일치 —",
      `existingRole=${existingRole}, requestedRole=${requestedRole}, userId=${userId}`);
    return NextResponse.redirect(
      new URL(`/?error=role_mismatch&existingRole=${existingRole}`, requestUrl.origin)
    );
  }

  // role 저장: 신규 사용자이거나 기존 role과 다를 경우
  if (finalRole !== existingRole) {
    const { error: updateErr } = await supabase.auth.updateUser({ data: { role: finalRole } });
    if (updateErr) {
      console.error("[auth/callback] updateUser 실패:", updateErr.message, "userId:", userId);
      return NextResponse.redirect(new URL("/?error=auth_failed", requestUrl.origin));
    }
  }

  // 3. parent 레코드 + subscription_plan 생성
  if (finalRole === "parent") {
    const { data: existingParent, error: parentSelectErr } = await supabase
      .from("parent")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (parentSelectErr) {
      console.error("[auth/callback] parent 조회 오류:", parentSelectErr.message);
    }

    if (!existingParent) {
      const kakaoName =
        (session.user.user_metadata?.full_name as string) ??
        (session.user.user_metadata?.name    as string) ??
        "";

      const { data: newParent, error: parentErr } = await supabase
        .from("parent")
        .insert({ user_id: userId, display_name: kakaoName })
        .select("id")
        .maybeSingle();

      if (parentErr) {
        console.error("[auth/callback] parent INSERT 실패:", parentErr.message, "code:", parentErr.code);
        return NextResponse.redirect(new URL("/?error=profile_setup_failed", requestUrl.origin));
      }

      if (newParent) {
        const { error: planErr } = await supabase
          .from("subscription_plan")
          .insert({
            parent_id:                newParent.id,
            plan_name:                "free",
            child_limit:              1,
            ai_consult_monthly_limit: 3,
            myeonddara_yearly_limit:  1,
          });
        if (planErr) {
          console.error("[auth/callback] subscription_plan INSERT 실패:", planErr.message);
          // subscription_plan 없어도 parent/home 접근 가능 — 계속 진행
        }

        // onboarding_completed 리셋
        // 신규 parent row 생성 = parent 온보딩 미완료.
        // 이전 student 온보딩 완료로 true가 남아 있으면 parent 온보딩을 스킵하게 됨.
        // → false 리셋으로 /onboarding/parent 강제 통과
        if (session.user.user_metadata?.onboarding_completed === true) {
          const { error: resetErr } = await supabase.auth.updateUser({
            data: { onboarding_completed: false },
          });
          if (resetErr) {
            console.error("[auth/callback] onboarding_completed 리셋 실패:", resetErr.message);
          }
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
      const kakaoNickname =
        (session.user.user_metadata?.full_name as string) ??
        (session.user.user_metadata?.name    as string) ??
        "";

      const { error: studentErr } = await supabase
        .from("student")
        .insert({ user_id: userId, nickname: kakaoNickname });

      if (studentErr) {
        console.error("[auth/callback] student INSERT 실패:", studentErr.message);
      }
    }
  }

  // 5. 세션 쿠키가 실린 response 반환 → 미들웨어가 /home → role-home으로 분기
  console.info("[auth/callback] ✅ 완료 → /home (finalRole:", finalRole, ")");
  return response;
}
