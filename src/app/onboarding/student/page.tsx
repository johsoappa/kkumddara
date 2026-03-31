"use client";

// ====================================================
// 학생 온보딩 (/onboarding/student)
// Step 1: 초대 코드 입력 → child 정보 확인
// Step 2: 확인 후 "연결하기" → completeStudentOnboarding
// → /student/home 이동
// ====================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Link2, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { verifyInviteCode, completeStudentOnboarding } from "@/lib/auth";
import { GRADE_LABEL } from "@/types/family";
import type { Grade } from "@/types/family";

type VerifiedChild = {
  child_id:    string;
  child_name:  string;
  school_grade: string;
};

export default function OnboardingStudentPage() {
  const router = useRouter();

  const [studentId, setStudentId]     = useState<string | null>(null);
  const [code, setCode]               = useState("");
  const [verified, setVerified]       = useState<VerifiedChild | null>(null);
  const [verifyLoading, setVfLoading] = useState(false);
  const [verifyError, setVfError]     = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError]     = useState<string | null>(null);

  // 현재 student.id 로드
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("student")
        .select("id")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setStudentId(data.id);
        });
    });
  }, []);

  // 코드 검증
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setVfLoading(true);
    setVfError(null);
    setVerified(null);

    const result = await verifyInviteCode(code);
    if (!result) {
      setVfError("유효하지 않은 코드예요. 학부모에게 코드를 다시 확인해 보세요.");
    } else {
      setVerified(result);
    }
    setVfLoading(false);
  };

  // child 연결
  const handleLink = async () => {
    if (!studentId || !verified) return;
    setLinkLoading(true);
    setLinkError(null);

    const { dbResult } = await completeStudentOnboarding(studentId, verified.child_id);
    if (dbResult.error) {
      setLinkError(dbResult.error.message);
      setLinkLoading(false);
      return;
    }

    router.replace("/student/home");
  };

  const gradeLabel = verified
    ? (GRADE_LABEL[verified.school_grade as Grade] ?? verified.school_grade)
    : "";

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-white min-h-screen flex flex-col">

        {/* 헤더 */}
        <div className="px-6 pt-10 pb-2">
          <p className="text-xs font-semibold" style={{ color: "#E84B2E" }}>
            학생 온보딩
          </p>
          <h1 className="mt-1 text-2xl font-bold text-base-text leading-tight">
            초대 코드를 입력해요
          </h1>
          <p className="mt-1.5 text-sm text-base-muted leading-relaxed">
            학부모님이 발급한 8자리 초대 코드를 입력하면
            <br />자녀 프로필이 연결돼요.
          </p>
        </div>

        <div className="flex-1 px-6 pt-8 pb-10 flex flex-col gap-6">

          {/* 코드 입력 폼 */}
          <form onSubmit={handleVerify} className="flex flex-col gap-3">
            <label className="block text-sm font-semibold text-base-text">
              초대 코드
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="8자리 코드 (예: AB12CD34)"
                maxLength={8}
                className="
                  flex-1 px-4 py-3 rounded-button border border-base-border
                  text-sm font-mono tracking-widest text-base-text bg-white uppercase
                  focus:outline-none focus:border-brand-red transition-colors
                  placeholder:text-base-muted placeholder:font-sans placeholder:tracking-normal
                "
              />
              <button
                type="submit"
                disabled={code.length < 4 || verifyLoading}
                className="
                  px-5 py-3 rounded-button text-sm font-bold text-white
                  disabled:opacity-40 transition-opacity shrink-0
                "
                style={{ backgroundColor: "#E84B2E" }}
              >
                {verifyLoading ? "확인 중" : "확인"}
              </button>
            </div>
            {verifyError && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-button">
                {verifyError}
              </p>
            )}
          </form>

          {/* 검증 성공: 자녀 정보 카드 */}
          {verified && (
            <div className="flex flex-col gap-4">
              <div className="bg-base-off border border-base-border rounded-card-lg p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-card flex items-center justify-center shrink-0"
                    style={{ background: "#FFF0EB" }}
                  >
                    <CheckCircle size={20} style={{ color: "#E84B2E" }} />
                  </div>
                  <div>
                    <p className="text-xs text-base-muted mb-0.5">연결할 자녀 프로필</p>
                    <p className="text-base font-bold text-base-text">
                      {verified.child_name}
                    </p>
                    {gradeLabel && (
                      <p className="text-sm text-base-muted mt-0.5">{gradeLabel}</p>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs text-base-muted leading-relaxed text-center px-4">
                위 프로필이 맞으면 아래 버튼을 눌러 연결을 완료해요.
                <br />연결 후에는 이 프로필로 꿈따라를 사용하게 돼요.
              </p>

              {linkError && (
                <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-button">
                  {linkError}
                </p>
              )}

              <button
                onClick={handleLink}
                disabled={linkLoading}
                className="
                  w-full py-3.5 rounded-button text-sm font-bold text-white
                  flex items-center justify-center gap-2
                  disabled:opacity-40 transition-opacity
                "
                style={{ backgroundColor: "#E84B2E" }}
              >
                <Link2 size={16} />
                {linkLoading ? "연결 중..." : `${verified.child_name} 프로필로 연결하기`}
              </button>

              {/* 코드 재입력 */}
              <button
                onClick={() => { setVerified(null); setCode(""); }}
                className="text-sm text-center text-base-muted underline"
              >
                다른 코드 입력하기
              </button>
            </div>
          )}

          {/* 안내 */}
          {!verified && (
            <div className="bg-base-card rounded-card p-4">
              <p className="text-xs font-semibold text-base-text mb-1.5">
                초대 코드는 어떻게 받나요?
              </p>
              <p className="text-xs text-base-muted leading-relaxed">
                학부모님이 꿈따라에서 자녀 프로필을 만들면 8자리 초대 코드가 생성돼요.
                학부모님께 코드를 공유받아 입력해 주세요.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
