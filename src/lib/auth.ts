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
// [주의] display_name을 user_metadata에 넣으면 @supabase/ssr가
//   세션을 쿠키에 raw JSON으로 저장할 때 한글이 포함되어
//   다음 fetch의 Cookie 헤더에서 ISO-8859-1 오류가 발생한다.
//   → role(ASCII)만 metadata에 넣고, display_name은 signup 후 DB 직접 저장.
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
        // display_name은 metadata에서 제외 — ISO-8859-1 Cookie 오류 방지
      },
    },
  });

  // 가입 성공 + display_name이 있으면 parent 테이블에 별도 저장
  // (DB 트리거가 parent 레코드를 동기 생성하므로 즉시 update 가능)
  if (!result.error && result.data.user && displayName?.trim()) {
    await supabase
      .from("parent")
      .update({ display_name: displayName.trim() })
      .eq("user_id", result.data.user.id);
  }

  return result;
}

// ────────────────────────────────────────────────────────────
// 학생 회원가입
// → DB 트리거가 student 자동 생성 (child_id는 onboarding에서 연결)
// display_name 처리 방식은 signUpParent와 동일 (ISO-8859-1 방지)
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
        // nickname은 metadata에서 제외 — ISO-8859-1 Cookie 오류 방지
      },
    },
  });

  // 가입 성공 + nickname이 있으면 student 테이블에 별도 저장
  if (!result.error && result.data.user && nickname?.trim()) {
    await supabase
      .from("student")
      .update({ nickname: nickname.trim() })
      .eq("user_id", result.data.user.id);
  }

  return result;
}

// ────────────────────────────────────────────────────────────
// 로그인 (공통)
// ────────────────────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
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
    supabase.auth.updateUser({
      data: { onboarding_completed: true },
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
    supabase.auth.updateUser({
      data: { onboarding_completed: true },
    }),
  ]);
  return { dbResult, metaResult };
}

// ────────────────────────────────────────────────────────────
// 초대 코드로 child 조회 (RPC — 비인증 가능)
// ────────────────────────────────────────────────────────────
export async function verifyInviteCode(code: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc(
    "verify_child_invite_code",
    { p_code: code.trim().toUpperCase() }
  );
  if (error || !data || (data as unknown[]).length === 0) return null;
  return (data as { child_id: string; child_name: string; school_grade: string }[])[0];
}
