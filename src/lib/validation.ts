// ====================================================
// 꿈따라 서버 사이드 입력값 검증 유틸리티
//
// 원칙:
//   - 외부 라이브러리(zod 등) 없이 순수 TS로 구현
//   - 모든 검증 함수는 { ok: true; value } | { ok: false; error } 반환
//   - 서버 액션 / route handler 최상단에서 항상 먼저 호출
//   - 실패 시 DB 반영 없이 즉시 에러 반환
//
// 사용 예:
//   const r = validateGrade(body.grade);
//   if (!r.ok) return badRequest(r.error);
// ====================================================

import type { Grade, InterestField } from "@/types/family";

// ── 결과 타입 ─────────────────────────────────────────────────

export type ValidationOk<T>  = { ok: true;  value: T };
export type ValidationFail   = { ok: false; error: string };
export type ValidationResult<T> = ValidationOk<T> | ValidationFail;

// ── 허용값 상수 ──────────────────────────────────────────────

export const VALID_GRADES_LIST: Grade[] = [
  "elementary3", "elementary4", "elementary5", "elementary6",
  "middle1", "middle2", "middle3",
  "high1", "high2", "high3",
];

export const VALID_INTERESTS_LIST: InterestField[] = [
  "it", "art", "medical", "business", "education",
];

export const VALID_ROLES = ["parent", "student"] as const;
export type ValidRole = typeof VALID_ROLES[number];

// ── 검증 함수 ────────────────────────────────────────────────

/** grade: DB child.school_grade 허용값 검증 */
export function validateGrade(v: unknown): ValidationResult<Grade> {
  if (typeof v !== "string" || !v.trim()) {
    return { ok: false, error: "학년을 선택해주세요." };
  }
  if (!VALID_GRADES_LIST.includes(v as Grade)) {
    return { ok: false, error: "허용되지 않는 학년 값이에요." };
  }
  return { ok: true, value: v as Grade };
}

/** interests: DB child.interests 허용값 검증 */
export function validateInterests(v: unknown): ValidationResult<InterestField[]> {
  if (!Array.isArray(v)) {
    return { ok: false, error: "관심분야는 배열 형식이어야 해요." };
  }
  if (v.length === 0) {
    return { ok: false, error: "관심분야를 1개 이상 선택해주세요." };
  }
  if (v.length > 5) {
    return { ok: false, error: "관심분야는 최대 5개까지 선택 가능해요." };
  }
  for (const item of v) {
    if (!VALID_INTERESTS_LIST.includes(item as InterestField)) {
      return { ok: false, error: `허용되지 않는 관심분야 값이에요: ${item}` };
    }
  }
  return { ok: true, value: v as InterestField[] };
}

/** role: parent | student 검증 */
export function validateRole(v: unknown): ValidationResult<ValidRole> {
  if (typeof v !== "string") {
    return { ok: false, error: "역할 값이 올바르지 않아요." };
  }
  if (!VALID_ROLES.includes(v as ValidRole)) {
    return { ok: false, error: `허용되지 않는 역할이에요: ${v}` };
  }
  return { ok: true, value: v as ValidRole };
}

/** UUID v4 형식 검증 (DB PK / FK 입력값 보호용) */
export function validateUUID(v: unknown, fieldName = "ID"): ValidationResult<string> {
  if (typeof v !== "string" || !v.trim()) {
    return { ok: false, error: `${fieldName} 값이 비어 있어요.` };
  }
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(v.trim())) {
    return { ok: false, error: `${fieldName} 형식이 올바르지 않아요.` };
  }
  return { ok: true, value: v.trim() };
}

/** 초대 코드: 8자리 영문(대문자) + 숫자 */
export function validateInviteCode(v: unknown): ValidationResult<string> {
  if (typeof v !== "string" || !v.trim()) {
    return { ok: false, error: "초대 코드를 입력해주세요." };
  }
  const code = v.trim().toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(code)) {
    return { ok: false, error: "초대 코드는 8자리 영문/숫자 조합이어야 해요." };
  }
  return { ok: true, value: code };
}

/** AI 상담 메시지: 1~1000자 */
export function validateMessage(v: unknown): ValidationResult<string> {
  if (typeof v !== "string" || !v.trim()) {
    return { ok: false, error: "메시지를 입력해주세요." };
  }
  const text = v.trim();
  if (text.length > 1000) {
    return { ok: false, error: "메시지는 1000자 이하로 입력해주세요." };
  }
  return { ok: true, value: text };
}

/** 이름: 1~50자, 공백만 입력 불가 */
export function validateName(v: unknown): ValidationResult<string> {
  if (typeof v !== "string" || !v.trim()) {
    return { ok: false, error: "이름을 입력해주세요." };
  }
  if (v.trim().length > 50) {
    return { ok: false, error: "이름은 50자 이하로 입력해주세요." };
  }
  return { ok: true, value: v.trim() };
}

/** 성별: 남자 | 여자 */
export function validateGender(v: unknown): ValidationResult<"남자" | "여자"> {
  if (v !== "남자" && v !== "여자") {
    return { ok: false, error: "성별은 '남자' 또는 '여자'여야 해요." };
  }
  return { ok: true, value: v };
}

// ── route handler 응답 헬퍼 ─────────────────────────────────

/**
 * route handler에서 400 에러를 간편하게 반환하는 헬퍼
 * 사용: return badRequest("허용되지 않는 학년 값이에요.");
 */
export function validationErrorResponse(
  error: string,
  code = "VALIDATION_ERROR",
  status = 400
): Response {
  return new Response(
    JSON.stringify({ error, code, status }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}
