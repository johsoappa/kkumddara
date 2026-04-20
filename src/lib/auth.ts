// ====================================================
// 꿈따라 Auth 헬퍼
// 회원가입/로그인/role 조회/onboarding 완료 처리
// ====================================================

import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/types/family";

// ────────────────────────────────────────────────────────────
// 학부모 회원가입
// → DB 트리거가 parent + subscription_plan(basic) 자동 생성
//
// [ISO-8859-1 오류 방지 전략]
//   1. user_metadata에는 ASCII 값(role)만 포함 — 한글 불포함
//   2. signup 직후 display_name을 DB에 PATCH 하지 않음
//      (PATCH body는 안전하지만 Cookie 헤더 경로의 모든 한글을 제거하는 것이 목적)
//   3. display_name은 localStorage("kkumddara_pending_profile")에 임시 저장
//   4. 온보딩 완료 시 parent 테이블에 flush → 한글이 오직 JSON body에만 존재
// ────────────────────────────────────────────────────────────
export async function signUpParent(
  email: string,
  password: string,
  displayName?: string
) {
  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: "parent" as UserRole,
        // display_name: 제외 — metadata에 한글 포함 시 Cookie 헤더 오류 유발
      },
    },
  });

  // 가입 성공 + display_name이 있으면 localStorage에 임시 저장 (네트워크 요청 없음)
  // 온보딩 완료 시 flushPendingProfile()로 DB에 반영한다.
  if (!result.error && displayName?.trim()) {
    if (typeof window !== "undefined") {
      const pending = JSON.parse(
        localStorage.getItem("kkumddara_pending_profile") ?? "{}"
      );
      localStorage.setItem(
        "kkumddara_pending_profile",
        JSON.stringify({ ...pending, display_name: displayName.trim() })
      );
    }
  }

  return result;
}

// ────────────────────────────────────────────────────────────
// 학생 회원가입
// → DB 트리거가 student 자동 생성 (child_id는 onboarding에서 연결)
// ISO-8859-1 방지 전략은 signUpParent와 동일:
//   nickname을 localStorage에 임시 저장 → 온보딩 완료 시 DB flush
// ────────────────────────────────────────────────────────────
export async function signUpStudent(
  email: string,
  password: string,
  nickname?: string
) {
  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: "student" as UserRole,
        // nickname: 제외 — metadata에 한글 포함 시 Cookie 헤더 오류 유발
      },
    },
  });

  // 가입 성공 + nickname이 있으면 localStorage에 임시 저장 (네트워크 요청 없음)
  if (!result.error && nickname?.trim()) {
    if (typeof window !== "undefined") {
      const pending = JSON.parse(
        localStorage.getItem("kkumddara_pending_profile") ?? "{}"
      );
      localStorage.setItem(
        "kkumddara_pending_profile",
        JSON.stringify({ ...pending, nickname: nickname.trim() })
      );
    }
  }

  return result;
}

// ────────────────────────────────────────────────────────────
// localStorage 임시 프로필 → DB flush
//
// 회원가입 시 한글 이름/닉네임을 localStorage에 임시 저장해 두고,
// 온보딩 완료 시점에 이 함수로 DB에 반영 + localStorage 클리어.
//
// role = "parent" → parent.display_name 업데이트
// role = "student" → student.nickname 업데이트
// ────────────────────────────────────────────────────────────
export async function flushPendingProfile(
  role: "parent" | "student",
  recordId: string   // parent.id 또는 student.id (user_id 아님)
) {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem("kkumddara_pending_profile");
  if (!raw) return;

  let pending: Record<string, string>;
  try {
    pending = JSON.parse(raw);
  } catch {
    localStorage.removeItem("kkumddara_pending_profile");
    return;
  }

  if (role === "parent" && pending.display_name) {
    await supabase
      .from("parent")
      .update({ display_name: pending.display_name })
      .eq("id", recordId);
  } else if (role === "student" && pending.nickname) {
    await supabase
      .from("student")
      .update({ nickname: pending.nickname })
      .eq("id", recordId);
  }

  localStorage.removeItem("kkumddara_pending_profile");
}

// ────────────────────────────────────────────────────────────
// 로그인 (공통)
// ────────────────────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

