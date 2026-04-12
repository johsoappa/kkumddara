"use client";

// ====================================================
// 명따라 메인 입력 화면 (/myeonddara)
//
// [상태별 분기]
//   loading  : 인증 확인 중 → 스켈레톤
//   guest    : 비로그인 → 소개 + 로그인 유도 (홈 리다이렉트 없음)
//   student  : 학생 계정 → 학부모 전용 안내 (홈 리다이렉트 없음)
//   parent   : 학부모 로그인 → 플랜 확인 → 자녀 선택 → 분석
//
// [서버 차단]
//   POST /api/myeonddara/use — 플랜·한도 검증 + 차감
// ====================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, ChevronDown, LogIn, Users } from "lucide-react";
import SajuInput from "@/components/myeonddara/SajuInput";
import { MYEONDDARA_INPUT_KEY } from "@/data/myeonddara";
import type { SajuInputData } from "@/types/myeonddara";
import { supabase } from "@/lib/supabase";
import { GRADE_LEVEL_LABEL, GRADE_LABEL } from "@/types/family";
import type { GradeLevel, Grade } from "@/types/family";

const PER_CHILD_YEARLY_LIMIT = 3;

const OHAENG_BADGES = [
  { emoji: "🔥", label: "화(火)" },
  { emoji: "🌊", label: "수(水)" },
  { emoji: "🌲", label: "목(木)" },
  { emoji: "⚙️", label: "금(金)" },
  { emoji: "⛰️", label: "토(土)" },
];

// ── 인증 상태 타입 ──
type AuthState = "loading" | "guest" | "student" | "parent";

interface ChildOption {
  id:           string;
  name:         string;
  avatar_emoji: string;
  gradeLabel:   string;
  usedCount:    number;
}

