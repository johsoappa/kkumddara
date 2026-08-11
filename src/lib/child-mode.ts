// ====================================================
// child-mode.ts — 학년(GradeLevel) → 씨앗/새싹/나침반 모드 변환
//
// [배경] docs/target-child-mode-definition.md 확정 기준(2026-06-09):
//   씨앗 초1~초2 / 새싹 초3~초4 / 나침반 초5~고등
//   이 변환을 실제로 수행하는 코드가 이전까지 없었다(G1.2 조사 결과).
//
// [주의] 이 모드 값은 화면 표시 분기용이며 인증·권한 보안 경계가 아니다.
// ====================================================

import type { GradeLevel } from "@/types/family";

export type ChildMode = "seed" | "sprout" | "compass";

const SEED_GRADES: readonly string[] = ["elem_1", "elem_2"];
const SPROUT_GRADES: readonly string[] = ["elem_3", "elem_4"];
const COMPASS_GRADES: readonly string[] = [
  "elem_5", "elem_6",
  "middle_1", "middle_2", "middle_3",
  "high_1", "high_2", "high_3",
];

/** grade_level → 모드. null/undefined/미정의 값은 모두 null(안전 폴백)로 반환한다. */
export function gradeLevelToMode(
  gradeLevel: GradeLevel | null | undefined
): ChildMode | null {
  if (!gradeLevel) return null;
  if (SEED_GRADES.includes(gradeLevel)) return "seed";
  if (SPROUT_GRADES.includes(gradeLevel)) return "sprout";
  if (COMPASS_GRADES.includes(gradeLevel)) return "compass";
  return null;
}

/** analytics 전송용 범위 표기. 기존 이벤트 property가 한국어 문자열 convention을 사용하므로 동일하게 맞춘다. */
export function childModeToGradeRange(
  mode: ChildMode | null
): "초1~초2" | "초3~초4" | "초5~고등" | "unknown" {
  if (mode === "seed") return "초1~초2";
  if (mode === "sprout") return "초3~초4";
  if (mode === "compass") return "초5~고등";
  return "unknown";
}
