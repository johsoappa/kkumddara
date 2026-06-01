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

  // recovery 세션 확보
  //   순서: ① 기존 세션 확인 → ② URL code 파라미터면 exchangeCodeForSession
  //         → ③ getSession 재확인 → ④ PASSWORD_RECOVERY/SIGNED_IN 이벤트 → ⑤ 5초 타임아웃
  //   메일 링크 진입: 위 과정으로 세션 확보 → ready
  //   직접 URL 접근(세션 없음): invalid 안내 (입력폼 미노출)
  useEffect(() => {
    let resolved = false;
    const markReady   = () => { if (!resolved) { resolved = true; setRecovery("ready"); } };
    const markInvalid = () => { if (!resolved) { resolved = true; setRecovery("invalid"); } };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        markReady();
      }
    });

    (async () => {
      try {
        // ① 이미 세션이 있으면(detectSessionInUrl 자동 교환 완료 등) ready
        const { data: pre } = await supabase.auth.getSession();
        if (pre.session) { markReady(); return; }

        // ② URL code 파라미터가 있으면 명시적으로 세션 교환
        const code = new URLSearchParams(window.location.search).get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[reset-password] exchangeCodeForSession failed", {
              message: error.message, status: error.status, name: error.name,
            });
            // 자동 교환이 먼저 처리했을 수 있으니 세션 재확인
            const { data: post } = await supabase.auth.getSession();
            if (post.session) markReady();
            else markInvalid();
            return;
          }
          // ③ 교환 후 세션 확인
          const { data: post } = await supabase.auth.getSession();
          if (post.session) { markReady(); return; }
        }
        // 세션/이벤트 미확보 → ④ onAuthStateChange 또는 ⑤ 타임아웃에 맡김
      } catch (err) {
        console.error("[reset-password] recovery init error", err);
      }
    })();

    // ⑤ 5초 내 세션이 확보되지 않으면 잘못된/만료된 접근으로 처리 (느린 네트워크 고려)
    const timer = setTimeout(async () => {
      if (resolved) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) markReady();
      else markInvalid();
    }, 5000);

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
      if (error) {
        // 개발자 콘솔에는 실제 Supabase error 기록 (원문은 사용자에게 노출하지 않음)
        console.error("[reset-password] updateUser failed", {
          message: error.message, status: error.status, name: error.name,
        });
        const lower = error.message?.toLowerCase() ?? "";
        if (lower.includes("different from the old") || lower.includes("should be different")) {
          // 동일 비밀번호 정책 위반은 구분 안내
          setErrorMsg("새 비밀번호는 이전 비밀번호와 다르게 설정해 주세요.");
        } else {
          setErrorMsg(
            "비밀번호 변경 중 문제가 발생했습니다. 재설정 링크가 만료되었을 수 있습니다. 다시 비밀번호 재설정을 요청해 주세요."
          );
        }
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch (err) {
      console.error("[reset-password] updateUser unexpected error", err);
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