export default function MyeonddaraPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // ── 인증 상태 ──────────────────────────────────────
  const [authState, setAuthState]        = useState<AuthState>("loading");

  // ── 학부모 전용: 플랜/한도 차단 ───────────────────
  const [checkDone, setCheckDone]        = useState(false);
  const [blocked, setBlocked]            = useState(false);
  const [blockMsg, setBlockMsg]          = useState("");
  const [blockType, setBlockType]        = useState<"plan" | "limit" | "auth" | null>(null);

  // ── 자녀 선택 ──────────────────────────────────────
  const [children, setChildren]          = useState<ChildOption[]>([]);
  const [selectedChildId, setSelected]   = useState<string | null>(null);
  const [showSelector, setShowSelector]  = useState(false);

  // ── 남은 횟수 (선택된 자녀 기준) ─────────────────
  const selectedChild  = children.find((c) => c.id === selectedChildId);
  const remainingCount =
    selectedChild != null
      ? Math.max(0, PER_CHILD_YEARLY_LIMIT - selectedChild.usedCount)
      : null;

  // ── 초기 로드 ──────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();

      // 비로그인 → guest 상태로 소개 화면 표시 (홈 이동 없음)
      if (!user) {
        setAuthState("guest");
        return;
      }

      // 학생 계정 → student 상태로 안내 화면 표시 (홈 이동 없음)
      if (user.user_metadata?.role !== "parent") {
        setAuthState("student");
        return;
      }

      // 학부모 확인
      setAuthState("parent");

      const { data: parentRow } = await supabase
        .from("parent")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!parentRow) {
        setBlocked(true);
        setBlockMsg("학부모 정보를 불러오지 못했어요.");
        setBlockType("auth");
        setCheckDone(true);
        return;
      }

      // 플랜 확인
      const { data: plan } = await supabase
        .from("subscription_plan")
        .select("myeonddara_yearly_limit, plan_name")
        .eq("parent_id", parentRow.id)
        .maybeSingle();

      const isFree      = !plan || plan.plan_name === "free";
      const yearlyLimit = plan?.myeonddara_yearly_limit ?? 0;

      if (isFree || yearlyLimit === 0) {
        setBlocked(true);
        setBlockMsg("명따라는 베이직 이상 플랜에서 이용할 수 있어요.\n연 3회 (1학기·2학기·연말) 제공됩니다.");
        setBlockType("plan");
        setCheckDone(true);
        return;
      }

      // 자녀 목록 조회
      const { data: childRows } = await supabase
        .from("child")
        .select("id, name, avatar_emoji, grade_level, school_grade")
        .eq("parent_id", parentRow.id)
        .eq("profile_status", "active")
        .order("created_at", { ascending: true });

      if (!childRows || childRows.length === 0) {
        setBlocked(true);
        setBlockMsg("명따라를 이용하려면 자녀 프로필이 필요해요.");
        setBlockType("auth");
        setCheckDone(true);
        return;
      }

      // 이번 연도 자녀별 사용량 조회
      const currentYear = new Date().getFullYear();
      const childIds    = childRows.map((c) => c.id);

      const { data: usageRows } = await supabase
        .from("myeonddara_usage")
        .select("child_id, count")
        .in("child_id", childIds)
        .eq("used_year", currentYear);

      const usageMap: Record<string, number> = {};
      (usageRows ?? []).forEach((u) => {
        if (u.child_id) usageMap[u.child_id] = u.count;
      });

      const options: ChildOption[] = childRows.map((c) => {
        let gl = "";
        if (c.grade_level && GRADE_LEVEL_LABEL[c.grade_level as GradeLevel]) {
          gl = GRADE_LEVEL_LABEL[c.grade_level as GradeLevel];
        } else if (c.school_grade && GRADE_LABEL[c.school_grade as Grade]) {
          gl = GRADE_LABEL[c.school_grade as Grade];
        }
        return {
          id:           c.id,
          name:         c.name,
          avatar_emoji: c.avatar_emoji,
          gradeLabel:   gl,
          usedCount:    usageMap[c.id] ?? 0,
        };
      });

      setChildren(options);

      const firstWithRemaining = options.find(
        (c) => c.usedCount < PER_CHILD_YEARLY_LIMIT
      );
      const defaultChild = firstWithRemaining ?? options[0];
      setSelected(defaultChild.id);

      if (
        defaultChild.usedCount >= PER_CHILD_YEARLY_LIMIT &&
        options.every((c) => c.usedCount >= PER_CHILD_YEARLY_LIMIT)
      ) {
        setBlocked(true);
        setBlockMsg(
          "이번 연도 명따라 분석 횟수를 모두 사용했어요.\n1학기(3월) · 2학기(9월) · 연말(12월)\n총 3회 제공됩니다."
        );
        setBlockType("limit");
      }

      setCheckDone(true);
    }

    init();
  }, []);

  // ── 자녀 선택 변경 시 차단 상태 재평가 ─────────────
  useEffect(() => {
    if (!checkDone || blockType === "plan" || blockType === "auth") return;
    const child = children.find((c) => c.id === selectedChildId);
    if (!child) return;

    if (child.usedCount >= PER_CHILD_YEARLY_LIMIT) {
      setBlocked(true);
      setBlockMsg(
        "이번 연도 명따라 분석 횟수를 모두 사용했어요.\n1학기(3월) · 2학기(9월) · 연말(12월)\n총 3회 제공됩니다."
      );
      setBlockType("limit");
    } else {
      setBlocked(false);
      setBlockMsg("");
      setBlockType(null);
    }
  }, [selectedChildId, children, checkDone, blockType]);

  // ── 폼 제출 ────────────────────────────────────────
  const handleSubmit = async (data: SajuInputData) => {
    if (blocked || !selectedChildId) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/myeonddara/use", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ childId: selectedChildId }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 429 || res.status === 403) {
          setBlocked(true);
          setBlockMsg(err.error);
          setBlockType(res.status === 403 ? "plan" : "limit");
          if (res.status === 429) {
            setChildren((prev) =>
              prev.map((c) =>
                c.id === selectedChildId
                  ? { ...c, usedCount: PER_CHILD_YEARLY_LIMIT }
                  : c
              )
            );
          }
        }
        setIsLoading(false);
        return;
      }

      const { remaining } = await res.json();
      setChildren((prev) =>
        prev.map((c) =>
          c.id === selectedChildId
            ? { ...c, usedCount: PER_CHILD_YEARLY_LIMIT - remaining }
            : c
        )
      );

      localStorage.setItem(MYEONDDARA_INPUT_KEY, JSON.stringify(data));
      router.push("/myeonddara/result");
    } catch {
      setIsLoading(false);
    }
  };

  // ── 공통 헤더 ──────────────────────────────────────
  const Header = () => (
    <div className="sticky top-0 z-50 bg-white border-b border-base-border">
      <div className="flex items-center justify-between px-4 h-14">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-base-off transition-colors"
          aria-label="뒤로가기"
        >
          <ArrowLeft size={20} className="text-base-text" />
        </button>
        <h1 className="text-sm font-bold text-base-text">명따라</h1>
        {/* 남은 횟수 배지 (학부모 + 정상 상태만) */}
        {authState === "parent" && remainingCount !== null && !blocked ? (
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "#FFF0EB", color: "#E84B2E" }}
          >
            올해 {remainingCount}회 남음
          </span>
        ) : (
          <div className="w-9" />
        )}
      </div>
    </div>
  );

  // ── 소개 카드 (모든 상태 공통 표시) ───────────────
  const IntroCard = () => (
    <div
      className="rounded-card-lg px-4 py-6 text-center"
      style={{ background: "linear-gradient(135deg, #1A3A6B, #2C5F8A)" }}
    >
      <span className="text-5xl leading-none block mb-3">✨</span>
      <h2 className="text-2xl font-bold text-white mb-2">명따라</h2>
      <p className="text-sm text-white/80 leading-relaxed mb-3">
        아이의 생년월일시로<br />
        타고난 기질과 적성을 분석해드려요.<br />
        동양 철학의 지혜로<br />
        진로의 방향을 찾아보세요.
      </p>
      <p className="text-xs text-white/60 mb-4">
        연 3회 제공 · 1학기(3월) · 2학기(9월) · 연말(12월)
      </p>
      <div className="flex justify-center gap-1 flex-nowrap">
        {OHAENG_BADGES.map((b) => (
          <span
            key={b.label}
            className="flex items-center gap-0.5 text-xs font-semibold text-white px-2 py-1 rounded-full whitespace-nowrap"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            <span>{b.emoji}</span>
            <span>{b.label}</span>
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-base-off">

        <Header />

        <div className="px-4 pt-4 pb-10 flex flex-col gap-4">

          {/* 소개 카드 — 모든 상태 공통 */}
          <IntroCard />

          {/* ── A. 비로그인(체험) — 로그인 유도 ─────────── */}
          {authState === "guest" && (
            <div className="bg-white rounded-card-lg shadow-card p-6 text-center flex flex-col items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#FFF0EB" }}
              >
                <LogIn size={22} style={{ color: "#E84B2E" }} />
              </div>
              <p className="text-sm font-semibold text-base-text">
                명따라는 학부모 로그인 후 이용할 수 있어요
              </p>
              <p className="text-xs text-base-muted leading-relaxed">
                베이직 이상 플랜에서 제공됩니다.<br />
                연 3회 (1학기 · 2학기 · 연말)
              </p>
              <button
                onClick={() => router.push("/")}
                className="mt-1 px-5 py-2.5 rounded-button text-sm font-bold text-white"
                style={{ backgroundColor: "#E84B2E" }}
              >
                로그인하고 시작하기
              </button>
            </div>
          )}

          {/* ── B. 학생 계정 — 학부모 전용 안내 ─────────── */}
          {authState === "student" && (
            <div className="bg-white rounded-card-lg shadow-card p-6 text-center flex flex-col items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#FFF0EB" }}
              >
                <Users size={22} style={{ color: "#E84B2E" }} />
              </div>
              <p className="text-sm font-semibold text-base-text">
                명따라는 학부모 전용 기능이에요
              </p>
              <p className="text-xs text-base-muted leading-relaxed">
                학부모 계정으로 로그인하면<br />
                자녀의 기질과 적성을 분석할 수 있어요.
              </p>
              <button
                onClick={() => router.back()}
                className="mt-1 px-5 py-2.5 rounded-button text-sm font-bold"
                style={{ backgroundColor: "#FFF0EB", color: "#E84B2E" }}
              >
                돌아가기
              </button>
            </div>
          )}

          {/* ── C. 학부모 — 자녀 선택 (2명 이상) ────────── */}
          {authState === "parent" && checkDone && !blocked && children.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowSelector((v) => !v)}
                className="
                  w-full bg-white rounded-card border border-base-border
                  px-4 py-3 flex items-center justify-between
                  text-sm font-semibold text-base-text
                "
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{selectedChild?.avatar_emoji}</span>
                  <span>{selectedChild?.name}</span>
                  {selectedChild?.gradeLabel && (
                    <span className="text-xs text-base-muted font-normal">
                      {selectedChild.gradeLabel}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2 text-xs text-base-muted font-normal">
                  <span
                    className={
                      (selectedChild?.usedCount ?? 0) >= PER_CHILD_YEARLY_LIMIT
                        ? "text-red-400"
                        : "text-brand-red"
                    }
                  >
                    {remainingCount === 0 ? "이번 해 종료" : `${remainingCount}회 남음`}
                  </span>
                  <ChevronDown size={14} />
                </span>
              </button>

              {showSelector && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-base-border rounded-card shadow-card z-10">
                  {children.map((child) => {
                    const rem = Math.max(0, PER_CHILD_YEARLY_LIMIT - child.usedCount);
                    return (
                      <button
                        key={child.id}
                        onClick={() => { setSelected(child.id); setShowSelector(false); }}
                        className={`
                          w-full flex items-center justify-between px-4 py-3
                          text-sm hover:bg-base-off transition-colors
                          ${child.id === selectedChildId ? "bg-base-off" : ""}
                        `}
                      >
                        <span className="flex items-center gap-2">
                          <span>{child.avatar_emoji}</span>
                          <span className="font-medium text-base-text">{child.name}</span>
                          {child.gradeLabel && (
                            <span className="text-xs text-base-muted">{child.gradeLabel}</span>
                          )}
                        </span>
                        <span className={`text-xs font-semibold ${rem === 0 ? "text-red-400" : "text-brand-red"}`}>
                          {rem === 0 ? "이번 해 종료" : `${rem}회 남음`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── C. 학부모 — 플랜/한도 차단 ──────────────── */}
          {authState === "parent" && checkDone && blocked && (
            <div className="bg-white rounded-card-lg shadow-card p-6 text-center flex flex-col items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#FFF0EB" }}
              >
                <Lock size={22} style={{ color: "#E84B2E" }} />
              </div>
              <p className="text-sm font-semibold text-base-text">
                {blockMsg.split("\n")[0]}
              </p>
              <p className="text-xs text-base-muted leading-relaxed whitespace-pre-line">
                {blockMsg.split("\n").slice(1).join("\n")}
              </p>
              {blockType === "plan" && (
                <button
                  onClick={() => router.push("/pricing")}
                  className="mt-1 px-5 py-2.5 rounded-button text-sm font-bold text-white"
                  style={{ backgroundColor: "#E84B2E" }}
                >
                  요금제 살펴보기
                </button>
              )}
            </div>
          )}

          {/* ── C. 학부모 — 입력 폼 ──────────────────────── */}
          {authState === "parent" && checkDone && !blocked && (
            <SajuInput onSubmit={handleSubmit} isLoading={isLoading} />
          )}

          {/* ── 로딩 스켈레톤 ────────────────────────────── */}
          {authState === "loading" && (
            <div className="bg-white rounded-card-lg shadow-card p-6 animate-pulse">
              <div className="h-4 bg-base-border rounded w-1/3 mb-4" />
              <div className="h-10 bg-base-border rounded mb-3" />
              <div className="h-10 bg-base-border rounded mb-3" />
              <div className="h-10 bg-base-border rounded" />
            </div>
          )}

          {/* ── 하단 안내 ────────────────────────────────── */}
          <p className="text-xs text-base-muted text-center leading-relaxed px-4">
            명따라는 동양 철학 기반의 참고용 진로 분석 서비스입니다.<br />
            아이의 가능성은 무한합니다. 💛
          </p>
        </div>
      </div>
    </div>
  );
}
