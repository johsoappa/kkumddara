"use client";

// ====================================================
// 보호자 초대 수락 페이지 (/join/caregiver)
//
// 흐름:
//   1. 로그인 여부 확인
//   2. 6자리 초대코드 입력
//   3. caregiver_invite 테이블에서 pending 코드 조회
//   4. accepted_by = user.id, invite_status = 'accepted' 업데이트
//   5. 성공 화면 표시
// ====================================================

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { UserCheck, ChevronLeft, ArrowRight } from "lucide-react";

type Step = "input" | "success" | "error";

export default function JoinCaregiverPage() {
  const router = useRouter();

  const [userId, setUserId]       = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [code, setCode]           = useState<string[]>(Array(6).fill(""));
  const [step, setStep]           = useState<Step>("input");
  const [loading, setLoading]     = useState(false);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [childName, setChildName] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── 인증 확인 ──────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // 로그인 후 이 페이지로 돌아오도록 redirect
        router.replace("/?next=/join/caregiver");
        return;
      }
      setUserId(user.id);
      setAuthLoading(false);
    });
  }, [router]);

  // ── 코드 입력 처리 ─────────────────────────────────────
  const handleInput = (index: number, value: string) => {
    const char = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(-1);
    const next = [...code];
    next[index] = char;
    setCode(next);
    setErrorMsg(null);

    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (code[index]) {
        const next = [...code];
        next[index] = "";
        setCode(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
    const next = [...code];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setCode(next);
    // 붙여넣기 후 마지막 채워진 칸으로 포커스
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
  };

  // ── 코드 제출 ──────────────────────────────────────────
  const handleSubmit = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setErrorMsg("6자리 코드를 모두 입력해주세요.");
      return;
    }
    if (!userId) return;

    setLoading(true);
    setErrorMsg(null);

    // pending 상태의 해당 코드 조회
    const { data: invite, error: fetchErr } = await supabase
      .from("caregiver_invite")
      .select("id, child_id, invite_status, expires_at, accepted_by")
      .eq("invite_code", fullCode)
      .eq("invite_status", "pending")
      .maybeSingle();

    if (fetchErr || !invite) {
      setErrorMsg("유효하지 않은 코드예요. 코드를 다시 확인해주세요.");
      setLoading(false);
      return;
    }

    // 만료 확인
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      setErrorMsg("만료된 초대코드예요. 부모님께 새 코드를 요청해주세요.");
      setLoading(false);
      return;
    }

    // 자녀 이름 조회
    const { data: childRow } = await supabase
      .from("child")
      .select("name")
      .eq("id", invite.child_id)
      .maybeSingle();

    // 수락 처리
    const { error: updateErr } = await supabase
      .from("caregiver_invite")
      .update({
        accepted_by:   userId,
        invite_status: "accepted",
      })
      .eq("id", invite.id);

    if (updateErr) {
      setErrorMsg("연결 처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
      setLoading(false);
      return;
    }

    setChildName(childRow?.name ?? null);
    setStep("success");
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-off">
        <p className="text-sm text-base-muted">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-white min-h-screen flex flex-col">

        {/* 헤더 */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b border-base-border"
          style={{ paddingTop: "env(safe-area-inset-top, 12px)" }}
        >
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full hover:bg-base-off transition-colors"
            aria-label="뒤로가기"
          >
            <ChevronLeft size={20} className="text-base-text" />
          </button>
          <h1 className="text-sm font-bold text-base-text">보호자 연결</h1>
        </div>

        <div className="flex-1 px-6 pt-10 pb-6 flex flex-col">

          {/* ── 성공 화면 ── */}
          {step === "success" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#F0FDF4" }}
              >
                <UserCheck size={28} className="text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-base-text">연결 완료!</p>
                {childName && (
                  <p className="text-sm text-base-muted mt-1">
                    <span className="font-semibold text-base-text">{childName}</span>
                    의 진로 탐색을 함께 확인할 수 있어요.
                  </p>
                )}
              </div>
              <button
                onClick={() => router.replace("/")}
                className="
                  mt-4 flex items-center gap-2
                  px-6 py-3 rounded-button text-white font-semibold text-sm
                "
                style={{ backgroundColor: "#E84B2E" }}
              >
                홈으로
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── 입력 화면 ── */}
          {step === "input" && (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-base-text leading-snug">
                  초대코드를 입력해주세요
                </h2>
                <p className="text-sm text-base-muted mt-2 leading-relaxed">
                  부모님이 공유한 6자리 코드를 입력하면
                  자녀의 진로 탐색을 함께 볼 수 있어요.
                </p>
              </div>

              {/* 6칸 코드 입력 */}
              <div className="flex gap-2 justify-center mb-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    value={code[i]}
                    onChange={(e) => handleInput(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    className="
                      w-11 h-14 text-center text-lg font-bold font-mono
                      border-2 rounded-button outline-none
                      uppercase transition-colors
                      focus:border-brand-red
                    "
                    style={{
                      borderColor: errorMsg ? "#EF4444" : code[i] ? "#E84B2E" : "#E5E7EB",
                      color: "#1A1A1A",
                    }}
                  />
                ))}
              </div>

              {/* 에러 메시지 */}
              {errorMsg && (
                <p className="text-sm text-red-500 text-center mb-4">{errorMsg}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || code.join("").length < 6}
                className="
                  w-full py-3.5 rounded-button text-white font-semibold text-sm
                  transition-opacity disabled:opacity-40
                "
                style={{ backgroundColor: "#E84B2E" }}
              >
                {loading ? "확인 중..." : "연결하기"}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
