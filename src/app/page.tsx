"use client";

// ====================================================
// 역할 선택 랜딩 (/)
// Step 1: 학부모 / 학생 카드 선택
// Step 2: 이메일 인증 (회원가입 | 로그인)
// ====================================================

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, BookOpen, Eye, EyeOff, ArrowLeft, ChevronRight } from "lucide-react";
import { signUpParent, signUpStudent, signIn, signInWithKakao } from "@/lib/auth";
import PasswordConditions, { isPasswordValid } from "@/components/PasswordConditions";

type Role = "parent" | "student";
type Step = "role" | "auth";
type AuthMode = "signup" | "signin";

export default function LandingPage() {
  const router = useRouter();

  const [step, setStep]             = useState<Step>("role");
  const [selectedRole, setRole]     = useState<Role | null>(null);
  const [authMode, setAuthMode]     = useState<AuthMode>("signup");
  const [showPassword, setShowPw]   = useState(false);
  const [showConditions, setShowConditions] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // 폼 상태
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [displayName, setDisplayName] = useState("");

  // ── Step 1: 역할 선택 후 Step 2 이동 ────────────────
  const handleRoleSelect = (role: Role) => {
    setRole(role);
    setStep("auth");
    setError(null);
  };

  // 버튼 활성화 조건
  // 회원가입: 이름 + 이메일 + 비밀번호 4개 조건 모두 충족
  // 로그인: 이메일 + 비밀번호 6자 이상
  const isValid =
    authMode === "signup"
      ? displayName.trim().length > 0 && email.trim().length > 0 && isPasswordValid(password)
      : email.trim().length > 0 && password.length >= 6;

  // ── Step 2: 인증 ────────────────────────────────────
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setLoading(true);
    setError(null);

    try {
      if (authMode === "signup") {
        const { error: err } =
          selectedRole === "parent"
            ? await signUpParent(email, password, displayName)
            : await signUpStudent(email, password, displayName);

        if (err) throw err;
        // 회원가입 성공 → 온보딩으로 (미들웨어가 role 기반 분기)
        router.replace("/onboarding");
      } else {
        const { error: err } = await signIn(email, password);
        if (err) throw err;
        // 로그인 성공 → 미들웨어가 role + onboarding 상태 기반 redirect
        router.replace("/home");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "오류가 발생했습니다.";
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        setError("이미 가입된 이메일입니다. 로그인을 시도해 보세요.");
      } else if (msg.includes("Invalid login credentials")) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (msg.includes("Password should be")) {
        setError("비밀번호는 6자 이상이어야 합니다.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-white min-h-screen flex flex-col">

        {/* ── 상단 로고 영역 ─────────────────────────── */}
        <div className="px-6 pt-10 pb-2 flex items-center gap-2">
          {step === "auth" && (
            <button
              onClick={() => { setStep("role"); setError(null); }}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-base-card transition-colors flex-shrink-0"
              aria-label="뒤로"
            >
              <ArrowLeft size={20} className="text-base-text" />
            </button>
          )}
          {/* 로고 — 흰 배경 PNG, bg-white 랜딩에서 자연 혼합 */}
          <Image
            src="/logo.png"
            alt="꿈따라 — 꿈을 찾고, 길을 만든다"
            width={104}
            height={44}
            priority
            style={{ objectFit: "contain", objectPosition: "left center" }}
          />
        </div>

        {/* ── 베타 배너 — 역할 선택 화면에서만 표시 ── */}
        {step === "role" && (
          <div className="mx-6 mt-2 mb-0 flex justify-center">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "#EEF2FF", color: "#4F6BD9" }}
            >
              🧪 지금은 베타 운영 중이에요 — 피드백을 기다립니다
            </span>
          </div>
        )}

        {/* ── Step 1: 역할 선택 ──────────────────────── */}
        {step === "role" && (
          <div className="flex-1 px-6 pt-6 pb-10 flex flex-col">

            {/* ── 서비스 가치 블록 ─────────────────── */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-base-text leading-snug">
                아이의 진로,<br />
                <span style={{ color: "#E84B2E" }}>막막하지 않게</span>
              </h1>
              <p className="mt-3 text-sm text-base-muted leading-relaxed">
                꿈따라는 자녀의 관심사를 함께 탐색하고,
                이번 주 할 수 있는 진로 활동을 제안해요.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {[
                  "관심 직업을 찾고 단계별 준비 방법을 확인해요",
                  "오늘의 미션으로 진로를 한 걸음씩 탐색해요",
                  "학부모와 학생이 나눌 수 있는 대화 주제를 제안해요",
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-base-muted">
                    <span className="font-bold flex-shrink-0" style={{ color: "#E84B2E" }}>✓</span>
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* ── 메인 CTA ─────────────────────── */}
            <button
              onClick={() => handleRoleSelect("parent")}
              className="
                w-full py-4 rounded-button text-sm font-bold text-white
                flex items-center justify-center gap-1.5
                active:opacity-80 transition-opacity
              "
              style={{ backgroundColor: "#E84B2E" }}
            >
              우리 아이 진로 탐색 시작하기
              <ChevronRight size={16} />
            </button>
            <p className="text-xs text-center text-base-muted mt-2">
              먼저 체험해 보고, 필요한 맞춤 기능을 이어서 이용해보세요
            </p>

            {/* ── 역할 선택 안내 ─────────────────── */}
            <p className="text-xs text-base-muted mt-5 mb-3 font-semibold text-center">
              또는 역할을 선택해 시작하기
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">

              {/* 학부모 카드 */}
              <RoleCard
                role="parent"
                icon={<Users size={26} strokeWidth={1.8} />}
                title="학부모로 시작하기"
                description="자녀의 관심사를 파악하고, 이번 주 나눠볼 대화 주제와 진로 방향을 확인해요."
                buttonLabel="학부모로 계속"
                onSelect={handleRoleSelect}
              />

              {/* 학생 카드 */}
              <RoleCard
                role="student"
                icon={<BookOpen size={26} strokeWidth={1.8} />}
                title="학생으로 시작하기"
                description="오늘의 미션을 완료하고, 관심 직업을 탐색하며 내 꿈을 찾아가요."
                buttonLabel="학생으로 계속"
                onSelect={handleRoleSelect}
              />
            </div>

            {/* ── 게스트 체험 섹션 ─────────────────── */}
            <div className="mt-6 rounded-card-lg border border-base-border bg-base-off p-4">
              <p className="text-xs font-bold text-base-text mb-0.5">
                먼저 직접 체험해 보세요
              </p>
              <p className="text-xs text-base-muted leading-relaxed mb-3">
                로그인 없이 미션·추천 직업·대화 주제를 미리 확인할 수 있어요.
                저장·개인화·맞춤 기능은 가입 후 이어서 이용해요.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push("/demo/parent")}
                  className="
                    flex-1 py-2.5 rounded-button text-xs font-semibold
                    border border-base-border bg-white text-base-text
                    active:opacity-70 transition-opacity
                  "
                >
                  학부모 체험하기
                </button>
                <button
                  onClick={() => router.push("/demo/student")}
                  className="
                    flex-1 py-2.5 rounded-button text-xs font-semibold
                    border border-base-border bg-white text-base-text
                    active:opacity-70 transition-opacity
                  "
                >
                  학생 체험하기
                </button>
              </div>
            </div>

            <p className="mt-6 text-xs text-center text-base-muted">
              이미 계정이 있다면{" "}
              <button
                className="font-semibold underline"
                style={{ color: "#E84B2E" }}
                onClick={() => {
                  setRole("parent"); // 로그인은 role 상관없이 먼저 진행
                  setAuthMode("signin");
                  setStep("auth");
                }}
              >
                로그인
              </button>
            </p>
          </div>
        )}

        {/* ── Step 2: 인증 폼 ───────────────────────── */}
        {step === "auth" && selectedRole && (
          <div className="flex-1 flex flex-col min-h-0">

            {/* 스크롤 영역 — 입력 필드 */}
            <div className="flex-1 overflow-y-auto min-h-0 px-6 pt-6 pb-4">
              <div className="mb-6">
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
                  style={{ background: "#FFF0EB", color: "#E84B2E" }}
                >
                  {selectedRole === "parent" ? (
                    <><Users size={12} /> 학부모</>
                  ) : (
                    <><BookOpen size={12} /> 학생</>
                  )}
                </div>
                <h2 className="text-xl font-bold text-base-text">
                  {authMode === "signup" ? "계정을 만들어요" : "다시 오셨군요!"}
                </h2>
                <p className="text-sm text-base-muted mt-1">
                  {authMode === "signup"
                    ? "이메일로 간편하게 가입할 수 있어요."
                    : "이메일과 비밀번호를 입력해 주세요."}
                </p>
              </div>

              <form id="auth-form" onSubmit={handleAuth} className="flex flex-col gap-4">

                {/* 이름/닉네임 (회원가입만) */}
                {authMode === "signup" && (
                  <div>
                    <label className="block text-sm font-medium text-base-text mb-1.5">
                      {selectedRole === "parent" ? "이름" : "닉네임"}
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={selectedRole === "parent" ? "홍길동" : "꿈꾸는 학생"}
                      className="
                        w-full px-4 py-3 rounded-button border border-base-border
                        text-sm text-base-text bg-white
                        focus:outline-none focus:border-brand-red transition-colors
                        placeholder:text-base-muted
                      "
                    />
                  </div>
                )}

                {/* 이메일 */}
                <div>
                  <label className="block text-sm font-medium text-base-text mb-1.5">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    autoComplete="email"
                    className="
                      w-full px-4 py-3 rounded-button border border-base-border
                      text-sm text-base-text bg-white
                      focus:outline-none focus:border-brand-red transition-colors
                      placeholder:text-base-muted
                    "
                  />
                </div>

                {/* 비밀번호 */}
                <div>
                  <label className="block text-sm font-medium text-base-text mb-1.5">
                    비밀번호
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (authMode === "signup") setShowConditions(true);
                      }}
                      placeholder="6자 이상"
                      required
                      minLength={6}
                      autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                      className="
                        w-full px-4 py-3 pr-11 rounded-button border border-base-border
                        text-sm text-base-text bg-white
                        focus:outline-none focus:border-brand-red transition-colors
                        placeholder:text-base-muted
                      "
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-base-muted"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {/* 회원가입 시 실시간 조건 체크 */}
                  {authMode === "signup" && (
                    <PasswordConditions password={password} show={showConditions} />
                  )}
                </div>

                {/* 에러 */}
                {error && (
                  <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-button">
                    {error}
                  </p>
                )}
              </form>

              {/* 모드 전환 */}
              <p className="mt-6 text-sm text-center text-base-muted">
                {authMode === "signup" ? (
                  <>
                    이미 계정이 있어요.{" "}
                    <button
                      className="font-semibold underline"
                      style={{ color: "#E84B2E" }}
                      onClick={() => { setAuthMode("signin"); setError(null); }}
                    >
                      로그인
                    </button>
                  </>
                ) : (
                  <>
                    계정이 없어요.{" "}
                    <button
                      className="font-semibold underline"
                      style={{ color: "#E84B2E" }}
                      onClick={() => { setAuthMode("signup"); setError(null); }}
                    >
                      회원가입
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* ── 항상 보이는 CTA ─────────────────────── */}
            <div className="shrink-0 px-6 pt-3 pb-8 bg-white border-t border-base-border flex flex-col gap-3">

              {/* 이메일 CTA */}
              <button
                form="auth-form"
                type="submit"
                disabled={loading || !isValid}
                className="
                  w-full py-3.5 rounded-button text-sm font-bold text-white
                  flex items-center justify-center gap-1.5
                  transition-opacity
                "
                style={{ backgroundColor: "#E84B2E", opacity: loading || !isValid ? 0.45 : 1 }}
              >
                {loading ? (
                  "처리 중..."
                ) : authMode === "signup" ? (
                  <>시작하기 <ChevronRight size={16} /></>
                ) : (
                  <>로그인 <ChevronRight size={16} /></>
                )}
              </button>

              {/* 구분선 */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-base-border" />
                <span className="text-xs text-base-muted">또는</span>
                <div className="flex-1 h-px bg-base-border" />
              </div>

              {/* 카카오 로그인 */}
              <button
                type="button"
                disabled={loading}
                onClick={() => selectedRole && signInWithKakao(selectedRole)}
                className="
                  w-full py-3.5 rounded-button text-sm font-bold
                  flex items-center justify-center gap-2
                  transition-opacity active:opacity-80
                "
                style={{ backgroundColor: "#FEE500", color: "#3C1E1E", opacity: loading ? 0.5 : 1 }}
              >
                {/* 카카오 로고 */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M9 1.5C4.86 1.5 1.5 4.19 1.5 7.5c0 2.12 1.29 3.98 3.23 5.08L4 14.5l2.73-1.45c.73.19 1.48.29 2.27.29 4.14 0 7.5-2.69 7.5-6S13.14 1.5 9 1.5z"
                    fill="#3C1E1E"
                  />
                </svg>
                카카오로 {authMode === "signup" ? "시작하기" : "로그인"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── 역할 카드 컴포넌트 ──────────────────────────────────────
function RoleCard({
  role,
  icon,
  title,
  description,
  buttonLabel,
  onSelect,
}: {
  role: Role;
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onSelect: (role: Role) => void;
}) {
  return (
    <button
      onClick={() => onSelect(role)}
      className="
        flex-1 text-left
        bg-white border-2 border-base-border rounded-card-lg p-5
        hover:border-brand-red hover:shadow-card-hover
        active:border-brand-red active:scale-[0.99]
        transition-all duration-150
        flex flex-col gap-4
      "
    >
      {/* 아이콘 */}
      <div
        className="w-11 h-11 rounded-card flex items-center justify-center"
        style={{ background: "#FFF0EB", color: "#E84B2E" }}
      >
        {icon}
      </div>

      {/* 텍스트 */}
      <div className="flex-1">
        <p className="text-base font-bold text-base-text">{title}</p>
        <p className="mt-1.5 text-sm text-base-muted leading-relaxed">
          {description}
        </p>
      </div>

      {/* CTA */}
      <div
        className="flex items-center gap-1 text-sm font-semibold"
        style={{ color: "#E84B2E" }}
      >
        {buttonLabel}
        <ChevronRight size={16} />
      </div>
    </button>
  );
}
