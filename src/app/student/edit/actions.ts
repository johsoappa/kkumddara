// ====================================================
// 학생 프로필 수정 Server Action
// — 서버에서 입력값 검증 후 DB 업데이트
//
// 보안:
//   1. validateGradeLevel / validateInterests 로 허용값 범위 검증 (DB 반영 전)
//   2. supabase.auth.getUser() 로 인증 확인
//   3. student.child_id 경유 → 자신의 child만 업데이트 가능
//   4. role !== "student" 접근 차단
//
// 저장 정책 (grade_level source of truth):
//   - child.grade_level: 항상 저장 (초1~고3 전체 지원)
//   - child.school_grade: grade_level → school_grade 매핑이 있으면 동시 저장
//     (초1·초2는 school_grade 없음 → null 저장)
// ====================================================

"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateGradeLevel, validateInterests } from "@/lib/validation";
import { GRADE_LEVEL_TO_SCHOOL_GRADE } from "@/types/family";

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateStudentProfile(
  grade: unknown,
  interests: unknown
): Promise<UpdateProfileResult> {

  // ── 1. 서버 입력값 검증 ─────────────────────────────
  // grade_level(elem_1~high_3) 기준으로 검증 — 초1·초2 포함 전체 범위
  const gradeResult = validateGradeLevel(grade);
  if (!gradeResult.ok) return { ok: false, error: gradeResult.error };

  const interestsResult = validateInterests(interests);
  if (!interestsResult.ok) return { ok: false, error: interestsResult.error };

  // ── 2. 인증 ──────────────────────────────────────────
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "로그인이 필요해요." };
  }
  if (user.user_metadata?.role !== "student") {
    return { ok: false, error: "학생 계정에서만 수정할 수 있어요." };
  }

  // ── 3. child_id 확보 (student → child 경로만 허용) ──
  const { data: studentData, error: studentErr } = await supabase
    .from("student")
    .select("child_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (studentErr) {
    console.error("[updateStudentProfile] student 조회 오류:", studentErr.message);
    return { ok: false, error: "학생 정보를 불러올 수 없어요." };
  }
  if (!studentData?.child_id) {
    return { ok: false, error: "연결된 자녀 프로필이 없어요." };
  }

  // ── 4. DB 업데이트 ───────────────────────────────────
  // grade_level: source of truth (초1~고3 전체)
  // school_grade: 하위호환 병행 저장 (초1·초2는 매핑 없음 → null)
  const gradeLevel   = gradeResult.value;
  const schoolGrade  = GRADE_LEVEL_TO_SCHOOL_GRADE[gradeLevel] ?? null;

  const { error: dbError } = await supabase
    .from("child")
    .update({
      grade_level:  gradeLevel,
      school_grade: schoolGrade,
      interests:    interestsResult.value,
    })
    .eq("id", studentData.child_id);

  if (dbError) {
    console.error("[updateStudentProfile] child 업데이트 오류:", dbError.message);
    return { ok: false, error: "저장 중 오류가 발생했어요. 다시 시도해주세요." };
  }

  return { ok: true };
}
