"use client";

// ====================================================
// 새 비밀번호 설정 (/auth/reset-password)
//
// 비밀번호 재설정 메일 링크로 진입한 사용자가 새 비밀번호를 저장한다.
// Supabase 브라우저 클라이언트(detectSessionInUrl 기본 true)가 링크의
// recovery 토큰을 자동 처리해 임시 세션을 만들고 PASSWORD_RECOVERY 이벤트를 발생시킨다.
// 그 세션 상태에서 supabase.auth.updateUser({ password }) 로 변경한다.
//
// [변경하지 않은 것]
//   Auth callback(/auth/callback) 구조 / Kakao OAuth / 회원가입 role 로직 / DB / RLS
// ====================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Status = "idle" | "loading" | "success" | "error";

const MIN_LENGTH = 6;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [status,    setStatus]    = useState<Status>("idle");
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);

  // recovery 세션 감지 (링크 자동 처리 결과)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // PASSWORD_RECOVERY: 메일 링크로 진입해 임시 세션이 설정된 상태
      if (event === "PASSWORD_RECOVERY") {
        setStatus("idle");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password || !confirm) {
      setErrorMsg("새 비밀번호를 입력해 주세요.");
      setStatus("error");
      return;
    }
    if (password.length < MIN_LENGTH) {
      setErrorMsg(`비밀번호는 ${MIN_LENGTH}자 이상이어야 합니다.`);
      setStatus("error");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus("success");
    } catch (err) {
      console.error("[reset-password] updateUser 오류:", err);
      setErrorMsg(
        "비밀번호 변경 중 문제가 발생했습니다. 재설정 링크가 만료되었을 수 있습니다. 다시 비밀번호 재설정을 요청해 주세요."
      );
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-base-off px-5 py-10 flex flex-col">

        <h1 className="text-xl font-bold text-base-text">새 비밀번호 설정</h1>
        <p className="text-sm text-base-muted mt-2 leading-relaxed">
          앞으로 사용할 새 비밀번호를 입력해 주세요.
        </p>

        {status === "success" ? (
          // ── 성공 상태 ──────────────────────────────
          <div className="mt-6 flex flex-col gap-4">
            <div className="bg-white rounded-card-lg shadow-card px-5 py-5">
              <p className="text-sm font-bold text-base-text leading-relaxed">
                비밀번호가 변경되었습니다.
                <br />새 비밀번호로 다시 로그인해 주세요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full py-3.5 rounded-button text-sm font-bold text-white active:opacity-70 transition-opacity"
              style={{ backgroundColor: "#E84B2E" }}
            >
              로그인하러 가기
            </button>
          </div>
        ) : (
          // ── 입력 폼 ────────────────────────────────
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            {status === "error" && errorMsg && (
              <p className="text-xs font-medium text-red-500 px-1 leading-relaxed">{errorMsg}</p>
            )}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="새 비밀번호 (6자리 이상)"
              autoComplete="new-password"
              className="
                w-full px-4 py-3 rounded-card border border-base-border
                text-sm text-base-text placeholder:text-base-muted
                focus:outline-none focus:border-[#E84B2E] transition-colors
              "
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="새 비밀번호 확인"
              autoComplete="new-password"
              className="
                w-full px-4 py-3 rounded-card border border-base-border
                text-sm text-base-text placeholder:text-base-muted
                focus:outline-none focus:border-[#E84B2E] transition-colors
              "
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="
                w-full py-3.5 rounded-button text-sm font-bold text-white
                active:opacity-70 transition-opacity disabled:opacity-40
              "
              style={{ backgroundColor: "#E84B2E" }}
            >
              {status === "loading" ? "변경 중..." : "비밀번호 변경하기"}
            </button>
          </form>
        )}

        {/* 로그인으로 돌아가기 */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-6 text-center text-xs text-base-muted underline underline-offset-2 py-2 active:opacity-60 transition-opacity"
        >
          로그인으로 돌아가기
        </button>

      </div>
    </div>
  );
}
