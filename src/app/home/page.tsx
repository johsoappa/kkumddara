"use client";

// ====================================================
// 홈 탭 페이지 (/home)
// - 온보딩 데이터 기반 개인화 인사말 + 뱃지
// - 진행 중인 로드맵 카드 → /roadmap/[id]
// - 오늘의 추천 직업 카드 (관심 분야 기반) → /explore
// - 주간 진도율 카드 → /report
// - localStorage 데이터 없으면 온보딩(/)으로 리다이렉트
// ====================================================

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { OCCUPATIONS } from "@/data/occupations";
import { getRoadmap } from "@/data/roadmaps";

// ----------------------------------------
// 상수 맵핑
// ----------------------------------------
const GRADE_LABEL: Record<string, string> = {
  elementary5: "초5",
  elementary6: "초6",
  middle1: "중1",
  middle2: "중2",
  middle3: "중3",
};

const INTEREST_LABEL: Record<string, string> = {
  it: "IT·기술",
  art: "예술·디자인",
  medical: "의료·과학",
  business: "비즈니스",
  education: "교육·사회",
};

const INTEREST_TO_CATEGORY: Record<string, string> = {
  it: "IT·기술",
  art: "예술·디자인",
  medical: "의료·과학",
  business: "비즈니스",
  education: "교육·사회",
};

interface OnboardingData {
  userType: "parent" | "student" | null;
  grade: string | null;
  interests: string[];
}

