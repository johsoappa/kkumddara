"use client";

// ====================================================
// 온보딩 폼 컴포넌트
// - 사용자 유형 선택 (학부모/학생)
// - 학년 선택 (초3~고3)
// - 관심 분야 선택 (복수 선택)
// - isEdit=true: 기존값 프리필 + 뒤로가기 + "입력 완료" 버튼
//
// [확장 가이드]
// 학년/관심분야/사용자타입 옵션은 파일 상단 상수(GRADE_GROUPS, INTEREST_OPTIONS,
// USER_TYPE_OPTIONS)만 수정하면 렌더링이 자동으로 반영됩니다.
// Supabase 스키마(grade, interests 컬럼)와 Grade/InterestField 타입을 함께 갱신하세요.
// ====================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ============================================================
// 1. 타입 정의
//    Supabase children 테이블의 grade / interests 컬럼과 동기화
// ============================================================

/** 사용자 역할. 현재는 UI 분기용이며 DB 저장은 추후 확장 가능. */
export type UserType = "parent" | "student";

/**
 * 학년 식별자.
 * DB children.grade 컬럼 허용값과 반드시 일치해야 합니다.
 * 새 학년 추가 시 → 이 타입 + GRADE_GROUPS 배열 + Supabase 스키마를 함께 수정하세요.
 */
export type Grade =
  | "elementary3"   // 초3 (새싹 모드)
  | "elementary4"   // 초4 (새싹 모드)
  | "elementary5"   // 초5
  | "elementary6"   // 초6
  | "middle1"       // 중1
  | "middle2"       // 중2
  | "middle3"       // 중3
  | "high1"         // 고1
  | "high2"         // 고2
  | "high3";        // 고3

/**
 * 관심 분야 식별자.
 * DB children.interests[] 컬럼 값과 반드시 일치해야 합니다.
 * 새 분야 추가 시 → 이 타입 + INTEREST_OPTIONS 배열 + Supabase 스키마를 함께 수정하세요.
 */
export type InterestField =
  | "it"            // IT/기술
  | "art"           // 예술/디자인
  | "medical"       // 의료/과학
  | "business"      // 비즈니스
  | "education";    // 교육/사회

/** 온보딩 폼 전체 상태. localStorage 및 Supabase 저장 구조와 동일. */
export interface OnboardingData {
  userType:  UserType | null;
  grade:     Grade | null;
  interests: InterestField[];
}

// ============================================================
// 2. 옵션 상수
//    렌더링 배열 + 타입 안전성 모두 확보.
//    확장 시 이 상수만 수정하면 UI가 자동 반영됩니다.
// ============================================================

/** 사용자 타입 카드 옵션 */
const USER_TYPE_OPTIONS: {
  value:    UserType;
  emoji:    string;
  label:    string;
  subLabel: string;
}[] = [
  { value: "parent",  emoji: "👨‍👩‍👧", label: "학부모", subLabel: "자녀 진로 설계" },
  { value: "student", emoji: "🧑‍🎓", label: "학생",   subLabel: "내 꿈 찾기"    },
];

/**
 * 학년 그룹 정의.
 * 각 그룹은 { label: 표시명, options: { value: Grade, label: 짧은명 }[] } 구조.
 * 초등/중등/고등 외 그룹 추가 시 이 배열에 항목 추가만 하면 됩니다.
 */
