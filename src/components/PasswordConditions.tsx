"use client";

// ====================================================
// PasswordConditions — 비밀번호 실시간 조건 체크 UI
//
// 사용법:
//   <PasswordConditions password={password} show={showConditions} />
//
// show=true 이 되는 시점: 비밀번호 입력 시작 시 (onChange)
// 조건 4가지: 6자 이상 / 영문 / 숫자 / 특수문자
// ====================================================

export const PASSWORD_CONDITIONS = [
  { label: "6자 이상",                  test: (v: string) => v.length >= 6 },
  { label: "영문 포함",                  test: (v: string) => /[a-zA-Z]/.test(v) },
  { label: "숫자 포함",                  test: (v: string) => /[0-9]/.test(v) },
  { label: "특수문자 포함 (!@#$%^&* 등)", test: (v: string) => /[!@#$%^&*]/.test(v) },
] as const;

/** 4개 조건 모두 충족 여부 */
export function isPasswordValid(password: string): boolean {
  return PASSWORD_CONDITIONS.every((c) => c.test(password));
}

interface Props {
  password: string;
  show: boolean;
}

export default function PasswordConditions({ password, show }: Props) {
  if (!show) return null;

  return (
    <ul className="mt-2 flex flex-col gap-1.5 pl-0.5">
      {PASSWORD_CONDITIONS.map((c) => {
        const ok = c.test(password);
        return (
          <li
            key={c.label}
            className="flex items-center gap-1.5"
            style={{ fontSize: "12px", color: ok ? "#16a34a" : "#9ca3af" }}
          >
            <span>{ok ? "✅" : "❌"}</span>
            <span>{c.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