// ----------------------------------------
// 메인 컴포넌트
// ----------------------------------------
export default function HomePage() {
  const router = useRouter();

  const [loading, setLoading]             = useState(true);
  const [onboarding, setOnboarding]       = useState<OnboardingData | null>(null);
  const [lastRoadmapId, setLastRoadmapId] = useState<string | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("kkumddara_onboarding");
    if (!stored) {
      router.replace("/");
      return;
    }

    const data: OnboardingData = JSON.parse(stored);
    setOnboarding(data);

    // "이 직업으로 로드맵 만들기"로 명시적 선택한 직업만 표시
    const last = localStorage.getItem("kkumddara_chosen_roadmap");
    setLastRoadmapId(last);

    if (last) {
      const progressData = localStorage.getItem(`kkumddara_roadmap_${last}`);
      const completed: string[] = progressData ? JSON.parse(progressData) : [];
      const roadmap = getRoadmap(last);
      if (roadmap) {
        const total = roadmap.stages.flatMap((s) => s.missions).length;
        setWeeklyProgress(
          total > 0 ? Math.round((completed.length / total) * 100) : 0
        );
      }
    }

    setLoading(false);
  }, [router]);

  // 관심 분야 기반 추천 직업
  const recommendedOccupation = useMemo(() => {
    if (!onboarding || onboarding.interests.length === 0) return OCCUPATIONS[0];
    const categories = onboarding.interests
      .map((i) => INTEREST_TO_CATEGORY[i])
      .filter(Boolean);
    const matches = OCCUPATIONS.filter((o) => categories.includes(o.category));
    if (matches.length === 0) return OCCUPATIONS[0];
    return matches.reduce((best, o) => (o.fitScore > best.fitScore ? o : best));
  }, [onboarding]);

  const lastRoadmap = lastRoadmapId ? getRoadmap(lastRoadmapId) : null;

  const handleRoadmapCard = () => {
    const chosen = localStorage.getItem("kkumddara_chosen_roadmap");
    if (chosen) router.push(`/roadmap/${chosen}`);
    else router.push("/explore");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-off">
        <p className="text-sm text-base-muted">불러오는 중...</p>
      </div>
    );
  }

  const gradeText  = GRADE_LABEL[onboarding?.grade ?? ""] ?? onboarding?.grade ?? "";
  const interestTexts = (onboarding?.interests ?? [])
    .map((i) => INTEREST_LABEL[i] ?? i)
    .join(", ");

  return (
    <AppShell headerTitle="꿈따라">
      <div className="px-5 py-6">

        {/* ---- 인사말 ---- */}
        <div className="mb-3">
          <p className="text-sm text-base-muted">안녕하세요! 👋</p>
          <h1 className="text-xl font-bold text-base-text mt-1 leading-snug">
            {onboarding?.userType === "parent" ? (
              <>
                오늘도{" "}
                <span className="text-brand-red">자녀의 꿈</span>을{" "}
                함께 설계해요
              </>
            ) : (
              <>
                오늘도{" "}
                <span className="text-brand-red">꿈따라</span>{" "}
                함께해요
              </>
            )}
          </h1>
        </div>

        {/* ---- 학년 + 관심 분야 뱃지 (클릭 시 온보딩 수정) ---- */}
        {onboarding && (
          <button
            onClick={() => router.push("/onboarding")}
            className="
              flex items-center gap-1.5 mb-6
              bg-base-card border border-base-border
              rounded-full px-3 py-1.5
              text-xs text-base-muted
              active:opacity-70 transition-opacity
            "
          >
            {gradeText && (
              <span className="font-semibold text-base-text">{gradeText}</span>
            )}
            {gradeText && interestTexts && (
              <span className="text-base-border">|</span>
            )}
            {interestTexts && <span>{interestTexts}</span>}
            <span className="text-brand-red font-semibold ml-0.5">수정 ›</span>
          </button>
        )}

        {/* ---- 카드 목록 ---- */}
        <div className="flex flex-col gap-4">

          {/* ① 진행 중인 로드맵 */}
          <button
            onClick={handleRoadmapCard}
            className="
              card text-left w-full
              flex items-center justify-between gap-3
              border-2 border-transparent
              hover:border-brand-red active:border-brand-red
              transition-colors
            "
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-base-muted mb-1.5">
                진행 중인 로드맵
              </p>
              {lastRoadmap ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl leading-none">
                      {lastRoadmap.occupationEmoji}
                    </span>
                    <p className="text-sm font-bold text-base-text">
                      {lastRoadmap.occupationName}
                    </p>
                  </div>
                  {/* 진행 바 */}
                  <div className="h-1.5 bg-base-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-red transition-all"
                      style={{ width: `${weeklyProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-base-muted mt-1">
                    {weeklyProgress}% 완료
                  </p>
                </>
              ) : (
                <p className="text-sm font-bold text-base-text">
                  🗺️ 직업을 선택하고 로드맵을 시작해요
                </p>
              )}
            </div>
            <ChevronRight size={18} className="text-base-muted flex-shrink-0" />
          </button>

          {/* ② 오늘의 추천 직업 */}
          <button
            onClick={() => router.push("/explore")}
            className="
              card text-left w-full
              flex items-center justify-between gap-3
              border-2 border-transparent
              hover:border-brand-red active:border-brand-red
              transition-colors
            "
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-base-muted mb-1.5">
                오늘의 추천 직업
              </p>
              {recommendedOccupation ? (
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">
                    {recommendedOccupation.emoji}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-base-text">
                      {recommendedOccupation.name}
                    </p>
                    <p className="text-xs text-base-muted mt-0.5">
                      적합도{" "}
                      <span className="font-semibold text-brand-red">
                        {recommendedOccupation.fitScore}%
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-bold text-base-text">
                  🔍 관심 분야 기반으로 추천해요
                </p>
              )}
            </div>
            <ChevronRight size={18} className="text-base-muted flex-shrink-0" />
          </button>

          {/* ③ 주간 진도율 */}
          <button
            onClick={() => router.push("/report")}
            className="
              card text-left w-full
              flex items-center justify-between gap-3
              border-2 border-transparent
              hover:border-brand-red active:border-brand-red
              transition-colors
            "
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-base-muted mb-1.5">
                주간 진도율
              </p>
              <div className="h-1.5 bg-base-border rounded-full overflow-hidden mb-1">
                <div
                  className="h-full rounded-full bg-brand-red transition-all"
                  style={{ width: `${weeklyProgress}%` }}
                />
              </div>
              <p className="text-xs text-base-muted">
                이번 주{" "}
                <span className="font-semibold text-base-text">
                  {weeklyProgress}%
                </span>{" "}
                완료
              </p>
            </div>
            <ChevronRight size={18} className="text-base-muted flex-shrink-0" />
          </button>

          {/* ④ 명따라 배너 */}
          <button
            onClick={() => router.push("/myeonddara")}
            className="
              w-full rounded-card-lg p-4 text-left
              flex items-center justify-between gap-3
              active:opacity-80 transition-opacity
            "
            style={{ background: "linear-gradient(135deg, #1A3A6B, #2C5F8A)" }}
          >
            <div>
              <p className="text-xs font-semibold text-white/70 mb-0.5">
                ✨ 명따라
              </p>
              <p className="text-sm font-bold text-white">
                사주로 찾는 우리 아이 진로
              </p>
              <p className="text-xs text-white/70 mt-1">
                분석 시작하기 →
              </p>
            </div>
            <span className="text-3xl leading-none flex-shrink-0">✨</span>
          </button>

        </div>
      </div>
    </AppShell>
  );
}
