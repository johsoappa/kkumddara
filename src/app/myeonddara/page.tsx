"use client";

// ====================================================
// 명따라 메인 입력 화면 (/myeonddara)
//
// [011 보정]
//   - 비로그인 / 학생 계정: 즉시 차단 (테스트 모드 제거)
//   - 자녀 프로필 연동: 자녀별 사용량 관리
//   - 사용량 차감: 서버 API(/api/myeonddara/use) 기준
//   - 클라이언트: 안내용 표시 목적으로만 사용량 조회
// ====================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, ChevronDown } from "lucide-react";
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

  // ── 초기화 상태 ────────────────────────────────────
  const [checkDone, setCheckDone]       = useState(false);
  const [blocked, setBlocked]           = useState(false);
  const [blockMsg, setBlockMsg]         = useState("");
  const [blockType, setBlockType]       = useState<"plan" | "limit" | "auth" | null>(null);

  // ── 자녀 선택 ──────────────────────────────────────
  const [children, setChildren]         = useState<ChildOption[]>([]);
  const [selectedChildId, setSelected]  = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  // ── 남은 횟수 (선택된 자녀 기준) ─────────────────
  const selectedChild = children.find((c) => c.id === selectedChildId);
  const remainingCount =
    selectedChild != null
      ? Math.max(0, PER_CHILD_YEARLY_LIMIT - selectedChild.usedCount)
      : null;

  // ── 초기 로드 ──────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();

      // 비로그인 → 홈으로
      if (!user) {
        router.replace("/");
        return;
      }

      // 학부모가 아닌 계정 → 홈으로
      if (user.user_metadata?.role !== "parent") {
        router.replace("/");
        return;
      }

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

      // 기본 선택: 남은 횟수가 있는 첫 자녀, 없으면 첫 자녀
      const firstWithRemaining = options.find(
        (c) => c.usedCount < PER_CHILD_YEARLY_LIMIT
      );
      const defaultChild = firstWithRemaining ?? options[0];
      setSelected(defaultChild.id);

      // 선택된 자녀가 이미 한도 초과인지 확인
      if (defaultChild.usedCount >= PER_CHILD_YEARLY_LIMIT && options.every(
        (c) => c.usedCount >= PER_CHILD_YEARLY_LIMIT
      )) {
        setBlocked(true);
        setBlockMsg(
          "이번 연도 명따라 분석 횟수를 모두 사용했어요.\n1학기(3월) · 2학기(9월) · 연말(12월)\n총 3회 제공됩니다."
        );
        setBlockType("limit");
      }

      setCheckDone(true);
    }

    init();
  }, [router]);

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

    // 서버 차감 API 호출
    try {
      const res = await fetch("/api/myeonddara/use", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ childId: selectedChildId }),
      });

      if (!res.ok) {
        const err = await res.json();
        // 한도 초과 or 플랜 차단 → 상태 업데이트
        if (res.status === 429 || res.status === 403) {
          setBlocked(true);
          setBlockMsg(err.error);
          setBlockType(res.status === 403 ? "plan" : "limit");
          // 자녀 usedCount 갱신 (UI 반영)
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

      // 자녀 usedCount 갱신
      setChildren((prev) =>
        prev.map((c) =>
          c.id === selectedChildId
            ? { ...c, usedCount: PER_CHILD_YEARLY_LIMIT - remaining }
            : c
        )
      );

      // localStorage에 입력 저장 후 결과 페이지로 이동
      localStorage.setItem(MYEONDDARA_INPUT_KEY, JSON.stringify(data));
      router.push("/myeonddara/result");
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-off flex justify-center">
      <div className="w-full max-w-mobile bg-base-off">

        {/* ── 헤더 ── */}
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
            {/* 남은 횟수 배지 */}
            {remainingCount !== null && !blocked && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#FFF0EB", color: "#E84B2E" }}
              >
                올해 {remainingCount}회 남음
              </span>
            )}
            {(remainingCount === null || blocked) && <div className="w-9" />}
          </div>
        </div>

        <div className="px-4 pt-4 pb-10 flex flex-col gap-4">

          {/* ① 소개 카드 */}
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

          {/* ② 자녀 선택 (자녀 2명 이상일 때 표시) */}
          {checkDone && !blocked && children.length > 1 && (
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
                        onClick={() => {
                          setSelected(child.id);
                          setShowSelector(false);
                        }}
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

          {/* ③ 차단 상태 */}
          {checkDone && blocked && (
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

          {/* ④ 입력 폼 */}
          {checkDone && !blocked && (
            <SajuInput onSubmit={handleSubmit} isLoading={isLoading} />
          )}

          {/* ④ 로딩 스켈레톤 */}
          {!checkDone && (
            <div className="bg-white rounded-card-lg shadow-card p-6 animate-pulse">
              <div className="h-4 bg-base-border rounded w-1/3 mb-4" />
              <div className="h-10 bg-base-border rounded mb-3" />
              <div className="h-10 bg-base-border rounded mb-3" />
              <div className="h-10 bg-base-border rounded" />
            </div>
          )}

          {/* ⑤ 하단 안내 */}
          <p className="text-xs text-base-muted text-center leading-relaxed px-4">
            명따라는 동양 철학 기반의 참고용 진로 분석 서비스입니다.<br />
            아이의 가능성은 무한합니다. 💛
          </p>
        </div>
      </div>
    </div>
  );
}
