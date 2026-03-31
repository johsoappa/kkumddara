"use client";

// ====================================================
// 부모 리포트 화면 (/report)
// - 주간 요약 / Top3 직업 / 강점 / 미션 현황 / 성장 추이
// - 로드맵 미션 완료 데이터 실시간 연동
// - 섹션별 scroll fade-in 애니메이션
// ====================================================

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import WeeklySummary from "@/components/report/WeeklySummary";
import TopOccupations from "@/components/report/TopOccupations";
import StrengthCards from "@/components/report/StrengthCards";
import MissionStatus from "@/components/report/MissionStatus";
import GrowthChart from "@/components/report/GrowthChart";
import ActivitySuggestions from "@/components/report/ActivitySuggestions";
import { getRoadmap } from "@/data/roadmaps";
import { REPORT_DUMMY } from "@/data/reports";
import type { MissionItem } from "@/types/report";

// ----------------------------------------
// 날짜 헬퍼
// ----------------------------------------
function getWeekLabel(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const week = Math.ceil(now.getDate() / 7);
  return `${year}년 ${month}월 ${week}주차`;
}

// ----------------------------------------
// Scroll fade-in 래퍼 컴포넌트
// ----------------------------------------
function FadeInSection({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.45s ease ${delay}ms, transform 0.45s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ----------------------------------------
// 메인 컴포넌트
// ----------------------------------------
export default function ReportPage() {
  const router = useRouter();

  const [userType, setUserType] = useState<"parent" | "student" | null>(null);
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [missionRate, setMissionRate] = useState(0);
  const [occupationName, setOccupationName] = useState<string | null>(null);

  useEffect(() => {
    // 온보딩 데이터
    const onboarding = localStorage.getItem("kkumddara_onboarding");
    if (onboarding) {
      const parsed = JSON.parse(onboarding);
      setUserType(parsed.userType ?? null);
    }

    // "이 직업으로 로드맵 만들기"로 명시적 선택한 직업 연동
    const lastId = localStorage.getItem("kkumddara_chosen_roadmap");
    if (lastId) {
      const roadmap = getRoadmap(lastId);
      if (roadmap) {
        setOccupationName(roadmap.occupationName);

        const stored = localStorage.getItem(`kkumddara_roadmap_${lastId}`);
        const completedIds: string[] = stored ? JSON.parse(stored) : [];

        // CURRENT 단계 미션만 "이번 주 미션"으로 표시
        const currentStage = roadmap.stages.find((s) => s.status === "current");
        if (currentStage) {
          const items: MissionItem[] = currentStage.missions.map((m) => ({
            id: m.id,
            text: m.text,
            completed: completedIds.includes(m.id),
          }));
          setMissions(items);

          const done = items.filter((m) => m.completed).length;
          setMissionRate(
            items.length > 0 ? Math.round((done / items.length) * 100) : 0
          );
        }
      }
    }
  }, []);

  // 성장 추이: 마지막 주차를 실제 완료율로 업데이트
  const growthData = REPORT_DUMMY.growthData.map((d, idx) =>
    idx === REPORT_DUMMY.growthData.length - 1 && missionRate > 0
      ? { ...d, rate: missionRate }
      : d
  );

  const subtitlePrefix = userType === "parent" ? "자녀의" : "나의";

  const handleShare = () => alert("카카오톡 공유 기능은 준비 중입니다. 😊");
  const handleSave  = () => alert("리포트 저장 기능은 준비 중입니다. 😊");

  return (
    <AppShell headerTitle="부모 리포트">
      <div className="px-4 pt-4 pb-6 flex flex-col gap-4">

        {/* ① 헤더 정보 */}
        <FadeInSection delay={0}>
          <div>
            <p className="text-xs font-semibold text-brand-red mb-0.5">
              {getWeekLabel()}
            </p>
            <p className="text-sm text-base-muted">
              {subtitlePrefix} 이번 주 진로 탐색 리포트
              {occupationName && (
                <span className="font-semibold text-base-text">
                  {" "}— {occupationName}
                </span>
              )}
            </p>
          </div>
        </FadeInSection>

        {/* ② 주간 요약 카드 3개 */}
        <FadeInSection delay={60}>
          <WeeklySummary
            exploredCount={REPORT_DUMMY.exploredCount}
            missionRate={missionRate > 0 ? missionRate : 75}
            streakDays={REPORT_DUMMY.streakDays}
          />
        </FadeInSection>

        {/* ③ 관심 직업 Top 3 */}
        <FadeInSection delay={0}>
          <TopOccupations occupations={REPORT_DUMMY.topOccupations} />
        </FadeInSection>

        {/* ④ 발견된 강점 */}
        <FadeInSection delay={0}>
          <StrengthCards strengths={REPORT_DUMMY.strengths} />
        </FadeInSection>

        {/* ⑤ 이번 주 미션 현황 (실제 데이터 연동) */}
        <FadeInSection delay={0}>
          {missions.length > 0 ? (
            <MissionStatus missions={missions} />
          ) : (
            <div className="card text-center py-6">
              <p className="text-3xl mb-2">🗺️</p>
              <p className="text-sm text-base-muted">
                아직 진행 중인 로드맵이 없어요
              </p>
              <button
                onClick={() => router.push("/explore")}
                className="mt-3 text-sm font-semibold text-brand-red"
              >
                직업 탐색하러 가기 →
              </button>
            </div>
          )}
        </FadeInSection>

        {/* ⑥ 성장 추이 */}
        <FadeInSection delay={0}>
          <GrowthChart data={growthData} />
        </FadeInSection>

        {/* ⑦ 부족한 준비 영역 */}
        <FadeInSection delay={0}>
          <div
            className="rounded-card-lg p-4 border border-yellow-200"
            style={{ backgroundColor: "#FFFDE7" }}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-lg leading-none mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-bold text-base-text">함께 보완해요</p>
                <p className="text-xs font-semibold text-yellow-700 mt-0.5">
                  {REPORT_DUMMY.weakArea.title}
                </p>
              </div>
            </div>
            <p className="text-xs text-base-muted leading-relaxed pl-7">
              {REPORT_DUMMY.weakArea.description}
            </p>
          </div>
        </FadeInSection>

        {/* ⑧ 함께 해보세요 */}
        <FadeInSection delay={0}>
          <ActivitySuggestions activities={REPORT_DUMMY.activities} />
        </FadeInSection>

        {/* ⑨ 명따라 유도 버튼 */}
        <FadeInSection delay={0}>
          <button
            onClick={() => router.push("/myeonddara")}
            className="
              w-full py-4 rounded-button text-sm font-bold
              flex items-center justify-center gap-2
              active:opacity-80 transition-opacity
            "
            style={{ background: "linear-gradient(135deg, #1A3A6B, #2C5F8A)", color: "#fff" }}
          >
            ✨ 명따라로 더 깊이 분석해보기
          </button>
        </FadeInSection>

        {/* ⑩ 공유 / 저장 버튼 */}
        <FadeInSection delay={0}>
          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={handleShare}
              className="
                w-full py-4 rounded-button
                font-semibold text-sm
                flex items-center justify-center gap-2
                active:opacity-80 transition-opacity
              "
              style={{ backgroundColor: "#FEE500", color: "#3C1E1E" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9 0.5C4.029 0.5 0 3.643 0 7.5C0 10.003 1.548 12.205 3.9 13.5L3 17.5L7.2 14.877C7.789 14.959 8.39 15 9 15C13.971 15 18 11.866 18 8C18 4.134 13.971 0.5 9 0.5Z"
                  fill="#3C1E1E"
                />
              </svg>
              리포트 카카오톡 공유하기
            </button>
            <button onClick={handleSave} className="btn-primary">
              리포트 저장하기
            </button>
          </div>
        </FadeInSection>

        {/* ⑪ 의견 보내기 */}
        <FadeInSection delay={0}>
          <button
            onClick={() => router.push("/feedback")}
            className="
              w-full py-3 rounded-button text-sm font-semibold
              flex items-center justify-center gap-1.5
              border border-base-border text-base-muted
              hover:border-brand-red hover:text-brand-red
              active:opacity-70 transition-colors
            "
          >
            💬 의견 보내기
          </button>
        </FadeInSection>

      </div>
    </AppShell>
  );
}