// ────────────────────────────────────────────────────────────
// 카카오 OAuth 로그인
//
// [흐름]
//   1. signInWithOAuth → 카카오 인증 페이지 redirect
//   2. 인증 완료 → /auth/callback?code=...&role=<role> 으로 복귀
//   3. /auth/callback 핸들러가 세션 교환 + parent/student 레코드 생성
//   4. /home → 미들웨어가 최종 분기
//
// [redirectTo]
//   배포 환경에 따라 NEXT_PUBLIC_SITE_URL 환경변수로 override 가능.
//   미설정 시 window.location.origin fallback (localhost/preview 대응).
// ────────────────────────────────────────────────────────────
export async function signInWithKakao(role: "parent" | "student") {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");

  const redirectTo = `${origin}/auth/callback?role=${role}`;

  // ── [ROLE-TRACE] 브라우저 콘솔 로그 — 진단 후 제거 ──
  // Vercel 서버 로그에는 안 남음. 브라우저 DevTools Console 탭에서 확인.
  console.log("[ROLE-TRACE] signInWithKakao 호출");
  console.log("[ROLE-TRACE]   role       :", role);
  console.log("[ROLE-TRACE]   origin     :", origin);
  console.log("[ROLE-TRACE]   redirectTo :", redirectTo);
  // ────────────────────────────────────────────────────

  return supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo,
      // account_email 권한 없음(KOE205) → scopes 명시로 Supabase 기본값 덮어씀
      // Supabase Kakao 기본 scope: "profile_nickname account_email" → account_email 제거
      // Supabase Dashboard: Authentication → Providers → Kakao → Allow users without email ON 필요
      scopes: "profile_nickname profile_image",
    },
  });
}

// ────────────────────────────────────────────────────────────
// 로그아웃
// ────────────────────────────────────────────────────────────
export async function signOut() {
  return supabase.auth.signOut();
}

// ────────────────────────────────────────────────────────────
// 현재 유저 role 조회
// user_metadata.role 기반
// ────────────────────────────────────────────────────────────
export async function getRole(): Promise<UserRole | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return (user?.user_metadata?.role as UserRole) ?? null;
}

// ────────────────────────────────────────────────────────────
// 온보딩 완료 처리 (학부모)
// 1. parent.onboarding_status = 'completed'
// 2. user_metadata.onboarding_completed = true (middleware용)
// ────────────────────────────────────────────────────────────
export async function completeParentOnboarding(parentId: string) {
  const [dbResult, metaResult] = await Promise.all([
    supabase
      .from("parent")
      .update({ onboarding_status: "completed" as const })
      .eq("id", parentId),
    // role을 명시적으로 재설정 — 세션 오염 방어
    supabase.auth.updateUser({
      data: { role: "parent" as UserRole, onboarding_completed: true },
    }),
  ]);
  return { dbResult, metaResult };
}

// ────────────────────────────────────────────────────────────
// 온보딩 완료 처리 (학생)
// 1. student.child_id 연결 + onboarding_status = 'completed'
// 2. user_metadata.onboarding_completed = true
// ────────────────────────────────────────────────────────────
export async function completeStudentOnboarding(
  studentId: string,
  childId: string
) {
  const [dbResult, metaResult] = await Promise.all([
    supabase
      .from("student")
      .update({ child_id: childId, onboarding_status: "completed" as const })
      .eq("id", studentId),
    // role을 명시적으로 재설정 — 세션 오염 방어
    supabase.auth.updateUser({
      data: { role: "student" as UserRole, onboarding_completed: true },
    }),
  ]);
  return { dbResult, metaResult };
}

// ────────────────────────────────────────────────────────────
// 초대 코드로 child 조회 (RPC — authenticated 필요)
// ────────────────────────────────────────────────────────────
export async function verifyInviteCode(code: string) {
  const { data, error } = await supabase.rpc(
    "verify_child_invite_code",
    { p_code: code.trim().toUpperCase() }
  );

  if (error) {
    // 권한 오류(42501)와 코드 불일치를 구분해 로깅
    console.error("[verifyInviteCode] RPC error:", error.code, error.message);
    return null;
  }
  if (!data || data.length === 0) return null;
  return data[0];
}
