"use client";

// ====================================================
// 온보딩 폼 컴포넌트
// - 사용자 유형 선택 (학부모/학생)
// - 학년 선택 (초5~중3)
// - 관심 분야 선택 (복수 선택)
// - isEdit=true: 기존값 프리필 + 뒤로가기 + "수정 완료" 버튼
//
// [Supabase 연동 준비]
// 이 컴포넌트의 onboardingData를 추후 Supabase users 테이블에 저장할 예정
// 데이터 구조는 아래 OnboardingData 타입을 그대로 사용하세요.
// ====================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getOrCreateFamily,
  createChild,
  getChild,
  updateChild,
} from "@/lib/db/family";

// ----------------------------------------
// 타입 정의 (Supabase 스키마와 동일하게 유지)
// ----------------------------------------
type UserType = "parent" | "student";

type Grade =
  | "elementary3"   // 초등 3학년 (새싹 모드)
  | "elementary4"   // 초등 4학년 (새싹 모드)
  | "elementary5"   // 초등 5학년
  | "elementary6"   // 초등 6학년
  | "middle1"       // 중학교 1학년
  | "middle2"       // 중학교 2학년
  | "middle3"       // 중학교 3학년
  | "high1"         // 고등학교 1학년
  | "high2"         // 고등학교 2학년
  | "high3";        // 고등학교 3학년

type InterestField =
  | "it"            // IT/기술
  | "art"           // 예술/디자인
  | "medical"       // 의료/과학
  | "business"      // 비즈니스
  | "education";    // 교육/사회

// 온보딩 데이터 전체 구조
// [Supabase 연동 시] users 테이블의 onboarding_data 컬럼에 JSON으로 저장
interface OnboardingData {
  userType: UserType | null;
  grade: Grade | null;
  interests: InterestField[];
}

// ----------------------------------------
// 선택지 데이터
// ----------------------------------------
// 학년 그룹 (초등 / 중학 / 고등)
const gradeGroups: {
  label: string;
  options: { value: Grade; label: string }[];
}[] = [
  {
    label: "초등학생",
    options: [
      { value: "elementary3", label: "초3" },
      { value: "elementary4", label: "초4" },
      { value: "elementary5", label: "초5" },
      { value: "elementary6", label: "초6" },
    ],
  },
  {
    label: "중학생",
    options: [
      { value: "middle1", label: "중1" },
      { value: "middle2", label: "중2" },
      { value: "middle3", label: "중3" },
    ],
  },
  {
    label: "고등학생",
    options: [
      { value: "high1", label: "고1" },
      { value: "high2", label: "고2" },
      { value: "high3", label: "고3" },
    ],
  },
];

const interestOptions: { value: InterestField; label: string; emoji: string }[] = [
  { value: "it", label: "IT/기술", emoji: "💻" },
  { value: "art", label: "예술/디자인", emoji: "🎨" },
  { value: "medical", label: "의료/과학", emoji: "🔬" },
  { value: "business", label: "비즈니스", emoji: "💼" },
  { value: "education", label: "교육/사회", emoji: "📚" },
];

// ----------------------------------------
// Props
// ----------------------------------------
interface OnboardingFormProps {
  isEdit?: boolean; // true: 수정 모드 (기존값 프리필 + 뒤로가기)
}

