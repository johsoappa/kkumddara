"use client";

// ====================================================
// 비밀번호 재설정 요청 (/auth/forgot-password)
//
// 가입 이메일을 입력하면 Supabase Auth password reset 메일을 발송한다.
// redirectTo → /auth/reset-password (메일 링크 클릭 후 진입)
//
// [변경하지 않은 것]
//   회원가입 role 로직 / Kakao OAuth / Auth callback cookie 처리 / DB / RLS
// ====================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Status = "idle" | "loading" | "success" | "error";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email,  setEmail]  = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setStatus("success");
    } catch (err) {
      console.error("[forgot-password] resetPasswordForEmail 오류:", err);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-base-off px-5 py-10 flex flex-col">

        <h1 className="text-xl font-bold text-base-text">비밀번호 재설정</h1>
        <p className="text-sm text-base-muted mt-2 leading-relaxed">
          가입한 이메일을 입력하면 비밀번호를 다시 설정할 수 있는 링크를 보내드릴게요.
        </p>

        {status === "success" ? (
          // ── 성공 상태 ──────────────────────────────
          <div className="mt-6 bg-white rounded-card-lg shadow-card px-5 py-5">
            <p className="text-sm font-bold text-base-text leading-relaxed">
              입력한 이메일로 비밀번호 재설정 링크를 보냈습니다.
              <br />메일함을 확인해 주세요.
            </p>
            <p className="text-xs text-base-muted mt-2 leading-relaxed">
              메일이 보이지 않으면 스팸함 또는 프로모션함도 함께 확인해 주세요.
            </p>
          </div>
        ) : (
          // ── 입력 폼 ────────────────────────────────
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            {status === "error" && (
              <p className="text-xs font-medium text-red-500 px-1">
                메일 발송 중 문제가 발생했습니다. 이메일 주소를 확인한 뒤 다시 시도해 주세요.
              </p>
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="가입한 이메일"
              autoComplete="email"
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
              {status === "loading" ? "보내는 중..." : "재설정 메일 받기"}
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
