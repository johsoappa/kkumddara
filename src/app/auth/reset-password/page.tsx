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
// recovery 세션 확인 상태 — 직접 URL 접근(세션 없음)과 메일 링크 진입을 구분
type Recovery = "checking" | "ready" | "invalid";

const MIN_LENGTH = 6;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [status,    setStatus]    = useState<Status>("idle");
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);
  const [recovery,  setRecovery]  = useState<Recovery>("checking");

  // recovery 세션 감지
  //   메일 링크 진입: Supabase 클라이언트가 URL 토큰을 자동 처리 →
  //     PASSWORD_RECOVERY / SIGNED_IN 이벤트 + 세션 생성
  //   직접 URL 접근: 세션 없음 → "invalid" 안내 화면 표시 (입력폼 미노출)
  useEffect(() => {
    let resolved = false;
    const markReady = () => { resolved = true; setRecovery("ready"); };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        markReady();
      }
    });

    // 이미 토큰 처리가 끝나 세션이 있는 경우 커버
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) markReady();
    });

    // 일정 시간 내 recovery 세션이 감지되지 않으면 잘못된/만료된 접근으로 처리
    const timer = setTimeout(async () => {
      if (resolved) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) markReady();
      else setRecovery("invalid");
    }, 2500);

    return () => { subscription.unsubscribe(); clearTimeout(timer); };
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

        {/* recovery 세션 확인 중 */}
        {recovery === "checking" && status !== "success" ? (
          <div className="mt-6 bg-white rounded-card-lg shadow-card px-5 py-6 text-center">
            <p className="text-sm text-base-muted">재설정 링크를 확인하는 중이에요...</p>
          </div>
        ) : recovery === "invalid" && status !== "success" ? (
          // 직접 접근 또는 만료된 링크 — 입력폼 미노출
          <div className="mt-6 flex flex-col gap-4">
            <div className="bg-white rounded-card-lg shadow-card px-5 py-5">
              <p className="text-sm font-bold text-base-text leading-relaxed">
                비밀번호 재설정 링크가 만료되었거나 잘못된 접근입니다.
                <br />다시 비밀번호 재설정을 요청해 주세요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/auth/forgot-password")}
              className="w-full py-3.5 rounded-button text-sm font-bold text-white active:opacity-70 transition-opacity"
              style={{ backgroundColor: "#E84B2E" }}
            >
              재설정 메일 다시 받기
            </button>
          </div>
        ) : status === "success" ? (
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