// ----------------------------------------
// 메인 컴포넌트
// ----------------------------------------
export default function OnboardingForm({ isEdit = false }: OnboardingFormProps) {
  const router = useRouter();

  // 폼 상태
  const [data, setData] = useState<OnboardingData>({
    userType: null,
    grade: null,
    interests: [],
  });

  // 로딩 / 에러 상태
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);

  // 이메일 로그인 (테스트용)
  const [testEmail,    setTestEmail]    = useState("");
  const [testPassword, setTestPassword] = useState("");
  const [authLoading,  setAuthLoading]  = useState(false);
  const [authMsg,      setAuthMsg]      = useState<string | null>(null);

  // 수정 모드: Supabase → localStorage 순으로 기존값 프리필
  useEffect(() => {
    if (!isEdit) return;

    const storedChildId = localStorage.getItem("kkumddara_child_id");

    const load = async () => {
      // ① Supabase에서 현재 학년 + 관심분야 로드 시도
      //    child.interests 배열 컬럼에서 직접 읽으므로 별도 쿼리 불필요
      if (storedChildId) {
        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData.user) {
            const child = await getChild(storedChildId);
            if (child) {
              // userType은 children 테이블에 없으므로 localStorage에서 가져옴
              const stored = localStorage.getItem("kkumddara_onboarding");
              const storedData = stored ? (JSON.parse(stored) as OnboardingData) : null;
              setData({
                userType:  storedData?.userType ?? null,
                grade:     child.grade as Grade,
                interests: (child.interests ?? []) as InterestField[],
              });
              return;
            }
          }
        } catch {
          // 인증 없거나 네트워크 오류 → localStorage fallback
        }
      }

      // ② localStorage fallback
      const stored = localStorage.getItem("kkumddara_onboarding");
      if (stored) setData(JSON.parse(stored) as OnboardingData);
    };

    load();
  }, [isEdit]);

  // ----------------------------------------
  // 핸들러 함수들
  // ----------------------------------------

  // 사용자 유형 선택
  const handleUserTypeSelect = (type: UserType) => {
    setData((prev) => ({ ...prev, userType: type }));
  };

  // 학년 선택
  const handleGradeSelect = (grade: Grade) => {
    setData((prev) => ({ ...prev, grade }));
  };

  // 관심 분야 토글 (복수 선택)
  const handleInterestToggle = (field: InterestField) => {
    setData((prev) => {
      const exists = prev.interests.includes(field);
      return {
        ...prev,
        interests: exists
          ? prev.interests.filter((i) => i !== field)  // 이미 선택됨 → 제거
          : [...prev.interests, field],                 // 미선택 → 추가
      };
    });
  };

  // 시작하기 / 입력 완료 버튼
  const handleStart = async () => {
    // ── 필수 항목 검증
    if (!data.userType || !data.grade) {
      alert("사용자 유형과 학년을 선택해주세요.");
      return;
    }
    if (data.interests.length === 0) {
      alert("관심 분야를 하나 이상 선택해주세요.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // ① localStorage 저장 (항상 — 오프라인 캐시)
      localStorage.setItem("kkumddara_onboarding", JSON.stringify(data));

      // ② Supabase 저장 (로그인 상태 여부 확인 후 시도)
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        // 디버그: 항상 로그 출력
        console.log("[온보딩] 현재 로그인 유저:", user?.id ?? "❌ 미로그인 (localStorage만 저장)");

        if (!user) {
          // 미로그인: localStorage 저장으로 계속, Supabase 저장 건너뜀
          console.warn("[온보딩] Supabase 미인증 → localStorage만 저장됩니다.");
        } else if (isEdit) {
          // ── 수정 모드: grade + interests 단일 UPDATE
          const storedChildId = localStorage.getItem("kkumddara_child_id");
          if (storedChildId) {
            const updated = await updateChild(storedChildId, {
              grade:     data.grade!,
              interests: data.interests,
            });
            console.log("[온보딩] updateChild 결과:", updated?.id ?? "❌ 실패");
          } else {
            console.warn("[온보딩] kkumddara_child_id 없음 → updateChild 건너뜀");
          }
        } else {
          // ── 최초 온보딩: 가족 확보 → 자녀 생성 (interests 포함)
          const family = await getOrCreateFamily(user.id);
          console.log("[온보딩] getOrCreateFamily:", family?.id ?? "❌ 실패");
          if (family) {
            const child = await createChild(family.id, user.id, {
              name:         "친구",
              grade:        data.grade!,
              interests:    data.interests,
              avatar_emoji: "🌱",
            });
            console.log("[온보딩] createChild:", child?.id ?? "❌ 실패");
            if (child) {
              localStorage.setItem("kkumddara_child_id", child.id);
            }
          }
        }
      } catch (supaErr) {
        // 미인증 / 네트워크 오류: localStorage 저장은 완료됐으므로 계속 진행
        console.warn("[온보딩] Supabase 저장 건너뜀:", supaErr);
      }

      // ③ 화면 이동 (캐시 새로고침 포함)
      router.refresh();

      if (isEdit) {
        router.back();
      } else {
        const isSprout =
          data.grade === "elementary3" || data.grade === "elementary4";
        router.push(isSprout ? "/sprout" : "/home");
      }

    } catch (error) {
      console.error("온보딩 저장 실패:", error);
      setErrorMsg("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // 카카오 로그인 (더미)
  const handleKakaoLogin = () => {
    // [Supabase 연동 포인트]
    // await supabase.auth.signInWithOAuth({ provider: 'kakao' });
    alert("카카오 로그인은 준비 중입니다. 😊");
  };

  // ── 이메일 로그인 성공 후 공통 처리
  //    기존 children 데이터 있으면 홈으로, 없으면 온보딩 계속
  const afterAuthSuccess = async (actionLabel: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    console.log(`[${actionLabel}] user.id:`, user?.id);

    if (!user) {
      setAuthMsg("⚠️ 인증은 됐지만 유저 정보를 가져오지 못했습니다. 새로고침 해주세요.");
      return;
    }

    // 기존 자녀 데이터 확인 (이미 온보딩을 완료한 계정인지)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingChild } = await (supabase as any)
      .from("children")
      .select("id, grade")
      .eq("created_by", user.id)
      .maybeSingle();

    if (existingChild) {
      // 데이터 있음 → 바로 홈/새싹 이동
      localStorage.setItem("kkumddara_child_id", existingChild.id);
      const isSprout =
        existingChild.grade === "elementary3" || existingChild.grade === "elementary4";
      router.push(isSprout ? "/sprout" : "/home");
    } else {
      // 데이터 없음 → 온보딩 폼에서 학년/관심분야 선택 계속
      setAuthMsg("✅ 로그인됐어요! 아래에서 학년과 관심분야를 선택 후 시작하세요.");
    }
  };

  // ── 이메일 로그인 (개발/테스트용)
  const handleEmailLogin = async () => {
    if (!testEmail || !testPassword) {
      setAuthMsg("⚠️ 이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }
    setAuthLoading(true);
    setAuthMsg(null);
    const { error } = await supabase.auth.signInWithPassword({
      email:    testEmail,
      password: testPassword,
    });
    if (error) {
      setAuthLoading(false);
      setAuthMsg("❌ 로그인 실패: " + error.message);
      return;
    }
    await afterAuthSuccess("이메일 로그인");
    setAuthLoading(false);
  };

  // ── 이메일 회원가입 (개발/테스트용)
  const handleEmailSignUp = async () => {
    if (!testEmail || !testPassword) {
      setAuthMsg("⚠️ 이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }
    if (testPassword.length < 6) {
      setAuthMsg("⚠️ 비밀번호는 6자리 이상이어야 합니다.");
      return;
    }
    setAuthLoading(true);
    setAuthMsg(null);
    const { error } = await supabase.auth.signUp({
      email:    testEmail,
      password: testPassword,
    });
    if (error) {
      setAuthLoading(false);
      setAuthMsg("❌ 가입 실패: " + error.message);
      return;
    }
    // signUp 후 자동 로그인 상태 → 동일한 후처리
    await afterAuthSuccess("이메일 가입");
    setAuthLoading(false);
  };

  // 버튼 활성화 조건
  const canStart = data.userType && data.grade && data.interests.length > 0;

  // 수정 모드 뒤로가기: 현재 학년에 따라 목적지 결정
  const backHref =
    data.grade === "elementary3" || data.grade === "elementary4"
      ? "/sprout"
      : "/home";

  // ----------------------------------------
  // 렌더링
  // ----------------------------------------
  return (
    <div className="flex flex-col min-h-screen bg-white px-5 pt-10 pb-8">

      {/* ---- 수정 모드: 뒤로가기 버튼 ---- */}
      {isEdit && (
        <button
          onClick={() => router.push(backHref)}
          className="
            flex items-center gap-1 mb-6 -ml-1
            text-sm font-semibold text-base-muted
            active:opacity-60 transition-opacity
          "
        >
          <ChevronLeft size={18} />
          돌아가기
        </button>
      )}

      {/* 로고 영역 */}
      {!isEdit && (
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-4xl font-bold text-brand-red">꿈따라</span>
          </div>
          <p className="text-sm text-base-muted text-center leading-relaxed">
            막연한 꿈이 아닌,{"\n"}
            <span className="font-semibold text-base-text">
              실행 가능한 내일을
            </span>
          </p>
        </div>
      )}

      {/* 수정 모드 타이틀 */}
      {isEdit && (
        <div className="mb-8">
          <h1 className="text-xl font-bold text-base-text">내 정보 수정</h1>
          <p className="text-sm text-base-muted mt-1">학년과 관심 분야를 변경해 보세요</p>
        </div>
      )}

      {/* ---- 섹션 1: 사용자 유형 선택 ---- */}
      <section className="mb-7">
        <h2 className="text-sm font-bold text-base-muted mb-3 uppercase tracking-wide">
          누가 사용하시나요?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {/* 학부모 카드 */}
          <button
            onClick={() => handleUserTypeSelect("parent")}
            className={cn(
              "relative py-5 px-4 rounded-card-lg border-2 transition-all",
              "flex flex-col items-center gap-2",
              data.userType === "parent"
                ? "border-brand-red bg-brand-light"    // 선택됨
                : "border-base-border bg-white"         // 미선택
            )}
          >
            <span className="text-3xl">👨‍👩‍👧</span>
            <span
              className={cn(
                "text-sm font-bold",
                data.userType === "parent" ? "text-brand-red" : "text-base-text"
              )}
            >
              학부모
            </span>
            <span
              className={cn(
                "text-xs",
                data.userType === "parent" ? "text-brand-orange" : "text-base-muted"
              )}
            >
              자녀 진로 설계
            </span>
            {/* 선택 체크 뱃지 */}
            {data.userType === "parent" && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-brand-red rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </span>
            )}
          </button>

          {/* 학생 카드 */}
          <button
            onClick={() => handleUserTypeSelect("student")}
            className={cn(
              "relative py-5 px-4 rounded-card-lg border-2 transition-all",
              "flex flex-col items-center gap-2",
              data.userType === "student"
                ? "border-brand-red bg-brand-light"
                : "border-base-border bg-white"
            )}
          >
            <span className="text-3xl">🧑‍🎓</span>
            <span
              className={cn(
                "text-sm font-bold",
                data.userType === "student" ? "text-brand-red" : "text-base-text"
              )}
            >
              학생
            </span>
            <span
              className={cn(
                "text-xs",
                data.userType === "student" ? "text-brand-orange" : "text-base-muted"
              )}
            >
              내 꿈 찾기
            </span>
            {data.userType === "student" && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-brand-red rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </span>
            )}
          </button>
        </div>
      </section>

      {/* ---- 섹션 2: 학년 선택 (초/중/고 구간 분리) ---- */}
      <section className="mb-7">
        <h2 className="text-sm font-bold text-base-muted mb-3 uppercase tracking-wide">
          학년을 선택하세요
        </h2>
        <div className="flex flex-col gap-3">
          {gradeGroups.map((group) => (
            <div key={group.label}>
              {/* 구간 라벨 */}
              <p className="text-xs text-base-muted mb-1.5">{group.label}</p>
              {/* 버튼 가로 나열 */}
              <div className="flex gap-2 flex-wrap">
                {group.options.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handleGradeSelect(value)}
                    className={cn(
                      "px-4 py-2.5 rounded-full text-sm font-semibold transition-all",
                      "border-2 min-w-[52px]",
                      data.grade === value
                        ? "bg-brand-red border-brand-red text-white"
                        : "bg-white border-base-border text-base-text"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- 섹션 3: 관심 분야 선택 ---- */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-base-muted mb-1 uppercase tracking-wide">
          관심 분야를 선택하세요
        </h2>
        <p className="text-xs text-base-muted mb-3">복수 선택 가능</p>
        <div className="grid grid-cols-2 gap-2">
          {interestOptions.map(({ value, label, emoji }) => {
            const isSelected = data.interests.includes(value);
            return (
              <button
                key={value}
                onClick={() => handleInterestToggle(value)}
                className={cn(
                  "flex items-center gap-3 py-3 px-4 rounded-card",
                  "border-2 transition-all text-left",
                  isSelected
                    ? "bg-brand-light border-brand-red"    // 선택됨
                    : "bg-white border-base-border"         // 미선택
                )}
              >
                <span className="text-xl">{emoji}</span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-brand-red" : "text-base-text"
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ---- 버튼 영역 ---- */}
      <div className="flex flex-col gap-3 mt-auto">

        {/* 에러 토스트 */}
        {errorMsg && (
          <div className="w-full px-4 py-3 rounded-card bg-red-50 border border-red-200 flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
          </div>
        )}

        {/* 시작하기 / 입력 완료 버튼 */}
        <button
          onClick={handleStart}
          disabled={!canStart || isLoading}
          className={cn(
            "btn-primary flex items-center justify-center gap-2",
          )}
        >
          {isLoading ? (
            <span className="text-sm">잠깐만요...</span>
          ) : (
            <>
              <span>{isEdit ? "입력 완료" : "꿈따라 시작하기"}</span>
              <ChevronRight size={18} />
            </>
          )}
        </button>

        {/* 카카오 로그인 (신규 진입 시에만 표시) */}
        {!isEdit && (
          <>
            {/* 구분선 */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-base-border" />
              <span className="text-xs text-base-muted">또는</span>
              <div className="flex-1 h-px bg-base-border" />
            </div>

            {/* 카카오 로그인 버튼 */}
            <button
              onClick={handleKakaoLogin}
              className="
                w-full py-4 rounded-button
                bg-[#FEE500] text-[#3C1E1E]
                font-semibold text-sm
                flex items-center justify-center gap-2
                active:opacity-80 transition-opacity
              "
            >
              {/* 카카오 아이콘 (SVG) */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9 0.5C4.029 0.5 0 3.643 0 7.5C0 10.003 1.548 12.205 3.9 13.5L3 17.5L7.2 14.877C7.789 14.959 8.39 15 9 15C13.971 15 18 11.866 18 8C18 4.134 13.971 0.5 9 0.5Z"
                  fill="#3C1E1E"
                />
              </svg>
              카카오로 시작하기
            </button>

            {/* ── 개발/테스트용 이메일 로그인 ── */}
            <div className="mt-1">
              {/* 구분선 */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px bg-base-border" />
                <span className="text-[10px] font-semibold text-base-muted bg-base-off px-2 py-0.5 rounded-full">
                  개발 테스트용
                </span>
                <div className="flex-1 h-px bg-base-border" />
              </div>

              <div className="flex flex-col gap-2">
                {/* 인증 메시지 (성공/실패 인라인) */}
                {authMsg && (
                  <p className={`text-xs font-medium px-1 ${
                    authMsg.startsWith("✅") ? "text-green-600" : "text-red-500"
                  }`}>
                    {authMsg}
                  </p>
                )}

                {/* 이메일 입력 */}
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@kkumddara.kr"
                  className="
                    w-full px-4 py-3 rounded-card border border-base-border
                    text-sm text-base-text placeholder:text-base-muted
                    focus:outline-none focus:border-brand-red transition-colors
                  "
                />
                {/* 비밀번호 입력 */}
                <input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="비밀번호 (6자리 이상)"
                  className="
                    w-full px-4 py-3 rounded-card border border-base-border
                    text-sm text-base-text placeholder:text-base-muted
                    focus:outline-none focus:border-brand-red transition-colors
                  "
                />
                {/* 버튼 2개 */}
                <div className="flex gap-2">
                  <button
                    onClick={handleEmailLogin}
                    disabled={authLoading}
                    className="
                      flex-1 py-3 rounded-button border border-base-border
                      text-sm font-semibold text-base-text bg-white
                      active:opacity-70 transition-opacity disabled:opacity-40
                    "
                  >
                    {authLoading ? "처리 중..." : "이메일로 시작하기"}
                  </button>
                  <button
                    onClick={handleEmailSignUp}
                    disabled={authLoading}
                    className="
                      flex-1 py-3 rounded-button border border-brand-red
                      text-sm font-semibold text-brand-red bg-white
                      active:opacity-70 transition-opacity disabled:opacity-40
                    "
                  >
                    {authLoading ? "처리 중..." : "테스트 계정 만들기"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