const GRADE_GROUPS: {
  label:   string;
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

/**
 * 관심 분야 옵션.
 * 새 분야 추가 시 여기에 항목 추가 + InterestField 타입 확장.
 * emoji는 향후 아이콘 컴포넌트로 교체 가능.
 */
const INTEREST_OPTIONS: {
  value: InterestField;
  label: string;
  emoji: string;
}[] = [
  { value: "it",        label: "IT/기술",    emoji: "💻" },
  { value: "art",       label: "예술/디자인", emoji: "🎨" },
  { value: "medical",   label: "의료/과학",   emoji: "🔬" },
  { value: "business",  label: "비즈니스",    emoji: "💼" },
  { value: "education", label: "교육/사회",   emoji: "📚" },
];

// ============================================================
// 3. 새싹 모드 학년 집합 (초3~4)
//    저장 후 라우팅 분기에 사용.
// ============================================================
const SPROUT_GRADES = new Set<Grade>(["elementary3", "elementary4"]);

// ============================================================
// 4. 공통 선택 상태 className
//    카드형(사용자타입·관심분야)과 pill형(학년) 두 가지 패턴.
//    브랜드 컬러 변경 시 이 상수만 수정하면 전체 반영됩니다.
// ============================================================
/** 카드형 버튼 — 선택됨 */
const CARD_SELECTED   = "border-[#E84B2E] bg-red-50" as const;
/** 카드형 버튼 — 미선택 */
const CARD_IDLE       = "border-base-border bg-white" as const;
/** pill형 버튼 — 선택됨 (배경 채움) */
const PILL_SELECTED   = "bg-[#E84B2E] border-[#E84B2E] text-white" as const;
/** pill형 버튼 — 미선택 */
const PILL_IDLE       = "bg-white border-base-border text-base-text" as const;
/** 선택 시 텍스트 컬러 */
const TEXT_SELECTED   = "text-[#E84B2E]" as const;
/** 미선택 텍스트 컬러 */
const TEXT_IDLE       = "text-base-text" as const;

// ============================================================
// 4. Props
// ============================================================
interface OnboardingFormProps {
  /** true: 수정 모드 — 기존값 프리필, 뒤로가기, "입력 완료" 버튼 */
  isEdit?: boolean;
}

// ============================================================
// 5. 메인 컴포넌트
// ============================================================
export default function OnboardingForm({ isEdit = false }: OnboardingFormProps) {
  const router = useRouter();

  // ── 폼 상태
  const [data, setData] = useState<OnboardingData>({
    userType:  null,
    grade:     null,
    interests: [],
  });

  // ── 로딩 / 에러
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);

  // ── 이메일 로그인 (개발/테스트용)
  const [testEmail,    setTestEmail]    = useState("");
  const [testPassword, setTestPassword] = useState("");
  const [authLoading,  setAuthLoading]  = useState(false);
  const [authMsg,      setAuthMsg]      = useState<string | null>(null);

  // ── 수정 모드 프리필: Supabase → localStorage 순서로 기존값 로드
  useEffect(() => {
    if (!isEdit) return;

    const storedChildId = localStorage.getItem("kkumddara_child_id");

    const load = async () => {
      if (storedChildId) {
        try {
          const { data: authData } = await supabase.auth.getUser();
          if (authData.user) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: child } = await (supabase as any)
              .from("child")
              .select("school_grade, interests")
              .eq("id", storedChildId)
              .maybeSingle();
            if (child) {
              const stored    = localStorage.getItem("kkumddara_onboarding");
              const storedObj = stored ? (JSON.parse(stored) as OnboardingData) : null;
              setData({
                userType:  storedObj?.userType ?? null,
                grade:     child.school_grade as Grade,
                interests: (child.interests ?? []) as InterestField[],
              });
              return;
            }
          }
        } catch {
          // 인증 없거나 네트워크 오류 → localStorage fallback
        }
      }
      const stored = localStorage.getItem("kkumddara_onboarding");
      if (stored) setData(JSON.parse(stored) as OnboardingData);
    };

    load();
  }, [isEdit]);

  // ──────────────────────────────────────────────
  // 핸들러
  // ──────────────────────────────────────────────

  const handleUserTypeSelect = (type: UserType) =>
    setData((prev) => ({ ...prev, userType: type }));

  const handleGradeSelect = (grade: Grade) =>
    setData((prev) => ({ ...prev, grade }));

  const handleInterestToggle = (field: InterestField) =>
    setData((prev) => ({
      ...prev,
      interests: prev.interests.includes(field)
        ? prev.interests.filter((i) => i !== field)
        : [...prev.interests, field],
    }));

  // ── 시작하기 / 입력 완료
  const handleStart = async () => {
    console.log("[온보딩] 시작하기 클릭, isEdit:", isEdit);

    if (!data.grade) {
      setErrorMsg("학년을 선택해주세요.");
      return;
    }
    if (data.interests.length === 0) {
      setErrorMsg("관심 분야를 하나 이상 선택해주세요.");
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      console.log("[온보딩] 유저:", user?.id ?? "❌ 미로그인");

      // localStorage 항상 저장 (오프라인 캐시)
      localStorage.setItem("kkumddara_onboarding", JSON.stringify(data));

      if (!user) {
        console.warn("[온보딩] 미인증 → localStorage만 저장");
      } else {
        const childId = localStorage.getItem("kkumddara_child_id");

        if (isEdit && childId) {
          // ── 수정 모드: UPDATE
          console.log("[온보딩] 수정 모드 → UPDATE, child_id:", childId);
          const { error } = await supabase
            .from("child")
            .update({ school_grade: data.grade, interests: data.interests })
            .eq("id", childId);
          if (error) console.error("[온보딩] UPDATE 에러:", error);
          else        console.log("[온보딩] UPDATE 성공");

        } else {
          // ── 최초 온보딩: INSERT
          console.log("[온보딩] 최초 온보딩 → INSERT");

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: existingFamily } = await (supabase as any)
            .from("families")
            .select("id")
            .eq("main_user_id", user.id)
            .maybeSingle();

          let familyId: string | null = existingFamily?.id ?? null;

          if (!familyId) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: newFamily, error: familyError } = await (supabase as any)
              .from("families")
              .insert({ main_user_id: user.id })
              .select("id")
              .single();
            console.log("[온보딩] family INSERT:", newFamily?.id ?? "❌", familyError?.message ?? "");
            familyId = newFamily?.id ?? null;
          } else {
            console.log("[온보딩] 기존 family 사용:", familyId);
          }

          if (!familyId) {
            console.error("[온보딩] family 확보 실패 → localStorage만 저장");
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: child, error: childError } = await (supabase as any)
              .from("children")
              .insert({
                family_id:  familyId,
                created_by: user.id,
                name:       "친구",
                grade:      data.grade,
                interests:  data.interests,
              })
              .select()
              .single();
            console.log("[온보딩] children INSERT:", child?.id ?? "❌", childError?.message ?? "");
            if (child) localStorage.setItem("kkumddara_child_id", child.id);
          }
        }
      }

      // 화면 이동
      // router.refresh() → Next.js 라우터 캐시 무효화 → 홈 컴포넌트 리마운트 보장
      router.refresh();
      const dest = SPROUT_GRADES.has(data.grade!) ? "/sprout" : "/student/home";
      router.replace(dest);

    } catch (error) {
      console.error("[온보딩] 전체 에러:", error);
      setErrorMsg("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
      router.push("/home");
    } finally {
      setIsLoading(false);
    }
  };

  // ── 카카오 로그인 (더미)
  const handleKakaoLogin = () => {
    alert("카카오 로그인은 준비 중입니다. 😊");
  };

  // ── 이메일 로그인/가입 공통 후처리
  const afterAuthSuccess = async (label: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    console.log(`[${label}] user.id:`, user?.id);

    if (!user) {
      setAuthMsg("⚠️ 인증은 됐지만 유저 정보를 가져오지 못했습니다. 새로고침 해주세요.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingChild } = await (supabase as any)
      .from("children")
      .select("id, grade, interests")
      .eq("created_by", user.id)
      .maybeSingle();

    if (existingChild) {
      localStorage.setItem("kkumddara_child_id", existingChild.id);
      if (!localStorage.getItem("kkumddara_onboarding")) {
        localStorage.setItem("kkumddara_onboarding", JSON.stringify({
          userType:  null,
          grade:     existingChild.grade,
          interests: existingChild.interests ?? [],
        }));
      }
      const isSprout = SPROUT_GRADES.has(existingChild.grade as Grade);
      router.push(isSprout ? "/sprout" : "/home");
    } else {
      setAuthMsg("✅ 로그인됐어요! 아래에서 학년과 관심분야를 선택 후 시작하세요.");
    }
  };

  // ── 이메일 로그인
  const handleEmailLogin = async () => {
    if (!testEmail || !testPassword) {
      setAuthMsg("⚠️ 이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }
    setAuthLoading(true);
    setAuthMsg(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: testEmail, password: testPassword,
    });
    if (error) {
      setAuthLoading(false);
      setAuthMsg("❌ 로그인 실패: " + error.message);
      return;
    }
    await afterAuthSuccess("이메일 로그인");
    setAuthLoading(false);
  };

  // ── 이메일 회원가입
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
      email: testEmail, password: testPassword,
    });
    if (error) {
      setAuthLoading(false);
      setAuthMsg("❌ 가입 실패: " + error.message);
      return;
    }
    await afterAuthSuccess("이메일 가입");
    setAuthLoading(false);
  };

  // ── 파생 상태
  const canStart = !!(data.grade && data.interests.length > 0);

  const backHref = SPROUT_GRADES.has(data.grade as Grade) ? "/sprout" : "/home";

  // ============================================================
  // 렌더링
  // ============================================================
  return (
    <div className="flex flex-col min-h-screen bg-white px-5 pt-10 pb-8">

      {/* ── 수정 모드: 뒤로가기 */}
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

      {/* ── 브랜딩 영역 (최초 온보딩) */}
      {!isEdit && (
        <div className="flex flex-col items-center mb-10">
          <span
            className="text-4xl font-bold mb-3"
            style={{ color: "#E84B2E" }}
          >
            꿈따라
          </span>
          <p className="text-sm text-base-muted text-center leading-relaxed">
            막연한 꿈이 아닌,
            <br />
            <span className="font-semibold text-base-text">실행 가능한 내일을</span>
          </p>
        </div>
      )}

      {/* ── 수정 모드 타이틀 */}
      {isEdit && (
        <div className="mb-8">
          <h1 className="text-xl font-bold text-base-text">내 정보 수정</h1>
          <p className="text-sm text-base-muted mt-1">학년과 관심 분야를 변경해 보세요</p>
        </div>
      )}

      {/* ══════════════════════════════════════
          섹션 1: 사용자 유형
          USER_TYPE_OPTIONS 상수 기반 렌더링
      ══════════════════════════════════════ */}
      <section className="mb-7">
        <h2 className="text-sm font-bold text-base-muted mb-3 uppercase tracking-wide">
          누가 사용하시나요?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {USER_TYPE_OPTIONS.map(({ value, emoji, label, subLabel }) => {
            const isSelected = data.userType === value;
            return (
              <button
                key={value}
                onClick={() => handleUserTypeSelect(value)}
                aria-pressed={isSelected}
                className={cn(
                  "relative py-5 px-4 rounded-card-lg border-2 transition-all",
                  "flex flex-col items-center gap-2",
                  isSelected ? CARD_SELECTED : CARD_IDLE
                )}
              >
                <span className="text-3xl">{emoji}</span>
                <span className={cn("text-sm font-bold", isSelected ? TEXT_SELECTED : TEXT_IDLE)}>
                  {label}
                </span>
                <span className={cn("text-xs", isSelected ? "text-[#E84B2E]/70" : "text-base-muted")}>
                  {subLabel}
                </span>
                {isSelected && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-[#E84B2E] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs leading-none">✓</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════
          섹션 2: 학년 선택
          GRADE_GROUPS 상수 기반 렌더링
      ══════════════════════════════════════ */}
      <section className="mb-7">
        <h2 className="text-sm font-bold text-base-muted mb-3 uppercase tracking-wide">
          학년을 선택하세요
        </h2>
        <div className="flex flex-col gap-3">
          {GRADE_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs text-base-muted mb-1.5">{group.label}</p>
              <div className="flex gap-2 flex-wrap">
                {group.options.map(({ value, label }) => {
                  const isSelected = data.grade === value;
                  return (
                    <button
                      key={value}
                      onClick={() => handleGradeSelect(value)}
                      aria-pressed={isSelected}
                      className={cn(
                        "px-4 py-2.5 rounded-full text-sm font-semibold transition-all",
                        "border-2 min-w-[52px]",
                        isSelected ? PILL_SELECTED : PILL_IDLE
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          섹션 3: 관심 분야
          INTEREST_OPTIONS 상수 기반 렌더링
      ══════════════════════════════════════ */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-base-muted mb-1 uppercase tracking-wide">
          관심 분야를 선택하세요
        </h2>
        <p className="text-xs text-base-muted mb-3">복수 선택 가능</p>
        <div className="grid grid-cols-2 gap-2">
          {INTEREST_OPTIONS.map(({ value, label, emoji }) => {
            const isSelected = data.interests.includes(value);
            return (
              <button
                key={value}
                onClick={() => handleInterestToggle(value)}
                aria-pressed={isSelected}
                className={cn(
                  "flex items-center gap-3 py-3 px-4 rounded-card",
                  "border-2 transition-all text-left",
                  isSelected ? CARD_SELECTED : CARD_IDLE
                )}
              >
                <span className="text-xl">{emoji}</span>
                <span className={cn("text-sm font-medium", isSelected ? TEXT_SELECTED : TEXT_IDLE)}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════
          액션 버튼 영역
      ══════════════════════════════════════ */}
      <div className="flex flex-col gap-3 mt-auto">

        {/* 에러 메시지 */}
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
          aria-disabled={!canStart || isLoading}
          aria-busy={isLoading}
          className={cn(
            "w-full py-4 rounded-button font-semibold text-sm",
            "flex items-center justify-center gap-2 transition-colors",
            "disabled:cursor-not-allowed",
            canStart && !isLoading
              ? "bg-[#E84B2E] text-white active:opacity-80"
              : "bg-gray-200 text-gray-400"
          )}
        >
          {isLoading ? (
            <span>잠깐만요...</span>
          ) : (
            <>
              <span>{isEdit ? "입력 완료" : "꿈따라 시작하기"}</span>
              <ChevronRight size={18} />
            </>
          )}
        </button>

        {/* 카카오 / 이메일 영역 (최초 온보딩에서만 표시) */}
        {!isEdit && (
          <>
            {/* 구분선 */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-base-border" />
              <span className="text-xs text-base-muted">또는</span>
              <div className="flex-1 h-px bg-base-border" />
            </div>

            {/* 카카오 버튼 (더미) */}
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
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  fillRule="evenodd" clipRule="evenodd"
                  d="M9 0.5C4.029 0.5 0 3.643 0 7.5C0 10.003 1.548 12.205 3.9 13.5L3 17.5L7.2 14.877C7.789 14.959 8.39 15 9 15C13.971 15 18 11.866 18 8C18 4.134 13.971 0.5 9 0.5Z"
                  fill="#3C1E1E"
                />
              </svg>
              카카오로 시작하기
            </button>

            {/* ── 개발/테스트용 이메일 로그인 ── */}
            <div className="mt-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-px bg-base-border" />
                <span className="text-[10px] font-semibold text-base-muted bg-base-off px-2 py-0.5 rounded-full">
                  개발 테스트용
                </span>
                <div className="flex-1 h-px bg-base-border" />
              </div>

              <div className="flex flex-col gap-2">
                {authMsg && (
                  <p className={cn(
                    "text-xs font-medium px-1",
                    authMsg.startsWith("✅") ? "text-green-600" : "text-red-500"
                  )}>
                    {authMsg}
                  </p>
                )}
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@kkumddara.kr"
                  className="
                    w-full px-4 py-3 rounded-card border border-base-border
                    text-sm text-base-text placeholder:text-base-muted
                    focus:outline-none focus:border-[#E84B2E] transition-colors
                  "
                />
                <input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="비밀번호 (6자리 이상)"
                  className="
                    w-full px-4 py-3 rounded-card border border-base-border
                    text-sm text-base-text placeholder:text-base-muted
                    focus:outline-none focus:border-[#E84B2E] transition-colors
                  "
                />
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
                      flex-1 py-3 rounded-button border border-[#E84B2E]
                      text-sm font-semibold text-[#E84B2E] bg-white
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
